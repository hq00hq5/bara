/**
 * Minimal nanoid-like ID generator (no external dependency)
 * Generates URL-safe random IDs
 */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function nanoid(size = 12) {
  let id = '';
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  for (let i = 0; i < size; i++) {
    id += CHARS[bytes[i] % CHARS.length];
  }
  return id;
}
