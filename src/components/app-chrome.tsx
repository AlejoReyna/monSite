"use client";

import { usePathname } from "next/navigation";
import NavbarV2 from "@/components/v2/navbar-v2";

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
    </>
  );
}
