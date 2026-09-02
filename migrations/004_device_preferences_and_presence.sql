CREATE TABLE devices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    new_financing_ui INTEGER NOT NULL DEFAULT 0 CHECK (new_financing_ui IN (0, 1)),
    show_presence INTEGER NOT NULL DEFAULT 1 CHECK (show_presence IN (0, 1)),
    current_path TEXT,
    last_seen_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX devices_last_seen_at_idx ON devices(last_seen_at DESC);
