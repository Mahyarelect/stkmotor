const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

type Attempt = { failures: number; windowStartedAt: number };

const globalForRateLimit = globalThis as unknown as {
  adminLoginAttempts?: Map<string, Attempt>;
};

const attempts =
  globalForRateLimit.adminLoginAttempts ?? new Map<string, Attempt>();

globalForRateLimit.adminLoginAttempts = attempts;

function currentAttempt(key: string): Attempt | null {
  const value = attempts.get(key);
  if (!value) return null;
  if (Date.now() - value.windowStartedAt >= WINDOW_MS) {
    attempts.delete(key);
    return null;
  }
  return value;
}

export function loginRetryAfterSeconds(key: string): number {
  const value = currentAttempt(key);
  if (!value || value.failures < MAX_FAILURES) return 0;
  return Math.max(
    1,
    Math.ceil((WINDOW_MS - (Date.now() - value.windowStartedAt)) / 1000)
  );
}

export function recordLoginFailure(key: string) {
  const value = currentAttempt(key);
  if (!value) {
    attempts.set(key, { failures: 1, windowStartedAt: Date.now() });
    return;
  }
  value.failures += 1;
  attempts.set(key, value);
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}
