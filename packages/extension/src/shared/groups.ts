/**
 * Groups & Categories Module (GRP-1..GRP-5)
 * Hierarchical folder organization, color-coded categories, and smart groups.
 */

export interface SnippetGroup {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  parentId?: string;
  createdAt: number;
}

export interface SmartGroup {
  id: string;
  name: string;
  query: {
    language?: string;
    domain?: string;
    tag?: string;
  };
}

export class GroupManager {
  private groups: SnippetGroup[] = [];
  private smartGroups: SmartGroup[] = [];

  createGroup(name: string, color?: string, parentId?: string): SnippetGroup {
    const group: SnippetGroup = {
      id: `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      color: color || "#00b96c",
      parentId,
      createdAt: Date.now(),
    };
    this.groups.push(group);
    return group;
  }

  listGroups(): SnippetGroup[] {
    return [...this.groups];
  }

  renameGroup(id: string, name: string): void {
    const g = this.groups.find((item) => item.id === id);
    if (g) g.name = name;
  }

  deleteGroup(id: string): void {
    // Delete group and nested children
    this.groups = this.groups.filter((g) => g.id !== id && g.parentId !== id);
  }

  createSmartGroup(name: string, query: SmartGroup["query"]): SmartGroup {
    const sg: SmartGroup = {
      id: `sg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      query,
    };
    this.smartGroups.push(sg);
    return sg;
  }

  listSmartGroups(): SmartGroup[] {
    return [...this.smartGroups];
  }
}

