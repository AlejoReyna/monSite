import type { Language } from "@/components/lang-context";
import { findProject, ABOUT_PORTFOLIO, type CuratedProject } from "./portfolio-content";
import type { AllowlistedActionName, DesktopAction } from "./types";

export const ALLOWLISTED_ACTIONS: AllowlistedActionName[] = [
  "answer_portfolio",
  "open_projects",
  "explain_project",
  "navigate_contact",
  "change_language",
  "toggle_focus",
  "open_terminal",
];

export const ASSISTANT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "answer_portfolio",
      description: "Answer a question using curated portfolio facts only.",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "Optional topic hint" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "open_projects",
      description: "Open the Projects / Finder window on the macOS desktop.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "explain_project",
      description: "Explain a specific portfolio project by id or title.",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "string",
            description: "Project id or title (inverater, plebes, cafeteria, wedding, nonamedbot)",
          },
        },
        required: ["projectId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "navigate_contact",
      description: "Navigate the visitor to the Contact section.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "change_language",
      description: "Change UI language to en, es, or zh.",
      parameters: {
        type: "object",
        properties: {
          language: { type: "string", enum: ["en", "es", "zh"] },
        },
        required: ["language"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "toggle_focus",
      description: "Enable or disable Focus mode (pauses decorative animations for up to 25 minutes).",
      parameters: {
        type: "object",
        properties: {
          enabled: { type: "boolean" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "open_terminal",
      description: "Open the portfolio chat Terminal window.",
      parameters: { type: "object", properties: {} },
    },
  },
];

function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "es" || value === "zh";
}

export function parseToolCall(
  name: string,
  rawArgs: unknown,
): DesktopAction | { error: string } {
  let args: Record<string, unknown> = {};
  if (typeof rawArgs === "string") {
    try {
      args = JSON.parse(rawArgs || "{}") as Record<string, unknown>;
    } catch {
      return { error: "Invalid tool arguments JSON" };
    }
  } else if (rawArgs && typeof rawArgs === "object") {
    args = rawArgs as Record<string, unknown>;
  }

  switch (name) {
    case "answer_portfolio":
      return {
        type: "answer_portfolio",
        args: { topic: typeof args.topic === "string" ? args.topic.slice(0, 120) : undefined },
      };
    case "open_projects":
      return { type: "open_projects", args: {} };
    case "explain_project": {
      if (typeof args.projectId !== "string" || !args.projectId.trim()) {
        return { error: "projectId is required" };
      }
      const project = findProject(args.projectId);
      if (!project) return { error: `Unknown project: ${args.projectId}` };
      return { type: "explain_project", args: { projectId: project.id } };
    }
    case "navigate_contact":
      return { type: "navigate_contact", args: {} };
    case "change_language":
      if (!isLanguage(args.language)) return { error: "language must be en, es, or zh" };
      return { type: "change_language", args: { language: args.language } };
    case "toggle_focus":
      return {
        type: "toggle_focus",
        args: { enabled: typeof args.enabled === "boolean" ? args.enabled : undefined },
      };
    case "open_terminal":
      return { type: "open_terminal", args: {} };
    default:
      return { error: `Action not allowlisted: ${name}` };
  }
}

export function explainProjectText(project: CuratedProject, lang: Language): string {
  return `${project.title} — ${project.category}. ${project.summary[lang]} Tags: ${project.tags.join(", ")}. ${project.href}`;
}

export function answerFromCurated(topic: string | undefined, lang: Language): string {
  if (topic) {
    const project = findProject(topic);
    if (project) return explainProjectText(project, lang);
  }
  return ABOUT_PORTFOLIO[lang];
}
