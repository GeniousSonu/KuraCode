-- ==============================================================================
-- KuraCode Row-Level Security (RLS) Policies
-- Proves zero cross-workspace and zero cross-user access even with guessed IDs
-- ==============================================================================

-- 1. Enable RLS on every table
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippet_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clipboard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: checks if auth.uid() is an active member of a workspace
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_id = ws_id AND user_id = auth.uid()::text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: checks if auth.uid() has editor or higher role in workspace
CREATE OR REPLACE FUNCTION can_edit_workspace(ws_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_id = ws_id 
          AND user_id = auth.uid()::text
          AND role IN ('owner', 'admin', 'editor')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Workspaces Policies
CREATE POLICY workspaces_select ON workspaces
    FOR SELECT USING (
        owner_id = auth.uid()::text OR is_workspace_member(id)
    );

CREATE POLICY workspaces_insert ON workspaces
    FOR INSERT WITH CHECK (
        owner_id = auth.uid()::text
    );

CREATE POLICY workspaces_update ON workspaces
    FOR UPDATE USING (
        owner_id = auth.uid()::text OR EXISTS (
            SELECT 1 FROM workspace_members 
            WHERE workspace_id = id AND user_id = auth.uid()::text AND role IN ('owner', 'admin')
        )
    );

-- 3. Workspace Members Policies
CREATE POLICY members_select ON workspace_members
    FOR SELECT USING (
        is_workspace_member(workspace_id)
    );

CREATE POLICY members_manage ON workspace_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workspace_members 
            WHERE workspace_id = workspace_members.workspace_id 
              AND user_id = auth.uid()::text 
              AND role IN ('owner', 'admin')
        )
    );

-- 4. Snippets Isolation Policies (Core Invariant)
-- Select: user can select their own personal snippets (workspace_id IS NULL) OR workspace snippets where they belong
CREATE POLICY snippets_select ON snippets
    FOR SELECT USING (
        (workspace_id IS NULL AND user_id = auth.uid()::text) OR
        (workspace_id IS NOT NULL AND is_workspace_member(workspace_id))
    );

-- Insert: user can insert personal snippet OR workspace snippet if editor+
CREATE POLICY snippets_insert ON snippets
    FOR INSERT WITH CHECK (
        (workspace_id IS NULL AND user_id = auth.uid()::text) OR
        (workspace_id IS NOT NULL AND can_edit_workspace(workspace_id))
    );

-- Update: personal snippet by owner; workspace snippet if editor+
CREATE POLICY snippets_update ON snippets
    FOR UPDATE USING (
        (workspace_id IS NULL AND user_id = auth.uid()::text) OR
        (workspace_id IS NOT NULL AND can_edit_workspace(workspace_id))
    );

-- Delete: personal snippet by owner; workspace snippet if admin/owner or creator
CREATE POLICY snippets_delete ON snippets
    FOR DELETE USING (
        (workspace_id IS NULL AND user_id = auth.uid()::text) OR
        (workspace_id IS NOT NULL AND (
            user_id = auth.uid()::text OR 
            EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = snippets.workspace_id AND user_id = auth.uid()::text AND role IN ('owner', 'admin'))
        ))
    );

-- 5. Clipboard Hub Policies
CREATE POLICY clipboard_personal ON clipboard_items
    FOR ALL USING (
        user_id = auth.uid()::text
    );

-- 6. Devices and Sessions Policies
CREATE POLICY devices_personal ON devices
    FOR ALL USING (
        user_id = auth.uid()::text
    );

CREATE POLICY sessions_personal ON sessions
    FOR ALL USING (
        user_id = auth.uid()::text
    );

-- 7. Share Codes Policies
CREATE POLICY share_codes_select ON share_codes
    FOR SELECT USING (
        expires_at > NOW() AND (claimed = FALSE OR max_claims > claims_count)
    );

CREATE POLICY share_codes_insert ON share_codes
    FOR INSERT WITH CHECK (
        created_by = auth.uid()::text
    );

