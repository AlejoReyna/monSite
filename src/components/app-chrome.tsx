"use client";

import { usePathname } from "next/navigation";
import NavbarV2 from "@/components/v2/navbar-v2";
import { useLanguage } from "@/components/lang-context";
import { t } from "@/lib/translations";

const HIDE_CHROME_PREFIXES = ["/historia", "/legacy", "/weddings"];

function shouldHideChrome(pathname: string | null): boolean {
  if (!pathname) return false;
  return HIDE_CHROME_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const hide = shouldHideChrome(pathname);

  return (
    <>
      {/* Skip to main content — first focusable element on every page */}
      <a href="#main-content" className="skip-to-main">
        {t("skipToMainContent", language)}
      </a>

      {!hide && <NavbarV2 />}

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <style jsx>{`
        .skip-to-main {
          position: absolute;
          top: -120%;
          left: 1rem;
          z-index: 100;
          padding: 0.75rem 1rem;
          background: #000000;
          color: #ffffff;
          border-radius: 0.375rem;
          text-decoration: none;
          font-family: var(--font-geist-sans, ui-sans-serif, system-ui), sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          transition: top 0.2s ease;
        }
        .skip-to-main:focus {
          top: 1rem;
        }
        #main-content:focus {
          outline: none;
        }
      `}</style>
    </>
  );
}
