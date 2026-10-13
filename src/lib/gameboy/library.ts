/** Each library entry owns its player URL; future games can add a configured
 * engine surface without changing the launcher's selection UI. */
export const GAME_LIBRARY = [
  { id: "pokemon-gold", title: "Pokémon Gold", playerUrl: "/gameboy/frame.html" },
] as const;
export type LibraryGame = typeof GAME_LIBRARY[number];
