import { localizeMetadata } from "@/lib/request-language";
import { getCopy } from "@/lib/request-language";
import type { Metadata } from "next";
import Link from "next/link";
import SkillCard from "@/components/blog/skill-card";
import Terminal from "@/components/blog/terminal";
import { skills, installAllCommand, installCommand } from "@/lib/blog/skills";

const baseMetadata: Metadata = {
  title: "Skills",
  description:
    "Downloadable Claude Code skills packaged from shipped systems — capability-gate, blazor-interop and theme-tokens. Install with one command.",
  alternates: { canonical: "/blog/skills" },
};

export default async function SkillsPage() {
  const copyText = await getCopy();
  return (
    <>
      <header className="blog-masthead blog-shell">
        <p className="blog-eyebrow">{copyText("Alexis Reyna · Skills")}</p>
        <h1>{copyText("Skills you can install in one command")}</h1>
        <p>
          {copyText("Each of these is a single ")}<code>SKILL.md</code> {copyText(" that teaches an agent — or a person — one thing I learned the expensive way. They came out of a shipped multichain storefront, so the examples are real code and the gotchas are ones that actually cost me an afternoon. ")}</p>
      </header>

      <section className="blog-section blog-shell">
        <h2 className="blog-section-title">{copyText("Install everything")}</h2>
        <p className="blog-section-note">
          {copyText("Run this from the root of any project. It writes each skill to")}{" "}
          <code
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: "0.875em",
            }}
          >
            .claude/skills/&lt;name&gt;/SKILL.md
          </code>
          {copyText(", where Claude Code picks them up automatically on the next session. ")}</p>

        <Terminal
          label="bash — install all"
          lines={[
            { kind: "comment", text: "from your project root" },
            { kind: "cmd", text: installAllCommand() },
            { kind: "out", text: "" },
            { kind: "comment", text: "confirm they landed" },
            { kind: "cmd", text: "ls .claude/skills/" },
            { kind: "out", text: "blazor-interop  capability-gate  theme-tokens" },
          ]}
        />
      </section>

      <section className="blog-section blog-shell">
        <h2 className="blog-section-title">{copyText("The skills")}</h2>
        <p className="blog-section-note">
          {copyText("Download the file directly, or copy the one-line install for a single skill. Nothing here needs a package manager, an account, or a build step. ")}</p>

        <div className="blog-skills-grid">
          {skills.map((skill) => (
            <SkillCard skill={skill} key={skill.id} />
          ))}
        </div>
      </section>

      <section className="blog-section blog-shell">
        <h2 className="blog-section-title">{copyText("One at a time")}</h2>
        <p className="blog-section-note">
          {copyText("The exact command behind each “Copy install” button, in case you’d rather see it than trust it. ")}</p>

        {skills.map((skill) => (
          <div key={skill.id} style={{ marginBottom: "1rem" }}>
            <Terminal
              label={`bash — ${skill.id}`}
              lines={[{ kind: "cmd", text: installCommand(skill.id) }]}
            />
          </div>
        ))}
      </section>

      <section className="blog-section blog-shell">
        <h2 className="blog-section-title">{copyText("What these actually are")}</h2>
        <div className="blog-prose">
          <p>
            {copyText("A Claude Code skill is a markdown file with a name and a description in its frontmatter. The description decides when the agent loads it; the body is instructions it follows in place of its defaults. That’s the entire format — no runtime, no dependencies. ")}</p>
          <p>
            {copyText("I wrote these to be read by a human as much as executed by an agent. If you never install one, the")}{" "}
            <Link href="/blog/feature-flags-that-cannot-lie">
              {copyText("capability-gate essay ")}</Link>{" "}
            {copyText("covers the same ground in prose. ")}</p>
          <aside className="blog-callout" data-tone="note">
            <span className="blog-callout-title">{copyText("Provenance")}</span>
            <p>
              {copyText("All three came out of ArtisanalBrew, a .NET 10 / Blazor storefront with liquid staking across three testnets. Line counts and file sizes on the cards above are measured from the files you’re downloading, not estimated. ")}</p>
          </aside>
        </div>
      </section>

      <div className="blog-shell" style={{ marginTop: "3rem" }}>
        <Link className="blog-back" href="/blog">
          {copyText("← Back to writing ")}</Link>
      </div>
    </>
  );
}

export async function generateMetadata() {
  return localizeMetadata(baseMetadata);
}
