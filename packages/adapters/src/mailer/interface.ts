import type { HealthCheckResult } from "../common/types.ts";

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface IMailer {
  sendEmail(payload: EmailPayload): Promise<{ id: string; success: boolean }>;
  checkHealth(): Promise<HealthCheckResult>;
}
