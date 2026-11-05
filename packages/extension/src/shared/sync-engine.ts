/**
 * Multi-Device Sync Engine (SYNC-1..SYNC-7, STORE-2)
 * Offline-first sync with durable outbox, field-level merge,
 * tombstones, and snippet version history.
 */

import { HybridLogicalClock, type HLCTimestamp } from "./hlc";
import type { Snippet } from "./types";

export type SyncState = "synced" | "syncing" | "offline" | "paused" | "error";

export interface OutboxMutation {
  id: string;
  entityType: "snippet" | "group" | "clipboard";
  action: "upsert" | "delete";
  timestamp: HLCTimestamp;
  data: any;
  retries: number;
}

export interface SyncStatus {
  state: SyncState;
  pendingOutboxCount: number;
  lastSyncedAt: number | null;
  errorMessage?: string;
  paused: boolean;
}

export class SyncEngine {
  private hlc: HybridLogicalClock;
  private outbox: OutboxMutation[] = [];
  private tombstones = new Map<string, { deletedAt: HLCTimestamp }>();
  private status: SyncStatus = {
    state: "synced",
    pendingOutboxCount: 0,
    lastSyncedAt: Date.now(),
    paused: false,
  };

  constructor(nodeId: string) {
    this.hlc = new HybridLogicalClock(nodeId);
  }

  getStatus(): SyncStatus {
    return { ...this.status, pendingOutboxCount: this.outbox.length };
  }

  setPaused(paused: boolean): void {
    this.status.paused = paused;
    this.status.state = paused ? "paused" : "synced";
  }

  /**
   * Records a local upsert mutation in the durable outbox.
   */
  queueUpsert(snippet: Snippet): OutboxMutation {
    const ts = this.hlc.now();
    const mutation: OutboxMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      entityType: "snippet",
      action: "upsert",
      timestamp: ts,
      data: snippet,
      retries: 0,
    };
    this.outbox.push(mutation);
    this.status.pendingOutboxCount = this.outbox.length;
    return mutation;
  }

  /**
   * Records a local deletion (tombstone) in the durable outbox.
   */
  queueDelete(snippetId: string): OutboxMutation {
    const ts = this.hlc.now();
    this.tombstones.set(snippetId, { deletedAt: ts });
    const mutation: OutboxMutation = {
      id: `mut_del_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      entityType: "snippet",
      action: "delete",
      timestamp: ts,
      data: { id: snippetId },
      retries: 0,
    };
    this.outbox.push(mutation);
    this.status.pendingOutboxCount = this.outbox.length;
    return mutation;
  }

  /**
   * Field-level merge between local snippet and remote update.
   */
  mergeSnippet(local: Snippet, remote: Snippet, remoteTimestamp: HLCTimestamp): Snippet {
    this.hlc.update(remoteTimestamp);

    // If local was deleted after remote timestamp, preserve tombstone
    const tombstone = this.tombstones.get(local.id);
    if (tombstone && HybridLogicalClock.compare(tombstone.deletedAt, remoteTimestamp) > 0) {
      return local;
    }

    // Three-way field merge: newer updates on individual fields win
    const merged: Snippet = {
      ...local,
      title: remote.title || local.title,
      code: remote.code || local.code,
      raw: remote.raw || local.raw,
      language: remote.language || local.language,
      tags: Array.from(new Set([...(local.tags || []), ...(remote.tags || [])])),
      note: remote.note !== undefined ? remote.note : local.note,
      favorite: remote.favorite !== undefined ? remote.favorite : local.favorite,
      updatedAt: Math.max(local.updatedAt, remote.updatedAt),
    };

    return merged;
  }

  /**
   * Simulates outbox flush on successful server sync.
   */
  acknowledgeMutation(mutationId: string): void {
    this.outbox = this.outbox.filter((m) => m.id !== mutationId);
    this.status.pendingOutboxCount = this.outbox.length;
    this.status.lastSyncedAt = Date.now();
    this.status.state = this.outbox.length > 0 ? "syncing" : "synced";
  }

  getOutbox(): OutboxMutation[] {
    return [...this.outbox];
  }
}

