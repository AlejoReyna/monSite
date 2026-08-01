"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BlogChapter } from "@/lib/blog/chapters";

interface ChapterNavigationProps {
  chapters: BlogChapter[];
}

const INTRO_ID = "article-introduction";

export default function ChapterNavigation({
  chapters,
}: ChapterNavigationProps) {
  const [activeId, setActiveId] = useState(INTRO_ID);
  /** Only the mobile sheet uses this; the desktop rail folds instead. */
  const [sheetOpen, setSheetOpen] = useState(false);
  /** Desktop only: the rail folds away to give the prose the full width. */
  const [railCollapsed, setRailCollapsed] = useState(false);
  /** Written straight to a CSS variable, never to state — see the effect. */
  const barRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ids = [
      INTRO_ID,
      ...chapters.flatMap((chapter) => [
        chapter.id,
        ...chapter.sections.map((section) => section.id),
      ]),
    ];
    const headings = ids
      .map((id) => document.getElementById(id))
      .filter((heading): heading is HTMLElement => Boolean(heading));

    let initialHashFrame = 0;
    if (window.location.hash) {
      const hashId = decodeURIComponent(window.location.hash.slice(1));
      if (ids.includes(hashId)) {
        initialHashFrame = window.requestAnimationFrame(() => {
          setActiveId(hashId);
          document
            .getElementById(hashId)
            ?.scrollIntoView({ block: "start", behavior: "auto" });
        });
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top) -
              Math.abs(b.boundingClientRect.top),
          );

        const current = visible[0]?.target.id;
        if (!current) return;

        setActiveId(current);
        window.history.replaceState(null, "", `#${current}`);
      },
      {
        rootMargin: "-18% 0px -72% 0px",
        threshold: 0,
      },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => {
      if (initialHashFrame) window.cancelAnimationFrame(initialHashFrame);
      observer.disconnect();
    };
  }, [chapters]);

  /**
   * Reading progress for the mobile bar. The value lands on a CSS custom
   * property instead of React state for the same reason the navbar toggles a
   * class by hand: this runs at frame rate, and re-rendering the whole
   * chapter tree to move a 2px line would be the most expensive thing on the
   * page. Nothing else derives from the number.
   */
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let frame = 0;

    const read = () => {
      frame = 0;
      const article = document.querySelector(".blog-article-content");
      if (!article) return;

      const { top, height } = article.getBoundingClientRect();
      // How much of the article has passed the top of the viewport, measured
      // against the part of it that can actually scroll by.
      const travelled = -top;
      const distance = height - window.innerHeight;
      const progress =
        distance <= 0 ? 1 : Math.min(1, Math.max(0, travelled / distance));

      bar.style.setProperty("--blog-read-progress", String(progress));
    };

    const onScroll = () => {
      frame ||= requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  /* Escape closes the sheet, and the page behind it must not scroll while it
     is open — on iOS a scrollable body under a fixed panel drags the panel
     with it. */
  useEffect(() => {
    if (!sheetOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheetOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    // The active entry is usually far down a seven-chapter list; opening onto
    // the top of it hides the one piece of information the panel exists for.
    // "nearest" leaves it alone when it is already in view — otherwise the
    // first chapter gets shoved half out of the frame on every open. Deferred
    // past the unroll: while the panel is still growing there is no scroll
    // height to scroll to.
    const reveal = window.setTimeout(() => {
      sheetRef.current
        ?.querySelector('[data-active="true"]')
        ?.scrollIntoView({ block: "nearest" });
    }, 320);

    return () => {
      window.clearTimeout(reveal);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [sheetOpen]);

  /**
   * The jump is performed by hand rather than left to the anchor's default.
   * While the sheet is open the body is scroll-locked, and the browser
   * resolves the hash before React can commit the unlock — the native jump
   * lands nowhere. Unlocking first and scrolling explicitly keeps the same
   * behaviour on the desktop rail, where the lock is never on.
   */
  const activate = useCallback((event: React.MouseEvent, id: string) => {
    event.preventDefault();
    setActiveId(id);
    setSheetOpen(false);

    document.body.style.overflow = "";
    window.history.replaceState(null, "", `#${id}`);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    document.getElementById(id)?.scrollIntoView({
      block: "start",
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, []);

  const activeChapterIndex = chapters.findIndex(
    (chapter) =>
      chapter.id === activeId ||
      chapter.sections.some((section) => section.id === activeId),
  );
  const activeChapter =
    activeChapterIndex === -1 ? null : chapters[activeChapterIndex];
  const activeLabel = activeChapter ? activeChapter.title : "Introducción";
  const activeNumber = activeChapter
    ? `Cap. ${String(activeChapterIndex + 1).padStart(2, "0")}`
    : "Inicio";

  /**
   * The way out of the article. The floating nav stays hidden for the whole
   * post (see blog-navbar.tsx), so this is the only route back to the index —
   * it sits at the top of the chapter column, above everything else it owns.
   */
  const backLink = (
    <Link className="blog-back blog-chapters-back" href="/blog">
      <span aria-hidden="true">←</span> Volver al blog
    </Link>
  );

  /** One glyph for both rail toggles: a panel with a rail on its left edge. */
  const railIcon = (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      aria-hidden="true"
    >
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
      <path d="M6 2.5v11" />
    </svg>
  );

  /** One list, rendered into the rail on desktop and the sheet on mobile. */
  const chapterList = (
    <nav>
      <a
        className="blog-chapter-intro"
        data-active={activeId === INTRO_ID}
        href={`#${INTRO_ID}`}
        onClick={(event) => activate(event, INTRO_ID)}
        aria-current={activeId === INTRO_ID ? "location" : undefined}
      >
        Introducción
      </a>

      <ol className="blog-chapter-list">
        {chapters.map((chapter, index) => {
          const chapterActive =
            activeId === chapter.id ||
            chapter.sections.some((section) => section.id === activeId);

          return (
            <li key={chapter.id} data-active={chapterActive}>
              <span className="blog-chapter-number">
                Capítulo {String(index + 1).padStart(2, "0")}
              </span>
              <a
                className="blog-chapter-link"
                data-active={activeId === chapter.id}
                href={`#${chapter.id}`}
                onClick={(event) => activate(event, chapter.id)}
                aria-current={activeId === chapter.id ? "location" : undefined}
              >
                {chapter.title}
              </a>

              {chapter.sections.length > 0 && (
                <ol className="blog-subchapter-list">
                  {chapter.sections.map((section) => (
                    <li key={section.id}>
                      <a
                        data-active={activeId === section.id}
                        href={`#${section.id}`}
                        onClick={(event) => activate(event, section.id)}
                        aria-current={
                          activeId === section.id ? "location" : undefined
                        }
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );

  return (
    <>
      {/* Mobile: the article starts at the top of the page and the index
          collapses into this one line. Stacking the full rail above the post,
          which is what the grid did, cost two screens of scrolling before the
          first paragraph. */}
      <div className="blog-chapter-bar" data-open={sheetOpen} ref={barRef}>
        <button
          type="button"
          className="blog-chapter-bar-button"
          onClick={() => setSheetOpen((open) => !open)}
          aria-expanded={sheetOpen}
        >
          <span className="blog-chapter-bar-menu">
            <span className="blog-chapter-bar-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            Menu
          </span>

          {/* Where a docs bar would say "On this page": the chapter you are
              actually in, which is the same information plus your place in
              it. */}
          <span className="blog-chapter-bar-text">
            <span className="blog-chapter-bar-eyebrow">{activeNumber}</span>
            <span className="blog-chapter-bar-title">{activeLabel}</span>
          </span>

          <svg
            className="blog-chapter-bar-chevron"
            viewBox="0 0 12 12"
            aria-hidden="true"
          >
            <path
              d="M4.5 2.5 8 6l-3.5 3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="blog-chapter-bar-progress" aria-hidden="true" />

        {/* The index drops out of the bar itself rather than arriving from
            somewhere else on screen: it belongs to the line you tapped, and
            the bar stays the anchor for where you are in the post. */}
        <div
          className="blog-chapter-sheet"
          aria-label="Capítulos del artículo"
          aria-hidden={!sheetOpen}
          // Nothing inside may be tabbed to or tapped through while collapsed.
          inert={!sheetOpen}
          ref={sheetRef}
        >
          {/* No header row here: the bar above already says which chapter you
              are in, and repeating "Contenido" under the line you just tapped
              spends the panel's first 40px on nothing. */}
          {backLink}
          {chapterList}
        </div>
      </div>

      <button
        type="button"
        className="blog-chapter-backdrop"
        data-open={sheetOpen}
        tabIndex={-1}
        aria-label="Cerrar contenido"
        onClick={() => setSheetOpen(false)}
      />

      {/* Desktop: the sticky rail. It folds to zero width on demand, leaving
          the floating toggle below as the only way back in. */}
      <aside
        className="blog-chapters"
        id="blog-chapters-rail"
        aria-label="Capítulos del artículo"
        data-collapsed={railCollapsed}
      >
        {/* Only the way back stays pinned — it has to stay reachable from
            anywhere in a seven-chapter list. The heading below scrolls with
            the list it introduces instead of sticking to the exit. */}
        <div className="blog-chapters-top">{backLink}</div>

        <div className="blog-chapters-heading">
          <span>Contenido</span>
          <button
            type="button"
            className="blog-rail-toggle"
            onClick={() => setRailCollapsed(true)}
            aria-expanded={!railCollapsed}
            aria-controls="blog-chapters-rail"
            aria-label="Ocultar el índice"
          >
            {railIcon}
          </button>
        </div>

        {chapterList}
      </aside>

      {/* What the folded rail leaves behind: the same glyph, floating where
          the rail's corner was, as the one tap that brings the index back.
          Only ever shown above the mobile breakpoint (see the CSS). */}
      <button
        type="button"
        className="blog-rail-toggle blog-rail-expand"
        data-open={railCollapsed}
        onClick={() => setRailCollapsed(false)}
        aria-expanded={!railCollapsed}
        aria-controls="blog-chapters-rail"
        aria-label="Mostrar el índice"
      >
        {railIcon}
      </button>
    </>
  );
}
