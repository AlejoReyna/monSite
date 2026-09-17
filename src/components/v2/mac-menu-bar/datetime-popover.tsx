"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLanguage } from "@/components/lang-context";
import { useDesktopStore } from "@/lib/desktop/desktop-store";
import styles from "./menu-bar.module.css";
import { useOutsideClick } from "./use-menu-dismiss";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// The clock is client-only: the null server snapshot keeps the server HTML and
// the hydration render empty, then the visitor's local time fills in. Snapshots
// are whole minutes, so the 1s check re-renders only when the minute changes.
function subscribeToClock(onTick: () => void) {
  const timer = window.setInterval(onTick, 1_000);
  return () => window.clearInterval(timer);
}
const currentMinute = () => Math.floor(Date.now() / 60_000);
const serverMinute = () => null;

export function DateTimeControl() {
  const { language } = useLanguage();
  const { openMenu, setOpenMenu, preferences, updatePreferences } = useDesktopStore();
  const open = openMenu === "datetime";
  const minute = useSyncExternalStore<number | null>(subscribeToClock, currentMinute, serverMinute);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const rootRef = useRef<HTMLDivElement>(null);
  useOutsideClick(open, () => setOpenMenu(null), rootRef);

  const now = minute === null ? null : new Date(minute * 60_000);
  const locale = language === "es" ? "es-MX" : language === "zh" ? "zh-CN" : "en-GB";
  const label = now?.toLocaleString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: preferences.hour12,
  });

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const days = useMemo(() => {
    const first = startOfMonth(cursor);
    const startPad = first.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: Array<{ day: number | null; isToday: boolean }> = [];
    for (let i = 0; i < startPad; i++) cells.push({ day: null, isToday: false });
    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        isToday:
          d === today.getDate() &&
          cursor.getMonth() === today.getMonth() &&
          cursor.getFullYear() === today.getFullYear(),
      });
    }
    return cells;
  }, [cursor]);

  const monthLabel = cursor.toLocaleString(locale, { month: "long", year: "numeric" });
  const copy =
    language === "es"
      ? { today: "Volver a hoy", hour: "Formato", tz: "Zona horaria" }
      : language === "zh"
        ? { today: "回到今天", hour: "时间格式", tz: "时区" }
        : { today: "Return to Today", hour: "Format", tz: "Timezone" };

  return (
    <div className={styles.item} ref={rootRef}>
      <button
        type="button"
        className={styles.clockBtn}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpenMenu(open ? null : "datetime")}
      >
        {now && <time dateTime={now.toISOString()}>{label}</time>}
      </button>
      {open && (
        <div className={`${styles.popover} ${styles.menuRight}`} role="dialog" aria-label="Calendar">
          <div className={styles.calHeader}>
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            >
              ‹
            </button>
            <span>{monthLabel}</span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            >
              ›
            </button>
          </div>
          <div className={styles.calGrid}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={`${d}-${i}`} className={styles.calDow}>
                {d}
              </span>
            ))}
            {days.map((cell, i) => (
              <span
                key={i}
                className={`${styles.calDay} ${cell.isToday ? styles.calDayToday : ""}`.trim()}
              >
                {cell.day ?? ""}
              </span>
            ))}
          </div>
          <div className={styles.calMeta}>
            <span>
              {copy.tz}: {tz}
            </span>
            <button type="button" className={styles.chip} onClick={() => setCursor(startOfMonth(new Date()))}>
              {copy.today}
            </button>
            <button
              type="button"
              className={styles.chip}
              onClick={() => updatePreferences({ hour12: !preferences.hour12 })}
            >
              {copy.hour}: {preferences.hour12 ? "12h" : "24h"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
