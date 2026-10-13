export type TerminalIntroCopy = {
  heading: string;
  prefix: string;
  portfolio: string;
  invitation: string;
};

const CHARACTER_MS = 40;
export const INTRO_FADE_MS = 220;
export const INTRO_BUTTON_STAGGER_MS = 90;

export function createTerminalIntro(copy: TerminalIntroCopy) {
  const heading = Array.from(`${copy.heading}!`);
  const prefix = Array.from(`${copy.prefix} `);
  const portfolio = Array.from(copy.portfolio);
  const invitation = Array.from(copy.invitation);
  const headingStart = 920;
  const subtitleStart = headingStart + heading.length * CHARACTER_MS + 100;
  const controlsStart = subtitleStart + (prefix.length + portfolio.length) * CHARACTER_MS + 120;
  const invitationStart = controlsStart + 2 * INTRO_BUTTON_STAGGER_MS + INTRO_FADE_MS + 100;
  const duration = invitationStart + invitation.length * CHARACTER_MS;
  return { heading, prefix, portfolio, invitation, headingStart, subtitleStart, controlsStart, invitationStart, duration };
}

export function terminalIntroFrame(intro: ReturnType<typeof createTerminalIntro>, elapsed: number) {
  const count = (start: number) => Math.max(0, Math.floor((elapsed - start) / CHARACTER_MS) + 1);
  const subtitleCount = count(intro.subtitleStart);
  return {
    heading: intro.heading.slice(0, count(intro.headingStart)).join(""),
    prefix: intro.prefix.slice(0, subtitleCount).join(""),
    portfolio: intro.portfolio.slice(0, Math.max(0, subtitleCount - intro.prefix.length)).join(""),
    subtitleVisible: elapsed >= intro.subtitleStart,
    controlsVisible: elapsed >= intro.controlsStart,
    invitation: intro.invitation.slice(0, count(intro.invitationStart)).join(""),
  };
}
