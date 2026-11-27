import { getStore } from '@netlify/blobs';

const MAX_ENTRIES = 1000;
const STORE_NAME = 'low-orbit-leaderboard';
const BOARD_KEY = 'top1000';
const VALID_PRESETS = new Set(['kestrel', 'falcon', 'aegis']);
const CUSTOM_SHIP_RE = /^custom:[0-2][0-3][0-3][0-3][0-5]$/;
const CUSTOM_POWER = {
  nose: [1, 2, 4],
  wings: [1, 2, 3, 4],
  weapon: [2, 3, 3, 4],
  engine: [1, 2, 3, 3],
};
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

function sanitizeShip(raw) {
  if (typeof raw !== 'string') return 'kestrel';
  if (VALID_PRESETS.has(raw)) return raw;
  if (CUSTOM_SHIP_RE.test(raw)) {
    const digits = raw.slice(7);
    const pwr =
      CUSTOM_POWER.nose[+digits[0]] +
      CUSTOM_POWER.wings[+digits[1]] +
      CUSTOM_POWER.weapon[+digits[2]] +
      CUSTOM_POWER.engine[+digits[3]];
    if (pwr <= 10) return raw;
  }
  return 'kestrel';
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

function sortBoard(rows) {
  return rows.sort((a, b) => b.score - a.score || (a.updatedAt || 0) - (b.updatedAt || 0));
}

async function loadBoard(store) {
  const entry = await store.getWithMetadata(BOARD_KEY, { type: 'json' });
  if (entry === null) return { rows: [], etag: null };
  const rows = Array.isArray(entry.data) ? entry.data : [];
  return { rows, etag: entry.etag || null };
}

function formatMe(rows, playerId) {
  if (!isValidPlayerId(playerId)) return null;
  const idx = rows.findIndex((r) => r.playerId === playerId);
  if (idx < 0) return null;
  const r = rows[idx];
  return {
    rank: idx + 1,
    name: r.name,
    score: r.score,
    wave: r.wave,
    ship: r.ship,
    overclock: Boolean(r.overclock),
  };
}

export default async (req) => {
  const store = getStore({ name: STORE_NAME, consistency: 'strong' });

  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit')) || 100));
      const offset = Math.max(0, Math.min(MAX_ENTRIES - 1, Number(url.searchParams.get('offset')) || 0));
      const playerId = url.searchParams.get('playerId') || '';

      const { rows } = await loadBoard(store);
      const slice = rows.slice(offset, offset + limit);
      const total = rows.length;
      const cutoff = total >= MAX_ENTRIES ? (rows[MAX_ENTRIES - 1]?.score ?? 0) : 0;

      return Response.json(
        {
          entries: slice.map((r, i) => ({
            rank: offset + i + 1,
            name: r.name,
            score: r.score,
            wave: r.wave,
            ship: r.ship,
            overclock: Boolean(r.overclock),
            isMe: Boolean(playerId && r.playerId === playerId),
          })),
          total,
          maxEntries: MAX_ENTRIES,
          cutoff,
          me: formatMe(rows, playerId),
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

    const score = Math.floor(Number(body?.score) || 0);
    const wave = Math.floor(Number(body?.wave) || 1);
    const kills = Math.floor(Number(body?.kills) || 0);
    const durationSec = Number(body?.durationSec) || 0;
    const ship = sanitizeShip(body?.ship);
    const overclock = Boolean(body?.overclock);

    if (body?.action !== 'rename' && !isPlausibleRun({ score, wave, kills, durationSec })) {
      return Response.json({ error: 'Run failed validation' }, { status: 400 });
    }

    try {
      // Optimistic conditional write retry loop so concurrent submissions never clobber each other
      for (let attempt = 0; attempt < 5; attempt++) {
        const { rows, etag } = await loadBoard(store);
        const idx = rows.findIndex((r) => r.playerId === playerId);
        const existing = idx >= 0 ? rows[idx] : null;

        if (body?.action === 'rename') {
          if (!existing) return Response.json({ ok: true, updatedName: false, me: null });
          rows[idx] = { ...existing, name };
          const writeOpts = etag ? { onlyIfMatch: etag } : { onlyIfNew: true };
          const res = await store.setJSON(BOARD_KEY, rows, writeOpts);
          if (res.modified) {
            return Response.json({ ok: true, updatedName: true, me: formatMe(rows, playerId) });
          }
          continue;
        }

        const totalBefore = rows.length;
        const cutoff = totalBefore >= MAX_ENTRIES ? (rows[MAX_ENTRIES - 1]?.score ?? 0) : 0;

        if (existing && score <= existing.score) {
          return Response.json({
            ok: true,
            saved: false,
            reason: 'not_best',
            me: formatMe(rows, playerId),
            total: totalBefore,
          });
        }
        if (!existing && totalBefore >= MAX_ENTRIES && score <= cutoff) {
          return Response.json({
            ok: true,
            saved: false,
            reason: 'below_cutoff',
            cutoff,
            total: totalBefore,
          });
        }

        const nextRow = {
          playerId,
          name,
          score,
          wave,
          kills,
          ship,
          overclock,
          updatedAt: Date.now(),
        };
        if (idx >= 0) rows[idx] = nextRow;
        else rows.push(nextRow);

        sortBoard(rows);
        const trimmed = rows.slice(0, MAX_ENTRIES);
        const writeOpts = etag ? { onlyIfMatch: etag } : { onlyIfNew: true };
        const res = await store.setJSON(BOARD_KEY, trimmed, writeOpts);
        if (res.modified) {
          return Response.json({
            ok: true,
            saved: true,
            me: formatMe(trimmed, playerId),
            total: trimmed.length,
          });
        }
      }
      return Response.json({ error: 'Busy, please try again' }, { status: 409 });
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
