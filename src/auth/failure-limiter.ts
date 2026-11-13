// Counts failed attempts per key inside a time window.
// This lives in memory, so it resets when the API restarts and is not shared
// between several API instances. That is acceptable for one small server. If
// the API is ever scaled out, move it to the database or Redis.
export class FailureLimiter {
  private readonly entries = new Map<
    string,
    { count: number; resetAt: number }
  >();

  constructor(
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  isBlocked(key: string, max: number): boolean {
    const entry = this.entries.get(key);
    if (!entry) return false;
    if (entry.resetAt <= this.now()) {
      this.entries.delete(key);
      return false;
    }
    return entry.count >= max;
  }

  recordFailure(key: string): void {
    const now = this.now();
    if (this.entries.size > 5000) this.prune(now);

    const entry = this.entries.get(key);
    if (!entry || entry.resetAt <= now) {
      this.entries.set(key, { count: 1, resetAt: now + this.windowMs });
    } else {
      entry.count += 1;
    }
  }

  clear(key: string): void {
    this.entries.delete(key);
  }

  private prune(now: number): void {
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) this.entries.delete(key);
    }
  }
}
