"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TerminalLine } from "@/lib/blog/types";

interface TerminalProps {
  lines: TerminalLine[];
  /** Shown in the title bar. Defaults to a generic shell label. */
  label?: string;
}

/**
 * A command block that reads as a terminal.
 *
 * Two rules drive the markup:
 *
 * 1. Only `cmd` lines are copyable. The `$` sigil, output and comments are
 *    `user-select: none` so a manual drag-select produces something runnable,
 *    and "Copy" joins commands only. Copying a `$` into a shell is the most
 *    common way a documented command fails for a reader.
 * 2. The whole thing is one `<pre>`-equivalent region with `overflow-x: auto`,
 *    so a long curl never widens the page on mobile.
 */
export default function Terminal({ lines, label = "bash" }: TerminalProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear on unmount so a pending reset can't fire against a gone component.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const commands = lines
    .filter((l): l is { kind: "cmd"; text: string } => l.kind === "cmd")
    .map((l) => l.text)
    .join("\n");

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(commands);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard is unavailable over plain http and when permission is
      // refused. The commands are visible and selectable — silently doing
      // nothing is better than an alert the reader can't act on.
    }
  }, [commands]);

  return (
    <div className="blog-term">
      <div className="blog-term-bar">
        <div className="blog-term-dots" aria-hidden="true">
          <span className="blog-term-dot" />
          <span className="blog-term-dot" />
          <span className="blog-term-dot" />
        </div>
        <span className="blog-term-label">{label}</span>
        {commands.length > 0 && (
          <button
            type="button"
            className="blog-term-copy"
            onClick={copy}
            data-copied={copied}
            aria-label={copied ? "Commands copied" : "Copy commands to clipboard"}
          >
            {copied ? "copied" : "copy"}
          </button>
        )}
      </div>

      <div className="blog-term-body">
        {lines.map((line, i) => {
          if (line.kind === "cmd") {
            return (
              <div className="blog-term-line" key={i}>
                <span className="blog-term-sigil" aria-hidden="true">
                  $
                </span>
                <span className="blog-term-cmd">{line.text}</span>
              </div>
            );
          }

          if (line.kind === "comment") {
            return (
              <div className="blog-term-line" key={i}>
                <span className="blog-term-comment"># {line.text}</span>
              </div>
            );
          }

          return (
            <div className="blog-term-line" key={i}>
              <span className="blog-term-out">{line.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
