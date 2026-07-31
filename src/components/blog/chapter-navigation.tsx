"use client";

import { useEffect, useState } from "react";
import type { BlogChapter } from "@/lib/blog/chapters";

interface ChapterNavigationProps {
  chapters: BlogChapter[];
}

export default function ChapterNavigation({
  chapters,
}: ChapterNavigationProps) {
  const [activeId, setActiveId] = useState("article-introduction");

  useEffect(() => {
    const ids = [
      "article-introduction",
      ...chapters.flatMap((chapter) => [
        chapter.id,
        ...chapter.sections.map((section) => section.id),
      ]),
    ];
    const headings = ids
      .map((id) => document.getElementById(id))
      .filter((heading): heading is HTMLElement => Boolean(heading));

    if (window.location.hash) {
      const hashId = decodeURIComponent(window.location.hash.slice(1));
      if (ids.includes(hashId)) setActiveId(hashId);
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
    return () => observer.disconnect();
  }, [chapters]);

  const activate = (id: string) => {
    setActiveId(id);
  };

  return (
    <aside className="blog-chapters" aria-label="Capítulos del artículo">
      <div className="blog-chapters-heading">
        <span>Contenido</span>
        <span>{String(chapters.length).padStart(2, "0")} capítulos</span>
      </div>

      <nav>
        <a
          className="blog-chapter-intro"
          data-active={activeId === "article-introduction"}
          href="#article-introduction"
          onClick={() => activate("article-introduction")}
          aria-current={
            activeId === "article-introduction" ? "location" : undefined
          }
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
                  onClick={() => activate(chapter.id)}
                  aria-current={
                    activeId === chapter.id ? "location" : undefined
                  }
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
                          onClick={() => activate(section.id)}
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
    </aside>
  );
}
