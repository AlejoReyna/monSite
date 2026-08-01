"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface SanicEasterEggWrapperProps {
  children: React.ReactNode;
}

export default function SanicEasterEggWrapper({
  children,
}: SanicEasterEggWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDashing, setIsDashing] = useState(false);
  const [showSpeech, setShowSpeech] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
            setShowSpeech(false);
          }
        });
      },
      {
        threshold: 0.3,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleClick = () => {
    setShowSpeech(true);
    setIsDashing(true);
    setTimeout(() => {
      setIsDashing(false);
    }, 1200);
  };

  return (
    <div ref={containerRef} className="sanic-code-wrapper">
      <div
        className={`sanic-peeker ${isVisible ? "is-visible" : ""} ${
          isDashing ? "is-dashing" : ""
        }`}
        onClick={handleClick}
        onMouseEnter={() => setShowSpeech(true)}
        onMouseLeave={() => !isDashing && setShowSpeech(false)}
        title="Gotta go fast!"
      >
        {showSpeech && (
          <div className="sanic-speech-bubble">
            <span>GOTTA GO FAST!</span>
          </div>
        )}
        <Image
          src="/sanic.png"
          alt="Sanic Easter Egg"
          className="sanic-img"
          width={591}
          height={531}
          loading="lazy"
          unoptimized
        />
      </div>

      <div className="sanic-code-inner">{children}</div>
    </div>
  );
}
