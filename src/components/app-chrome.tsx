"use client";

import { usePathname } from "next/navigation";
import NavbarV2 from "@/components/v2/navbar-v2";
import LanguageSwitcher from "@/components/language-switcher";

const HIDE_CHROME_PREFIXES = ["/blog", "/historia", "/legacy", "/weddings"];

function shouldHideChrome(pathname: string | null): boolean {
  if (!pathname) return false;
  return HIDE_CHROME_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hide = shouldHideChrome(pathname);

  return (
    <>
      {!hide && <NavbarV2 />}

      <main>{children}</main>
      {(pathname?.startsWith("/weddings") || pathname?.startsWith("/legacy")) && (
        <div style={{ position: "fixed", bottom: "1rem", right: "1rem", zIndex: 2147483001, background: "#181313e6", borderRadius: 24, padding: "10px 14px" }}>
          <LanguageSwitcher size="sm" />
        </div>
      )}
    </>
  );
}
