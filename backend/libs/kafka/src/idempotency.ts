export interface IdempotencyKey {
  topic: string;
  partition: number;
  offset: string;
}

export interface IdempotencyEntry {
  key: string;
  processedAt: string;
  eventId: string;
  correlationId: string;
}

export class IdempotencyHandler {
  private processedEvents: Map<string, IdempotencyEntry> = new Map();
  private maxSize: number;
  private cleanupInterval: number;

  constructor(maxSize: number = 10000, cleanupInterval: number = 300000) { // 5 minutes default
    this.maxSize = maxSize;
    this.cleanupInterval = cleanupInterval;
    this.startCleanup();
  }

  private generateKey(topic: string, partition: number, offset: string): string {
    return `${topic}:${partition}:${offset}`;
  }

  private generateEventKey(eventId: string, correlationId: string): string {
    return `event:${eventId}:${correlationId}`;
  }

  isDuplicate(topic: string, partition: number, offset: string): boolean {
    const key = this.generateKey(topic, partition, offset);
    return this.processedEvents.has(key);
  }

  isDuplicateEvent(eventId: string, correlationId: string): boolean {
    const key = this.generateEventKey(eventId, correlationId);
    return this.processedEvents.has(key);
  }

  markProcessed(topic: string, partition: number, offset: string, eventId: string, correlationId: string): void {
    const key = this.generateKey(topic, partition, offset);
    const eventKey = this.generateEventKey(eventId, correlationId);
    
    const entry: IdempotencyEntry = {
      key,
      processedAt: new Date().toISOString(),
      eventId,
      correlationId
    };

    this.processedEvents.set(key, entry);
    this.processedEvents.set(eventKey, entry);

    // Cleanup if we exceed max size
    if (this.processedEvents.size > this.maxSize) {
      this.cleanup();
    }
  }

  private cleanup(): void {
    const entries = Array.from(this.processedEvents.entries());
    const sortedEntries = entries.sort((a, b) => 
      new Date(a[1].processedAt).getTime() - new Date(b[1].processedAt).getTime()
    );

    // Remove oldest entries to get back to 80% of max size
    const targetSize = Math.floor(this.maxSize * 0.8);
    const entriesToRemove = sortedEntries.slice(0, entries.length - targetSize);
    
    entriesToRemove.forEach(([key]) => {
      this.processedEvents.delete(key);
    });

    console.log(`[IdempotencyHandler] Cleaned up ${entriesToRemove.length} old entries`);
  }

  private startCleanup(): void {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  getStats(): { totalProcessed: number; maxSize: number } {
    return {
      totalProcessed: this.processedEvents.size,
      maxSize: this.maxSize
    };
  }

  clear(): void {
    this.processedEvents.clear();
    console.log('[IdempotencyHandler] Cleared all processed events');
  }
}

