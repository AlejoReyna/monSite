"use client"
import { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownTimerProps {
  targetDate: string; // Formato: "2024-06-19T00:00:00"
  className?: string;
}

export default function CountdownTimer({ targetDate, className = "" }: CountdownTimerProps) {
  // Este es nuestro "estado" - como una pizarra donde escribimos el tiempo restante
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // useEffect es como nuestro "supervisor automático"
  // Se ejecuta cuando el componente se monta y configura nuestro "reloj"
  useEffect(() => {
    // Esta función es como nuestro "calculador de tiempo"
    // Toma dos fechas y nos dice cuánto tiempo falta entre ellas
    const calculateTimeLeft = (): TimeLeft => {
      // Fecha objetivo - convertimos el texto en una fecha que JavaScript entiende
      const targetTime = new Date(targetDate).getTime();
      // Fecha actual - "ahora mismo"
      const now = new Date().getTime();
      // La diferencia nos da los milisegundos que faltan
      const difference = targetTime - now;

      let timeLeft: TimeLeft = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
      };

      // Solo calculamos si aún falta tiempo (no queremos números negativos)
      if (difference > 0) {
        // Aquí hacemos la "conversión matemática":
        // - 1 día = 24 horas = 24 * 60 * 60 * 1000 milisegundos
        // - 1 hora = 60 minutos = 60 * 60 * 1000 milisegundos
        // - etc.
        timeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        };
      }

      return timeLeft;
    };

    // Primero calculamos el tiempo inmediatamente
    setTimeLeft(calculateTimeLeft());

    // Luego configuramos un "temporizador" que actualiza cada segundo
    // Es como decirle a JavaScript: "cada 1000 milisegundos (1 segundo), 
    // ejecuta esta función"
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Esta función de "limpieza" es importante:
    // cuando el componente se desmonta, limpiamos el temporizador
    // para evitar que siga ejecutándose en segundo plano
    return () => clearInterval(timer);
  }, [targetDate]); // Se ejecuta nuevamente si cambia la fecha objetivo

  // Esta función nos ayuda a mostrar números con formato consistente
  // Por ejemplo: convierte "5" en "05" para que se vea más elegante
  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0');
  };

  return (
    <div className={`countdown-timer ${className}`}>
      {/* Contenedor principal con diseño elegante */}
      <div className="flex flex-col items-center justify-center text-center">
        
       

        {/* Los números del countdown - ACTUALIZADO con garamond-300 para armonía tipográfica */}
        <div className="flex flex-nowrap justify-center gap-2 md:gap-8">
          
          {/* Días */}
          <div className="flex flex-col items-center">
            <div className="bg-white/10 backdrop-blur-sm  p-2 md:p-4 min-w-[60px] md:min-w-[90px] text-center">
              <div className="text-2xl md:text-4xl font-light text-white tracking-wide garamond-300">
                {formatNumber(timeLeft.days)}
              </div>
              <div className="text-xs md:text-sm text-white/70 mt-1 uppercase tracking-wider garamond-300">
                Días
              </div>
            </div>
          </div>

          {/* Horas */}
          <div className="flex flex-col items-center">
            <div className="bg-white/10 backdrop-blur-sm  p-2 md:p-4 min-w-[60px] md:min-w-[90px] text-center">
              <div className="text-2xl md:text-4xl font-light text-white tracking-wide garamond-300">
                {formatNumber(timeLeft.hours)}
              </div>
              <div className="text-xs md:text-sm text-white/70 mt-1 uppercase tracking-wider garamond-300">
                Horas
              </div>
            </div>
          </div>

          {/* Minutos */}
          <div className="flex flex-col items-center">
            <div className="bg-white/10 backdrop-blur-sm  p-2 md:p-4 min-w-[60px] md:min-w-[90px] text-center">
              <div className="text-2xl md:text-4xl font-light text-white tracking-wide garamond-300">
                {formatNumber(timeLeft.minutes)}
              </div>
              <div className="text-xs md:text-sm text-white/70 mt-1 uppercase tracking-wider garamond-300">
                Minutos
              </div>
            </div>
          </div>

          {/* Segundos */}
          <div className="flex flex-col items-center">
            <div className="bg-white/10 backdrop-blur-sm  p-2 md:p-4 min-w-[60px] md:min-w-[90px] text-center">
              <div className="text-2xl md:text-4xl font-light text-white tracking-wide garamond-300">
                {formatNumber(timeLeft.seconds)}
              </div>
              <div className="text-xs md:text-sm text-white/70 mt-1 uppercase tracking-wider garamond-300">
                Segundos
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}