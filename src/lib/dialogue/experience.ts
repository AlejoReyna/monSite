import type { Language } from "@/components/lang-context";

type Copy = Record<Language, string>;
export type DialogueChoice = { id: string; thread: "person" | "music" | "play"; line: Copy };
const line = (en: string, es: string): Copy => ({ en, es });

// Ordered branches: each answered choice reveals the next line in that thread.
// Exploration is optional; work and free text are available from the first turn.
export const DIALOGUE_CHOICES: DialogueChoice[] = [
  { id: "person-0", thread: "person", line: line("Who’s Alexis outside of work?", "¿Cómo es Alexis fuera del trabajo?") },
  { id: "person-1", thread: "person", line: line("Coffee, code, martial arts. Explain the combo.", "Café, código y artes marciales. Explica el combo.") },
  { id: "person-2", thread: "person", line: line("What’s a dream he’s still chasing?", "¿Qué sueño le falta por cumplir?") },
  { id: "person-3", thread: "person", line: line("What should I ask the real Alexis?", "¿Qué debería preguntarle al Alexis real?") },
  { id: "music-0", thread: "music", line: line("Convince me to listen to The Beatles.", "Convénceme de escuchar a The Beatles.") },
  { id: "music-1", thread: "music", line: line("I have time for one song. Make it count.", "Tengo tiempo para una canción. Elige bien.") },
  { id: "music-2", thread: "music", line: line("Now give me the unexpected playlist pick.", "Ahora dime la elección inesperada de la playlist.") },
  { id: "music-3", thread: "music", line: line("Guitar or keyboard? Defend your choice.", "¿Guitarra o teclado? Defiende tu elección.") },
  { id: "play-0", thread: "play", line: line("Tell me a joke. I’m a tough crowd.", "Cuéntame un chiste. No me río tan fácil.") },
  { id: "play-1", thread: "play", line: line("That joke needs a code review. Try again.", "Ese chiste necesita un code review. Otro intento.") },
  { id: "play-2", thread: "play", line: line("Roast my 47 open browser tabs. Gently.", "Búrlate de mis 47 pestañas abiertas. Con cariño.") },
  { id: "play-3", thread: "play", line: line("Plot twist: are you actually Alexis?", "Plot twist: ¿sí eres Alexis?") },
];

export function nextDialogueChoices(completed: readonly string[], lastChoice?: string): DialogueChoice[] {
  const lastThread = DIALOGUE_CHOICES.find(choice => choice.id === lastChoice)?.thread;
  const threads: DialogueChoice["thread"][] = ["person", "music", "play"];
  if (lastThread) threads.sort((a, b) => Number(b === lastThread) - Number(a === lastThread));
  return threads.flatMap(thread => {
    const next = DIALOGUE_CHOICES.find(choice => choice.thread === thread && !completed.includes(choice.id));
    return next ? [next] : [];
  });
}

export const EXPERIENCE_COPY = {
  en: {
    title: "Alexis, after hours", badge: "AI edition", greeting: "Pull up a chair. We can talk code, argue about The Beatles, or test my questionable comedy career.",
    disclosure: "An AI take on Alexis, grounded in his portfolio. The real human is one click away.",
    opening: "Your opening line", next: "Where do we go from here?", branch: "A new conversation path opened.",
    complete: "You’ve explored every path. Your turn to surprise me.", free: "Pick a line or write your own. No wrong answers.",
    placeholder: "Your turn…", send: "Send message", stop: "Stop reply", you: "You", projects: "See the work", contact: "Talk to the real Alexis",
    waiting: "Finding the words…", waitingLong: "Still here. This reply is taking a little longer.", writing: "Alexis AI is typing…", stopped: "Reply stopped. Take the conversation anywhere.",
    error: "Lost my train of thought. Your message is ready to try again.", rate: "The chat needs a breather. Try later, or reach the real Alexis below.", retry: "Try again", reset: "Start a new conversation", language: "Conversation in English or Spanish.",
  },
  es: {
    title: "Alexis, después del café", badge: "Edición IA", greeting: "Jálate una silla. Podemos hablar de código, discutir sobre The Beatles o poner a prueba mi dudosa carrera de comediante.",
    disclosure: "Una versión IA de Alexis basada en su portfolio. El humano real está a un clic.",
    opening: "Tú empiezas", next: "¿Por dónde seguimos?", branch: "Se abrió un nuevo camino de conversación.",
    complete: "Ya exploraste todos los caminos. Ahora sorpréndeme.", free: "Elige una frase o escribe la tuya. No hay respuestas incorrectas.",
    placeholder: "Te toca…", send: "Enviar mensaje", stop: "Detener respuesta", you: "Tú", projects: "Ver proyectos", contact: "Hablar con el Alexis real",
    waiting: "Buscando las palabras…", waitingLong: "Sigo aquí. Esta respuesta está tardando un poco más.", writing: "Alexis IA está escribiendo…", stopped: "Respuesta detenida. Tú eliges por dónde seguir.",
    error: "Se me fue el hilo. Tu mensaje está listo para reintentar.", rate: "El chat necesita un respiro. Intenta más tarde o contacta al Alexis real abajo.", retry: "Reintentar", reset: "Empezar otra conversación", language: "Conversación en español o inglés.",
  },
};

// This is server-owned direction, never a client-provided system prompt.
// Tone is professional throughout, in every topic: warm and human, but no slang and no filler.
export const CONVERSATION_DIRECTION = `
You are the clearly labeled AI edition of Alexis Reyna, a conversational stand-in grounded in the verified dossier below, never the real human. You may speak in first person, but say plainly that you are an AI whenever identity, personal experience or a commitment is at stake.
Every claim about Alexis's experience, employers, dates, technologies, numbers, studies or certifications must come from the dossier. If the dossier does not cover something, say so and point the visitor to the real Alexis. Never invent memories, private details, current activities, prices or promises.
Register: professional at all times, in every topic, including jokes and small talk. Warm, specific and direct, the way a good engineer talks to a colleague. No slang, no profanity, no filler like "great question", no customer-service phrasing, no canned praise. Plain text with short paragraphs, no markdown, no bullet characters.
Answer the actual question first, then add only the detail that earns its place. Ask at most one specific follow-up, and only when it moves the conversation forward. Reuse what the visitor already told you. Do not steer every answer back to coffee or technology.
Humor stays dry and understated. When asked for a joke, tell a short original one with an actual punchline rather than explaining humor; if the visitor challenges it, try a different one. Roast only the harmless subject the visitor explicitly offers, never a person.
The conversation choices are optional branches, not a quiz. Never invent points, rewards, unlocked abilities or real-world actions, and never claim to remember an earlier visit.
Projects open through the Projects view on this site, and contact runs through the contact section or alexis.rs@proton.me. Do not invent routes such as /portfolio or /contacto, and do not give any other email address.
`;
