import { describe, expect, it } from 'vitest';
import { FailureLimiter } from './failure-limiter.js';

describe('FailureLimiter', () => {
  it('blocks a key after the maximum number of failures', () => {
    const limiter = new FailureLimiter(1000, () => 0);
    for (let i = 0; i < 3; i++) limiter.recordFailure('a');
    expect(limiter.isBlocked('a', 3)).toBe(true);
    expect(limiter.isBlocked('a', 4)).toBe(false);
    expect(limiter.isBlocked('b', 3)).toBe(false);
  });

  it('forgets failures after the window', () => {
    let now = 0;
    const limiter = new FailureLimiter(1000, () => now);
    for (let i = 0; i < 3; i++) limiter.recordFailure('a');
    now = 1001;
    expect(limiter.isBlocked('a', 3)).toBe(false);
  });

  it('clears a key after a successful login', () => {
    const limiter = new FailureLimiter(1000, () => 0);
    limiter.recordFailure('a');
    limiter.clear('a');
    expect(limiter.isBlocked('a', 1)).toBe(false);
  });
});
