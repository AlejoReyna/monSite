import type { Metadata, Viewport } from "next";
import Image from "next/image";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Merci",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#000000" };

export default function MerciPage() {
  return (
    <div className={styles.screen}>
      <Image
        src="/haswer.gif"
        alt="Un personaje animado"
        width={480}
        height={270}
        unoptimized
        priority
        className={styles.gif}
      />
    </div>
  );
}
