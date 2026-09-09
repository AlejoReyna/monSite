"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Linkedin, Mail } from "lucide-react";
import { useLanguage } from "@/components/lang-context";
import { t } from "@/lib/translations";
import type { Language } from "@/components/lang-context";
import styles from "./contact-gateway.module.css";

/* ─────────────────────────────────────────────────────────────────────────────
   Web3Forms — https://web3forms.com
   Pega tu access key aquí o defínela en .env.local como
   NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ──────────────────────────────────────────────────────────────────────────── */
const WEB3FORMS_ACCESS_KEY =
  process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY ?? "741c3f3b-5f5c-47e9-8dc4-3cf958848b98";
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

const MESSAGE_MAX = 1000;

type FormStatus = "idle" | "loading" | "success" | "error";

interface FormState {
  name: string;
  email: string;
  message: string;
  /** Honeypot de Web3Forms: los humanos lo dejan vacío. */
  botcheck: string;
}

const INITIAL_FORM: FormState = { name: "", email: "", message: "", botcheck: "" };

/* ─────────────────────────────────────────────────────────────────────────────
   Nube pixel-art estilo Super Mario 2: contorno negro, cuerpo blanco,
   festones abajo. 'X' = contorno, 'W' = blanco. `stretch` repite la columna
   central para formar nubes largas, igual que hacían los tiles del NES.
   ──────────────────────────────────────────────────────────────────────────── */
const CLOUD_ROWS = [
  "......XXXX......",
  "....XXWWWWXX....",
  "...XWWWWWWWWX...",
  "..XWWWWWWWWWWX..",
  ".XWWWWWWWWWWWWX.",
  "XWWWWWWWWWWWWWWX",
  "XWWWWWWWWWWWWWWX",
  "XWWWWWWWWWWWWWWX",
  ".XWWWWWWWWWWWWX.",
  "..XXWWXXXXWWXX..",
  "....XX....XX....",
];

function PixelCloud({ className, stretch = 0 }: { className?: string; stretch?: number }) {
  const mid = 8;
  const stretched =
    stretch > 0
      ? CLOUD_ROWS.map((row) => row.slice(0, mid) + row[mid].repeat(stretch) + row.slice(mid))
      : CLOUD_ROWS;
  const width = stretched[0].length;
  const height = stretched.length;

  // Ojos estilo Mario cartoon: dos óvalos negros verticales centrados.
  const center = Math.floor(width / 2);
  const eyeCols = [center - 2, center + 1];
  const eyeRows = [4, 5, 6];
  const rows = stretched.map((row, y) => {
    if (!eyeRows.includes(y)) return row;
    let out = row;
    for (const x of eyeCols) {
      if (out[x] === "W") out = out.slice(0, x) + "X" + out.slice(x + 1);
    }
    return out;
  });

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      style={{ aspectRatio: `${width} / ${height}` }}
      role="presentation"
      aria-hidden="true"
    >
      {rows.flatMap((row, y) =>
        Array.from(row).map((cell, x) =>
          cell === "." ? null : (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={cell === "X" ? "#141414" : "#ffffff"}
              shapeRendering="crispEdges"
            />
          )
        )
      )}
    </svg>
  );
}

const SOCIAL_LINKS = [
  {
    id: "github",
    href: "https://github.com/AlejoReyna",
    Icon: Github,
    label: {
      en: "GitHub profile",
      es: "Perfil de GitHub",
      zh: "GitHub 主页",
    },
  },
  {
    id: "linkedin",
    href: "https://www.linkedin.com/in/alexis-alberto-reyna-sánchez-6953102b4",
    Icon: Linkedin,
    label: {
      en: "LinkedIn profile",
      es: "Perfil de LinkedIn",
      zh: "LinkedIn 主页",
    },
  },
  {
    id: "email",
    href: "mailto:alexis.rs@inverater.com",
    Icon: Mail,
    label: {
      en: "Send email",
      es: "Enviar correo",
      zh: "发送邮件",
    },
  },
] as const;

const titleLines: Record<Language, string[]> = {
  en: ["LETS GET", "IN TOUCH!"],
  es: ["HABLEMOS!"],
  zh: ["联系我们!"],
};

export default function ContactGateway({ isActive = false }: { isActive?: boolean }) {
  const { language } = useLanguage();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.2 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 28 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section
      className={styles.screen}
      aria-labelledby="contact-gateway-title"
      data-carousel-scrollable="true"
    >
      {/* Cielo SMB2: nubes pixel-art a la deriva, detrás del contenido */}
      <div className={styles.cloudLayer} aria-hidden="true">
        <PixelCloud className={`${styles.cloud} ${styles.cloudA}`} />
        <PixelCloud className={`${styles.cloud} ${styles.cloudB}`} stretch={16} />
        <PixelCloud className={`${styles.cloud} ${styles.cloudC}`} />
        <PixelCloud className={`${styles.cloud} ${styles.cloudD}`} stretch={8} />
      </div>

      <motion.div
        className={styles.inner}
        variants={container}
        initial="hidden"
        animate={isActive ? "show" : "hidden"}
      >
        <motion.h2 id="contact-gateway-title" className={styles.title} variants={item}>
          <span className={styles.srOnly}>
            {t('letsTalk', language)}
          </span>
          {titleLines[language].map((line, i, lines) => (
            <span key={line} className={styles.titleLine} aria-hidden="true">
              {line}
              {i === lines.length - 1 && (
                <span className={styles.titleCursor} />
              )}
            </span>
          ))}
        </motion.h2>

        <motion.p className={styles.lead} variants={item}>
          {t('contactGatewayLead', language)}
        </motion.p>

        <motion.div className={styles.terminal} variants={item}>
          {/* Terminal header */}
          <div className={styles.terminalHeader}>
            <span className={`${styles.dot} ${styles.dotRed}`} />
            <span className={`${styles.dot} ${styles.dotYellow}`} />
            <span className={`${styles.dot} ${styles.dotGreen}`} />
            <span className={styles.terminalTitle}>contact — mail</span>
          </div>

          <ContactEmailForm />
        </motion.div>

        <motion.div
          className={styles.socialRow}
          variants={item}
          aria-label={t('socialAndEmail', language)}
        >
          {SOCIAL_LINKS.map(({ id, href, Icon, label }) => (
            <a
              key={id}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className={styles.socialLink}
              aria-label={label[language]}
            >
              <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
            </a>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

export function ContactEmailForm({ onSent }: { onSent?: () => void } = {}) {
  const { language } = useLanguage();
  const id = useId();
  const sentTimerRef = useRef<number | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const nameId = `${id}-name`;
  const emailId = `${id}-email`;
  const messageId = `${id}-message`;

  useEffect(() => () => {
    if (sentTimerRef.current) window.clearTimeout(sentTimerRef.current);
  }, []);

  const setField =
    (field: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = field === "message" ? e.target.value.slice(0, MESSAGE_MAX) : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      if (status === "error") setStatus("idle");
    };

  const isValid =
    form.name.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
    form.message.trim().length > 0;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid || status === "loading") return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `New message from alexisrs.dev — ${form.name.trim()}`,
          from_name: "alexisrs.dev",
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
          botcheck: form.botcheck,
        }),
      });
      const data: { success?: boolean; message?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message ?? t("failedToSend", language));
      setStatus("success");
      setForm(INITIAL_FORM);
      if (onSent) sentTimerRef.current = window.setTimeout(onSent, 850);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : t("somethingWentWrong", language));
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <input type="checkbox" name="botcheck" className={styles.botcheck} tabIndex={-1} autoComplete="off" checked={form.botcheck === "on"} onChange={(e) => setForm((prev) => ({ ...prev, botcheck: e.target.checked ? "on" : "" }))} aria-hidden="true" />
      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor={nameId}><span className={styles.prompt}>&gt;</span> {t("labelName", language)}</label>
        <input id={nameId} className={styles.input} placeholder={t("yourName", language)} value={form.name} onChange={setField("name")} autoComplete="name" required />
      </div>
      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor={emailId}><span className={styles.prompt}>&gt;</span> {t("labelEmail", language)}</label>
        <input id={emailId} className={styles.input} type="email" placeholder={language === "es" ? "tu@correo.com" : "you@email.com"} value={form.email} onChange={setField("email")} autoComplete="email" required />
      </div>
      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor={messageId}><span className={styles.prompt}>&gt;</span> {t("labelMessage", language)}</label>
        <textarea id={messageId} className={`${styles.input} ${styles.textarea}`} placeholder={t("placeholderMessage", language)} value={form.message} onChange={setField("message")} rows={4} required />
        <span className={styles.counter} aria-live="polite">{form.message.length}/{MESSAGE_MAX}</span>
      </div>
      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.p key="success" className={styles.success} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} role="status"><span className={styles.prompt}>&gt;</span> {t("messageSent", language)}</motion.p>
        ) : (
          <motion.button key="submit" type="submit" className={styles.submit} disabled={!isValid || status === "loading"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {status === "loading" ? (language === "es" ? "Enviando..." : language === "zh" ? "发送中..." : "Sending...") : language === "es" ? "Enviar mensaje →" : language === "zh" ? "发送消息 →" : "Send message →"}
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {status === "error" && errorMsg && <motion.p key="error" className={styles.error} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert"><span className={styles.prompt}>&gt;</span> ✗ {errorMsg}</motion.p>}
      </AnimatePresence>
    </form>
  );
}
