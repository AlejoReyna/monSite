"use client";

import { useEffect } from "react";
import HeroV2 from "@/components/v2/hero-v2";
import ClipReveal from "@/components/v3/clip-reveal";
import KineticWords from "@/components/v3/kinetic-words";
import ParallaxDepth from "@/components/v3/parallax-depth";
import ProjectsCarousel from "@/components/v3/projects-carousel";
import RollingCounter from "@/components/v3/rolling-counter";
import MosaicWave from "@/components/v3/mosaic-wave";
import ContactEditorial from "@/components/v3/contact-editorial";

export default function V3Page() {
  // Uniform dark background for the whole v3 page
  useEffect(() => {
    const original = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#08080a";
    return () => {
      document.body.style.backgroundColor = original;
    };
  }, []);

  return (
    <div className="relative" style={{ background: "#08080a" }}>
      {/* Hero — flat dark bg, no image/texture */}
      <HeroV2 noBgImage />

      {/* Editorial dark scroll-driven sections */}
      <div className="v3-root">
        <ClipReveal />
        <KineticWords />
        <ParallaxDepth />
        <ProjectsCarousel />
        <RollingCounter />
        <MosaicWave />
        <ContactEditorial />
      </div>
    </div>
  );
}
