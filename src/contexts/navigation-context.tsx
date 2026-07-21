"use client";

import { createContext, useContext, ReactNode } from "react";

type Section = "home" | "inverater" | "cafeteria" | "plebes" | "nonamedbot" | "wedding" | "contact";

interface NavigationContextType {
  navigateToSection: (section: Section) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const navigateToSection = (section: Section) => {
    const el = document.getElementById(section);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    // Sin ancla en la página (p. ej. la secuencia de paneles del home):
    // delega en quien escuche el evento (hero-carousel-sequence).
    window.dispatchEvent(new CustomEvent("sequence:navigate", { detail: section }));
  };

  return (
    <NavigationContext.Provider value={{ navigateToSection }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
