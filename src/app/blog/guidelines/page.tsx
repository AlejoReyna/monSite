import type { Metadata } from "next";
import Link from "next/link";
import Blocks from "@/components/blog/blocks";
import type { Block } from "@/lib/blog/types";

export const metadata: Metadata = {
  title: "Block guidelines",
  description:
    "The closed block vocabulary this blog is written in — each block rendered next to the rule that governs when to use it.",
  alternates: { canonical: "/blog/guidelines" },
};

/**
 * A living spec: every entry renders the real block component, so the page
 * cannot drift from the implementation. If a block changes, this page changes
 * with it — there is no second copy of the styling to keep in sync.
 */
const spec: { name: string; rule: string; demo: Block[] }[] = [
  {
    name: "heading",
    rule:
      "Section boundary. One per section, never two in a row — a heading immediately followed by another means the first section has no content and shouldn't exist.",
    demo: [{ kind: "heading", text: "The validator is the feature" }],
  },
  {
    name: "subheading",
    rule:
      "Sub-boundary inside a section. Only legal after a heading. There is no level three; if you need one, the section is too long.",
    demo: [{ kind: "subheading", text: "Rhythm belongs to the container" }],
  },
  {
    name: "paragraph",
    rule:
      "The default. Everything that isn't one of the others is this. Capped at the 68-character measure; body ink is softened to #444141 so headings stay dominant.",
    demo: [
      {
        kind: "paragraph",
        content: [
          "A deployment manifest is a whole chain definition, not a patch. It carries the addresses and the capabilities together, so you cannot commit one without the other — they are ",
          { kind: "strong", text: "one file" },
          ".",
        ],
      },
    ],
  },
  {
    name: "lede",
    rule:
      "The single most important sentence in a section. Maximum one per section. This is the constraint that changed how I write: having exactly one slot forces you to name the point, and often reveals a section holding two arguments.",
    demo: [
      {
        kind: "lede",
        content: [
          "A feature flag is a promise. Most of the time, breaking it renders a button in the wrong place. Sometimes it sends money to the empty string.",
        ],
      },
    ],
  },
  {
    name: "list",
    rule:
      "Use ordered only when order is load-bearing — steps that must happen in sequence. An ordered list of parallel items misleads the reader into thinking sequence matters.",
    demo: [
      {
        kind: "list",
        ordered: true,
        items: [
          [
            { kind: "strong", text: "Deploy the contract." },
            " No address, no flag. Not optional, not parallelizable.",
          ],
          [
            { kind: "strong", text: "Add the address" },
            " to the manifest using the key the loader reads.",
          ],
          [{ kind: "strong", text: "Set the flag" }, " to true."],
        ],
      },
    ],
  },
  {
    name: "code",
    rule:
      "Steps outside the reading measure to full width — code that wraps is code that lies about its shape. The caption labels what the reader is looking at, so it never has to be inferred from context.",
    demo: [
      {
        kind: "code",
        language: "typescript",
        caption: "src/lib/blog/skills.ts",
        code: `export function installCommand(id: string): string {
  return \`mkdir -p .claude/skills/\${id} && curl -fsSL …\`;
}`,
      },
    ],
  },
  {
    name: "terminal",
    rule:
      "For commands the reader is meant to run — distinct from code they're meant to read. Only $ lines are copyable; output and comments are user-select:none, so a drag-select produces something runnable.",
    demo: [
      {
        kind: "terminal",
        caption: "bash",
        lines: [
          { kind: "comment", text: "install one skill" },
          {
            kind: "cmd",
            text: "curl -fsSL alexisreyna.dev/skills/theme-tokens/SKILL.md -o SKILL.md",
          },
          { kind: "out", text: "→ 11.2 KB written" },
        ],
      },
    ],
  },
  {
    name: "callout · note",
    rule:
      "A rule or principle worth isolating from the argument around it. Not for asides — if it's skippable, it's a parenthetical, not a callout.",
    demo: [
      {
        kind: "callout",
        tone: "note",
        title: "The whole idea",
        content: [
          "A capability is a claim about deployed infrastructure. The claim and the proof live in one committed artifact, validated at startup, with no bypass.",
        ],
      },
    ],
  },
  {
    name: "callout · warn",
    rule:
      "Reserved for things that will cost the reader real time if ignored. Rationed deliberately: a page with three warnings has none, because the reader stops seeing them.",
    demo: [
      {
        kind: "callout",
        tone: "warn",
        title: "Don't add the bypass",
        content: [
          "No ",
          { kind: "code", text: "ignoreValidation" },
          ". The value of the gate is entirely in the absence of exceptions.",
        ],
      },
    ],
  },
  {
    name: "table",
    rule:
      "Three columns maximum. Wider tables don't survive a phone, and the horizontal scroll they get instead is a worse experience than the prose you'd have written.",
    demo: [
      {
        kind: "table",
        head: ["Hop", "Where", "What it does"],
        rows: [
          ["1", "deployments/*.json", "Declares capabilities and backing addresses"],
          ["3", "ChainRegistry.Validate", "Throws if a flag lacks its deployment"],
          ["4", "ChainsController", "Filters on .Enabled"],
        ],
      },
    ],
  },
  {
    name: "divider",
    rule:
      "Breathing room between movements of an argument — a turn, not decoration. If you can't say what changed above versus below it, delete it.",
    demo: [{ kind: "divider" }],
  },
];

export default function GuidelinesPage() {
  return (
    <>
      <header className="blog-masthead blog-shell">
        <p className="blog-eyebrow">Alexis Reyna · Guidelines</p>
        <h1>Block guidelines</h1>
        <p>
          This blog has no rich text editor and no markdown. Posts are typed
          arrays of blocks from a closed vocabulary of ten, so an invalid post
          is a build error rather than a page that renders slightly wrong. Below
          is every block, rendered by the real component, next to the rule that
          governs it.
        </p>
      </header>

      <section className="blog-section blog-shell">
        <h2 className="blog-section-title">Three rules above the vocabulary</h2>
        <div className="blog-prose">
          <p>
            <strong>Rhythm belongs to the container.</strong> Blocks carry no
            outer margin. One <code>{"> * + *"}</code> rule owns all vertical
            spacing, so the gap between a paragraph and a table always equals
            the gap between two paragraphs. The only exceptions are
            relationships — a heading and the text beneath it tighten up,
            because they are one unit.
          </p>
          <p>
            <strong>The measure is applied to text, not the container.</strong>{" "}
            Prose caps at 68 characters. Capping the container instead would
            clamp its children, and then a table could never reach full width
            without negative-margin escapes that break when the gutter changes.
          </p>
          <p>
            <strong>Inline emphasis does not nest.</strong> A <code>strong</code>{" "}
            cannot contain a <code>link</code>. When you reach for nested
            emphasis, the honest fix is usually that the sentence wants to be
            two sentences.
          </p>
        </div>
      </section>

      <section className="blog-section blog-shell">
        <h2 className="blog-section-title">The vocabulary</h2>
        <p className="blog-section-note">
          Ten blocks. Adding an eleventh has to be argued for — a constraint
          that changes what you write has earned its place; one that only
          prevents ugly output is better handled by a lint rule.
        </p>

        {spec.map((entry) => (
          <div className="blog-spec" key={entry.name}>
            <div className="blog-spec-head">
              <span className="blog-spec-name">{entry.name}</span>
              <span className="blog-spec-rule">{entry.rule}</span>
            </div>
            <div className="blog-spec-demo">
              <Blocks blocks={entry.demo} />
            </div>
          </div>
        ))}
      </section>

      <div className="blog-shell" style={{ marginTop: "3rem" }}>
        <Link className="blog-back" href="/blog">
          ← Back to writing
        </Link>
      </div>
    </>
  );
}
