"use client";

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

export default function CindyInlineInvitation() {
  return (
    <div className="wc-scope">
      <InlineWeddingProvider>
        <ThemeProvider>
          <Navbar visible />
          <HeroSection entered immediate revealed />
          <section id="galeria">
            <Gallery3D />
          </section>
          <section id="padres">
            <ParentsSection />
          </section>
          <section id="itinerario">
            <ItinerarySection />
          </section>
          <section id="ubicacion">
            <LocationSection />
          </section>
          <section id="dresscode">
            <DressCodeSection />
          </section>
          <section id="regalos">
            <GiftEnvelopeBannerSection />
          </section>
          <section id="hoteles">
            <HotelsSection />
          </section>
          <section id="rsvp">
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
