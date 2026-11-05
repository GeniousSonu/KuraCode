import fs from "node:fs";
import type { IStorePublisher, PublishResult } from "./interface.ts";
import type { HealthCheckResult } from "../common/types.ts";
import { withTimeout } from "../common/retry.ts";

export interface ChromeStoreConfig {
  extensionId?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

export class ChromeStorePublisher implements IStorePublisher {
  public readonly target = "chrome" as const;
  private config: ChromeStoreConfig;

  constructor(config: ChromeStoreConfig) {
    this.config = config;
  }

  public async publish(zipPath: string, dryRun = true): Promise<PublishResult> {
    if (!fs.existsSync(zipPath)) {
      throw new Error(`Chrome publish artifact not found at ${zipPath}`);
    }

    if (dryRun) {
      return {
        success: true,
        target: "chrome",
        status: `[DRY_RUN] Chrome extension package ${zipPath} validated (${fs.statSync(zipPath).size} bytes). Ready for upload to ID ${this.config.extensionId || "kmbodbaepkmhfeohkbfbkpmnnjfkknmg"}.`,
        dryRun: true,
      };
    }

    if (!this.config.clientId || !this.config.clientSecret || !this.config.refreshToken || !this.config.extensionId) {
      throw new Error("Missing Chrome Web Store API credentials.");
    }

    // Refresh OAuth token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Chrome Web Store token refresh failed: ${tokenRes.status}`);
    }

    const { access_token } = (await tokenRes.json()) as any;

    // Upload archive
    const zipBytes = fs.readFileSync(zipPath);
    const uploadRes = await fetch(
      `https://www.googleapis.com/upload/chromewebstore/v1.1/items/${this.config.extensionId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "x-goog-api-version": "2",
        },
        body: zipBytes,
      }
    );

    if (!uploadRes.ok) {
      throw new Error(`Chrome item upload failed: ${uploadRes.status}`);
    }

    const uploadData = (await uploadRes.json()) as any;
    return {
      success: uploadData.uploadState === "SUCCESS",
      target: "chrome",
      status: `Uploaded to Chrome Web Store: ${uploadData.uploadState}`,
      operationId: uploadData.id,
      dryRun: false,
    };
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    if (!this.config.clientId || !this.config.refreshToken) {
      return {
        ok: false,
        status: "unconfigured",
        latencyMs: 0,
        message: "Chrome Web Store credentials not configured in environment.",
      };
    }

    try {
      const res = await withTimeout(async (signal) => {
        return fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: this.config.clientId || "",
            client_secret: this.config.clientSecret || "",
            refresh_token: this.config.refreshToken || "",
            grant_type: "refresh_token",
          }),
          signal,
        });
      }, 5000);

      return {
        ok: res.ok,
        status: res.ok ? "healthy" : "unhealthy",
        latencyMs: 1,
        message: res.ok ? "Chrome Web Store token refresh verified." : `Token refresh returned ${res.status}`,
      };
    } catch (err: any) {
      return {
        ok: false,
        status: "unhealthy",
        latencyMs: 0,
        error: err.message,
      };
    }
  }
}
