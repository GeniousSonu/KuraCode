/**
 * Workplaces & Multi-Tenancy Module (WS-1..WS-4, INV-1..INV-3, RT-1..RT-4)
 * Strict role-based access control (RBAC) and tenant isolation.
 */

export type WorkplaceRole = "owner" | "admin" | "editor" | "commenter" | "viewer";

export interface WorkplaceMember {
  userId: string;
  email: string;
  name: string;
  role: WorkplaceRole;
  joinedAt: number;
}

export interface Workplace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: number;
  members: WorkplaceMember[];
  settings: {
    stripUrlsByDefault: boolean;
    allowMemberInvites: boolean;
    retentionDays: number;
  };
}

export interface WorkplaceInvite {
  id: string;
  workplaceId: string;
  workplaceName: string;
  inviterEmail: string;
  role: WorkplaceRole;
  expiresAt: number;
  token: string;
}

/**
 * Validates permission action for a specific role.
 */
export function canPerformAction(
  role: WorkplaceRole,
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

export class WorkplaceManager {
  private workplaces: Workplace[] = [];
  private activeWorkplaceId: string | null = null; // null = Personal Space

  getActiveWorkplaceId(): string | null {
    return this.activeWorkplaceId;
  }

  setActiveWorkplaceId(id: string | null): void {
    if (id !== null && !this.workplaces.some((w) => w.id === id)) {
      throw new Error(`Workplace with ID "${id}" does not exist`);
    }
    this.activeWorkplaceId = id;
  }

  createWorkplace(name: string, owner: { id: string; email: string; name: string }): Workplace {
    const ws: Workplace = {
      id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
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
    this.workplaces.push(ws);
    return ws;
  }

  listWorkplaces(): Workplace[] {
    return [...this.workplaces];
  }

  getWorkplace(id: string): Workplace | undefined {
    return this.workplaces.find((w) => w.id === id);
  }
}

