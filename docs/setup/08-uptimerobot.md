# Setup Guide 08: UptimeRobot (Uptime Monitoring & Status Page)

*Verified Date: November 2026*

This guide sets up UptimeRobot to monitor KuraCode services and host a public status page linked from the official website and support pages.

---

## 1. Create Heartbeat & HTTP Monitors

1. Sign up or log in at [UptimeRobot](https://uptimerobot.com/).
2. Click **+ Add New Monitor**:
   - **Monitor 1 (Web App):**
     - Type: `HTTP(s)`
     - Friendly Name: `KuraCode Web App`
     - URL: `https://www.genioussonu.me/extensions/kuracode`
     - Monitoring Interval: `5 minutes`
   - **Monitor 2 (API Liveness):**
     - Type: `HTTP(s)`
     - Friendly Name: `KuraCode API Health`
     - URL: `https://<your-api-domain>/healthz`
     - Monitoring Interval: `5 minutes`
   - **Monitor 3 (Readiness Probe):**
     - Type: `HTTP(s)`
     - Friendly Name: `KuraCode Services Readiness`
     - URL: `https://<your-api-domain>/readyz`
     - Monitoring Interval: `5 minutes`
   - **Monitor 4 (Cron Heartbeat):**
     - Type: `Heartbeat`
     - Friendly Name: `Nightly Database Keep-Alive Heartbeat`
     - Interval: `24 hours`
     - Copy the generated Heartbeat URL.

---

## 2. Configure Public Status Page

1. In the top navigation, click **Status Pages** -> **+ Add Status Page**.
2. **Name:** `KuraCode Status`
3. **Domain:** `status.genioussonu.me` (or standard `stats.uptimerobot.com/<id>`).
4. Select all 4 monitors created above.
5. Add the status page URL to `README.md`, `SUPPORT.md`, and the website footer.

---

## 3. Environment Variables

Add to `.env.local`:
```bash
UPTIMEROBOT_HEARTBEAT_URL="https://heartbeat.uptimerobot.com/<your-heartbeat-id>"
UPTIMEROBOT_API_KEY="<your-uptimerobot-read-only-api-key>"
```

### Testing the Integration
```bash
pnpm setup:test uptimerobot
```

**Success output:**
```
✔ [PASS] UptimeRobot heartbeat ping acknowledged. Capability 'uptime.status' is now ENABLED.
```

---

## 4. Free-Tier Limits

- **Limits:** 50 monitors free with 5-minute check intervals, 1 public status page with custom domain support.

