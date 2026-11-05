-- ==============================================================================
-- KuraCode Core Database Schema
-- Standard PostgreSQL 16 (Compatible with Supabase and plain self-hosted Postgres)
-- ==============================================================================

-- 1. Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY DEFAULT ('ws_' || substr(md5(random()::text), 1, 12)),
    name TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Workspace Members (RBAC: owner, admin, editor, viewer)
CREATE TABLE IF NOT EXISTS workspace_members (
    id TEXT PRIMARY KEY DEFAULT ('wsm_' || substr(md5(random()::text), 1, 12)),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 3. Workspace Invitations & Share Codes
CREATE TABLE IF NOT EXISTS invitations (
    id TEXT PRIMARY KEY DEFAULT ('inv_' || substr(md5(random()::text), 1, 12)),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
    expires_at TIMESTAMPTZ NOT NULL,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Snippets (Multi-tenant partitioned; NULL workspace_id = Personal Space)
CREATE TABLE IF NOT EXISTS snippets (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    code TEXT NOT NULL,
    raw TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'plaintext',
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Snippet Groups / Tags
CREATE TABLE IF NOT EXISTS snippet_groups (
    id TEXT PRIMARY KEY DEFAULT ('grp_' || substr(md5(random()::text), 1, 12)),
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Temporary Quick Share Codes (15-min ephemeral share)
CREATE TABLE IF NOT EXISTS share_codes (
    code TEXT PRIMARY KEY,
    snippet_id TEXT NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    claimed BOOLEAN NOT NULL DEFAULT FALSE,
    max_claims INTEGER NOT NULL DEFAULT 1,
    claims_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Devices & Sessions
CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    device_name TEXT NOT NULL,
    platform TEXT NOT NULL,
    client_version TEXT NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    public_key TEXT,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Clipboard Hub (Cross-device scratchpad with auto-expiration)
CREATE TABLE IF NOT EXISTS clipboard_items (
    id TEXT PRIMARY KEY DEFAULT ('clip_' || substr(md5(random()::text), 1, 12)),
    user_id TEXT NOT NULL,
    device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY DEFAULT ('aud_' || substr(md5(random()::text), 1, 16)),
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

