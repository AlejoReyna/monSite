export const KONAMI_SEQUENCE = [
  { key: "ArrowUp", label: "↑" },
  { key: "ArrowUp", label: "↑" },
  { key: "ArrowDown", label: "↓" },
  { key: "ArrowDown", label: "↓" },
  { key: "ArrowLeft", label: "←" },
  { key: "ArrowRight", label: "→" },
  { key: "ArrowLeft", label: "←" },
  { key: "ArrowRight", label: "→" },
  { key: "b", label: "B" },
  { key: "a", label: "A" },
] as const;

/** A wrong key leaves the accepted steps intact, so the visitor can try again. */
export function advanceKonami(progress: number, key: string): number {
  if (progress >= KONAMI_SEQUENCE.length) return progress;
  return key.toLowerCase() === KONAMI_SEQUENCE[progress].key.toLowerCase() ? progress + 1 : progress;
}
