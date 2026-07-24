import { useEffect, useState } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";

import type { PrismOrbitState } from "../components/PrismLearningOrbit";

const sectionStates: Record<string, PrismOrbitState> = {
  challenge: "pathSplit",
  "how-it-works": "pathSplit",
  tutor: "conceptGraph",
  mastery: "conceptGraph",
  evaluators: "conceptGraph",
  architecture: "systemMap",
};

export function orbitStateForSection(id: string): PrismOrbitState {
  return sectionStates[id] ?? "ambient";
}

export function useOverviewMotion() {
  const { scrollY, scrollYProgress } = useScroll();
  const reducedMotion = useReducedMotion();
  const [orbitState, setOrbitState] = useState<PrismOrbitState>("ambient");
  const orbitScale = useTransform(scrollYProgress, [0, 0.45, 1], [1, 0.92, 0.8]);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-orbit-state]"));
    if (!sections.length) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setOrbitState(orbitStateForSection((visible.target as HTMLElement).dataset.orbitState ?? ""));
    }, { threshold: [0.3, 0.55, 0.75] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useMotionValueEvent(scrollY, "change", () => undefined);

  return { orbitScale, orbitState, reducedMotion: Boolean(reducedMotion) };
}
