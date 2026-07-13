"use client"
import { useState } from 'react';
import { FaHeart } from 'react-icons/fa';

// Web3Forms configuration
const WEB3FORMS_ACCESS_KEY = '9e04209b-b0b4-4883-82ab-a4f939af7198';

// Componente MessageSection con funcionalidad Web3Forms y estética RSVP
export default function MessageSection({ className }: { className?: string }) {
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  console.log('🎯 MessageSection rendered. Current formStatus:', formStatus);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('🔥 FORM SUBMITTED - Starting submission process');
    
    setFormStatus('loading');
    
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      
      // Log form data for debugging
      console.log('📝 Form data being sent:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
      }
      
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      console.log('📬 Web3Forms response:', result);
      
      if (result.success) {
        console.log('✅ Message sent successfully!');
        setFormStatus('success');
        
        // Reset form
        form.reset();
        
        // Reset status after 5 seconds
        setTimeout(() => {
          console.log('🔄 Resetting status to idle');
          setFormStatus('idle');
        }, 5000);
      } else {
        console.error('❌ Web3Forms error:', result.message);
        setFormStatus('error');
        
        // Reset to idle after 5 seconds
        setTimeout(() => {
          setFormStatus('idle');
        }, 5000);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      setFormStatus('error');
      
      // Reset to idle after 5 seconds
      setTimeout(() => {
        setFormStatus('idle');
      }, 5000);
    }
  };

  return (
    <div className={`mx-8 md:mx-0 bg-white/10 backdrop-blur-md border border-white/20 shadow-elegant hover:shadow-elegant-hover hover:border-white/40 transition-all duration-700 transform hover:-translate-y-2 ${className}`}>
      
      {/* Content Section */}
      <div className="p-8 md:p-10 relative">
        
        {/* Title */}
        <h3 className="text-2xl md:text-3xl font-light text-white mb-6 tracking-wide text-center garamond-300">
          MENSAJE
        </h3>
        
        {/* Subtitle */}
        <p className="text-white/80 text-sm font-light tracking-[0.15em] uppercase mb-6 text-center garamond-300">
          Comparte tus 
          <br />
          buenos deseos
        </p>
        
        
        
        {/* Web3Forms Form */}
        <form 
          action="https://api.web3forms.com/submit" 
          method="POST"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Web3Forms required hidden fields */}
          <input type="hidden" name="access_key" value={WEB3FORMS_ACCESS_KEY} />
          <input type="hidden" name="subject" value="Nuevo mensaje de invitación de boda" />
          <input type="hidden" name="from_name" value="Invitación de Boda" />
          
          <div>
            <label className="block text-xs font-light text-white/80 mb-2 tracking-[0.1em] uppercase garamond-300">
              Nombre
            </label>
            <input 
              type="text" 
              name="name"
              required
              placeholder="Tu nombre completo"
              className="w-full p-3 border border-white/30 bg-white/10 backdrop-blur-sm focus:outline-none focus:border-white/50 transition-all duration-300 text-white placeholder-white/50"
            />
          </div>
          
          <div>
            <label className="block text-xs font-light text-white/80 mb-2 tracking-[0.1em] uppercase garamond-300">
              Correo electrónico
            </label>
            <input 
              type="email" 
              name="email"
              required
              placeholder="tu@email.com"
              className="w-full p-3 border border-white/30 bg-white/10 backdrop-blur-sm focus:outline-none focus:border-white/50 transition-all duration-300 text-white placeholder-white/50"
            />
          </div>
          
          <div>
            <label className="block text-xs font-light text-white/80 mb-2 tracking-[0.1em] uppercase garamond-300">
              Mensaje
            </label>
            <textarea 
              name="message"
              required
              rows={4}
              placeholder="Comparte tus buenos deseos y bendiciones para nuestra nueva vida juntos..."
              className="w-full p-3 border border-white/30 bg-white/10 backdrop-blur-sm focus:outline-none focus:border-white/50 transition-all duration-300 resize-none text-white placeholder-white/50"
            />
          </div>
          
          {/* Submit Button */}
          <div className="pt-2">
            <button 
              type="submit"
              disabled={formStatus === 'loading'}
              className="group/btn inline-flex items-center gap-3 px-6 py-3 border border-white/30 hover:border-white/50 text-white hover:text-white transition-all duration-400 relative overflow-hidden w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-white/10 transform -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-400"></div>
              <span className="font-light tracking-[0.1em] uppercase text-xs relative z-10">
                {formStatus === 'loading' ? 'Enviando...' : 'Enviar Mensaje'}
              </span>
            </button>
          </div>

          {/* Status Messages */}
          <div className="min-h-[40px] flex items-center justify-center pt-2">
            {formStatus === 'loading' && (
              <div className="flex items-center justify-center gap-2 text-white/90 text-sm">
                <div className="animate-spin h-3 w-3 border border-white/60 border-t-transparent rounded-full"></div>
                <span className="garamond-300">Enviando mensaje...</span>
              </div>
            )}
            
            {formStatus === 'success' && (
              <div className="flex items-center justify-center gap-2 text-green-300 bg-green-500/20 px-4 py-2 rounded-full text-sm animate-pulse border border-green-400/30">
                <FaHeart className="text-sm animate-bounce" />
                <span className="garamond-300">¡Mensaje enviado!</span>
              </div>
            )}
            
            {formStatus === 'error' && (
              <div className="flex items-center justify-center gap-2 text-red-300 bg-red-500/20 px-4 py-2 rounded-full text-sm border border-red-400/30">
                <span className="garamond-300">❌ Error al enviar</span>
              </div>
            )}
          </div>
        </form>
      </div>

      <style jsx>{`
        .shadow-elegant {
          box-shadow: 
            0 4px 6px -1px rgba(0, 0, 0, 0.3),
            0 20px 25px -5px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        }
        
        .shadow-elegant-hover {
          box-shadow: 
            0 10px 15px -3px rgba(0, 0, 0, 0.4),
            0 25px 50px -12px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}