"use client"
import Link from 'next/link';
import './Header.css';

export default function HeaderComponent() {
    return (
        <nav className="navbar">
            <div className="text-black text-xl background nav-grid">
                <Link href="/" className="nav-back">
                    &lt;-- <span className="nav-back-label">Back to main</span>
                </Link>
                <p className="nav-text mt-2"> Alexis Alberto Reyna Sánchez | Software Developer </p>
            </div>
        </nav>
    );
}
