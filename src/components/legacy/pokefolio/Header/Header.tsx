"use client"
import { useCopy } from "@/components/use-copy";
import Link from 'next/link';
import './Header.css';

export default function HeaderComponent() {
  const copyText = useCopy();
    return (
        <nav className="navbar">
            <div className="text-black text-xl background nav-grid">
                <Link href="/" className="nav-back">
                    &lt;-- <span className="nav-back-label">{copyText("Back to main")}</span>
                </Link>
                <p className="nav-text mt-2"> {copyText(" Alexis Alberto Reyna Sánchez | Software Developer ")}</p>
            </div>
        </nav>
    );
}
