// Helpers for the "recently used attributes" cookie.
// We store up to 5 attribute IDs, newest first, as a JSON array.

export const RECENT_ATTRS_COOKIE = "recently_used_attributes"
const MAX = 5

export function parseRecentIds(cookieValue: string | undefined): string[] {
  if (!cookieValue) return []
  try {
    const parsed = JSON.parse(cookieValue)
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : []
  } catch {
    return []
  }
}

export function addRecentId(existingIds: string[], newId: string): string[] {
  // Put the new ID first, drop duplicates, cap at MAX
  return [newId, ...existingIds.filter((id) => id !== newId)].slice(0, MAX)
}