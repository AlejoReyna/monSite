import { localizeMetadata } from "@/lib/request-language";
import { getCopy } from "@/lib/request-language";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import BlogNavbar from "@/components/blog/blog-navbar";
import "./blog.css";

const baseMetadata: Metadata = {
  title: {
    default: "Blog — Alexis Reyna",
    template: "%s — Alexis Reyna",
  },
  description:
    "Notes on architecture, design systems and the details that decide whether software feels solid. Plus downloadable Claude Code skills.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "/blog",
    siteName: "Alexis Reyna",
    title: "Blog — Alexis Reyna",
    description:
      "Notes on architecture, design systems and the details that decide whether software feels solid.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#111214",
};

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const copyText = await getCopy();
  return (
    <div className="blog">
      <BlogNavbar />
      {children}

      <footer className="blog-footer blog-shell">
        <p>© {new Date().getFullYear()} Alexis Reyna</p>
        <nav aria-label={copyText("Blog sections")}>
          <Link href="/">{copyText("Portfolio")}</Link>
        </nav>
      </footer>
    </div>
  );
}

export async function generateMetadata() {
  return localizeMetadata(baseMetadata);
}
