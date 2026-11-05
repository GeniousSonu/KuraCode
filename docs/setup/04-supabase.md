# Setup Guide 04: Supabase (PostgreSQL 16, Auth & Realtime Sync)

*Verified Date: November 2026*

This guide sets up Supabase for cloud PostgreSQL storage, Row-Level Security (RLS) multi-tenancy, Realtime WebSocket synchronization, and managed OAuth bridge.

---

## 1. Create Supabase Project

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New project**:
   - **Name:** `KuraCode`
   - **Database Password:** Generate and store in a secure password manager.
   - **Region:** Choose a region close to your primary users (e.g., `us-east-1` or `eu-central-1` or `ap-south-1`).
   - **Pricing Plan:** Select **Free Tier**.
3. Click **Create new project** (takes ~90 seconds to provision).

---

## 2. Run Database Migrations

You can run the plain SQL migrations either using the Supabase Web SQL Editor or via the Supabase CLI:

### Option A: Web SQL Editor (Recommended for initial setup)
1. In the Supabase sidebar, click **SQL Editor**.
2. Click **+ New query**.
3. Copy and run in exact order:
   - File 1: [`supabase/migrations/20261105000001_initial_schema.sql`](file:///home/dayshift/Pictures/extension%20tool/supabase/migrations/20261105000001_initial_schema.sql)
   - File 2: [`supabase/migrations/20261105000002_rls_policies.sql`](file:///home/dayshift/Pictures/extension%20tool/supabase/migrations/20261105000002_rls_policies.sql)
4. Confirm message: `Success. No rows returned.`

### Option B: Supabase CLI
```bash
npx supabase db push
```

---

## 3. Enable Authentication Providers & Redirect Allow-List

1. In Supabase sidebar, go to **Authentication** -> **Providers**:
   - **GitHub:** Toggle **Enabled**, enter GitHub Client ID & Secret from Guide 01. Copy the Callback URL provided by Supabase into your GitHub OAuth App if using Supabase as bridge.
   - **Google:** Toggle **Enabled**, enter Google Client ID & Secret from Guide 02.
2. Go to **Authentication** -> **URL Configuration**:
   - **Site URL:** `https://www.genioussonu.me/extensions/kuracode`
   - **Redirect URLs (Allow-list):**
     - `https://www.genioussonu.me/extensions/kuracode/auth/callback`
     - `https://kmbodbaepkmhfeohkbfbkpmnnjfkknmg.chromiumapp.org/`
     - `http://localhost:5173/auth/callback`
     - `http://localhost:3000/auth/callback`

---

## 4. Enable Realtime Sync

1. Go to **Database** -> **Replication**:
2. Under **supabase_realtime**:
   - Enable replication for table `snippets`
   - Enable replication for table `workspaces`
   - Enable replication for table `clipboard_items`

---

## 5. Environment Variables & Key Hygiene

Go to **Project Settings** -> **API**:
- **Project URL:** Copy `https://<your-project-id>.supabase.co`
- **Project API Keys:**
  - `anon` `public`: Safe to expose in extension and web client because Row-Level Security protects every row.
  - `service_role` `secret`: **SERVER ONLY.** Bypasses RLS. NEVER bundle in extension or client builds!

Add to `.env.local`:
```bash
PUBLIC_SUPABASE_URL="https://<your-project-id>.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
```

### Testing the Integration
```bash
pnpm setup:test supabase
```

**Success output:**
```
✔ [PASS] Supabase REST & Realtime endpoints connected. Capabilities 'db.cloud' & 'realtime' are now ENABLED.
```

---

## 6. Free-Tier Limits & Inactivity Safety

- **Storage:** 500 MB database, 5 GB egress/month, 50,000 monthly active users, 200 concurrent Realtime connections.
- **Inactivity Pause Warning:** Free Supabase projects pause after 7 consecutive days of inactivity.
  - *Keep-Alive Plan:* KuraCode's GitHub Actions scheduled nightly workflow (`.github/workflows/nightly.yml`) executes an automated health query every 24 hours to prevent dormancy pauses.

