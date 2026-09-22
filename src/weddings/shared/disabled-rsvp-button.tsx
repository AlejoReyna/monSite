"use client";

import { useCopy } from "@/components/use-copy";
import styles from "./disabled-rsvp-button.module.css";

interface DisabledRsvpButtonProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function DisabledRsvpButton({
  children,
  className = "",
  style,
}: DisabledRsvpButtonProps) {
  const copyText = useCopy();
  return (
    <span
      className={`${styles.wrapper} ${className}`}
      style={style}
      role="button"
      aria-disabled="true"
      tabIndex={-1}
    >
      {children}
      <span className={styles.tooltip} role="tooltip">
        {copyText("To protect weddings planner privacy, this feature is disabled ")}</span>
    </span>
  );
}
