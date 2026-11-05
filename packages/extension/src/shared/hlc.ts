/**
 * Hybrid Logical Clock (HLC) Implementation (SYNC-3)
 * Provides monotonic, causally consistent timestamps across distributed devices
 * without requiring synchronized wall clocks.
 */

export interface HLCTimestamp {
  millis: number;
  counter: number;
  nodeId: string;
}

export class HybridLogicalClock {
  private latestMillis: number = 0;
  private counter: number = 0;
  readonly nodeId: string;

  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }

  /**
   * Generates a new local HLC timestamp.
   */
  now(physicalNow: number = Date.now()): HLCTimestamp {
    if (physicalNow > this.latestMillis) {
      this.latestMillis = physicalNow;
      this.counter = 0;
    } else {
      this.counter++;
    }

    return {
      millis: this.latestMillis,
      counter: this.counter,
      nodeId: this.nodeId,
    };
  }

  /**
   * Updates local HLC upon receiving a remote message timestamp.
   */
  update(remote: HLCTimestamp, physicalNow: number = Date.now()): HLCTimestamp {
    this.latestMillis = Math.max(this.latestMillis, physicalNow, remote.millis);

    if (this.latestMillis === remote.millis && this.latestMillis === physicalNow) {
      this.counter = Math.max(this.counter, remote.counter) + 1;
    } else if (this.latestMillis === remote.millis) {
      this.counter = remote.counter + 1;
    } else if (this.latestMillis === physicalNow) {
      this.counter = 0;
    } else {
      this.counter++;
    }

    return {
      millis: this.latestMillis,
      counter: this.counter,
      nodeId: this.nodeId,
    };
  }

  /**
   * Compares two HLC timestamps.
   * Returns: negative if a < b, positive if a > b, 0 if identical.
   */
  static compare(a: HLCTimestamp, b: HLCTimestamp): number {
    if (a.millis !== b.millis) {
      return a.millis - b.millis;
    }
    if (a.counter !== b.counter) {
      return a.counter - b.counter;
    }
    return a.nodeId.localeCompare(b.nodeId);
  }

  /**
   * Serializes HLC timestamp to a compact string format.
   */
  static serialize(ts: HLCTimestamp): string {
    return `${ts.millis.toString(36)}-${ts.counter.toString(36)}-${ts.nodeId}`;
  }

  /**
   * Deserializes HLC timestamp from string format.
   */
  static deserialize(str: string): HLCTimestamp {
    const parts = str.split("-");
    return {
      millis: parseInt(parts[0], 36),
      counter: parseInt(parts[1], 36),
      nodeId: parts.slice(2).join("-"),
    };
  }
}

