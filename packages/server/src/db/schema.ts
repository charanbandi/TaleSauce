export const SCHEMA = `
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  environment TEXT NOT NULL,
  brain_kind TEXT NOT NULL,
  model TEXT,
  session_id TEXT,
  personality TEXT NOT NULL,   -- JSON
  pos_x REAL NOT NULL,
  pos_y REAL NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  role TEXT NOT NULL,          -- user | assistant | system
  content TEXT NOT NULL,
  kind TEXT NOT NULL,          -- chat | task | question | result
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL           -- JSON: { sliderPct, focus }
);
`;
