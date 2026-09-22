"use client";

import { useCopy } from "@/components/use-copy";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { useLanguage, type Language } from "@/components/lang-context";
import { useDesktopStore } from "@/lib/desktop/desktop-store";
import { DOCK_COPY, DOCK_PRESETS, DOCK_SIZE_NAMES } from "@/lib/desktop/dock-layout";
import { ASSISTANT_NAME, type AssistantVoiceId } from "@/lib/desktop/types";
import styles from "./menu-bar.module.css";

const VOICES: AssistantVoiceId[] = ["eve", "ara", "leo", "rex", "sal", "luna"];

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function ModalShell({
  open,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const root = dialogRef.current;
    const initial =
      (root?.querySelector("[data-modal-initial-focus]") as HTMLElement | null) ||
      (root?.querySelector(FOCUSABLE) as HTMLElement | null);
    // Defer focus so the dialog is in the DOM/paint before moving focus.
    const focusTimer = window.setTimeout(() => initial?.focus(), 0);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1 && el.offsetParent !== null,
      );
      if (nodes.length === 0) {
        event.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey) {
        if (active === first || !dialogRef.current.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialogRef.current.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey, true);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey, true);
      const prev = previousFocus.current;
      if (prev && typeof prev.focus === "function" && document.contains(prev)) {
        prev.focus({ preventScroll: true });
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={styles.modal}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      ref={dialogRef}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.dialog}>{children}</div>
    </div>
  );
}

export function DesktopDialogs() {
  const copyText = useCopy();
  const { language, setLanguage } = useLanguage();
  const {
    aboutOpen,
    preferencesOpen,
    tourOpen,
    shortcutsOpen,
    setAboutOpen,
    setPreferencesOpen,
    setTourOpen,
    setShortcutsOpen,
    preferences,
    updatePreferences,
    dockSize,
    setDockSize,
  } = useDesktopStore();

  const aboutId = useId();
  const prefsId = useId();
  const tourId = useId();
  const shortcutsId = useId();

  const closeAbout = useCallback(() => setAboutOpen(false), [setAboutOpen]);
  const closePrefs = useCallback(() => setPreferencesOpen(false), [setPreferencesOpen]);
  const closeTour = useCallback(() => setTourOpen(false), [setTourOpen]);
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), [setShortcutsOpen]);

  const copy =
    language === "es"
      ? {
          aboutTitle: "Acerca de este portafolio",
          aboutBody:
            "Portafolio interactivo estilo macOS de Alexis Reyna. Navega proyectos, blog y contacto desde la barra de menús, el dock o Orbit.",
          prefs: "Preferencias",
          language: copyText("Idioma"),
          motion: "Reducir movimiento",
          voice: `${ASSISTANT_NAME} — voz`,
          hour: "Formato de hora",
          sounds: "Sonidos opcionales de UI",
          on: "Activado",
          off: "Desactivado",
          h12: "12 h",
          h24: "24 h",
          tourTitle: "Tour rápido",
          tourBody: [
            "Usa Apple · Archivo · Ir para abrir proyectos, blog y contacto.",
            "Spotlight (lupa) busca páginas, proyectos y comandos.",
            `${ASSISTANT_NAME} (orbe) responde por texto o micrófono.`,
            "Focus pausa animaciones decorativas durante 25 minutos.",
            "Arrastra los íconos del escritorio; clic derecho o Visualización para ordenarlos de nuevo.",
            "Arrastra el separador del Dock para agrandarlo o reducirlo; clic derecho en el Dock para los tamaños.",
          ],
          shortcutsTitle: "Atajos de teclado",
          shortcuts: [
            "Esc — cerrar menú, ventana o panel",
            "Flechas / Enter — navegar Spotlight",
            "Clic fuera — cerrar el popover activo",
            "⌘ / Mayús + clic — seleccionar varios íconos del escritorio",
            "Mayús + F10 — menú de un ícono del escritorio",
            "Flechas — redimensionar el Dock desde su separador",
          ],
          close: "Cerrar",
          done: "Listo",
        }
      : {
            aboutTitle: "About This Portfolio",
            aboutBody:
              "Alexis Reyna’s interactive macOS-style portfolio. Reach projects, blog, and contact from the menu bar, dock, or Orbit.",
            prefs: "Preferences",
            language: copyText("Language"),
            motion: "Reduce motion",
            voice: `${ASSISTANT_NAME} voice`,
            hour: "Time format",
            sounds: "Optional UI sounds",
            on: "On",
            off: "Off",
            h12: "12-hour",
            h24: "24-hour",
            tourTitle: "Quick Tour",
            tourBody: [
              "Use Apple · File · Go to open projects, blog, and contact.",
              "Spotlight (magnifier) finds pages, projects, and commands.",
              `${ASSISTANT_NAME} (orb) answers via text or microphone.`,
              "Focus pauses decorative animations for 25 minutes.",
              "Drag desktop icons anywhere; right-click the desktop or use View to tidy them up.",
              "Drag the Dock's divider to grow or shrink it; right-click the Dock for preset sizes.",
            ],
            shortcutsTitle: "Keyboard Shortcuts",
            shortcuts: [
              "Esc — close menu, window, or panel",
              "Arrows / Enter — navigate Spotlight",
              "Click outside — dismiss the active popover",
              "⌘ / Shift-click — select several desktop icons",
              "Shift+F10 — open a desktop icon's menu",
              "Arrows — resize the Dock from its divider",
            ],
            close: "Close",
            done: "Done",
          };

  const dock = DOCK_COPY[language];

  const langs: { id: Language; label: string }[] = [
    { id: "es", label: "Español" },
    { id: "en", label: "English" },
  ];

  return (
    <>
      <ModalShell open={aboutOpen} onClose={closeAbout} labelledBy={aboutId}>
        <h2 id={aboutId}>{copy.aboutTitle}</h2>
        <p>{copy.aboutBody}</p>
        <div className={styles.dialogActions}>
          <button type="button" data-modal-initial-focus onClick={closeAbout}>
            {copy.close}
          </button>
        </div>
      </ModalShell>

      <ModalShell open={preferencesOpen} onClose={closePrefs} labelledBy={prefsId}>
        <h2 id={prefsId}>{copy.prefs}</h2>
        <div className={styles.prefRow}>
          <span>{copy.language}</span>
          <div className={styles.chips}>
            {langs.map((l) => (
              <button
                key={l.id}
                type="button"
                className={styles.chip}
                aria-pressed={language === l.id}
                onClick={() => setLanguage(l.id)}
              >
                {copyText(l.label)}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.prefRow}>
          <span>{copy.motion}</span>
          <button
            type="button"
            aria-pressed={preferences.reducedMotion}
            onClick={() => updatePreferences({ reducedMotion: !preferences.reducedMotion })}
          >
            {preferences.reducedMotion ? copy.on : copy.off}
          </button>
        </div>
        <div className={styles.prefRow}>
          <span>{dock.size}</span>
          <div className={styles.chips}>
            {DOCK_SIZE_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                className={styles.chip}
                aria-pressed={dockSize === DOCK_PRESETS[name]}
                onClick={() => setDockSize(DOCK_PRESETS[name])}
              >
                {dock[name]}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.prefRow}>
          <span>{copy.voice}</span>
          <div className={styles.chips}>
            {VOICES.map((v) => (
              <button
                key={v}
                type="button"
                className={styles.chip}
                aria-pressed={preferences.assistantVoice === v}
                onClick={() => updatePreferences({ assistantVoice: v })}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.prefRow}>
          <span>{copy.hour}</span>
          <div className={styles.chips}>
            <button
              type="button"
              className={styles.chip}
              aria-pressed={preferences.hour12}
              onClick={() => updatePreferences({ hour12: true })}
            >
              {copy.h12}
            </button>
            <button
              type="button"
              className={styles.chip}
              aria-pressed={!preferences.hour12}
              onClick={() => updatePreferences({ hour12: false })}
            >
              {copy.h24}
            </button>
          </div>
        </div>
        <div className={styles.prefRow}>
          <span>{copy.sounds}</span>
          <button
            type="button"
            aria-pressed={preferences.soundsEnabled}
            onClick={() => updatePreferences({ soundsEnabled: !preferences.soundsEnabled })}
          >
            {preferences.soundsEnabled ? copy.on : copy.off}
          </button>
        </div>
        <div className={styles.dialogActions}>
          <button type="button" data-modal-initial-focus onClick={closePrefs}>
            {copy.done}
          </button>
        </div>
      </ModalShell>

      <ModalShell open={tourOpen} onClose={closeTour} labelledBy={tourId}>
        <h2 id={tourId}>{copy.tourTitle}</h2>
        <ul>
          {copy.tourBody.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className={styles.dialogActions}>
          <button type="button" data-modal-initial-focus onClick={closeTour}>
            {copy.close}
          </button>
        </div>
      </ModalShell>

      <ModalShell open={shortcutsOpen} onClose={closeShortcuts} labelledBy={shortcutsId}>
        <h2 id={shortcutsId}>{copy.shortcutsTitle}</h2>
        <ul>
          {copy.shortcuts.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className={styles.dialogActions}>
          <button type="button" data-modal-initial-focus onClick={closeShortcuts}>
            {copy.close}
          </button>
        </div>
      </ModalShell>
    </>
  );
}
