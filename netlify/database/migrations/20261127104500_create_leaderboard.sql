CREATE TABLE IF NOT EXISTS leaderboard (
  player_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score > 0),
  wave INTEGER NOT NULL DEFAULT 1,
  kills INTEGER NOT NULL DEFAULT 0,
  ship TEXT NOT NULL DEFAULT 'kestrel',
  overclock BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leaderboard_rank_idx
  ON leaderboard (score DESC, updated_at ASC);
