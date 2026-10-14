export const GAMEBOY_CASES = ["classic", "transparent", "green", "red"] as const;
export type GameBoyCase = typeof GAMEBOY_CASES[number];
export const CASE_STORAGE_KEY = "monsite.gold.case.v1";
export function parseGameBoyCase(value: unknown): GameBoyCase {
  return GAMEBOY_CASES.includes(value as GameBoyCase) ? value as GameBoyCase : "classic";
}

export type GameFullscreenMode = "none" | "native" | "immersive";
type FullscreenHost = {
  documentElement: { requestFullscreen?: (options?: FullscreenOptions) => Promise<void> };
  fullscreenElement: unknown;
  fullscreenEnabled?: boolean;
  exitFullscreen?: () => Promise<void>;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
};

/** The root can enter fullscreen; HTMLDialogElement cannot. Keep the engine
 * mounted, synchronize browser exits, and release only fullscreen we own. */
export function createGameFullscreen(host: FullscreenHost, onChange: (mode: GameFullscreenMode) => void) {
  let mode: GameFullscreenMode = "none";
  let owned = false, wanted = false, pending = false, disposed = false;
  const update = (next: GameFullscreenMode) => {
    if (mode === next) return;
    mode = next;
    if (!disposed) onChange(next);
  };
  const exitOwned = async () => {
    if (owned && host.fullscreenElement === host.documentElement) {
      try { await host.exitFullscreen?.(); } catch { return; }
    }
    else if (owned && pending) return; // A late native request still needs cleanup.
    owned = false;
  };
  const changed = () => {
    if (!owned) return;
    if (host.fullscreenElement === host.documentElement) {
      if (wanted) update("native");
    } else {
      owned = false; wanted = false; update("none");
    }
  };
  host.addEventListener("fullscreenchange", changed);
  return {
    async enter() {
      if (disposed || pending) return;
      wanted = true;
      update("immersive");
      if (host.fullscreenElement || host.fullscreenEnabled === false || !host.documentElement.requestFullscreen) return;
      pending = true; owned = true;
      try {
        // Called directly from a click, preserving transient user activation.
        await host.documentElement.requestFullscreen({ navigationUI: "hide" });
        if (disposed || !wanted) await exitOwned();
        else if (host.fullscreenElement === host.documentElement) update("native");
        else { owned = false; update("immersive"); }
      } catch {
        owned = false;
        if (wanted && !disposed) update("immersive");
      } finally { pending = false; }
    },
    async leave() {
      wanted = false;
      await exitOwned();
      if (!owned || pending) update("none");
    },
    dispose() {
      disposed = true; wanted = false;
      host.removeEventListener("fullscreenchange", changed);
      void exitOwned();
    },
  };
}
