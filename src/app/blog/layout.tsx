import type { Metadata, Viewport } from "next";
import Link from "next/link";
import BlogNavbar from "@/components/blog/blog-navbar";
import "./blog.css";

export const metadata: Metadata = {
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

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="blog">
      <BlogNavbar />
      {children}

      <footer className="blog-footer blog-shell">
        <p>© {new Date().getFullYear()} Alexis Reyna</p>
        <nav aria-label="Blog sections">
          <Link href="/">Portfolio</Link>
        </nav>
      </footer>
    </div>
  );
}
