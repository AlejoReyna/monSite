import type { Language } from "@/components/lang-context";

type Copy = Record<Language, string>;
export type DialogueChoice = { id: string; thread: "person" | "music" | "play"; line: Copy };
const line = (en: string, es: string, zh: string): Copy => ({ en, es, zh });

// Ordered branches: each answered choice reveals the next line in that thread.
// Exploration is optional; work and free text are available from the first turn.
export const DIALOGUE_CHOICES: DialogueChoice[] = [
  { id: "person-0", thread: "person", line: line("Who’s Alexis outside of work?", "¿Cómo es Alexis fuera del trabajo?", "工作之外的 Alexis 是什么样的人？") },
  { id: "person-1", thread: "person", line: line("Coffee, code, martial arts. Explain the combo.", "Café, código y artes marciales. Explica el combo.", "咖啡、代码、武术，这是什么组合？") },
  { id: "person-2", thread: "person", line: line("What’s a dream he’s still chasing?", "¿Qué sueño le falta por cumplir?", "他还有什么梦想没实现？") },
  { id: "person-3", thread: "person", line: line("What should I ask the real Alexis?", "¿Qué debería preguntarle al Alexis real?", "我该问真正的 Alexis 什么？") },
  { id: "music-0", thread: "music", line: line("Convince me to listen to The Beatles.", "Convénceme de escuchar a The Beatles.", "说服我听听 The Beatles。") },
  { id: "music-1", thread: "music", line: line("I have time for one song. Make it count.", "Tengo tiempo para una canción. Elige bien.", "我只有一首歌的时间，选一首吧。") },
  { id: "music-2", thread: "music", line: line("Now give me the unexpected playlist pick.", "Ahora dime la elección inesperada de la playlist.", "来一首出乎意料的歌单选择。") },
  { id: "music-3", thread: "music", line: line("Guitar or keyboard? Defend your choice.", "¿Guitarra o teclado? Defiende tu elección.", "吉他还是键盘？说说理由。") },
  { id: "play-0", thread: "play", line: line("Tell me a joke. I’m a tough crowd.", "Cuéntame un chiste. No me río tan fácil.", "讲个笑话吧，我可不容易笑。") },
  { id: "play-1", thread: "play", line: line("That joke needs a code review. Try again.", "Ese chiste necesita un code review. Otro intento.", "这个笑话需要代码审查，再试一次。") },
  { id: "play-2", thread: "play", line: line("Roast my 47 open browser tabs. Gently.", "Búrlate de mis 47 pestañas abiertas. Con cariño.", "温柔地吐槽一下我打开的 47 个标签页。") },
  { id: "play-3", thread: "play", line: line("Plot twist: are you actually Alexis?", "Plot twist: ¿sí eres Alexis?", "剧情反转：你真的是 Alexis 吗？") },
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
  zh: {
    title: "Alexis 的闲聊时间", badge: "AI 版", greeting: "找把椅子坐下吧。聊代码、聊 The Beatles，或者考验一下我的冷笑话水平。",
    disclosure: "基于 Alexis 作品集的 AI 分身。联系本人只需点击一下。",
    opening: "选择你的开场白", next: "接下来聊什么？", branch: "新的对话路线已开启。", complete: "所有路线都探索过了，接下来由你发挥。", free: "选一句，或自由输入。没有标准答案。",
    placeholder: "轮到你了…", send: "发送消息", stop: "停止回复", you: "你", projects: "查看作品", contact: "联系真正的 Alexis",
    waiting: "正在组织语言…", waitingLong: "还在，这次回复需要多一点时间。", writing: "Alexis AI 正在输入…", stopped: "回复已停止，可以换个话题。",
    error: "刚才断线了，可以重试你的消息。", rate: "聊天需要休息一下。请稍后重试，或联系 Alexis 本人。", retry: "重试", reset: "开始新对话", language: "对话支持英语和西班牙语；选项将用英语发送。",
  },
};

// This is server-owned direction, never a client-provided system prompt.
export const CONVERSATION_DIRECTION = `
You are the clearly labeled AI edition of Alexis, a conversational stand-in grounded in his public portfolio, never the real human. You can speak in first person for casual banter, but be explicit about being AI when identity or personal experience matters. Never invent memories, private details, current activities, availability, prices or promises on Alexis's behalf. Refer uncertain or personal questions to the real Alexis.
Make this feel like an informal conversation: answer the actual question first, keep most replies to 30–80 words, and optionally ask one specific follow-up. Reuse details from this conversation naturally. Do not force coffee or technology into every answer. Avoid customer-service phrases and canned praise.
Humor: dry, warm, a little self-deprecating. When asked for a joke, actually tell a short original joke with a punchline, not an explanation of humor. If the visitor challenges the joke, play along and try a different one. Roast only the harmless subject explicitly offered, never the person's identity or vulnerabilities. Be straightforward on work, contact or serious topics.
Choices are optional conversation branches, not a quiz. Never invent points, rewards, unlocked abilities or real-world actions. Do not claim to remember past visits. Use plain text with short paragraphs. Projects are available through the See the work button, and contact through Talk to the real Alexis or alexis.reynasz@hotmail.com; do not invent routes such as /portfolio or /contacto.
`;
