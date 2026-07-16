"use client";

import {
  useRef,
  useState,
  useEffect,
  type FormEvent,
  type ChangeEvent,
} from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
} from "framer-motion";
import { Github, Linkedin, Mail } from "lucide-react";
import { useLanguage } from "@/components/lang-context";
import { t } from "@/lib/translations";
import "@/components/v3/v3.css";

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
type FormStatus = "idle" | "loading" | "success" | "error";
interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const SUBJECT_MAX = 80;

/* ─────────────────────────────────────────
   Social links
───────────────────────────────────────── */
type SocialId = "github" | "linkedin" | "email";

const SOCIAL_LINKS: {
  id: SocialId;
  href: string;
  labelEn: string;
  labelEs: string;
  labelZh: string;
}[] = [
  {
    id: "github",
    href: "https://github.com/AlejoReyna",
    labelEn: "GitHub profile",
    labelEs: "Perfil de GitHub",
    labelZh: "GitHub 个人主页",
  },
  {
    id: "linkedin",
    href: "https://www.linkedin.com/in/alexis-alberto-reyna-sánchez-6953102b4",
    labelEn: "LinkedIn profile",
    labelEs: "Perfil de LinkedIn",
    labelZh: "LinkedIn 个人主页",
  },
  {
    id: "email",
    href: "mailto:alexis.rs@inverater.com",
    labelEn: "Send email",
    labelEs: "Enviar correo",
    labelZh: "发送邮件",
  },
];

function SocialIcon({ id, className }: { id: SocialId; className?: string }) {
  const common = {
    className,
    size: 22,
    strokeWidth: 1.5,
    "aria-hidden": true as const,
  };
  switch (id) {
    case "github":
      return <Github {...common} />;
    case "linkedin":
      return <Linkedin {...common} />;
    case "email":
      return <Mail {...common} />;
  }
}

/* ─────────────────────────────────────────
   Stagger entry animation
───────────────────────────────────────── */
const fieldVariant = (delay: number) => ({
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const, delay },
  },
});

/* ─────────────────────────────────────────
   Submit button inner content
───────────────────────────────────────── */
function SubmitButtonContent({ status, language }: { status: FormStatus; language: string }) {
  if (status === "loading") {
    return (
      <span style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
          style={{ display: "inline-block" }}
          aria-hidden="true"
        >
          ↻
        </motion.span>
        {language === "zh" ? "发送中..." : language === "es" ? "ENVIANDO..." : "SENDING..."}
      </span>
    );
  }
  return <>{language === "zh" ? "发送 →" : language === "es" ? "ENVIAR →" : "SEND →"}</>;
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function ContactEditorial() {
  const { language } = useLanguage();

  /* ── Refs ── */
  const sectionRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const isFormInView = useInView(formRef, { once: true, amount: 0.15 });

  /* ── Headline clip-path reveal via scroll ── */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.85", "start 0.3"],
  });
  const headlineClip = useTransform(
    scrollYProgress,
    [0, 1],
    ["inset(0% 100% 0% 0%)", "inset(0% 0% 0% 0%)"]
  );

  /* ── Form state ── */
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const setField = (field: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = field === "subject"
        ? e.target.value.slice(0, SUBJECT_MAX)
        : e.target.value;
      setForm((prev) => ({ ...prev, [field]: val }));
    };

  const isValid =
    form.name.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.message.trim().length > 0;

  /* ── Submit ── */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid || status === "loading") return;
    setStatus("loading");
    setErrorMsg("");

    try {
      // API accepts: name, email, message, interest
      // subject is appended to message; intent maps to interest
      // TODO: extender API para aceptar `subject` como campo independiente
      const body: Record<string, string> = {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.subject.trim()
          ? `[${form.subject.trim()}]\n\n${form.message.trim()}`
          : form.message.trim(),
      };

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => ({}));
        const msg = (data as { error?: string }).error ?? t("failedToSend", language);
        throw new Error(msg);
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : t("somethingWentWrong", language));
    }
  };

  /* Reset error on field change */
  useEffect(() => {
    if (status === "error") setStatus("idle");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  return (
    <section
      ref={sectionRef}
      className="v3-noise v3-contact-editorial"
      style={{
        background: "var(--v3-bg)",
        padding: "clamp(4rem, 10vw, 8rem) clamp(1.5rem, 6vw, 5rem)",
        position: "relative",
        overflow: "hidden",
      }}
      aria-label={t("contact", language)}
    >
      {/* ── 2-col grid: headline + copy (left) | form + sidebar (right) ── */}
      <div className="v3-contact-layout">
        {/* ── LEFT: Headline + sub-copy ── */}
        <div>
          <motion.h2
            ref={headlineRef}
            className="v3-display"
            style={{
              fontSize: "clamp(3rem, 8vw, 7rem)",
              lineHeight: 0.92,
              maxWidth: "18ch",
              marginBottom: "1.75rem",
              clipPath: headlineClip,
              WebkitClipPath: headlineClip as unknown as string,
              fontWeight: 400,
            }}
          >
            {language === "zh" ? (
              <>
                告诉我你想{" "}
                <span style={{ color: "var(--v3-gold)" }}>构建</span>什么。
              </>
            ) : language === "es" ? (
              <>
                Cuéntame qué quieres{" "}
                <span style={{ color: "var(--v3-gold)" }}>construir</span>.
              </>
            ) : (
              <>
               Let's get in{" "}
                <span style={{ color: "var(--v3-gold)" }}>touch.</span>
              </>
            )}
          </motion.h2>

         
        </div>

        {/* ── RIGHT: Form + sidebar ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(2rem, 5vw, 3rem)",
          }}
        >
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          style={{ display: "flex", flexDirection: "column", gap: "0" }}
        >
          {/* name */}
          <motion.div
            variants={fieldVariant(0)}
            initial="hidden"
            animate={isFormInView ? "visible" : "hidden"}
            style={{ position: "relative" }}
          >
            <label htmlFor="contact-name" className="sr-only">
              {t("yourName", language)}
            </label>
            <input
              id="contact-name"
              className="v3-contact-input"
              placeholder={language === "zh" ? "你的名字" : language === "es" ? "TU NOMBRE" : "YOUR NAME"}
              value={form.name}
              onChange={setField("name")}
              required
              autoComplete="name"
            />
          </motion.div>

          {/* email */}
          <motion.div
            variants={fieldVariant(0.08)}
            initial="hidden"
            animate={isFormInView ? "visible" : "hidden"}
          >
            <label htmlFor="contact-email" className="sr-only">
              {t("yourEmail", language)}
            </label>
            <input
              id="contact-email"
              className="v3-contact-input"
              type="email"
              placeholder={language === "zh" ? "你的邮箱" : language === "es" ? "TU CORREO" : "YOUR EMAIL"}
              value={form.email}
              onChange={setField("email")}
              required
              autoComplete="email"
            />
          </motion.div>

          {/* subject + char counter */}
          <motion.div
            variants={fieldVariant(0.16)}
            initial="hidden"
            animate={isFormInView ? "visible" : "hidden"}
            style={{ position: "relative" }}
          >
            <label htmlFor="contact-subject" className="sr-only">
              {language === "zh" ? "简短主题（可选）" : language === "es" ? "Asunto breve (opcional)" : "Brief subject (optional)"}
            </label>
            <input
              id="contact-subject"
              className="v3-contact-input"
              placeholder={language === "zh" ? "简短主题" : language === "es" ? "ASUNTO BREVE" : "BRIEF SUBJECT"}
              value={form.subject}
              onChange={setField("subject")}
              maxLength={SUBJECT_MAX}
              autoComplete="off"
              style={{ paddingRight: "3.5rem" }}
            />
            {/* char counter */}
            <span
              aria-live="polite"
              aria-label={`${form.subject.length} de ${SUBJECT_MAX} caracteres`}
              className="v3-mono"
              style={{
                position: "absolute",
                right: 0,
                bottom: "0.9rem",
                fontSize: "0.6rem",
                color: form.subject.length >= SUBJECT_MAX * 0.9
                  ? "var(--v3-ember)"
                  : "var(--v3-gold)",
                letterSpacing: "0.05em",
                pointerEvents: "none",
              }}
            >
              {form.subject.length}/{SUBJECT_MAX}
            </span>
          </motion.div>

          {/* message */}
          <motion.div
            variants={fieldVariant(0.24)}
            initial="hidden"
            animate={isFormInView ? "visible" : "hidden"}
          >
            <label htmlFor="contact-message" className="sr-only">
              {t("yourMessage", language)}
            </label>
            <textarea
              id="contact-message"
              className="v3-contact-input"
              placeholder={language === "zh" ? "你的消息" : language === "es" ? "TU MENSAJE" : "YOUR MESSAGE"}
              value={form.message}
              onChange={setField("message")}
              required
              rows={4}
              style={{ resize: "vertical" }}
            />
          </motion.div>


          {/* Submit button + states */}
          <motion.div
            variants={fieldVariant(0.4)}
            initial="hidden"
            animate={isFormInView ? "visible" : "hidden"}
            style={{ marginTop: "1.75rem" }}
          >
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    background: "rgba(34, 85, 34, 0.25)",
                    border: "1px solid rgba(34, 160, 34, 0.4)",
                    padding: "1.1rem 1.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <span style={{ color: "#84cc16", fontSize: "1.1rem" }}>✓</span>
                  <span
                    className="v3-mono"
                    style={{
                      fontSize: "0.65rem",
                      letterSpacing: "0.22em",
                      color: "#a3e63a",
                      textTransform: "uppercase",
                    }}
                  >
                    {language === "zh"
                      ? "消息已收到 · 我会尽快回复"
                      : language === "es"
                      ? "MENSAJE RECIBIDO · TE ESCRIBO PRONTO"
                      : "MESSAGE RECEIVED · I'LL WRITE SOON"}
                  </span>
                </motion.div>
              ) : (
                <motion.button
                  key="submit"
                  type="submit"
                  disabled={!isValid || status === "loading"}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35 }}
                  className="v3-contact-btn v3-contact-btn--full"
                  style={{
                    opacity: !isValid ? 0.4 : 1,
                    cursor: !isValid ? "not-allowed" : "pointer",
                  }}
                >
                  <SubmitButtonContent status={status} language={language} />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
              {status === "error" && errorMsg && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    marginTop: "0.75rem",
                    fontSize: "0.65rem",
                    letterSpacing: "0.15em",
                    color: "var(--v3-ember)",
                    fontFamily: "var(--font-space-mono, monospace)",
                    textTransform: "uppercase",
                  }}
                  role="alert"
                >
                  ✗ {errorMsg}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </form>

        <aside className="v3-social-icon-row" aria-label={t("socialAndEmail", language)}>
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.id}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="v3-social-icon-link"
              aria-label={language === "zh" ? link.labelZh : language === "es" ? link.labelEs : link.labelEn}
            >
              <SocialIcon id={link.id} />
            </a>
          ))}
        </aside>
        </div>
      </div>

    </section>
  );
}
