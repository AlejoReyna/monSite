"use client";

import { motion } from "framer-motion";

interface SectionHeaderProps {
  index: string;        // "01"
  tag: string;          // "ejemplo 01 / clip-path reveal"
  title: string;        // "APERTURA"
  caption: string;      // "el scroll expande lo oculto"
}

export default function SectionHeader({ index, tag, title, caption }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="v3-section-header"
      data-index={index}
    >
      <span className="v3-sh-tag">{tag}</span>
      <h2 className="v3-sh-title v3-display" style={{ margin: 0 }}>{title}</h2>
      <span className="v3-sh-num">{caption}</span>
    </motion.div>
  );
}
