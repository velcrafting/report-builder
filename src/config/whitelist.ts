// Whitelist of emails that can access the app as editors or above.
// In production, load from AUTH_WHITELIST env var (comma-separated emails).
// Falls back to a hardcoded dev list when env var is missing.

export function getWhitelist(): string[] {
  const envList = process.env.AUTH_WHITELIST;
  if (envList) {
    return envList.split(",").map((e) => e.trim().toLowerCase());
  }
  // Dev fallback — replace with real emails
  return [
    "admin@example.com",
    "editor@example.com",
  ];
}

export function isWhitelisted(email: string): boolean {
  return getWhitelist().includes(email.toLowerCase());
}
