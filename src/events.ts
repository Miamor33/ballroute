type Listener<T = any> = (data: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<Listener>>();

  on<T>(event: string, listener: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.listeners.get(event)?.delete(listener);
  }

  emit<T>(event: string, data: T): void {
    this.listeners.get(event)?.forEach((fn) => fn(data));
  }

  off(event: string): void {
    this.listeners.delete(event);
  }
}

export const bus = new EventBus();
