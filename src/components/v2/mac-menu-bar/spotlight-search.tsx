"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/lang-context";
import { useDesktopStore } from "@/lib/desktop/desktop-store";
import { CURATED_PROJECTS } from "@/lib/desktop/portfolio-content";
import { ASSISTANT_NAME, type SpotlightResult } from "@/lib/desktop/types";
import styles from "./menu-bar.module.css";
import { useOutsideClick } from "./use-menu-dismiss";

export function SpotlightSearch() {
  const { language } = useLanguage();
  const store = useDesktopStore();
  const open = store.openMenu === "search";
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useOutsideClick(open, () => store.setOpenMenu(null), rootRef);

  useEffect(() => {
    if (!open) return;
    const reset = window.setTimeout(() => {
      setQuery("");
      setActive(0);
      inputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(reset);
  }, [open]);

  const labels =
    language === "es"
      ? {
          placeholder: "Buscar proyectos, páginas, comandos…",
          empty: "Sin resultados",
          projects: "Proyectos",
          pages: "Páginas",
          commands: "Comandos",
          home: "Inicio",
          blog: "Blog",
          contact: "Contacto",
          terminal: "Terminal",
          focus: "Activar Focus",
          prefs: "Preferencias",
          assistant: `Preguntar a ${ASSISTANT_NAME}`,
        }
      : language === "zh"
        ? {
            placeholder: "搜索项目、页面、命令…",
            empty: "无结果",
            projects: "项目",
            pages: "页面",
            commands: "命令",
            home: "首页",
            blog: "博客",
            contact: "联系",
            terminal: "终端",
            focus: "开启 Focus",
            prefs: "偏好设置",
            assistant: `询问 ${ASSISTANT_NAME}`,
          }
        : {
            placeholder: "Search projects, pages, commands…",
            empty: "No results",
            projects: "Projects",
            pages: "Pages",
            commands: "Commands",
            home: "Home",
            blog: "Blog",
            contact: "Contact",
            terminal: "Terminal",
            focus: "Enable Focus",
            prefs: "Preferences",
            assistant: `Ask ${ASSISTANT_NAME}`,
          };

  const results = useMemo<SpotlightResult[]>(() => {
    const items: SpotlightResult[] = [
      ...CURATED_PROJECTS.map((p) => ({
        id: `project-${p.id}`,
        kind: "project" as const,
        title: p.title,
        subtitle: p.category,
        keywords: [p.title, p.category, p.id, ...p.tags],
        action: () => {
          store.openProjects({ projectId: p.id });
          store.setOpenMenu(null);
        },
      })),
      {
        id: "page-home",
        kind: "page",
        title: labels.home,
        keywords: ["home", "inicio", "首页"],
        action: () => {
          store.navigateHome();
          store.setOpenMenu(null);
        },
      },
      {
        id: "page-blog",
        kind: "page",
        title: labels.blog,
        keywords: ["blog"],
        action: () => store.navigateBlog(),
      },
      {
        id: "page-contact",
        kind: "page",
        title: labels.contact,
        keywords: ["contact", "contacto", "联系"],
        action: () => {
          store.navigateContact();
          store.setOpenMenu(null);
        },
      },
      {
        id: "cmd-projects",
        kind: "command",
        title: labels.projects,
        keywords: ["projects", "proyectos", "finder", "open"],
        action: () => {
          store.openProjects();
          store.setOpenMenu(null);
        },
      },
      {
        id: "cmd-terminal",
        kind: "command",
        title: labels.terminal,
        keywords: ["terminal", "chat"],
        action: () => {
          store.openTerminal();
          store.setOpenMenu(null);
        },
      },
      {
        id: "cmd-focus",
        kind: "command",
        title: labels.focus,
        keywords: ["focus", "focus mode"],
        action: () => {
          store.toggleFocus(true);
          store.setOpenMenu(null);
        },
      },
      {
        id: "cmd-prefs",
        kind: "command",
        title: labels.prefs,
        keywords: ["preferences", "settings", "preferencias"],
        action: () => store.openPreferences(),
      },
      {
        id: "cmd-assistant",
        kind: "command",
        title: labels.assistant,
        keywords: ["assistant", "orbit", "help", "ask"],
        action: () => store.setOpenMenu("assistant"),
      },
    ];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q)),
    );
  }, [query, labels, store]);

  // Derived clamp — avoids sync setState-in-effect when results shrink.
  const safeActive = Math.min(active, Math.max(results.length - 1, 0));

  if (!open) return null;

  const run = (index: number) => {
    const item = results[index];
    if (!item) return;
    item.action();
  };

  return (
    <div
      className={styles.spotlight}
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Spotlight"
      onKeyDown={(event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setActive((i) => Math.max(i - 1, 0));
        } else if (event.key === "Enter") {
          event.preventDefault();
          run(safeActive);
        } else if (event.key === "Escape") {
          event.preventDefault();
          store.setOpenMenu(null);
        }
      }}
    >
      <input
        ref={inputRef}
        className={styles.spotlightInput}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        placeholder={labels.placeholder}
        aria-autocomplete="list"
        aria-controls="spotlight-results"
      />
      <div className={styles.spotlightList} id="spotlight-results" role="listbox">
        {results.length === 0 ? (
          <div className={styles.spotlightEmpty}>{labels.empty}</div>
        ) : (
          results.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={index === safeActive}
              className={styles.spotlightItem}
              data-active={index === safeActive}
              onMouseEnter={() => setActive(index)}
              onClick={() => run(index)}
            >
              <span className={styles.kind}>{item.kind}</span>
              <strong>{item.title}</strong>
              {item.subtitle && <small>{item.subtitle}</small>}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
