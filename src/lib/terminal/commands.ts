export const TERMINAL_COMMANDS = ["/help", "/projects", "/about", "/contact", "/ai", "/menu", "/clear", "/exit"] as const;
export type TerminalCommand = typeof TERMINAL_COMMANDS[number];

const ALIASES: Record<string, TerminalCommand> = {
  help: "/help", projects: "/projects", ls: "/projects", about: "/about",
  whoami: "/about", contact: "/contact", ai: "/ai", menu: "/menu",
  clear: "/clear", exit: "/exit",
  "1": "/projects", "2": "/about", "3": "/contact", "4": "/ai",
};

// Natural language is always welcome. Shell aliases only apply in the launcher;
// explicit slash commands work in either mode without reaching the AI provider.
export function parseTerminalCommand(input: string, mode: "shell" | "assistant"): TerminalCommand | "unknown" | null {
  const value = input.trim().toLowerCase();
  if (TERMINAL_COMMANDS.includes(value as TerminalCommand)) return value as TerminalCommand;
  if (value.startsWith("/")) return "unknown";
  return mode === "shell" ? ALIASES[value] ?? null : null;
}

export function completeTerminalCommand(input: string): TerminalCommand[] {
  if (!input.startsWith("/") || /\s/.test(input)) return [];
  return TERMINAL_COMMANDS.filter(command => command.startsWith(input.toLowerCase()));
}
