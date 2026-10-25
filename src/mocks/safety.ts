// Mock of core/safety.ts (Khan). Only enough phrases to exercise the Support redirect.
const CRISIS_PATTERNS = [/\bkill myself\b/, /\bsuicid/, /\bend my life\b/, /\bwant to die\b/, /\bhurt myself\b/];

export function screen(text: string): { crisis: boolean } {
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ");
  return { crisis: CRISIS_PATTERNS.some((pattern) => pattern.test(normalized)) };
}
