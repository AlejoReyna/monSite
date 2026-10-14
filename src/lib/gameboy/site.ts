export const GAMEBOY_HOST = "gba.alexisrs.dev";
export const GAMEBOY_SITE_URL = `https://${GAMEBOY_HOST}`;
export const GAMEBOY_PORTFOLIO_URL = "https://alexisrs.dev";

export function isGameBoyHost(host: string | null | undefined): boolean {
  return host?.split(":")[0].toLowerCase() === GAMEBOY_HOST;
}
