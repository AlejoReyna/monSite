import { localizeMetadata } from "@/lib/request-language";
import type { Metadata } from "next";

const baseMetadata: Metadata = {
  title: "Historia del proyecto | Alexis' desktop",
  description:
    "Narrativa del desarrollo: SIASE, dashboard, Nexus y SIASE Plus — experiencia académica UANL.",
};

export default function HistoriaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

export async function generateMetadata() {
  return localizeMetadata(baseMetadata);
}
