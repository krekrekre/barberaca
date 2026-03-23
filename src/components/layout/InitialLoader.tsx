"use client";

import { useEffect, useState } from "react";
import styles from "./InitialLoader.module.css";

/** Minimum time the splash is visible, then short fade (masks hero / layout flash on first paint). */
const MIN_VISIBLE_MS = 200;
const FADE_MS = 280;

export default function InitialLoader() {
  const [phase, setPhase] = useState<"show" | "fade" | "gone">("show");

  useEffect(() => {
    const tFade = window.setTimeout(() => setPhase("fade"), MIN_VISIBLE_MS);
    const tGone = window.setTimeout(
      () => setPhase("gone"),
      MIN_VISIBLE_MS + FADE_MS,
    );
    return () => {
      window.clearTimeout(tFade);
      window.clearTimeout(tGone);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      className={`${styles.overlay} ${phase === "show" ? styles.overlayShow : styles.overlayHide}`}
      aria-hidden
    >
      <div className={styles.spinner} />
    </div>
  );
}
