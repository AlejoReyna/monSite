"use client";

import { usePathname } from "next/navigation";
import NavbarV2 from "@/components/v2/navbar-v2";
// import MobileDock from "@/components/MobileDock";

const HIDE_CHROME_PREFIXES = ["/historia", "/legacy", "/weddings"];

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
      {children}
      {/* Old mac dock — hidden on mobile while v3 scroll sequence is active */}
      {/* {!hide && <MobileDock />} */}
    </>
  );
}
