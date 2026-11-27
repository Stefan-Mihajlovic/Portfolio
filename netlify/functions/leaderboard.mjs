import { getDatabase } from '@netlify/database';

const MAX_ENTRIES = 1000;
const VALID_SHIPS = new Set(['kestrel', 'falcon', 'aegis']);
const BLOCKED_WORDS = ['nigger', 'nigga', 'faggot', 'chink', 'kike', 'spic', 'retard', 'hitler', 'nazi'];

function sanitizeName(raw) {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  if (cleaned.length < 2 || cleaned.length > 14) return null;
  if (!/^[\p{L}\p{N} _-]+$/u.test(cleaned)) return null;
  const lower = cleaned.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (BLOCKED_WORDS.some((w) => lower.includes(w))) return null;
  return cleaned;
}

function isValidPlayerId(id) {
  return typeof id === 'string' && id.length >= 8 && id.length <= 64 && /^[a-zA-Z0-9_-]+$/.test(id);
}

function isPlausibleRun({ score, wave, kills, durationSec }) {
  if (!Number.isInteger(score) || score < 1 || score > 50_000_000) return false;
  if (!Number.isInteger(wave) || wave < 1 || wave > 500) return false;
  if (!Number.isInteger(kills) || kills < 0 || kills > 100_000) return false;
  if (!Number.isFinite(durationSec) || durationSec < 2) return false;
  if (score > 15_000 && durationSec < 10) return false;
  if (score / Math.max(12, durationSec) > 12_000) return false;
  if (score > 8_000 && kills === 0) return false;
  return true;
}

async function fetchPlayerRank(db, playerId) {
  if (!isValidPlayerId(playerId)) return null;
  const rows = await db.sql`
    SELECT player_id, name, score, wave, ship, overclock, updated_at, rank
    FROM (
      SELECT
        player_id,
        name,
        score,
        wave,
        ship,
        overclock,
        updated_at,
        ROW_NUMBER() OVER (ORDER BY score DESC, updated_at ASC)::int AS rank
      FROM leaderboard
    ) ranked
    WHERE player_id = ${playerId}
    LIMIT 1
  `;
  return rows[0] || null;
}

export default async (req) => {
  const db = getDatabase();

  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit')) || 100));
      const offset = Math.max(0, Math.min(MAX_ENTRIES - 1, Number(url.searchParams.get('offset')) || 0));
      const playerId = url.searchParams.get('playerId') || '';

      const [entries, countRows, cutoffRows, me] = await Promise.all([
        db.sql`
          SELECT player_id, name, score, wave, ship, overclock, updated_at
          FROM leaderboard
          ORDER BY score DESC, updated_at ASC
          LIMIT ${limit} OFFSET ${offset}
        `,
        db.sql`SELECT COUNT(*)::int AS total FROM leaderboard`,
        db.sql`
          SELECT score
          FROM leaderboard
          ORDER BY score DESC, updated_at ASC
          OFFSET ${MAX_ENTRIES - 1} LIMIT 1
        `,
        fetchPlayerRank(db, playerId),
      ]);

      const total = countRows[0]?.total ?? 0;
      const cutoff = total >= MAX_ENTRIES ? (cutoffRows[0]?.score ?? 0) : 0;

      return Response.json(
        {
          entries: entries.map((r, i) => ({
            rank: offset + i + 1,
            name: r.name,
            score: r.score,
            wave: r.wave,
            ship: r.ship,
            overclock: Boolean(r.overclock),
            isMe: Boolean(playerId && r.player_id === playerId),
          })),
          total,
          maxEntries: MAX_ENTRIES,
          cutoff,
          me: me
            ? {
                rank: me.rank,
                name: me.name,
                score: me.score,
                wave: me.wave,
                ship: me.ship,
                overclock: Boolean(me.overclock),
              }
            : null,
        },
        {
          headers: {
            'Cache-Control': playerId ? 'no-store' : 'public, max-age=5, s-maxage=10',
          },
        },
      );
    } catch (err) {
      console.error('Leaderboard GET error:', err);
      return Response.json({ error: 'Failed to load leaderboard' }, { status: 500 });
    }
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const playerId = body?.playerId;
    if (!isValidPlayerId(playerId)) {
      return Response.json({ error: 'Invalid player ID' }, { status: 400 });
    }
    const name = sanitizeName(body?.name);
    if (!name) {
      return Response.json({ error: 'Callsign must be 2-14 valid characters' }, { status: 400 });
    }

    try {
      // Optional callsign rename without altering score
      if (body?.action === 'rename') {
        await db.sql`
          UPDATE leaderboard
          SET name = ${name}
          WHERE player_id = ${playerId}
        `;
        const me = await fetchPlayerRank(db, playerId);
        return Response.json({ ok: true, updatedName: true, me });
      }

      const score = Math.floor(Number(body?.score) || 0);
      const wave = Math.floor(Number(body?.wave) || 1);
      const kills = Math.floor(Number(body?.kills) || 0);
      const durationSec = Number(body?.durationSec) || 0;
      const ship = VALID_SHIPS.has(body?.ship) ? body.ship : 'kestrel';
      const overclock = Boolean(body?.overclock);

      if (!isPlausibleRun({ score, wave, kills, durationSec })) {
        return Response.json({ error: 'Run failed validation' }, { status: 400 });
      }

      const [existingRows, countRows, cutoffRows] = await Promise.all([
        db.sql`SELECT score, updated_at FROM leaderboard WHERE player_id = ${playerId} LIMIT 1`,
        db.sql`SELECT COUNT(*)::int AS total FROM leaderboard`,
        db.sql`
          SELECT score
          FROM leaderboard
          ORDER BY score DESC, updated_at ASC
          OFFSET ${MAX_ENTRIES - 1} LIMIT 1
        `,
      ]);

      const existing = existingRows[0] || null;
      const totalBefore = countRows[0]?.total ?? 0;
      const cutoff = totalBefore >= MAX_ENTRIES ? (cutoffRows[0]?.score ?? 0) : 0;

      // Only save when strictly beating previous personal best!
      if (existing && score <= existing.score) {
        const me = await fetchPlayerRank(db, playerId);
        return Response.json({
          ok: true,
          saved: false,
          reason: 'not_best',
          me,
          total: totalBefore,
        });
      }

      // Enforce 1,000-player cap before inserting a brand-new player
      if (!existing && totalBefore >= MAX_ENTRIES && score <= cutoff) {
        return Response.json({
          ok: true,
          saved: false,
          reason: 'below_cutoff',
          cutoff,
          total: totalBefore,
        });
      }

      // Atomic UPSERT: inserts new pilot or updates ONLY if new score beats saved score!
      const [savedRow] = await db.sql`
        INSERT INTO leaderboard (player_id, name, score, wave, kills, ship, overclock, updated_at)
        VALUES (${playerId}, ${name}, ${score}, ${wave}, ${kills}, ${ship}, ${overclock}, NOW())
        ON CONFLICT (player_id) DO UPDATE SET
          name = EXCLUDED.name,
          score = EXCLUDED.score,
          wave = EXCLUDED.wave,
          kills = EXCLUDED.kills,
          ship = EXCLUDED.ship,
          overclock = EXCLUDED.overclock,
          updated_at = NOW()
        WHERE EXCLUDED.score > leaderboard.score
        RETURNING player_id, name, score, wave, ship, overclock
      `;

      // Trim leaderboard strictly to Top 1,000 entries
      await db.sql`
        DELETE FROM leaderboard
        WHERE player_id IN (
          SELECT player_id
          FROM leaderboard
          ORDER BY score DESC, updated_at ASC
          OFFSET ${MAX_ENTRIES}
        )
      `;

      const [me, afterCount] = await Promise.all([
        fetchPlayerRank(db, playerId),
        db.sql`SELECT COUNT(*)::int AS total FROM leaderboard`,
      ]);

      return Response.json({
        ok: true,
        saved: Boolean(savedRow),
        me: me
          ? {
              rank: me.rank,
              name: me.name,
              score: me.score,
              wave: me.wave,
              ship: me.ship,
              overclock: Boolean(me.overclock),
            }
          : null,
        total: afterCount[0]?.total ?? totalBefore,
      });
    } catch (err) {
      console.error('Leaderboard POST error:', err);
      return Response.json({ error: 'Failed to save score' }, { status: 500 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
};

export const config = {
  path: '/api/leaderboard',
  method: ['GET', 'POST'],
};
