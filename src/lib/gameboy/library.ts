/** Each library entry owns its player URL; future games can add a configured
 * engine surface without changing the launcher's selection UI. */
export type LibraryGame = {
  id: string;
  title: string;
  playerUrl: string;
  /** Local object URL, retained until the player unmounts (including retries). */
  romUrl?: string;
};

export const GAME_LIBRARY: readonly LibraryGame[] = [
  { id: "pokemon-gold", title: "Pokémon Gold", playerUrl: "/gameboy/frame.html" },
];
