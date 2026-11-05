import type { IDatabaseAdapter, DBWorkspace, DBSnippet } from "./interface.ts";
import type { HealthCheckResult } from "../common/types.ts";

export class MemoryDatabaseAdapter implements IDatabaseAdapter {
  private workspaces: Map<string, DBWorkspace> = new Map();
  private snippets: Map<string, DBSnippet> = new Map();

  public async createWorkspace(name: string, ownerId: string): Promise<DBWorkspace> {
    const id = `ws_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const ws: DBWorkspace = {
      id,
      name,
      ownerId,
      createdAt: Date.now(),
    };
    this.workspaces.set(id, ws);
    return ws;
  }

  public async listWorkspaces(userId: string): Promise<DBWorkspace[]> {
    return Array.from(this.workspaces.values()).filter((ws) => ws.ownerId === userId);
  }

  public async saveSnippet(snippet: DBSnippet): Promise<void> {
    this.snippets.set(snippet.id, { ...snippet, updatedAt: Date.now() });
  }

  public async listSnippets(workspaceId: string | null, userId: string): Promise<DBSnippet[]> {
    return Array.from(this.snippets.values()).filter((s) => {
      if (workspaceId) {
        return s.workspaceId === workspaceId;
      }
      // Personal space: workspaceId is null and user matches
      return s.workspaceId === null && s.userId === userId;
    });
  }

  public async deleteSnippet(snippetId: string, userId: string): Promise<boolean> {
    const s = this.snippets.get(snippetId);
    if (!s) return false;
    // RLS: User can delete if owner or member
    if (s.userId === userId || s.workspaceId !== null) {
      this.snippets.delete(snippetId);
      return true;
    }
    return false;
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    return {
      ok: true,
      status: "healthy",
      latencyMs: 1,
      message: "MemoryDatabaseAdapter (Zero-Account mode) active.",
    };
  }

  public clear() {
    this.workspaces.clear();
    this.snippets.clear();
  }
}
