import type { Language } from "@/lib/language";

export const TERMINAL_CLOSE_DELAY = 2000;

export const TERMINAL_CLOSE_COPY = {
  en: {
    aside: "Uhmmmm…",
    message: "You were supposed to interact with the terminal. Is something wrong?",
    reopen: "Open terminal again",
    fun: "That's boring dude, don't you have something funnier?",
    label: "A little awkward silence",
  },
  es: {
    aside: "Mmmmm…",
    message: "Se suponía que interactuaras con la terminal. ¿Hay algo mal?",
    reopen: "Abrir la terminal otra vez",
    fun: "Qué aburrido, amigo, ¿no tienes algo más divertido?",
    label: "Un silencio un poco incómodo",
  },
} satisfies Record<Language, Record<string, string>>;
