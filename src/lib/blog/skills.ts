import type { Skill } from "./types";

/**
 * The site's canonical origin. Used to build the install commands shown in the
 * terminal, so they are copy-pasteable by a reader who is not on this machine.
 */
export const SITE_ORIGIN = "https://www.alexisreyna.dev";

/**
 * Byte/line counts are the real ones, measured from the files in
 * public/skills/. If you replace a SKILL.md, re-measure:
 *
 *   wc -c -l public/skills/<id>/SKILL.md
 */
export const skills: Skill[] = [
  {
    id: "capability-gate",
    name: "capability-gate",
    tagline: "Feature flags that cannot lie",
    description:
      "A capability is a claim about deployed infrastructure. This skill enforces that the claim and its proof live in one committed artifact, validated at startup, with no bypass — so a flag can never promise a contract that isn't deployed.",
    takeaway:
      "The five-hop path from manifest to UI, the fail-closed validator, and why the escape hatch you're about to add is the whole bug.",
    bytes: 11611,
    lines: 193,
    origin: "ArtisanalBrew — multichain deployment registry",
    tags: ["architecture", "feature-flags", "validation"],
  },
  {
    id: "blazor-interop",
    name: "blazor-interop",
    tagline: "JS that survives enhanced navigation",
    description:
      "Blazor Web App has three separate mechanisms that replace DOM nodes under you, each with different rules. This encodes the module shape that survives all three, plus the lifecycle traps that only appear after a route change.",
    takeaway:
      "Why your script works on hard refresh and dies on navigation — and the idempotent-singleton + double-rAF pattern that fixes it.",
    bytes: 11261,
    lines: 238,
    origin: "ArtisanalBrew — 28 hand-rolled interop modules",
    tags: ["blazor", "javascript", "lifecycle"],
  },
  {
    id: "theme-tokens",
    name: "theme-tokens",
    tagline: "Design tokens that don't silently collapse",
    description:
      "Four token systems, a three-tier light/dark/system cascade, and one environment quirk that renders text pure black if you write CSS the way every style guide tells you to. Leads with the rule that inverts the standard advice.",
    takeaway:
      "Never chain custom properties. Plus why a shared component relies on a token being undefined, and how promoting it to :root breaks the whole site.",
    bytes: 11433,
    lines: 218,
    origin: "ArtisanalBrew — dark mode, phases 0–3",
    tags: ["css", "design-systems", "theming"],
  },
];

export function getSkill(id: string): Skill | undefined {
  return skills.find((s) => s.id === id);
}

/** Canonical public URL of a skill file. */
export function skillUrl(id: string): string {
  return `${SITE_ORIGIN}/skills/${id}/SKILL.md`;
}

/** Same file, as a same-origin path — for the download button. */
export function skillPath(id: string): string {
  return `/skills/${id}/SKILL.md`;
}

/**
 * The one-liner that installs a skill into the reader's project.
 *
 * `mkdir -p` first because curl will not create the directory and the error it
 * gives when the path is missing reads like a network failure. `-fsSL` so a
 * 404 fails loudly instead of writing an HTML error page into SKILL.md.
 */
export function installCommand(id: string): string {
  return `mkdir -p .claude/skills/${id} && curl -fsSL ${skillUrl(id)} -o .claude/skills/${id}/SKILL.md`;
}

/** Install every skill in one paste. */
export function installAllCommand(): string {
  const ids = skills.map((s) => s.id).join(" ");
  return `for s in ${ids}; do mkdir -p .claude/skills/$s && curl -fsSL ${SITE_ORIGIN}/skills/$s/SKILL.md -o .claude/skills/$s/SKILL.md; done`;
}
