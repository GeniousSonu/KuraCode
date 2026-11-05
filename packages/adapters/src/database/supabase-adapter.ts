import type { IDatabaseAdapter, DBWorkspace, DBSnippet } from "./interface.ts";
import type { HealthCheckResult } from "../common/types.ts";
import { CircuitBreaker } from "../common/circuit-breaker.ts";
import { withRetry, withTimeout } from "../common/retry.ts";

export interface SupabaseConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export class SupabaseDatabaseAdapter implements IDatabaseAdapter {
  private breaker = new CircuitBreaker();
  private config: SupabaseConfig;

  constructor(config: SupabaseConfig) {
    this.config = config;
  }

  private getHeaders(jwt?: string) {
    return {
      apikey: this.config.supabaseAnonKey || "",
      Authorization: `Bearer ${jwt || this.config.supabaseAnonKey || ""}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };
  }

  public async createWorkspace(name: string, ownerId: string): Promise<DBWorkspace> {
    if (!this.config.supabaseUrl || !this.config.supabaseAnonKey) {
      throw new Error("Supabase is not configured. Missing SUPABASE_URL or SUPABASE_ANON_KEY.");
    }

    return this.breaker.execute(async () => {
      return withRetry(async () => {
        return withTimeout(async (signal) => {
          const res = await fetch(`${this.config.supabaseUrl}/rest/v1/workspaces`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify({ name, owner_id: ownerId }),
            signal,
          });

          if (!res.ok) {
            throw new Error(`Supabase createWorkspace failed with status ${res.status}`);
          }

          const data = (await res.json()) as any[];
          const ws = data[0];
          return {
            id: ws.id,
            name: ws.name,
            ownerId: ws.owner_id,
            createdAt: new Date(ws.created_at).getTime(),
          };
        });
      });
    });
  }

  public async listWorkspaces(userId: string): Promise<DBWorkspace[]> {
    if (!this.config.supabaseUrl || !this.config.supabaseAnonKey) {
      throw new Error("Supabase is not configured.");
    }

    return this.breaker.execute(async () => {
      return withRetry(async () => {
        return withTimeout(async (signal) => {
          const res = await fetch(
            `${this.config.supabaseUrl}/rest/v1/workspaces?owner_id=eq.${encodeURIComponent(userId)}&select=*`,
            {
              headers: this.getHeaders(),
              signal,
            }
          );

          if (!res.ok) {
            throw new Error(`Supabase listWorkspaces failed with status ${res.status}`);
          }

          const data = (await res.json()) as any[];
          return data.map((ws) => ({
            id: ws.id,
            name: ws.name,
            ownerId: ws.owner_id,
            createdAt: new Date(ws.created_at).getTime(),
          }));
        });
      });
    });
  }

  public async saveSnippet(snippet: DBSnippet): Promise<void> {
    if (!this.config.supabaseUrl || !this.config.supabaseAnonKey) {
      throw new Error("Supabase is not configured.");
    }

    await this.breaker.execute(async () => {
      return withRetry(async () => {
        return withTimeout(async (signal) => {
          const res = await fetch(`${this.config.supabaseUrl}/rest/v1/snippets`, {
            method: "POST",
            headers: {
              ...this.getHeaders(),
              Prefer: "resolution=merge-duplicates",
            },
            body: JSON.stringify({
              id: snippet.id,
              workspace_id: snippet.workspaceId,
              user_id: snippet.userId,
              title: snippet.title,
              code: snippet.code,
              raw: snippet.raw,
              language: snippet.language,
              created_at: new Date(snippet.createdAt).toISOString(),
              updated_at: new Date(snippet.updatedAt).toISOString(),
            }),
            signal,
          });

          if (!res.ok) {
            throw new Error(`Supabase saveSnippet failed with status ${res.status}`);
          }
        });
      });
    });
  }

  public async listSnippets(workspaceId: string | null, userId: string): Promise<DBSnippet[]> {
    if (!this.config.supabaseUrl || !this.config.supabaseAnonKey) {
      throw new Error("Supabase is not configured.");
    }

    return this.breaker.execute(async () => {
      return withRetry(async () => {
        return withTimeout(async (signal) => {
          const filter = workspaceId
            ? `workspace_id=eq.${encodeURIComponent(workspaceId)}`
            : `workspace_id=is.null&user_id=eq.${encodeURIComponent(userId)}`;

          const res = await fetch(`${this.config.supabaseUrl}/rest/v1/snippets?${filter}&select=*`, {
            headers: this.getHeaders(),
            signal,
          });

          if (!res.ok) {
            throw new Error(`Supabase listSnippets failed with status ${res.status}`);
          }

          const data = (await res.json()) as any[];
          return data.map((s) => ({
            id: s.id,
            workspaceId: s.workspace_id,
            userId: s.user_id,
            title: s.title,
            code: s.code,
            raw: s.raw,
            language: s.language,
            createdAt: new Date(s.created_at).getTime(),
            updatedAt: new Date(s.updated_at).getTime(),
          }));
        });
      });
    });
  }

  public async deleteSnippet(snippetId: string, _userId: string): Promise<boolean> {
    if (!this.config.supabaseUrl || !this.config.supabaseAnonKey) {
      throw new Error("Supabase is not configured.");
    }

    return this.breaker.execute(async () => {
      return withRetry(async () => {
        return withTimeout(async (signal) => {
          const res = await fetch(
            `${this.config.supabaseUrl}/rest/v1/snippets?id=eq.${encodeURIComponent(snippetId)}`,
            {
              method: "DELETE",
              headers: this.getHeaders(),
              signal,
            }
          );
          return res.ok;
        });
      });
    });
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    const start = Date.now();
    if (!this.config.supabaseUrl || !this.config.supabaseAnonKey) {
      return {
        ok: false,
        status: "unconfigured",
        latencyMs: 0,
        message: "Supabase cloud database is not configured. Falling back to local storage.",
      };
    }

    try {
      const res = await withTimeout(async (signal) => {
        return fetch(`${this.config.supabaseUrl}/rest/v1/`, {
          method: "GET",
          headers: this.getHeaders(),
          signal,
        });
      }, 3000);

      return {
        ok: res.ok,
        status: res.ok ? "healthy" : "degraded",
        latencyMs: Date.now() - start,
        message: res.ok ? "Supabase REST endpoint is healthy." : `Supabase returned status ${res.status}`,
      };
    } catch (err: any) {
      return {
        ok: false,
        status: "unhealthy",
        latencyMs: Date.now() - start,
        error: err.message,
      };
    }
  }
}
