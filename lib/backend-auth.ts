/** Returns auth headers for HF Space (or empty if no token configured) */
export function hfAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = process.env.HF_ACCESS_TOKEN
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra
}
