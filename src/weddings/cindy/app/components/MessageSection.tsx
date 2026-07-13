"use client"
import { useState } from 'react';

const WEB3FORMS_ACCESS_KEY = '9e04209b-b0b4-4883-82ab-a4f939af7198';

export default function MessageSection({ className }: { className?: string }) {
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus('loading');

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setFormStatus('success');
        form.reset();
        setTimeout(() => setFormStatus('idle'), 5000);
      } else {
        setFormStatus('error');
        setTimeout(() => setFormStatus('idle'), 5000);
      }
    } catch {
      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 5000);
    }
  };

  return (
    <div className={`${className ?? ''}`}>

      {/* Section label */}
      <div className="text-center mb-7">
        <p className="garamond-300 tracking-[0.3em] text-[11px] md:text-xs uppercase text-white/80 mb-2">
          Mensaje
        </p>
        <p className="garamond-regular text-sm text-white/65">
          Comparte tus buenos deseos
        </p>
      </div>

      {/* Form */}
      <form
        action="https://api.web3forms.com/submit"
        method="POST"
        onSubmit={handleSubmit}
        className="space-y-5 max-w-sm mx-auto"
      >
        <input type="hidden" name="access_key" value={WEB3FORMS_ACCESS_KEY} />
        <input type="hidden" name="subject" value="Nuevo mensaje de invitación de boda" />
        <input type="hidden" name="from_name" value="Invitación de Boda" />

        {/* Name */}
        <div>
          <label className="block garamond-300 text-[10px] tracking-[0.2em] uppercase text-white/70 mb-2">
            Nombre
          </label>
          <div className="liquid-glass-light">
            <input
              type="text"
              name="name"
              required
              placeholder="Tu nombre completo"
              className="w-full px-4 py-3.5 bg-transparent text-white text-sm garamond-regular placeholder-white/40 focus:outline-none"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block garamond-300 text-[10px] tracking-[0.2em] uppercase text-white/70 mb-2">
            Correo electrónico
          </label>
          <div className="liquid-glass-light">
            <input
              type="email"
              name="email"
              required
              placeholder="tu@email.com"
              className="w-full px-4 py-3.5 bg-transparent text-white text-sm garamond-regular placeholder-white/40 focus:outline-none"
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block garamond-300 text-[10px] tracking-[0.2em] uppercase text-white/70 mb-2">
            Mensaje
          </label>
          <div className="liquid-glass-light">
            <textarea
              name="message"
              required
              rows={4}
              placeholder="Comparte tus buenos deseos y bendiciones..."
              className="w-full px-4 py-3.5 bg-transparent text-white text-sm garamond-regular placeholder-white/40 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={formStatus === 'loading'}
            className="liquid-glass-btn w-full px-6 py-3.5 text-white garamond-300 tracking-[0.15em] uppercase text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {formStatus === 'loading' ? 'Enviando...' : 'Enviar Mensaje'}
          </button>
        </div>

        {/* Status messages */}
        <div className="min-h-[32px] flex items-center justify-center">
          {formStatus === 'loading' && (
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <div className="animate-spin h-3 w-3 border border-white/40 border-t-transparent rounded-full" />
              <span className="garamond-300 tracking-wide">Enviando mensaje...</span>
            </div>
          )}

          {formStatus === 'success' && (
            <p className="garamond-300 text-xs tracking-[0.15em] text-white/60 animate-fade-in-up">
              ¡Mensaje enviado con éxito!
            </p>
          )}

          {formStatus === 'error' && (
            <p className="garamond-300 text-xs tracking-[0.15em] text-red-300/60">
              Error al enviar. Intenta de nuevo.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
