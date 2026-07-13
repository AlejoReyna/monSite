"use client"
import { useRef } from 'react';
import { useState } from 'react';
import { withBasePath } from '../../lib/basePath';

const WEB3FORMS_ACCESS_KEY = 'bc3c03b3-0e4c-480e-b5cd-e2a44d17c280';

export default function RSVPSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (hasSubmitted) return;

    setFormStatus('loading');

    try {
      const formData = new FormData();
      formData.append('access_key', WEB3FORMS_ACCESS_KEY);
      formData.append('subject', 'Nuevo mensaje desde el RSVP de la boda');
      formData.append('from_name', 'Cindy Wedding RSVP');
      formData.append('name', name);
      formData.append('email', email);
      formData.append('message', message);

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setHasSubmitted(true);
        setFormStatus('success');
        setShowSuccessFeedback(true);
        setName('');
        setEmail('');
        setMessage('');
        setTimeout(() => setShowSuccessFeedback(false), 5000);
        return;
      }

      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 5000);
    } catch {
      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 5000);
    }
  };


  return (
    <section
      ref={sectionRef}
      className="w-full min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(
          135deg,
          rgba(22, 16, 12, 0.68) 0%,
          rgba(28, 21, 16, 0.60) 35%,
          rgba(34, 25, 18, 0.56) 70%,
          rgba(22, 16, 12, 0.68) 100%
        ), url('${withBasePath('/weddings/cindy/hands.JPG')}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Vignette edges */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 45%, rgba(10,7,5,0.45) 100%)'
      }} />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-end px-4 sm:px-6 md:px-10 pb-8 sm:pb-10 md:pb-14">
        <div className="rsvp-wrapper">

          {/* Headline */}
          <p className="rsvp-message">
            Tu presencia hará aún más especial este día.
          </p>

          {/* Form */}
          <form
            className="rsvp-form"
            action="https://api.web3forms.com/submit"
            method="POST"
            onSubmit={handleSubmit}
          >
            <p className="rsvp-form-title">
              Nos hará muy felices leer tu mensaje en este momento único
            </p>

            <input type="hidden" name="access_key" value={WEB3FORMS_ACCESS_KEY} />
            <input type="hidden" name="subject" value="Nuevo mensaje desde el RSVP de la boda" />
            <input type="hidden" name="from_name" value="Cindy Wedding RSVP" />

            {!hasSubmitted && (
              <>
                <div className="rsvp-fields">
                  {/* Name + Email row */}
                  <div className="rsvp-row">
                    <div className="rsvp-field">
                      <label className="rsvp-label">Nombre</label>
                      <input
                        type="text"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre completo"
                        className="rsvp-input"
                        autoComplete="name"
                        required
                        disabled={formStatus === 'loading'}
                      />
                    </div>
                    <div className="rsvp-field">
                      <label className="rsvp-label">Correo electrónico</label>
                      <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        className="rsvp-input"
                        autoComplete="email"
                        required
                        disabled={formStatus === 'loading'}
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="rsvp-field">
                    <label className="rsvp-label">Mensaje</label>
                    <textarea
                      name="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Escribe aquí tus buenos deseos..."
                      className="rsvp-input rsvp-textarea"
                      required
                      disabled={formStatus === 'loading'}
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="rsvp-actions">
                  <button
                    type="submit"
                    className="rsvp-send-btn"
                    disabled={formStatus === 'loading'}
                  >
                    <span className="rsvp-btn-text">
                      {formStatus === 'loading' ? 'Enviando…' : 'Enviar mensaje'}
                    </span>
                    {formStatus !== 'loading' && (
                      <svg className="rsvp-btn-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path d="M3 10h14M11 4l6 6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {formStatus === 'loading' && (
                      <span className="rsvp-spinner" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </>
            )}

            <p className={`rsvp-feedback ${formStatus === 'loading' || formStatus === 'error' || showSuccessFeedback ? 'rsvp-feedback--visible' : ''} ${formStatus === 'success' ? 'rsvp-feedback--success' : ''} ${formStatus === 'error' ? 'rsvp-feedback--error' : ''}`}>
              {formStatus === 'success' && 'Enviado con éxito. ¡Hasta pronto!'}
              {formStatus === 'error' && 'No se pudo enviar. Intenta de nuevo.'}
              {formStatus === 'loading' && 'Enviando tu mensaje…'}
            </p>
          </form>
        </div>
      </div>

      <style jsx>{`
        /* ── Wrapper ── */
        .rsvp-wrapper {
          width: 100%;
          max-width: 44rem;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* ── Headline ── */
        .rsvp-message {
          text-align: center;
          color: rgba(255, 255, 255, 0.95);
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.9rem, 5.2vw, 3.4rem);
          font-weight: 300;
          letter-spacing: 0.04em;
          line-height: 1.25;
          text-wrap: balance;
          text-shadow:
            0 4px 16px rgba(18, 12, 7, 0.35),
            0 1px 2px rgba(18, 12, 7, 0.22);
          margin: 0;
        }

        /* ── Form ── */
        .rsvp-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        /* ── Form title ── */
        .rsvp-form-title {
          text-align: center;
          color: rgba(255, 255, 255, 0.9);
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(0.95rem, 2.1vw, 1.18rem);
          font-weight: 400;
          line-height: 1.35;
          letter-spacing: 0.02em;
          margin: 0;
        }

        /* ── Fields ── */
        .rsvp-fields {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0rem;
        }

        /* Name + Email side-by-side on sm+ */
        .rsvp-row {
          display: flex;
          flex-direction: column;
        }

        @media (min-width: 540px) {
          .rsvp-row {
            flex-direction: row;
            gap: 2rem;
          }
          .rsvp-row .rsvp-field {
            flex: 1;
            min-width: 0;
          }
        }

        /* ── Individual field ── */
        .rsvp-field {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .rsvp-label {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.68rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.75);
          padding: 0.9rem 0.1rem 0;
        }

        /* ── Inputs — underline only, no block ── */
        .rsvp-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.48);
          outline: none;
          color: rgba(255, 255, 255, 0.96);
          font-size: clamp(1rem, 2.2vw, 1.15rem);
          font-family: 'Cormorant Garamond', serif;
          letter-spacing: 0.02em;
          padding: 0.35rem 0.1rem 0.55rem;
          transition: border-color 200ms ease;
          box-sizing: border-box;
        }

        .rsvp-input:focus {
          border-bottom-color: rgba(255, 255, 255, 0.85);
        }

        .rsvp-input:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .rsvp-input::placeholder {
          color: rgba(255, 255, 255, 0.38);
          font-style: italic;
        }

        .rsvp-textarea {
          min-height: 5.5rem;
          resize: none;
          line-height: 1.55;
        }

        @media (min-width: 640px) {
          .rsvp-textarea { min-height: 6rem; }
        }

        /* ── Actions row ── */
        .rsvp-actions {
          display: flex;
          justify-content: center;
          padding-top: 0.5rem;
        }

        /* ── Submit button ── */
        .rsvp-send-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.5);
          color: rgba(255, 255, 255, 0.96);
          border-radius: 999px;
          padding: 0.42rem 1.45rem;
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(0.82rem, 1.6vw, 0.92rem);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 220ms ease, border-color 220ms ease, transform 220ms ease;
        }

        .rsvp-send-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.10);
          border-color: rgba(255, 255, 255, 0.75);
          transform: translateY(-1px);
        }

        .rsvp-send-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .rsvp-send-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .rsvp-btn-icon {
          width: 1rem;
          height: 1rem;
          flex-shrink: 0;
          transition: transform 220ms ease;
        }

        .rsvp-send-btn:hover:not(:disabled) .rsvp-btn-icon {
          transform: translateX(3px);
        }

        /* Spinner */
        .rsvp-spinner {
          display: inline-block;
          width: 0.85rem;
          height: 0.85rem;
          border: 1.5px solid rgba(255, 255, 255, 0.25);
          border-top-color: rgba(255, 255, 255, 0.90);
          border-radius: 50%;
          animation: rsvpSpin 0.75s linear infinite;
          flex-shrink: 0;
        }

        @keyframes rsvpSpin {
          to { transform: rotate(360deg); }
        }

        /* ── Feedback ── */
        .rsvp-feedback {
          text-align: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.9rem;
          letter-spacing: 0.05em;
          opacity: 0;
          transform: translateY(4px);
          transition: opacity 260ms ease, transform 260ms ease;
          color: rgba(247, 239, 226, 0.92);
          min-height: 1.3em;
        }

        .rsvp-feedback--visible {
          opacity: 1;
          transform: translateY(0);
        }

        .rsvp-feedback--success {
          color: rgba(247, 239, 226, 0.92);
        }

        .rsvp-feedback--error {
          color: rgba(230, 160, 150, 0.95);
        }
      `}</style>
    </section>
  );
}
