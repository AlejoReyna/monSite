export type GamePlatform = "gb" | "gbc" | "gba";
export type GameCore = "gambatte" | "mgba";
export const coreForPlatform = (platform: GamePlatform): GameCore => platform === "gba" ? "mgba" : "gambatte";
export const DOOM_ROM_SHA256 = "f5f4f0aac6c1884ef0b771dacb21a5d3f2152a066157f46abb39769c7f95deab";

/** Engines and ROMs are loaded only after the user selects a game. */
export type LibraryGame = {
  id: string;
  title: string;
  playerUrl: string;
  platform: GamePlatform;
  core: GameCore;
  sha256: string;
  saveMode: "gold" | "cartridge";
  source: "bundled" | "local";
  artwork?: "gold" | "doom";
  /** Bundled asset path or a local File's current object URL. */
  romUrl: string;
};

export const GAME_LIBRARY: readonly LibraryGame[] = [
  {
    id: "pokemon-gold", title: "Pokémon Gold", playerUrl: "/gameboy/frame.html",
    platform: "gbc", core: "gambatte", saveMode: "gold", source: "bundled", artwork: "gold",
    sha256: "fb0016d27b1e5374e1ec9fcad60e6628d8646103b5313ca683417f52b97e7e4e",
    romUrl: "/games/pokemon-gold.gbc",
  },
  {
    id: `rom-${DOOM_ROM_SHA256}`, title: "Doom", playerUrl: "/gameboy/frame.html?local=1",
    platform: "gba", core: "mgba", saveMode: "cartridge", source: "bundled", artwork: "doom",
    sha256: DOOM_ROM_SHA256, romUrl: "/games/doom.gba",
  },
];
