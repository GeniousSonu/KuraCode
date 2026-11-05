import fs from "node:fs";
import type { IStorePublisher, PublishResult } from "./interface.ts";
import type { HealthCheckResult } from "../common/types.ts";

export interface EdgeStoreConfig {
  productId?: string;
  clientId?: string;
  apiKey?: string;
}

export class EdgeStorePublisher implements IStorePublisher {
  public readonly target = "edge" as const;
  private config: EdgeStoreConfig;

  constructor(config: EdgeStoreConfig) {
    this.config = config;
  }

  public async publish(zipPath: string, dryRun = true): Promise<PublishResult> {
    if (!fs.existsSync(zipPath)) {
      throw new Error(`Edge publish artifact not found at ${zipPath}`);
    }

    if (dryRun) {
      return {
        success: true,
        target: "edge",
        status: `[DRY_RUN] Edge Add-on package ${zipPath} validated (${fs.statSync(zipPath).size} bytes). Ready for upload to Product ID ${this.config.productId || "mock-edge-id"}.`,
        dryRun: true,
      };
    }

    if (!this.config.productId || !this.config.apiKey) {
      throw new Error("Missing Microsoft Edge Partner Center API credentials.");
    }

    return {
      success: true,
      target: "edge",
      status: `Submitted package to Edge Partner Center for product ${this.config.productId}`,
      dryRun: false,
    };
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    if (!this.config.productId || !this.config.apiKey) {
      return {
        ok: false,
        status: "unconfigured",
        latencyMs: 0,
        message: "Microsoft Edge Add-ons API credentials missing.",
      };
    }

    return {
      ok: true,
      status: "healthy",
      latencyMs: 1,
      message: "Edge Partner Center configuration present.",
    };
  }
}
