"use client"
import { useState, useLayoutEffect, useMemo, useRef } from 'react';
import LocationSection from '@/weddings/cindy/app/components/LocationSection';
// import GiftSection from '@/weddings/cindy/app/components/GiftSection'; // Hidden — merged into RSVPSection
import RSVPSection from '@/weddings/cindy/app/components/RSVPSection';
import MinimalistFooter from '@/weddings/cindy/app/components/Footer';
import ItinerarySection from '@/weddings/cindy/app/components/ItinerarySection';
import Navbar from '@/weddings/cindy/app/components/Navbar';
import Gallery3D from '@/weddings/cindy/app/components/Gallery3D';
import ParentsSection from '@/weddings/cindy/app/components/ParentsSection';
import DressCodeSection from '@/weddings/cindy/app/components/DressCodeSection';
import HotelsSection from '@/weddings/cindy/app/components/HotelsSection';
import GiftEnvelopeBannerSection from '@/weddings/cindy/app/components/GiftEnvelopeBannerSection';
import { ThemeProvider } from '@/weddings/cindy/app/context/ThemeContext';
import HeroSection from '@/weddings/cindy/app/components/HeroSection';
import SplashScreen from '@/weddings/cindy/app/components/SplashScreen';
import { useNotchColor } from '@/weddings/cindy/hooks/useNotchColor';

const SESSION_KEY = 'cj_envelope_opened';
const SPLASH_NOTCH_COLOR = '#e8dfd2';
const SPLASH_EXIT_MS = 1400;
const RESET_ENVELOPE_PARAM = 'reset-envelope';

export default function Home() {
  const [entered, setEntered] = useState(false);
  // showSplash controls whether the SplashScreen component is mounted.
  // It stays true during the exit animation so the fade-out can play.
  const [showSplash, setShowSplash] = useState(true);
  // When true, hero skips animations and shows content immediately (refresh case).
  const [immediate, setImmediate] = useState(false);
  // Navbar stays hidden until the splash finishes its exit animation.
  const [navbarReady, setNavbarReady] = useState(false);
  const splashExitTimeoutRef = useRef<number | null>(null);

  // Notch / status-bar color per section.
  const heroRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLElement>(null);
  const parentsRef = useRef<HTMLElement>(null);
  const itineraryRef = useRef<HTMLElement>(null);
  const locationRef = useRef<HTMLElement>(null);
  const dressCodeRef = useRef<HTMLElement>(null);
  const giftRef = useRef<HTMLElement>(null);
  const hotelsRef = useRef<HTMLElement>(null);
  const rsvpRef = useRef<HTMLElement>(null);

  const isAppRevealed = !showSplash;
  const notchRefs = useMemo(
    () => (
      showSplash
        ? []
        : [
            heroRef,
            galleryRef,
            parentsRef,
            itineraryRef,
            locationRef,
            dressCodeRef,
            giftRef,
            hotelsRef,
            rsvpRef,
          ]
    ),
    [showSplash],
  );
  const notchColors = useMemo(
    () => (
      showSplash
        ? []
        : [
            '#9b9b9b',
            '#edeae4',
            '#f9f8f4',
            '#f8f6f3',
            '#f3ebe2',
            '#f3ebe2',
            '#fefefe',
            '#ffffff',
            '#7b7774',
          ]
    ),
    [showSplash],
  );

  useNotchColor({
    refs: notchRefs,
    colors: notchColors,
    defaultColor: showSplash ? SPLASH_NOTCH_COLOR : '#ffffff',
  });

  // ── Scroll lock helpers ──────────────────────────────────────────────────
  // `overflow: hidden` alone doesn't block scroll on iOS Safari.
  // Fixing the body at its current top position is the only reliable approach.
  const lockScroll = () => {
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
  };

  const unlockScroll = () => {
    const top = document.body.style.top;
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, parseInt(top || '0') * -1);
  };

  // useLayoutEffect runs BEFORE the browser paints, so on refresh the splash
  // is removed and hero shows instantly — no flash.
  useLayoutEffect(() => {
    const url = new URL(window.location.href);
    const shouldResetEnvelope = url.searchParams.get(RESET_ENVELOPE_PARAM) === '1';

    if (shouldResetEnvelope) {
      sessionStorage.removeItem(SESSION_KEY);
      url.searchParams.delete(RESET_ENVELOPE_PARAM);
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }

    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      window.scrollTo(0, 0);
      unlockScroll();
      setEntered(true);
      setShowSplash(false);
      setImmediate(true);
      setNavbarReady(true);
    } else {
      lockScroll();
    }
    return () => {
      if (splashExitTimeoutRef.current !== null) {
        window.clearTimeout(splashExitTimeoutRef.current);
      }
      unlockScroll();
    };
  }, []);

  const handleEnter = () => {
    sessionStorage.setItem(SESSION_KEY, 'true');
    if (splashExitTimeoutRef.current !== null) {
      window.clearTimeout(splashExitTimeoutRef.current);
    }

    // Keep the app hidden until the envelope exit finishes, so the hero
    // starts rendering only once the splash has fully owned the first paint.
    splashExitTimeoutRef.current = window.setTimeout(() => {
      unlockScroll();
      setEntered(true);
      setShowSplash(false);
      setNavbarReady(true);
      splashExitTimeoutRef.current = null;
    }, SPLASH_EXIT_MS);
  };

  return (
    <ThemeProvider>
      {showSplash && <SplashScreen onEnter={handleEnter} />}
      <div
        className={`app-shell${isAppRevealed ? ' app-shell--visible' : ''}`}
        aria-hidden={!isAppRevealed}
      >
        <Navbar visible={isAppRevealed && navbarReady} />
        <section ref={heroRef}>
          <div
            aria-hidden="true"
            className="safari-tint-sentinel"
            style={{ backgroundColor: '#9b9b9b' }}
          />
          <HeroSection entered={entered} immediate={immediate} revealed={isAppRevealed} />
        </section>


        <section ref={galleryRef} id="galeria">
          <div
            aria-hidden="true"
            className="safari-tint-sentinel"
            style={{ backgroundColor: '#edeae4' }}
          />
          <Gallery3D />
        </section>
        <section ref={parentsRef} id="padres">
          <div
            aria-hidden="true"
            className="safari-tint-sentinel"
            style={{ backgroundColor: '#f9f8f4' }}
          />
          <ParentsSection />
        </section>
        <section ref={itineraryRef} id="itinerario">
          <div
            aria-hidden="true"
            className="safari-tint-sentinel"
            style={{ backgroundColor: '#f8f6f3' }}
          />
          <ItinerarySection />
        </section>
        <section ref={locationRef} id="ubicacion">
          <div
            aria-hidden="true"
            className="safari-tint-sentinel"
            style={{ backgroundColor: '#f3ebe2' }}
          />
          <LocationSection />
        </section>

        <section ref={dressCodeRef} id="dresscode">
          <div
            aria-hidden="true"
            className="safari-tint-sentinel"
            style={{ backgroundColor: '#f3ebe2' }}
          />
          <DressCodeSection />
        </section>
        <section ref={giftRef} id="regalos">
          <div
            aria-hidden="true"
            className="safari-tint-sentinel"
            style={{ backgroundColor: '#fefefe' }}
          />
          <GiftEnvelopeBannerSection />
        </section>
        <section ref={hotelsRef} id="hoteles">
          <div
            aria-hidden="true"
            className="safari-tint-sentinel"
            style={{ backgroundColor: '#ffffff' }}
          />
          <HotelsSection />
        </section>
        <section ref={rsvpRef} id="rsvp">
          <div
            aria-hidden="true"
            className="safari-tint-sentinel"
            style={{ backgroundColor: '#7b7774' }}
          />
          <RSVPSection />
        </section>
        <div id="footer">
          <MinimalistFooter />
        </div>
      </div>
      <style jsx>{`
        .app-shell {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }

        .app-shell--visible {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
      `}</style>
    </ThemeProvider>
  );
}
