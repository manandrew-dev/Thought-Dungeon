// Crisis-language screener (requirements S1, S5). Tuned to favour false positives:
// a missed crisis is far worse than an unnecessary trip to the Support screen.

// Patterns run against normalized text: lowercase, apostrophes removed ("don't" → "dont"),
// other punctuation turned into spaces, whitespace collapsed to single spaces.
const CRISIS_PATTERNS: RegExp[] = [
  // Suicide
  /\bsuicid/,
  /\bkill(ing)? my ?self\b/,
  /\bkms\b/,
  /\bunalive\b/,
  /\b(end|ending|take|taking) (my|this) (own )?life\b/,
  /\bend(ing)? (it all|everything)\b/,
  /\b(hang|hanging|shoot|shooting|drown|drowning) my ?self\b/,
  /\bjump(ing)? (off|from) (a |the )?(bridge|building|roof|cliff)\b/,
  /\b(overdose|overdosing|od on)\b/,
  /\bslit(ting)? my (wrists?|throat)\b/,

  // Wanting to die or not exist
  // Everyday hyperbole ("this exam is killing me", "I'll die if I fail") is deliberately not matched,
  // so ordinary exam stress can still be worked through in the game.
  /\b(want|wanna|wanting|ready) (to )?die\b/,
  /\bwant(ing)? to be dead\b/,
  /\bwish (i|id) (was|were|could be) dead\b/,
  /\bwish i could (die|disappear forever)\b/,
  /\b(rather|better off) (be )?dead\b/,
  /\bbetter off without me\b/,
  /\b(dont|do not|no longer) want to (live|be alive|be here|exist|wake up)\b/,
  /\b(nothing|no one|nobody) (left )?to live for\b/,
  /\bno reason to (live|keep going|go on)\b/,
  /\bnot worth living\b/,
  /\bno point (in )?(living|being alive|going on)\b/,
  /\b(cant|can not|cannot) (go on|keep going) (living|anymore|like this)\b/,
  /\b(cant|can not|cannot) keep living\b/,
  /\b(cant|can not|cannot) do this anymore\b/,
  /\bdisappear forever\b/,

  // Self-harm
  /\bself ?harm/,
  /\b(hurt|hurting|harm|harming|cut|cutting|burn|burning|punish|punishing) my ?self\b/,
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’‘`]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function screen(text: string): { crisis: boolean } {
  const normalized = normalize(text);
  return { crisis: CRISIS_PATTERNS.some((pattern) => pattern.test(normalized)) };
}
