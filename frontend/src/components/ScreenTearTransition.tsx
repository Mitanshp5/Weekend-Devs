import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";

interface ScreenTearTransitionProps {
  originX: number;
  originY: number;
  onComplete: () => void;
}

export function ScreenTearTransition({
  originX,
  originY,
  onComplete,
}: ScreenTearTransitionProps) {
  const [cloneHtml, setCloneHtml] = useState<string>("");

  useEffect(() => {
    const rootEl = document.getElementById("root");
    if (rootEl) {
      setCloneHtml(rootEl.innerHTML);
    }
  }, []);

  const tearY = originY || window.innerHeight / 2;
  const startX = originX || 100;
  const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1200;

  // Jagged horizontal paper-tear polygon paths
  const topPolygon = `polygon(
    0 0,
    100vw 0,
    100vw ${tearY}px,
    90vw ${tearY + 8}px,
    78vw ${tearY - 10}px,
    64vw ${tearY + 12}px,
    50vw ${tearY - 8}px,
    36vw ${tearY + 10}px,
    22vw ${tearY - 12}px,
    10vw ${tearY + 6}px,
    0 ${tearY}px
  )`;

  const bottomPolygon = `polygon(
    0 ${tearY}px,
    10vw ${tearY + 6}px,
    22vw ${tearY - 12}px,
    36vw ${tearY + 10}px,
    50vw ${tearY - 8}px,
    64vw ${tearY + 12}px,
    78vw ${tearY - 10}px,
    90vw ${tearY + 8}px,
    100vw ${tearY}px,
    100vw 100vh,
    0 100vh
  )`;

  return createPortal(
    <div className="screen-tear-portal">
      {/* Dark background behind torn page halves */}
      <div className="screen-tear-bg" />

      {/* Moving Arrow Circle: Travels horizontally across full screen */}
      <motion.div
        className="screen-tear-arrow"
        style={{ top: tearY - 22 }}
        initial={{ left: startX - 22, opacity: 1, scale: 1 }}
        animate={{
          left: screenWidth + 60,
          opacity: [1, 1, 0.9, 0],
          scale: [1, 1.2, 1.1, 0.9],
        }}
        transition={{
          duration: 1.1,
          ease: [0.25, 1, 0.5, 1],
        }}
      >
        <svg width={18} height={21} viewBox="0 0 16 19" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="1.61321" cy="1.61321" r="1.5" fill="#10281e" />
          <circle cx="5.73583" cy="1.61321" r="1.5" fill="#10281e" />
          <circle cx="5.73583" cy="5.5566" r="1.5" fill="#10281e" />
          <circle cx="9.85851" cy="5.5566" r="1.5" fill="#10281e" />
          <circle cx="9.85851" cy="9.5" r="1.5" fill="#10281e" />
          <circle cx="13.9811" cy="9.5" r="1.5" fill="#10281e" />
          <circle cx="5.73583" cy="13.4434" r="1.5" fill="#10281e" />
          <circle cx="9.85851" cy="13.4434" r="1.5" fill="#10281e" />
          <circle cx="1.61321" cy="17.3868" r="1.5" fill="#10281e" />
          <circle cx="5.73583" cy="17.3868" r="1.5" fill="#10281e" />
        </svg>
      </motion.div>

      {/* Horizontal Glowing Tear Line */}
      <motion.div
        className="screen-tear-line"
        style={{ top: tearY - 2 }}
        initial={{ left: 0, width: startX, opacity: 1 }}
        animate={{
          width: [startX, screenWidth, screenWidth],
          opacity: [1, 1, 0],
        }}
        transition={{
          duration: 1.15,
          times: [0, 0.75, 1],
          ease: [0.25, 1, 0.5, 1],
        }}
      />

      {/* Top Torn Page Half (Slides Up) */}
      {cloneHtml && (
        <motion.div
          className="screen-tear-half screen-tear-half-top"
          style={{ clipPath: topPolygon }}
          initial={{ y: 0 }}
          animate={{ y: "-105%" }}
          transition={{
            duration: 0.9,
            delay: 0.45,
            ease: [0.45, 0, 0.55, 1],
          }}
          dangerouslySetInnerHTML={{ __html: cloneHtml }}
        />
      )}

      {/* Bottom Torn Page Half (Slides Down) */}
      {cloneHtml && (
        <motion.div
          className="screen-tear-half screen-tear-half-bottom"
          style={{ clipPath: bottomPolygon }}
          initial={{ y: 0 }}
          animate={{ y: "105%" }}
          transition={{
            duration: 0.9,
            delay: 0.45,
            ease: [0.45, 0, 0.55, 1],
          }}
          onAnimationComplete={onComplete}
          dangerouslySetInnerHTML={{ __html: cloneHtml }}
        />
      )}
    </div>,
    document.body
  );
}

export default ScreenTearTransition;
