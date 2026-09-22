"use client";

import { useCallback } from "react";
import { useLanguage } from "./lang-context";
import { translateText } from "@/lib/locale-copy";

export function useCopy() {
  const { language } = useLanguage();
  return useCallback((text: string) => translateText(text, language), [language]);
}
