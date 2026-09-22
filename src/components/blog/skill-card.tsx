"use client";

import { useCopy } from "@/components/use-copy";
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
  const copyText = useCopy();
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
      <p className="blog-skill-tagline">{copyText(skill.tagline)}</p>
      <p className="blog-skill-desc">{copyText(skill.description)}</p>

      <p className="blog-skill-takeaway">
        <span>{copyText("What you get")}</span>
        {copyText(skill.takeaway)}
      </p>

      <div className="blog-skill-foot">
        <div className="blog-skill-stats">
          <span>SKILL.md</span>
          <span>·</span>
          <span>{skill.lines} {copyText(" lines")}</span>
          <span>·</span>
          <span>{kb} KB</span>
        </div>

        <div className="blog-skill-actions">
          <a
            className="blog-btn"
            href={skillPath(skill.id)}
            download={`${skill.id}-SKILL.md`}
          >
            {copyText("Download ")}</a>
          <button
            type="button"
            className="blog-btn"
            data-variant="ghost"
            data-copied={copied}
            onClick={copy}
            aria-label={`${copyText("Copy install")}: ${skill.name}`}
          >
            {copied ? copyText("Copied") : copyText("Copy install")}
          </button>
        </div>
      </div>
    </article>
  );
}
