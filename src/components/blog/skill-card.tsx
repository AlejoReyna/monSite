"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Skill } from "@/lib/blog/types";
import { installCommand, skillPath } from "@/lib/blog/skills";

/**
 * One downloadable skill.
 *
 * The download is a plain `<a download>` to a static file in /public — no
 * route handler, no JS required. The copy button is the progressive
 * enhancement on top, and the install command stays visible on the page
 * either way (see the terminal below the grid), so a reader with a blocked
 * clipboard is never stuck.
 */
export default function SkillCard({ skill }: { skill: Skill }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(installCommand(skill.id));
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable — the command is printed in full below the grid.
    }
  }, [skill.id]);

  const kb = (skill.bytes / 1024).toFixed(1);

  return (
    <article className="blog-skill">
      <h3 className="blog-skill-name">{skill.name}</h3>
      <p className="blog-skill-tagline">{skill.tagline}</p>
      <p className="blog-skill-desc">{skill.description}</p>

      <p className="blog-skill-takeaway">
        <span>What you get</span>
        {skill.takeaway}
      </p>

      <div className="blog-skill-foot">
        <div className="blog-skill-stats">
          <span>SKILL.md</span>
          <span>·</span>
          <span>{skill.lines} lines</span>
          <span>·</span>
          <span>{kb} KB</span>
        </div>

        <div className="blog-skill-actions">
          <a
            className="blog-btn"
            href={skillPath(skill.id)}
            download={`${skill.id}-SKILL.md`}
          >
            Download
          </a>
          <button
            type="button"
            className="blog-btn"
            data-variant="ghost"
            data-copied={copied}
            onClick={copy}
            aria-label={`Copy install command for ${skill.name}`}
          >
            {copied ? "Copied" : "Copy install"}
          </button>
        </div>
      </div>
    </article>
  );
}
