import { useEffect, useState } from "react";

export interface CapabilityItem {
  name: string;
  status: "ENABLED" | "DISABLED_MISSING_CONFIG" | "DISABLED_BY_OWNER" | "DEGRADED";
  description: string;
  requiredVars: string[];
  missingVars: string[];
  fallbackStrategy?: string;
  guideLink: string;
}

const DEFAULT_CAPABILITIES: Record<string, CapabilityItem> = {
  "auth.google": {
    name: "auth.google",
    status: "DISABLED_MISSING_CONFIG",
    description: "Google OAuth 2.0 / OIDC Sign-In",
    requiredVars: ["PUBLIC_GOOGLE_CLIENT_ID"],
    missingVars: ["PUBLIC_GOOGLE_CLIENT_ID"],
    fallbackStrategy: "Offline local mode",
    guideLink: "docs/setup/02-google-cloud.md",
  },
  "auth.github": {
    name: "auth.github",
    status: "DISABLED_MISSING_CONFIG",
    description: "GitHub OAuth App Sign-In",
    requiredVars: ["PUBLIC_GITHUB_CLIENT_ID"],
    missingVars: ["PUBLIC_GITHUB_CLIENT_ID"],
    fallbackStrategy: "Offline local mode",
    guideLink: "docs/setup/01-github.md",
  },
  "db.cloud": {
    name: "db.cloud",
    status: "DEGRADED",
    description: "Cloud PostgreSQL Storage (Supabase)",
    requiredVars: ["PUBLIC_SUPABASE_URL", "PUBLIC_SUPABASE_ANON_KEY"],
    missingVars: ["PUBLIC_SUPABASE_URL", "PUBLIC_SUPABASE_ANON_KEY"],
    fallbackStrategy: "Local browser storage / IndexedDB with JSON export",
    guideLink: "docs/setup/04-supabase.md",
  },
  "realtime": {
    name: "realtime",
    status: "DEGRADED",
    description: "Real-time WebSocket Sync across devices",
    requiredVars: ["PUBLIC_SUPABASE_URL", "PUBLIC_SUPABASE_ANON_KEY"],
    missingVars: ["PUBLIC_SUPABASE_URL", "PUBLIC_SUPABASE_ANON_KEY"],
    fallbackStrategy: "Offline mutation queue and local polling",
    guideLink: "docs/setup/04-supabase.md",
  },
  "email.send": {
    name: "email.send",
    status: "DEGRADED",
    description: "Transactional Email via Resend",
    requiredVars: ["RESEND_API_KEY"],
    missingVars: ["RESEND_API_KEY"],
    fallbackStrategy: "Direct invite link copying",
    guideLink: "docs/setup/05-resend.md",
  },
  "ratelimit.redis": {
    name: "ratelimit.redis",
    status: "DEGRADED",
    description: "Atomic Rate Limiting & Ephemeral Cache (Upstash)",
    requiredVars: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    missingVars: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    fallbackStrategy: "In-memory sliding window rate limiter",
    guideLink: "docs/setup/07-upstash-redis.md",
  },
  "captcha": {
    name: "captcha",
    status: "DEGRADED",
    description: "Bot Protection via Cloudflare Turnstile",
    requiredVars: ["PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"],
    missingVars: ["PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"],
    fallbackStrategy: "IP rate limiting and lockout",
    guideLink: "docs/setup/03-cloudflare.md",
  },
  "errors.sentry": {
    name: "errors.sentry",
    status: "DEGRADED",
    description: "Error Tracking with Content Scrubbing (Sentry)",
    requiredVars: ["PUBLIC_SENTRY_DSN"],
    missingVars: ["PUBLIC_SENTRY_DSN"],
    fallbackStrategy: "Local structured logging and diagnostic bundle export",
    guideLink: "docs/setup/06-sentry.md",
  },
  "uptime.status": {
    name: "uptime.status",
    status: "DEGRADED",
    description: "UptimeRobot Monitoring & Status Page",
    requiredVars: ["UPTIMEROBOT_HEARTBEAT_URL"],
    missingVars: ["UPTIMEROBOT_HEARTBEAT_URL"],
    fallbackStrategy: "Built-in /healthz & /readyz probes",
    guideLink: "docs/setup/08-uptimerobot.md",
  },
};

export function SetupWizard() {
  const [capabilities, setCapabilities] = useState<Record<string, CapabilityItem>>(DEFAULT_CAPABILITIES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Attempt to fetch live capability status from API if running
    fetch("http://localhost:3000/api/capabilities")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.capabilities) {
          setCapabilities(data.capabilities);
        }
      })
      .catch(() => {
        // Fall back cleanly to default client capabilities
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "20px", background: "#111418", borderRadius: "8px", color: "#e6edf3", marginTop: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>First-Run Service Setup & Capability Health</h2>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#8b949e" }}>
            KuraCode runs 100% offline in Zero-Account mode. Connect services one by one; each feature activates automatically.
          </p>
        </div>
        <span style={{ fontSize: "12px", background: "#00b96c22", color: "#00b96c", padding: "4px 8px", borderRadius: "4px", border: "1px solid #00b96c44" }}>
          Zero Secrets Exposed
        </span>
      </div>

      {loading ? (
        <p>Checking service capabilities...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #30363d", color: "#8b949e" }}>
                <th style={{ padding: "8px 12px" }}>Capability</th>
                <th style={{ padding: "8px 12px" }}>Status</th>
                <th style={{ padding: "8px 12px" }}>Active Strategy / Fallback</th>
                <th style={{ padding: "8px 12px" }}>Guide</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(capabilities).map(([key, cap]) => {
                let badgeColor = "#f85149";
                let badgeBg = "#f8514922";
                if (cap.status === "ENABLED") {
                  badgeColor = "#3fb950";
                  badgeBg = "#3fb95022";
                } else if (cap.status === "DEGRADED") {
                  badgeColor = "#d29922";
                  badgeBg = "#d2992222";
                }

                return (
                  <tr key={key} style={{ borderBottom: "1px solid #21262d" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>
                      <div>{cap.name}</div>
                      <div style={{ fontSize: "11px", color: "#8b949e" }}>{cap.description}</div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ color: badgeColor, background: badgeBg, padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>
                        {cap.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#c9d1d9" }}>
                      {cap.missingVars.length === 0 ? (
                        <span style={{ color: "#3fb950" }}>Connected & Active</span>
                      ) : (
                        <span>
                          <strong style={{ color: "#8b949e" }}>Fallback:</strong> {cap.fallbackStrategy || "Disabled"}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <code style={{ fontSize: "11px", color: "#58a6ff" }}>{cap.guideLink}</code>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

