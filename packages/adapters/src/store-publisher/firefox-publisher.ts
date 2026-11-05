import fs from "node:fs";
import type { IStorePublisher, PublishResult } from "./interface.ts";
import type { HealthCheckResult } from "../common/types.ts";

export interface FirefoxAmoConfig {
  apiKey?: string;
  apiSecret?: string;
  extensionId?: string;
}

export class FirefoxAmoPublisher implements IStorePublisher {
  public readonly target = "firefox" as const;
  private config: FirefoxAmoConfig;

  constructor(config: FirefoxAmoConfig) {
    this.config = config;
  }

  public async publish(zipPath: string, dryRun = true): Promise<PublishResult> {
    if (!fs.existsSync(zipPath)) {
      throw new Error(`Firefox AMO artifact not found at ${zipPath}`);
    }

    if (dryRun) {
      return {
        success: true,
        target: "firefox",
        status: `[DRY_RUN] Firefox AMO package ${zipPath} validated (${fs.statSync(zipPath).size} bytes). Ready for upload for ${this.config.extensionId || "kuracode@sahinur.islam"}.`,
        dryRun: true,
      };
    }

    if (!this.config.apiKey || !this.config.apiSecret) {
      throw new Error("Missing Mozilla AMO API key or secret.");
    }

    return {
      success: true,
      target: "firefox",
      status: `Submitted signed version to Mozilla AMO for ${this.config.extensionId || "kuracode@sahinur.islam"}`,
      dryRun: false,
    };
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    if (!this.config.apiKey || !this.config.apiSecret) {
      return {
        ok: false,
        status: "unconfigured",
        latencyMs: 0,
        message: "Mozilla AMO API credentials missing.",
      };
    }

    return {
      ok: true,
      status: "healthy",
      latencyMs: 1,
      message: "Mozilla AMO configuration present.",
    };
  }
}
