"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const HIDDEN_CLASS = "blog-nav-shell--hidden";

/** Above the fold the bar always shows — that's where people look for it. */
const ALWAYS_VISIBLE_ABOVE = 72;

/**
 * Scroll smaller than this doesn't count as intent. Trackpad noise and iOS
 * momentum both emit sub-pixel jitter in the opposite direction, and without a
 * deadzone the bar flickers on every one of them. Deltas accumulate while
 * under it, so a slow deliberate scroll still registers.
 */
const DELTA_DEADZONE = 6;

/** A fine pointer this close to the top edge is reaching for the bar. */
const POINTER_REVEAL_ZONE = 80;

export default function BlogNavbar() {
  const shellRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  const isPostPage = Boolean(
    pathname &&
      pathname.startsWith("/blog/") &&
      !["/blog/skills", "/blog/guidelines"].includes(pathname)
  );

  /**
   * Inside a post the bar never comes out; everywhere else it hides while
   * reading down and returns on the first deliberate scroll up.
   *
   * A post is read top to bottom, and a floating bar sliding in over it on
   * every upward scroll is noise on top of the thing being read. The chapter
   * column carries the link back to the index instead, so nothing is lost.
   * The pages around it — the index, skills, guidelines — are where
   * navigating is the point, and there the bar behaves as before.
   *
   * The class is toggled straight on the node instead of through state: this
   * reads scroll at frame rate, and re-rendering the tree to flip one boolean
   * would be the only expensive thing on the page. Nothing else derives from
   * it, so there is nothing for React to keep in sync.
   */
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    if (isPostPage) {
      shell.classList.add(HIDDEN_CLASS);

      // Keyboard focus is the one exception: nothing may be tabbed to while it
      // sits translated off-screen (see .blog-nav-shell--hidden).
      const onFocusIn = () => shell.classList.remove(HIDDEN_CLASS);
      const onFocusOut = () => shell.classList.add(HIDDEN_CLASS);

      shell.addEventListener("focusin", onFocusIn);
      shell.addEventListener("focusout", onFocusOut);

      return () => {
        shell.removeEventListener("focusin", onFocusIn);
        shell.removeEventListener("focusout", onFocusOut);
      };
    }

    let lastY = window.scrollY;
    let hidden = false;
    let frame = 0;
    // Focus inside the bar pins it open. Tabbing must never send focus to
    // something that has been translated off-screen.
    let pinned = false;

    shell.classList.remove(HIDDEN_CLASS);

    const setHidden = (next: boolean) => {
      if (next === hidden) return;
      hidden = next;
      shell.classList.toggle(HIDDEN_CLASS, next);
    };

    const read = () => {
      frame = 0;
      const y = window.scrollY;

      // Rubber-band overscroll reports motion the user never made; reacting to
      // it makes the bar flap at both ends of the page.
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (y < 0 || y > max) return;

      const delta = y - lastY;
      if (Math.abs(delta) < DELTA_DEADZONE) return;
      lastY = y;

      if (pinned) {
        setHidden(false);
        return;
      }

      if (y <= ALWAYS_VISIBLE_ABOVE) {
        setHidden(false);
        return;
      }
      setHidden(delta > 0);
    };

    const onScroll = () => {
      frame ||= requestAnimationFrame(read);
    };

    const onFocusIn = () => {
      pinned = true;
      setHidden(false);
    };
    const onFocusOut = () => {
      pinned = false;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.clientY <= POINTER_REVEAL_ZONE) setHidden(false);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    shell.addEventListener("focusin", onFocusIn);
    shell.addEventListener("focusout", onFocusOut);

    // Only for mice: on touch this would fire mid-swipe and fight the scroll.
    const finePointer = window.matchMedia("(pointer: fine)");
    if (finePointer.matches) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      shell.removeEventListener("focusin", onFocusIn);
      shell.removeEventListener("focusout", onFocusOut);
    };
  }, [isPostPage]);

  return (
    <header className={`blog-nav-shell${isPostPage ? " blog-nav-shell--hidden" : ""}`} ref={shellRef}>
      <nav className="blog-nav" aria-label="Blog navigation">
        <div className="blog-nav-left">
          <Link className="blog-nav-brand" href="/blog" aria-label="Alexis Reyna Blog home">
            <span className="blog-nav-brand-main">
              <span className="blog-nav-bracket">&lt;</span>
              <span>Alexis Reyna</span>
              <span className="blog-nav-bracket">/&gt;</span>
            </span>
            <small className="blog-nav-subtitle">Blog</small>
          </Link>

          <div className="blog-nav-links">
            <Link href="/blog">Posts</Link>
            <Link className="blog-nav-portfolio" href="/">
              Portfolio
            </Link>
          </div>
        </div>

        <div className="blog-nav-right">
          <div className="blog-nav-socials">
            <a
              href="https://github.com/AlejoReyna"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .5a12 12 0 00-3.79 23.4c.6.11.82-.26.82-.58V20.9c-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.34-1.75-1.34-1.75-1.09-.75.08-.73.08-.73 1.2.08 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.66-.31-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.31-.54-1.57.12-3.27 0 0 1.01-.32 3.3 1.23a11.48 11.48 0 016 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.7.24 2.96.12 3.27.77.84 1.23 1.9 1.23 3.22 0 4.61-2.8 5.61-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.7.83.58A12 12 0 0012 .5z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/alexis-alberto-reyna-sánchez-6953102b4"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
          <Link className="blog-nav-cta" href="/#contact">
            Hablemos
          </Link>
        </div>
      </nav>
    </header>
  );
}
