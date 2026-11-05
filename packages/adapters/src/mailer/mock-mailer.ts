import type { IMailer, EmailPayload } from "./interface.ts";
import type { HealthCheckResult } from "../common/types.ts";

export interface CapturedEmail extends EmailPayload {
  id: string;
  sentAt: number;
}

export class MockMailCatcher implements IMailer {
  private outbox: CapturedEmail[] = [];

  public async sendEmail(payload: EmailPayload): Promise<{ id: string; success: boolean }> {
    const id = `mail_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const email: CapturedEmail = {
      ...payload,
      id,
      sentAt: Date.now(),
    };
    this.outbox.push(email);
    return { id, success: true };
  }

  public getOutbox(): CapturedEmail[] {
    return [...this.outbox];
  }

  public getLatestEmail(): CapturedEmail | undefined {
    return this.outbox[this.outbox.length - 1];
  }

  public clear() {
    this.outbox = [];
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    return {
      ok: true,
      status: "healthy",
      latencyMs: 1,
      message: `MockMailCatcher active (captured ${this.outbox.length} emails).`,
    };
  }
}
