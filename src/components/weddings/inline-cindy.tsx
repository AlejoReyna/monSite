"use client";

import { useMemo, useRef } from "react";
import "@/weddings/cindy/globals.css";
import { InlineWeddingProvider } from "@/weddings/shared/inline-context";
import { ThemeProvider } from "@/weddings/cindy/app/context/ThemeContext";
import Navbar from "@/weddings/cindy/app/components/Navbar";
import HeroSection from "@/weddings/cindy/app/components/HeroSection";
import Gallery3D from "@/weddings/cindy/app/components/Gallery3D";
import ParentsSection from "@/weddings/cindy/app/components/ParentsSection";
import ItinerarySection from "@/weddings/cindy/app/components/ItinerarySection";
import LocationSection from "@/weddings/cindy/app/components/LocationSection";
import DressCodeSection from "@/weddings/cindy/app/components/DressCodeSection";
import GiftEnvelopeBannerSection from "@/weddings/cindy/app/components/GiftEnvelopeBannerSection";
import HotelsSection from "@/weddings/cindy/app/components/HotelsSection";
import RSVPSection from "@/weddings/cindy/app/components/RSVPSection";
import MinimalistFooter from "@/weddings/cindy/app/components/Footer";
import { useNotchColor } from "@/weddings/cindy/hooks/useNotchColor";

export default function CindyInlineInvitation() {
  const heroRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLElement>(null);
  const parentsRef = useRef<HTMLElement>(null);
  const itineraryRef = useRef<HTMLElement>(null);
  const locationRef = useRef<HTMLElement>(null);
  const dressCodeRef = useRef<HTMLElement>(null);
  const giftRef = useRef<HTMLElement>(null);
  const hotelsRef = useRef<HTMLElement>(null);
  const rsvpRef = useRef<HTMLElement>(null);

  const notchRefs = useMemo(
    () => [
      heroRef,
      galleryRef,
      parentsRef,
      itineraryRef,
      locationRef,
      dressCodeRef,
      giftRef,
      hotelsRef,
      rsvpRef,
    ],
    []
  );
  const notchColors = useMemo(
    () => [
      "#9b9b9b",
      "#edeae4",
      "#f9f8f4",
      "#f8f6f3",
      "#f3ebe2",
      "#f3ebe2",
      "#fefefe",
      "#ffffff",
      "#7b7774",
    ],
    []
  );

  useNotchColor({
    refs: notchRefs,
    colors: notchColors,
    defaultColor: "#ffffff",
  });

  return (
    <div className="wc-scope">
      <InlineWeddingProvider>
        <ThemeProvider>
          <Navbar visible />
          <section ref={heroRef}>
            <div
              aria-hidden="true"
              className="safari-tint-sentinel"
              style={{ backgroundColor: "#9b9b9b" }}
            />
            <HeroSection entered immediate revealed />
          </section>
          <section ref={galleryRef} id="galeria">
            <div
              aria-hidden="true"
              className="safari-tint-sentinel"
              style={{ backgroundColor: "#edeae4" }}
            />
            <Gallery3D />
          </section>
          <section ref={parentsRef} id="padres">
            <div
              aria-hidden="true"
              className="safari-tint-sentinel"
              style={{ backgroundColor: "#f9f8f4" }}
            />
            <ParentsSection />
          </section>
          <section ref={itineraryRef} id="itinerario">
            <div
              aria-hidden="true"
              className="safari-tint-sentinel"
              style={{ backgroundColor: "#f8f6f3" }}
            />
            <ItinerarySection />
          </section>
          <section ref={locationRef} id="ubicacion">
            <div
              aria-hidden="true"
              className="safari-tint-sentinel"
              style={{ backgroundColor: "#f3ebe2" }}
            />
            <LocationSection />
          </section>
          <section ref={dressCodeRef} id="dresscode">
            <div
              aria-hidden="true"
              className="safari-tint-sentinel"
              style={{ backgroundColor: "#f3ebe2" }}
            />
            <DressCodeSection />
          </section>
          <section ref={giftRef} id="regalos">
            <div
              aria-hidden="true"
              className="safari-tint-sentinel"
              style={{ backgroundColor: "#fefefe" }}
            />
            <GiftEnvelopeBannerSection />
          </section>
          <section ref={hotelsRef} id="hoteles">
            <div
              aria-hidden="true"
              className="safari-tint-sentinel"
              style={{ backgroundColor: "#ffffff" }}
            />
            <HotelsSection />
          </section>
          <section ref={rsvpRef} id="rsvp">
            <div
              aria-hidden="true"
              className="safari-tint-sentinel"
              style={{ backgroundColor: "#7b7774" }}
            />
            <RSVPSection />
          </section>
          <div id="footer">
            <MinimalistFooter />
          </div>
        </ThemeProvider>
      </InlineWeddingProvider>
    </div>
  );
}
