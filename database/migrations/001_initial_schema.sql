-- 001_initial_schema.sql
-- Create sessions table (buckets for webhooks)
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  response_status INTEGER DEFAULT 200,
  response_content_type TEXT DEFAULT 'application/json',
  response_body TEXT DEFAULT '{"success": true, "message": "Webhook received successfully"}',
  response_delay_ms INTEGER DEFAULT 0,
  forward_url TEXT DEFAULT NULL,
  max_requests INTEGER DEFAULT 500,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create requests table (captured webhooks)
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  query_params TEXT,
  headers TEXT,
  body TEXT,
  raw_body TEXT,
  client_ip TEXT,
  content_type TEXT,
  size_bytes INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  response_status INTEGER DEFAULT 200,
  forward_status INTEGER DEFAULT NULL,
  forward_response TEXT DEFAULT NULL,
  forward_error TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_requests_session_id ON requests(session_id);
CREATE INDEX IF NOT EXISTS idx_requests_session_created ON requests(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);
