/**
 * Workspaces & Multi-Tenancy Module (WS-1..WS-4, INV-1..INV-3, RT-1..RT-4)
 * Strict role-based access control (RBAC), tenant isolation, and invite codes.
 */

export type WorkspaceRole = "owner" | "admin" | "editor" | "commenter" | "viewer";

export interface WorkspaceMember {
  userId: string;
  email: string;
  name: string;
  role: WorkspaceRole;
  joinedAt: number;
}

export interface WorkspaceSettings {
  stripUrlsByDefault: boolean;
  allowMemberInvites: boolean;
  retentionDays: number;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  ownerId: string;
  createdAt: number;
  members: WorkspaceMember[];
  settings: WorkspaceSettings;
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  workspaceName: string;
  inviterEmail: string;
  inviterName?: string;
  role: WorkspaceRole;
  code: string; // 6-character code (e.g., KURA-9281) or 4-digit code
  token: string;
  expiresAt: number;
  maxUses: number;
  usedCount: number;
  revoked: boolean;
}

export interface CodeClaimResult {
  kind: "workspace_invite" | "quick_share";
  targetId: string;
  title: string;
  subtitle: string;
  role?: WorkspaceRole;
  expiresInMinutes: number;
  data?: unknown;
}

/**
 * Validates permission action for a specific role (RBAC matrix).
 */
export function canPerformAction(
  role: WorkspaceRole,
  action: "view" | "edit" | "delete" | "invite" | "admin" | "transfer_ownership"
): boolean {
  switch (action) {
    case "view":
      return true; // all roles can view
    case "edit":
      return role === "owner" || role === "admin" || role === "editor";
    case "delete":
      return role === "owner" || role === "admin";
    case "invite":
      return role === "owner" || role === "admin";
    case "admin":
      return role === "owner" || role === "admin";
    case "transfer_ownership":
      return role === "owner";
    default:
      return false;
  }
}

export class WorkspaceManager {
  private workspaces: Workspace[] = [];
  private invites: WorkspaceInvite[] = [];
  private activeWorkspaceId: string | null = null; // null = Personal Space
  private failedAttempts = 0;
  private lockedUntil = 0;

  constructor(initialWorkspaces: Workspace[] = [], initialInvites: WorkspaceInvite[] = []) {
    this.workspaces = [...initialWorkspaces];
    this.invites = [...initialInvites];
  }

  getActiveWorkspaceId(): string | null {
    return this.activeWorkspaceId;
  }

  setActiveWorkspaceId(id: string | null): void {
    if (id !== null && !this.workspaces.some((w) => w.id === id)) {
      throw new Error(`Workspace with ID "${id}" does not exist`);
    }
    this.activeWorkspaceId = id;
  }

  createWorkspace(
    name: string,
    owner: { id: string; email: string; name: string },
    icon?: string
  ): Workspace {
    const ws: Workspace = {
      id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      icon: icon || "📁",
      ownerId: owner.id,
      createdAt: Date.now(),
      members: [
        {
          userId: owner.id,
          email: owner.email,
          name: owner.name,
          role: "owner",
          joinedAt: Date.now(),
        },
      ],
      settings: {
        stripUrlsByDefault: false,
        allowMemberInvites: true,
        retentionDays: 365,
      },
    };
    this.workspaces.push(ws);
    return ws;
  }

  listWorkspaces(): Workspace[] {
    return [...this.workspaces];
  }

  getWorkspace(id: string): Workspace | undefined {
    return this.workspaces.find((w) => w.id === id);
  }

  deleteWorkspace(id: string, actorId: string): void {
    const ws = this.getWorkspace(id);
    if (!ws) throw new Error("Workspace not found");
    const member = ws.members.find((m) => m.userId === actorId);
    if (!member || !canPerformAction(member.role, "delete")) {
      throw new Error("Insufficient permissions to delete workspace");
    }
    this.workspaces = this.workspaces.filter((w) => w.id !== id);
    if (this.activeWorkspaceId === id) {
      this.activeWorkspaceId = null; // revert to Personal
    }
  }

  createInvite(
    workspaceId: string,
    inviter: { email: string; name: string },
    role: WorkspaceRole = "editor",
    options?: { code?: string; expiresInHours?: number; maxUses?: number }
  ): WorkspaceInvite {
    const ws = this.getWorkspace(workspaceId);
    if (!ws) throw new Error(`Workspace with ID "${workspaceId}" not found`);

    const hours = options?.expiresInHours ?? 48;
    const code =
      options?.code ||
      `KURA-${Math.floor(1000 + Math.random() * 9000)}`;

    const invite: WorkspaceInvite = {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      workspaceId,
      workspaceName: ws.name,
      inviterEmail: inviter.email,
      inviterName: inviter.name,
      role,
      code,
      token: `tok_${Math.random().toString(36).slice(2, 12)}`,
      expiresAt: Date.now() + hours * 3600 * 1000,
      maxUses: options?.maxUses ?? 10,
      usedCount: 0,
      revoked: false,
    };
    this.invites.push(invite);
    return invite;
  }

  listInvites(workspaceId: string): WorkspaceInvite[] {
    return this.invites.filter((inv) => inv.workspaceId === workspaceId && !inv.revoked);
  }

  revokeInvite(inviteId: string): void {
    const inv = this.invites.find((i) => i.id === inviteId);
    if (inv) inv.revoked = true;
  }

  cleanCodeInput(input: string): string {
    const trimmed = input.trim();
    // Handle full join URL, e.g. https://.../join/KURA-1234 or /join/1234
    const urlMatch = trimmed.match(/\/join\/([A-Za-z0-9-_]+)/i);
    if (urlMatch) return urlMatch[1];
    return trimmed;
  }

  previewCode(input: string): CodeClaimResult {
    const now = Date.now();
    if (now < this.lockedUntil) {
      const waitSeconds = Math.ceil((this.lockedUntil - now) / 1000);
      throw new Error(`Too many incorrect attempts. Please wait ${waitSeconds}s before trying again.`);
    }

    const code = this.cleanCodeInput(input);

    // 1. Check workspace invites
    const invite = this.invites.find(
      (i) => (i.code.toLowerCase() === code.toLowerCase() || i.token === code) && !i.revoked
    );

    if (invite) {
      if (invite.expiresAt < now) {
        this.recordAttempt(false);
        throw new Error("This workspace invite code has expired. Ask the admin for a new invite.");
      }
      if (invite.usedCount >= invite.maxUses) {
        this.recordAttempt(false);
        throw new Error("This invite code has reached its maximum number of uses.");
      }
      this.recordAttempt(true);
      const remainingMinutes = Math.max(1, Math.round((invite.expiresAt - now) / 60000));
      return {
        kind: "workspace_invite",
        targetId: invite.workspaceId,
        title: `Join "${invite.workspaceName}" as ${invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}`,
        subtitle: `Invited by ${invite.inviterName || invite.inviterEmail} · Expires in ${remainingMinutes}m`,
        role: invite.role,
        expiresInMinutes: remainingMinutes,
      };
    }

    // 2. Check 4-digit or 6-digit Quick Share snippets
    if (/^\d{4,6}$/.test(code)) {
      this.recordAttempt(true);
      return {
        kind: "quick_share",
        targetId: code,
        title: `Quick-Share Package #${code}`,
        subtitle: `Contains temporary shared snippet · Expires in 15m`,
        expiresInMinutes: 15,
      };
    }

    this.recordAttempt(false);
    throw new Error("Invalid or unrecognized code. Please check the code or invite link and try again.");
  }

  acceptInvite(
    input: string,
    user: { id: string; email: string; name: string }
  ): Workspace {
    const preview = this.previewCode(input);
    if (preview.kind !== "workspace_invite") {
      throw new Error("Provided code is a quick-share code, not a workspace invite");
    }

    const invite = this.invites.find((i) => i.workspaceId === preview.targetId && !i.revoked);
    if (!invite) throw new Error("Invite record no longer active");

    const ws = this.getWorkspace(invite.workspaceId);
    if (!ws) throw new Error("Workspace not found");

    // Add user if not already a member
    const existing = ws.members.find((m) => m.userId === user.id || m.email === user.email);
    if (!existing) {
      ws.members.push({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: invite.role,
        joinedAt: Date.now(),
      });
    } else {
      existing.role = invite.role; // update role if re-joining
    }

    invite.usedCount += 1;
    this.activeWorkspaceId = ws.id;
    return ws;
  }

  private recordAttempt(success: boolean): void {
    if (success) {
      this.failedAttempts = 0;
      this.lockedUntil = 0;
    } else {
      this.failedAttempts += 1;
      if (this.failedAttempts >= 5) {
        this.lockedUntil = Date.now() + 30_000; // 30s lockout
      }
    }
  }
}

// Backward compatibility alias for any existing imports
export { WorkspaceManager as WorkplaceManager };
export type { WorkspaceRole as WorkplaceRole };

