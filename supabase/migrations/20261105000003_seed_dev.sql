-- ==============================================================================
-- KuraCode Development & Staging Seed Script
-- Safe deterministic seed records for offline testing and development
-- DO NOT RUN IN PRODUCTION
-- ==============================================================================

-- Seed Workspaces
INSERT INTO workspaces (id, name, owner_id)
VALUES 
    ('ws_dev_frontend', 'Frontend Engineering', 'usr_dev_alice'),
    ('ws_dev_platform', 'Core Platform', 'usr_dev_bob')
ON CONFLICT (id) DO NOTHING;

-- Seed Workspace Members
INSERT INTO workspace_members (id, workspace_id, user_id, role)
VALUES 
    ('wsm_dev_1', 'ws_dev_frontend', 'usr_dev_alice', 'owner'),
    ('wsm_dev_2', 'ws_dev_frontend', 'usr_dev_carol', 'editor'),
    ('wsm_dev_3', 'ws_dev_platform', 'usr_dev_bob', 'owner')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Snippets
INSERT INTO snippets (id, workspace_id, user_id, title, code, raw, language, pinned)
VALUES
    ('snip_dev_1', 'ws_dev_frontend', 'usr_dev_alice', 'React useDebounce hook', 'function useDebounce<T>(value: T, delay: number): T {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const timer = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(timer);\n  }, [value, delay]);\n  return debounced;\n}', 'function useDebounce<T>(value: T, delay: number): T {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const timer = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(timer);\n  }, [value, delay]);\n  return debounced;\n}', 'typescript', true),
    ('snip_dev_2', 'ws_dev_platform', 'usr_dev_bob', 'Docker healthcheck snippet', 'HEALTHCHECK --interval=30s --timeout=5s --retries=3 \\\n  CMD curl -f http://localhost:3000/healthz || exit 1', 'HEALTHCHECK --interval=30s --timeout=5s --retries=3 \\\n  CMD curl -f http://localhost:3000/healthz || exit 1', 'dockerfile', false)
ON CONFLICT (id) DO NOTHING;

