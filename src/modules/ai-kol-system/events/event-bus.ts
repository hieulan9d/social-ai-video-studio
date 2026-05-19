import type { KolSystemEventType, KolSystemEvent, EventHandler } from './event-types';

/**
 * Internal event bus for the AI KOL system.
 * Enables decoupled communication between services.
 * Future: can be replaced with external message queue (Redis, SQS, etc.)
 */
class KolEventBus {
  private handlers: Map<KolSystemEventType, EventHandler[]> = new Map();
  private globalHandlers: EventHandler[] = [];

  /**
   * Subscribe to a specific event type
   */
  on<T = unknown>(eventType: KolSystemEventType, handler: EventHandler<T>): () => void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler as EventHandler);
    this.handlers.set(eventType, existing);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType) || [];
      const index = handlers.indexOf(handler as EventHandler);
      if (index > -1) handlers.splice(index, 1);
    };
  }

  /**
   * Subscribe to ALL events (useful for logging, analytics)
   */
  onAll(handler: EventHandler): () => void {
    this.globalHandlers.push(handler);
    return () => {
      const index = this.globalHandlers.indexOf(handler);
      if (index > -1) this.globalHandlers.splice(index, 1);
    };
  }

  /**
   * Emit an event to all subscribers
   */
  async emit<T = unknown>(event: KolSystemEvent<T>): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    const allHandlers = [...handlers, ...this.globalHandlers];

    await Promise.allSettled(
      allHandlers.map((handler) => handler(event as KolSystemEvent))
    );
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
    this.globalHandlers = [];
  }
}

// Singleton instance
export const kolEventBus = new KolEventBus();
export type { KolEventBus };
