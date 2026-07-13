"use client"
import LocationSection from '@/weddings/andrea/app/components/LocationSection';
import GiftSection from '@/weddings/andrea/app/components/GiftSection';
import RSVPSection from '@/weddings/andrea/app/components/RSVPSection';
import MinimalistFooter from '@/weddings/andrea/app/components/Footer';
import ItinerarySection from '@/weddings/andrea/app/components/ItinerarySection';
import Navbar from '@/weddings/andrea/app/components/Navbar';
import Gallery from '@/weddings/andrea/app/components/Gallery';
import ParentsSection from '@/weddings/andrea/app/components/ParentsSection';
import DressCodeSection from '@/weddings/andrea/app/components/DressCodeSection';
import { ThemeProvider } from '@/weddings/andrea/app/context/ThemeContext';
import HeroSection from '@/weddings/andrea/app/components/HeroSection';

export default function Home() {
  return (
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
  );
}