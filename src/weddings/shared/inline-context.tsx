"use client";

import { createContext, useContext, type ReactNode } from "react";

const InlineWeddingContext = createContext(false);

export function InlineWeddingProvider({ children }: { children: ReactNode }) {
  return (
    <InlineWeddingContext.Provider value={true}>
      {children}
    </InlineWeddingContext.Provider>
  );
}

export function useInlineWedding() {
  return useContext(InlineWeddingContext);
}
