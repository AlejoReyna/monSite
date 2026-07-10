"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Linkedin, Mail } from "lucide-react";
import { useLanguage } from "@/components/lang-context";
import styles from "./contact-gateway.module.css";

/* ─────────────────────────────────────────────────────────────────────────────
   Web3Forms — https://web3forms.com
   Pega tu access key aquí o defínela en .env.local como
   NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ──────────────────────────────────────────────────────────────────────────── */
const WEB3FORMS_ACCESS_KEY =
  process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY ?? "YOUR_WEB3FORMS_ACCESS_KEY_HERE";
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

const SOCIAL_LINKS = [
  {
    id: "github",
    href: "https://github.com/AlejoReyna",
    Icon: Github,
    labelEn: "GitHub profile",
    labelEs: "Perfil de GitHub",
  },
  {
    id: "linkedin",
    href: "https://www.linkedin.com/in/alexis-alberto-reyna-sánchez-6953102b4",
    Icon: Linkedin,
    labelEn: "LinkedIn profile",
    labelEs: "Perfil de LinkedIn",
  },
  {
    id: "email",
    href: "mailto:alexis.rs@inverater.com",
    Icon: Mail,
    labelEn: "Send email",
    labelEs: "Enviar correo",
  },
] as const;

export default function ContactGateway({ isActive = false }: { isActive?: boolean }) {
  const { language } = useLanguage();
  const isEs = language === "es";

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const setField =
    (field: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        field === "message" ? e.target.value.slice(0, MESSAGE_MAX) : e.target.value;
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
          subject: `New message from alexisreyna.dev — ${form.name.trim()}`,
          from_name: "alexisreyna.dev",
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
          botcheck: form.botcheck,
        }),
      });

      const data: { success?: boolean; message?: string } = await res
        .json()
        .catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(
          data.message ?? (isEs ? "Error al enviar." : "Failed to send.")
        );
      }

      setStatus("success");
      setForm(INITIAL_FORM);
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error
          ? err.message
          : isEs
            ? "Algo salió mal."
            : "Something went wrong."
      );
    }
  };

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
      <motion.div
        className={styles.inner}
        variants={container}
        initial="hidden"
        animate={isActive ? "show" : "hidden"}
      >
        <motion.h2 id="contact-gateway-title" className={styles.title} variants={item}>
          <span className={styles.titlePrompt}>&gt;</span>{" "}
          {isEs ? "hablemos" : "let's get in touch"}
          <span className={styles.titleCursor} aria-hidden="true" />
        </motion.h2>

        <motion.p className={styles.lead} variants={item}>
          {isEs
            ? "¿Tienes un proyecto en mente o solo quieres saludar? Escríbeme y te respondo pronto."
            : "Got a project in mind, or just want to say hi? Drop me a line and I'll write back soon."}
        </motion.p>

        <motion.div className={styles.terminal} variants={item}>
          {/* Terminal header */}
          <div className={styles.terminalHeader}>
            <span className={`${styles.dot} ${styles.dotRed}`} />
            <span className={`${styles.dot} ${styles.dotYellow}`} />
            <span className={`${styles.dot} ${styles.dotGreen}`} />
            <span className={styles.terminalTitle}>contact — mail</span>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {/* Honeypot anti-spam de Web3Forms — oculto para humanos */}
            <input
              type="checkbox"
              name="botcheck"
              className={styles.botcheck}
              tabIndex={-1}
              autoComplete="off"
              checked={form.botcheck === "on"}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, botcheck: e.target.checked ? "on" : "" }))
              }
              aria-hidden="true"
            />

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="contact-gw-name">
                <span className={styles.prompt}>&gt;</span> {isEs ? "nombre" : "name"}
              </label>
              <input
                id="contact-gw-name"
                className={styles.input}
                placeholder={isEs ? "Tu nombre" : "Your name"}
                value={form.name}
                onChange={setField("name")}
                autoComplete="name"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="contact-gw-email">
                <span className={styles.prompt}>&gt;</span> {isEs ? "correo" : "email"}
              </label>
              <input
                id="contact-gw-email"
                className={styles.input}
                type="email"
                placeholder={isEs ? "tu@correo.com" : "you@email.com"}
                value={form.email}
                onChange={setField("email")}
                autoComplete="email"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="contact-gw-message">
                <span className={styles.prompt}>&gt;</span> {isEs ? "mensaje" : "message"}
              </label>
              <textarea
                id="contact-gw-message"
                className={`${styles.input} ${styles.textarea}`}
                placeholder={isEs ? "Cuéntame tu idea..." : "Tell me about your idea..."}
                value={form.message}
                onChange={setField("message")}
                rows={4}
                required
              />
              <span className={styles.counter} aria-live="polite">
                {form.message.length}/{MESSAGE_MAX}
              </span>
            </div>

            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.p
                  key="success"
                  className={styles.success}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  role="status"
                >
                  <span className={styles.prompt}>&gt;</span>{" "}
                  {isEs
                    ? "mensaje enviado — te escribo pronto ✓"
                    : "message sent — I'll write back soon ✓"}
                </motion.p>
              ) : (
                <motion.button
                  key="submit"
                  type="submit"
                  className={styles.submit}
                  disabled={!isValid || status === "loading"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {status === "loading"
                    ? isEs
                      ? "Enviando..."
                      : "Sending..."
                    : isEs
                      ? "Enviar mensaje →"
                      : "Send message →"}
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {status === "error" && errorMsg && (
                <motion.p
                  key="error"
                  className={styles.error}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  role="alert"
                >
                  <span className={styles.prompt}>&gt;</span> ✗ {errorMsg}
                </motion.p>
              )}
            </AnimatePresence>
          </form>
        </motion.div>

        <motion.div
          className={styles.socialRow}
          variants={item}
          aria-label={isEs ? "Redes y correo" : "Social and email"}
        >
          {SOCIAL_LINKS.map(({ id, href, Icon, labelEn, labelEs }) => (
            <a
              key={id}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className={styles.socialLink}
              aria-label={isEs ? labelEs : labelEn}
            >
              <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
            </a>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
