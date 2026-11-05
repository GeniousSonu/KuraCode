import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { evaluateCapabilities, generateRedirectUris } from "@kuracode/config";
import { MockMailCatcher, StubCaptchaVerifier } from "@kuracode/adapters";

const PORT = Number(process.env.PORT || 3000);
const mailCatcher = new MockMailCatcher();
const captchaVerifier = new StubCaptchaVerifier();
const startTime = Date.now();

export function createApiServer() {
  const uris = generateRedirectUris();

  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || "/", `http://localhost:${PORT}`);
    const method = req.method || "GET";

    // Set CORS headers
    const origin = req.headers.origin;
    if (origin && (uris.authorizedOrigins.includes(origin) || origin.startsWith("chrome-extension://"))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE, PUT");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey");

    if (method === "OPTIONS") {
      res.writeHead(204).end();
      return;
    }

    // Helper: JSON response
    const sendJson = (statusCode: number, data: unknown) => {
      res.writeHead(statusCode, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    };

    // Helper: Parse JSON body
    const parseBody = async (): Promise<any> => {
      return new Promise((resolve) => {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch {
            resolve({});
          }
        });
      });
    };

    // --- 1. HEALTH & READINESS ENDPOINTS ---
    if (url.pathname === "/healthz") {
      return sendJson(200, {
        status: "ok",
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString(),
      });
    }

    if (url.pathname === "/readyz") {
      const caps = evaluateCapabilities();
      const isReady = true; // Service is always ready in zero-account mode
      return sendJson(200, {
        status: isReady ? "ready" : "degraded",
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString(),
        capabilities: Object.fromEntries(Object.entries(caps).map(([k, v]) => [k, v.status])),
      });
    }

    if (url.pathname === "/heartbeat") {
      return sendJson(200, {
        alive: true,
        service: "kuracode-api",
        timestamp: new Date().toISOString(),
      });
    }

    // --- 2. CAPABILITIES API ---
    if (url.pathname === "/api/capabilities") {
      const caps = evaluateCapabilities();
      return sendJson(200, {
        capabilities: caps,
        timestamp: new Date().toISOString(),
      });
    }

    // --- 3. MOCK OIDC PROVIDER (Zero-Account local development & CI) ---
    // /api/auth/mock/:provider/authorize
    const mockAuthMatch = url.pathname.match(/^\/api\/auth\/mock\/([^/]+)\/authorize$/);
    if (mockAuthMatch && method === "GET") {
      const provider = mockAuthMatch[1];
      const redirectUri = url.searchParams.get("redirect_uri");
      const state = url.searchParams.get("state") || "mock_state";
      const code = `mock_code_${provider}_${Date.now()}`;

      if (!redirectUri) {
        return sendJson(400, { error: "missing redirect_uri" });
      }

      // Automatically redirect back with authorization code & state
      const targetUrl = new URL(redirectUri);
      targetUrl.searchParams.set("code", code);
      targetUrl.searchParams.set("state", state);

      res.writeHead(302, { Location: targetUrl.toString() }).end();
      return;
    }

    // /api/auth/mock/:provider/token
    const mockTokenMatch = url.pathname.match(/^\/api\/auth\/mock\/([^/]+)\/token$/);
    if (mockTokenMatch && method === "POST") {
      const provider = mockTokenMatch[1];
      return sendJson(200, {
        access_token: `mock_access_token_${provider}_${Date.now()}`,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: `mock_refresh_token_${provider}`,
        id_token: `mock_id_token_${provider}`,
      });
    }

    // /api/auth/mock/:provider/userinfo
    const mockUserMatch = url.pathname.match(/^\/api\/auth\/mock\/([^/]+)\/userinfo$/);
    if (mockUserMatch && method === "GET") {
      const provider = mockUserMatch[1];
      return sendJson(200, {
        id: `mock_user_${provider}_42`,
        email: `dev@kuracode.app`,
        name: `KuraCode Local Developer (${provider})`,
        avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=kuracode`,
      });
    }

    // --- 4. LOCAL MAIL CATCHER INBOX ---
    if (url.pathname === "/api/mail/inbox" && method === "GET") {
      return sendJson(200, { emails: mailCatcher.getOutbox() });
    }

    if (url.pathname === "/api/mail/send" && method === "POST") {
      const body = await parseBody();
      const result = await mailCatcher.sendEmail(body);
      return sendJson(200, result);
    }

    if (url.pathname === "/api/mail/clear" && method === "POST") {
      mailCatcher.clear();
      return sendJson(200, { success: true });
    }

    // --- 5. STUB TURNSTILE VERIFIER ---
    if (url.pathname === "/api/turnstile/verify" && method === "POST") {
      const body = await parseBody();
      const result = await captchaVerifier.verifyToken(body.response || "");
      return sendJson(200, result);
    }

    // Not found
    return sendJson(404, { error: "Endpoint not found" });
  });
}

// Start if executed directly
if (process.argv[1]?.endsWith("server.ts") || process.argv[1]?.endsWith("server.js")) {
  const server = createApiServer();
  server.listen(PORT, () => {
    console.info(`[KuraCode API] Server listening on http://localhost:${PORT}`);
    console.info(`[KuraCode API] Liveness: http://localhost:${PORT}/healthz`);
    console.info(`[KuraCode API] Readiness: http://localhost:${PORT}/readyz`);
  });
}

