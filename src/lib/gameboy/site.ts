export const GAMEBOY_HOST = "gba.alexisrs.dev";
export const GAMEBOY_SITE_URL = `https://${GAMEBOY_HOST}`;
export const GAMEBOY_PORTFOLIO_URL = "https://alexisrs.dev";

export function isGameBoyHost(host: string | null | undefined): boolean {
  return host?.split(":")[0].toLowerCase() === GAMEBOY_HOST;
}

// On the dedicated host the console is the only page: every other page path
// redirects to the subdomain root (which rewrites to /gba). Returns the
// redirect target, or null when the request passes through.
export function resolveGameBoyRedirect(host: string | null | undefined, pathname: string | null | undefined): string | null {
  if (!isGameBoyHost(host)) return null;
  if (!pathname || pathname === "/" || pathname === "/gba") return null;
  if (pathname === "/api" || pathname.startsWith("/api/")) return null;
  if (pathname.startsWith("/_next/")) return null;
  if (/\/[^/]*\.[^/]+$/.test(pathname)) return null;
  return "/";
}
