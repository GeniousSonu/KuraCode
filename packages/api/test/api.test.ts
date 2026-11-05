import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApiServer } from "../src/server.js";
import type { Server } from "node:http";

describe("@kuracode/api (Liveness, Readiness, Mock OIDC, Mail Catcher)", () => {
  let server: Server;
  const PORT = 3456;
  const BASE = `http://localhost:${PORT}`;

  beforeAll(async () => {
    process.env.PORT = String(PORT);
    server = createApiServer();
    await new Promise<void>((resolve) => server.listen(PORT, resolve));
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("GET /healthz returns 200 with liveness metadata", async () => {
    const res = await fetch(`${BASE}/healthz`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe("ok");
    expect(typeof body.uptimeSeconds).toBe("number");
  });

  it("GET /readyz returns capability states without leaking secrets", async () => {
    const res = await fetch(`${BASE}/readyz`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe("ready");
    expect(body.capabilities["auth.google"]).toBeDefined();
    expect(body.capabilities["db.cloud"]).toBeDefined();
    // Prove no secret values exist in output
    const rawText = JSON.stringify(body);
    expect(rawText).not.toContain("SECRET");
    expect(rawText).not.toContain("API_KEY");
  });

  it("GET /heartbeat returns 200 alive", async () => {
    const res = await fetch(`${BASE}/heartbeat`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.alive).toBe(true);
  });

  it("Mock OIDC authorizes and redirects with code and state", async () => {
    const res = await fetch(
      `${BASE}/api/auth/mock/github/authorize?redirect_uri=${encodeURIComponent("http://localhost:5173/auth/callback")}&state=xyz123`,
      { redirect: "manual" }
    );
    expect(res.status).toBe(302);
    const location = res.headers.get("location");
    expect(location).toContain("code=mock_code_github_");
    expect(location).toContain("state=xyz123");
  });

  it("Mock OIDC exchanges code for tokens and fetches user info", async () => {
    const tokenRes = await fetch(`${BASE}/api/auth/mock/github/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "mock_code_123" }),
    });
    expect(tokenRes.status).toBe(200);
    const tokenData = (await tokenRes.json()) as any;
    expect(tokenData.access_token).toContain("mock_access_token_github");

    const userRes = await fetch(`${BASE}/api/auth/mock/github/userinfo`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    expect(userRes.status).toBe(200);
    const userData = (await userRes.json()) as any;
    expect(userData.email).toBe("dev@kuracode.app");
  });

  it("Local Mail Catcher captures invites and delivers to inbox", async () => {
    await fetch(`${BASE}/api/mail/clear`, { method: "POST" });

    // Send test email
    const sendRes = await fetch(`${BASE}/api/mail/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "developer@example.com",
        subject: "Workspace invite",
        html: "<p>Invite</p>",
      }),
    });
    expect(sendRes.status).toBe(200);

    // Read from inbox
    const inboxRes = await fetch(`${BASE}/api/mail/inbox`);
    const inboxData = (await inboxRes.json()) as any;
    expect(inboxData.emails.length).toBe(1);
    expect(inboxData.emails[0].to).toBe("developer@example.com");
  });

  it("Stub Turnstile verifies tokens cleanly", async () => {
    const res = await fetch(`${BASE}/api/turnstile/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: "sample_token" }),
    });
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
  });
});

