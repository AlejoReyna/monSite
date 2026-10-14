import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveGameBoyRedirect } from "./lib/gameboy/site";

export function middleware(request: NextRequest) {
  const target = resolveGameBoyRedirect(request.headers.get("host"), request.nextUrl.pathname);
  if (!target) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = target;
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
