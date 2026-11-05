import type { HealthCheckResult } from "../common/types.ts";

export interface DBWorkspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
}

export interface DBSnippet {
  id: string;
  workspaceId: string | null;
  userId: string;
  title: string;
  code: string;
  raw: string;
  language: string;
  createdAt: number;
  updatedAt: number;
}

export interface IDatabaseAdapter {
  createWorkspace(name: string, ownerId: string): Promise<DBWorkspace>;
  listWorkspaces(userId: string): Promise<DBWorkspace[]>;
  saveSnippet(snippet: DBSnippet): Promise<void>;
  listSnippets(workspaceId: string | null, userId: string): Promise<DBSnippet[]>;
  deleteSnippet(snippetId: string, userId: string): Promise<boolean>;
  checkHealth(): Promise<HealthCheckResult>;
}
