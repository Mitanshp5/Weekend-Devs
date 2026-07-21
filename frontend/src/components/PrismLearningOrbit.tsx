import { motion, useReducedMotion } from "motion/react";

export type PrismOrbitState = "intro" | "ambient" | "pathSplit" | "conceptGraph" | "systemMap";

type OrbitNode = { id: string; label: string; x: number; y: number };

const orbitNodes: OrbitNode[] = [
  { id: "observe", label: "Observe", x: 24, y: 28 },
  { id: "map", label: "Map", x: 74, y: 22 },
  { id: "guide", label: "Guide", x: 80, y: 70 },
  { id: "verify", label: "Verify", x: 32, y: 76 },
];

const orbitPaths = [
  "M 58 14 C 82 14 91 35 84 53 C 77 73 47 86 25 72 C 5 59 13 29 35 19 C 42 16 50 14 58 14 Z",
  "M 23 45 C 31 12 74 8 89 34 C 102 58 73 88 40 82 C 14 77 4 58 23 45 Z",
  "M 15 53 C 21 27 50 9 76 22 C 100 34 94 68 69 81 C 41 96 8 78 15 53 Z",
];

export function PrismLearningOrbit({ state = "ambient", reducedMotion = false }: { state?: PrismOrbitState; reducedMotion?: boolean }) {
  const userReducedMotion = useReducedMotion();
  const isStatic = reducedMotion || userReducedMotion;
  const isGraph = state === "conceptGraph";
  const isSplit = state === "pathSplit";

  return (
    <div className={`prism-learning-orbit prism-learning-orbit--${state}`} data-static={isStatic ? "true" : "false"} data-testid="prism-learning-orbit">
      <svg className="prism-learning-orbit__svg" data-testid="prism-learning-orbit-svg" aria-hidden="true" viewBox="0 0 100 100" role="presentation">
        <defs>
          <filter id="prism-orbit-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <radialGradient id="prism-orbit-core"><stop stopColor="#efffc0" /><stop offset=".32" stopColor="#91ddc4" stopOpacity=".55" /><stop offset="1" stopColor="#91ddc4" stopOpacity="0" /></radialGradient>
        </defs>
        <motion.circle cx="50" cy="50" r="26" fill="url(#prism-orbit-core)" animate={isStatic ? undefined : { scale: [0.94, 1.05, 0.94], opacity: [0.65, 1, 0.65] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <g filter="url(#prism-orbit-glow)">
          {orbitPaths.map((path, index) => <motion.path key={path} d={path} fill="none" stroke={index === 1 ? "#dff28a" : "#91ddc4"} strokeWidth="0.55" strokeLinecap="round" opacity={isSplit ? 0.88 : 0.62} animate={isStatic ? undefined : { rotate: index % 2 ? 360 : -360 }} transition={{ duration: 18 + index * 4, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "50px 50px" }} />)}
          {isGraph && orbitNodes.map((node, index) => <motion.line key={`edge-${node.id}`} x1="50" y1="50" x2={node.x} y2={node.y} stroke="#91ddc4" strokeWidth="0.32" opacity=".7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.55, delay: index * 0.08 }} />)}
          {orbitNodes.map((node, index) => <motion.circle key={node.id} data-testid={`orbit-node-${node.id}`} cx={node.x} cy={node.y} r={isGraph ? "2.5" : "1.8"} fill={index === 1 ? "#dff28a" : "#91ddc4"} style={{ transformOrigin: `${node.x}px ${node.y}px` }} animate={isStatic ? undefined : { opacity: [0.55, 1, 0.55], scale: [0.85, 1.25, 0.85] }} transition={{ duration: 3.5 + index, repeat: Infinity, ease: "easeInOut" }} />)}
        </g>
      </svg>
      <div className="prism-learning-orbit__labels" aria-label="PRISM learning phases">
        {orbitNodes.map((node) => <span key={node.id} className={`prism-learning-orbit__label prism-learning-orbit__label--${node.id}`}>{node.label}</span>)}
      </div>
    </div>
  );
}
