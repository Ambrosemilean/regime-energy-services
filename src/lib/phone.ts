/**
 * Shared phone normalisation + validation.
 *
 * Numbers are stored in a Supabase-friendly E.164-like form:
 * an optional leading "+" followed by 7–15 digits. Spaces, dashes,
 * dots and parentheses are stripped so "0803 123 4567", "+234 803
 * 123-4567" and "08031234567" normalise consistently.
 */
export function normalizePhone(input: unknown): string | null {
  if (typeof input !== "string") return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");

  if (!digits) return null;

  if (digits.length < 7 || digits.length > 15) return null;

  return hasPlus ? `+${digits}` : digits;
}

/** Returns true when the string looks like a phone number rather than an email. */
export function looksLikePhone(input: string): boolean {
  return /^[+\d][\d\s().-]{5,}$/.test(input.trim()) && !input.includes("@");
}
