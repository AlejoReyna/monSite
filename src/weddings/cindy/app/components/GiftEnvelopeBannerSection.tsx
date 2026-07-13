"use client"
import { useEffect, useRef, useState } from 'react';

export default function GiftEnvelopeBannerSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '-20px' }
    );

    const el = sectionRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`gift-envelope-section${isVisible ? ' gift-envelope-section--visible' : ''}`}
    >
      <div className="gift-envelope-section__inner">
        <p className="gift-envelope-section__eyebrow">Mesa de regalos</p>
        <p className="gift-envelope-section__presence">
          <span>Su compañía es lo más valioso para nosotros</span>
        </p>
        <p className="gift-envelope-section__text">
          Si desean tener un detalle adicional, será sinceramente agradecido.
        </p>
        <span className="gift-envelope-section__line" />
        <div className="gift-envelope-section__options">
          {/* ── Left: envelope ── */}
          <div className="gift-envelope-section__left">
            <div className="gift-envelope-section__seal" aria-hidden="true">
              <svg viewBox="0 0 72 56" fill="none">
                <rect x="1.5" y="1.5" width="69" height="53" rx="3" stroke="currentColor" strokeWidth="1.2" />
                <path d="M2 3 L36 30 L70 3" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </div>
            <p className="gift-envelope-section__seal-label">Sobre en mano</p>
          </div>


          {/* ── Right: bank card ── */}
          <div className="gift-envelope-section__right">
            <div className="gift-envelope-section__bank-card">
              <p className="gift-envelope-section__bank-title">Transferencia bancaria</p>
              <div className="gift-envelope-section__bank-row">
                <span>Banco</span>
                <strong>BBVA</strong>
              </div>
              <div className="gift-envelope-section__bank-row">
                <span>CLABE</span>
                <strong>0125 8001 5127 6602 40</strong>
              </div>
              <div className="gift-envelope-section__bank-row">
                <span>Tarjeta</span>
                <strong>4152 3141 2145 2463</strong>
              </div>
              <div className="gift-envelope-section__bank-row">
                <span>Titular</span>
                <strong>Cindy Janeth Medina Sanchez</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .gift-envelope-section {
          width: 100%;
          min-height: 100vh;
          min-height: 100svh;
          padding: 5rem 1.5rem;
          background: linear-gradient(135deg, #fbf9f6 0%, #f8f6f3 35%, #f5f2ee 70%, #f9f7f4 100%);
          border-top: 1px solid rgba(196, 152, 91, 0.2);
          border-bottom: 1px solid rgba(196, 152, 91, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: translateY(14px);
        }

        .gift-envelope-section--visible {
          animation: giftEnvelopeIn 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        .gift-envelope-section__inner {
          width: min(100%, 68rem);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.6rem;
        }

        .gift-envelope-section__eyebrow {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: 1.47rem;
          letter-spacing: 0.45em;
          text-transform: uppercase;
          color: rgba(139, 115, 85, 0.68);
          margin: 0;
        }

        .gift-envelope-section__presence {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-size: 1.3rem;
          line-height: 1.1;
          letter-spacing: 0.03em;
          color: #5a4631;
          margin: 0;
          max-width: 24rem;
        }

        .gift-envelope-section__presence span {
          display: block;
          white-space: normal;
        }

        .gift-envelope-section__text {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: 1.15rem;
          line-height: 1.8;
          color: rgba(92, 73, 50, 0.80);
          margin: 0;
          max-width: 38rem;
        }

        .gift-envelope-section__line {
          display: block;
          width: 3.3rem;
          height: 1px;
          margin-top: 0.2rem;
          background: linear-gradient(90deg, rgba(196, 152, 91, 0.45), rgba(139, 90, 43, 0.28));
        }

        /* ── Options: vertical en mobile, 50/50 en desktop ── */
        .gift-envelope-section__options {
          width: 100%;
          display: flex;
          flex-direction: column;
          margin-top: 0.5rem;
          border: 1px solid rgba(196, 152, 91, 0.16);
          border-radius: 6px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.55);
        }

        @media (min-width: 768px) {
          .gift-envelope-section__options {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr;
          }
        }

        /* ── Left panel ── */
        .gift-envelope-section__left {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.25rem;
          padding: 2.5rem 2rem;
          background: rgba(255, 255, 255, 0.30);
          border-bottom: 1px solid rgba(196, 152, 91, 0.18);
        }

        @media (min-width: 768px) {
          .gift-envelope-section__left {
            border-bottom: none;
            border-right: 1px solid rgba(196, 152, 91, 0.18);
            padding: 3.5rem 3rem;
          }
        }

        .gift-envelope-section__seal {
          color: rgba(139, 115, 85, 0.50);
          width: 7rem;
          height: auto;
        }

        .gift-envelope-section__seal svg {
          width: 100%;
          height: 100%;
        }

        .gift-envelope-section__seal-label {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: 10px;
          letter-spacing: 0.40em;
          text-transform: uppercase;
          color: rgba(139, 115, 85, 0.55);
          margin: 0;
        }

        /* ── Right panel ── */
        .gift-envelope-section__right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 2rem;
        }

        .gift-envelope-section__bank-card {
          width: 100%;
          text-align: left;
        }

        .gift-envelope-section__bank-title {
          margin: 0 0 1rem 0;
          text-align: center;
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-size: 1.4rem;
          letter-spacing: 0.06em;
          color: #5a4631;
        }

        .gift-envelope-section__bank-row {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(196, 152, 91, 0.12);
        }

        .gift-envelope-section__bank-row:last-child {
          border-bottom: none;
        }

        .gift-envelope-section__bank-row span {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: 10.5px;
          letter-spacing: 0.30em;
          text-transform: uppercase;
          color: rgba(139, 115, 85, 0.70);
          flex-shrink: 0;
        }

        .gift-envelope-section__bank-row strong {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 500;
          font-size: 1.15rem;
          letter-spacing: 0.03em;
          color: #3d2a14;
          text-align: right;
        }

        @media (min-width: 640px) {
          .gift-envelope-section__eyebrow {
            font-size: 2.24rem;
          }
          .gift-envelope-section__presence {
            font-size: 1.43rem;
            max-width: 32rem;
          }
          .gift-envelope-section__presence span {
            white-space: nowrap;
          }
          .gift-envelope-section__text {
            font-size: 1.2rem;
          }
          .gift-envelope-section__bank-title {
            font-size: 1.5rem;
          }
          .gift-envelope-section__bank-row strong {
            font-size: 1.2rem;
          }
        }

        @media (min-width: 768px) {
          .gift-envelope-section {
            padding: 6rem 3rem;
          }

          .gift-envelope-section__inner {
            gap: 2rem;
          }

          .gift-envelope-section__eyebrow {
            font-size: 2.66rem;
          }
          .gift-envelope-section__presence {
            font-size: 1.56rem;
            max-width: 38rem;
          }

          .gift-envelope-section__text {
            font-size: 1.25rem;
          }

          .gift-envelope-section__left {
            padding: 3.5rem 3rem;
          }

          .gift-envelope-section__seal {
            width: 9rem;
          }

          .gift-envelope-section__right {
            padding: 3.5rem 3rem;
          }

          .gift-envelope-section__bank-title {
            font-size: 1.55rem;
            margin-bottom: 1.25rem;
          }

          .gift-envelope-section__bank-row {
            padding: 1.1rem 0;
          }

          .gift-envelope-section__bank-row strong {
            font-size: 1.25rem;
          }
        }

        @media (min-width: 1024px) {
          .gift-envelope-section__eyebrow {
            font-size: 3.08rem;
          }
          .gift-envelope-section__presence {
            font-size: 1.69rem;
            max-width: 44rem;
          }

          .gift-envelope-section__seal {
            width: 10rem;
          }

          .gift-envelope-section__left,
          .gift-envelope-section__right {
            padding: 4rem 4rem;
          }

          .gift-envelope-section__bank-title {
            font-size: 1.65rem;
          }

          .gift-envelope-section__bank-row strong {
            font-size: 1.35rem;
          }
        }

        @keyframes giftEnvelopeIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
