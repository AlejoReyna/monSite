export const KONAMI_KEYS = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"] as const;
export const KONAMI_TIMEOUT_MS = 2500;

/** Retain the longest matching prefix on mistakes (including ↑ ↑ ↑). */
export function advanceKonami(progress: number, key: string): number {
  const input = [...KONAMI_KEYS.slice(0, Math.min(progress, KONAMI_KEYS.length - 1)), key.length === 1 ? key.toLowerCase() : key];
  for (let length = Math.min(input.length, KONAMI_KEYS.length); length > 0; length--) {
    if (KONAMI_KEYS.slice(0, length).every((value, index) => value === input[input.length - length + index])) return length;
  }
  return 0;
}

export function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="dialog"], dialog');
}
