"use client";

import "@/weddings/andrea/globals.css";
import { InlineWeddingProvider } from "@/weddings/shared/inline-context";
import { ThemeProvider } from "@/weddings/andrea/app/context/ThemeContext";
import Navbar from "@/weddings/andrea/app/components/Navbar";
import HeroSection from "@/weddings/andrea/app/components/HeroSection";
import Gallery from "@/weddings/andrea/app/components/Gallery";
import ParentsSection from "@/weddings/andrea/app/components/ParentsSection";
import ItinerarySection from "@/weddings/andrea/app/components/ItinerarySection";
import LocationSection from "@/weddings/andrea/app/components/LocationSection";
import DressCodeSection from "@/weddings/andrea/app/components/DressCodeSection";
import GiftSection from "@/weddings/andrea/app/components/GiftSection";
import RSVPSection from "@/weddings/andrea/app/components/RSVPSection";
import MinimalistFooter from "@/weddings/andrea/app/components/Footer";

export default function AndreaInlineInvitation() {
  return (
    <div className="wa-scope">
      <InlineWeddingProvider>
        <ThemeProvider>
          <Navbar />
          <HeroSection />
          <div id="galeria">
            <Gallery />
          </div>
          <ParentsSection />
          <div id="itinerario">
            <ItinerarySection />
          </div>
          <div id="ubicacion">
            <LocationSection />
          </div>
          <div id="dresscode">
            <DressCodeSection />
          </div>
          <div id="regalos">
            <GiftSection />
          </div>
          <div id="rsvp">
            <RSVPSection />
          </div>
          <div id="footer">
            <MinimalistFooter />
          </div>
        </ThemeProvider>
      </InlineWeddingProvider>
    </div>
  );
}
