import React, { useState } from "react";
import { NavLink, useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { navigationItems } from "../app/navigation";

export function DashboardShell() {
  const location = useLocation();
  const outlet = useOutlet();
  const reduceMotion = useReducedMotion();
  const [hoveredDestination, setHoveredDestination] = useState<string | null>(null);

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-nav" aria-label="Primary navigation">
        <NavLink className="brand" to="/learn">PRISM</NavLink>
        <nav>
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              style={({ isActive }) => ({ color: isActive ? "#f7fff5" : "#c5ded1" })}
              onMouseEnter={() => setHoveredDestination(item.to)}
              onMouseLeave={() => setHoveredDestination(null)}
              onFocus={() => setHoveredDestination(item.to)}
              onBlur={() => setHoveredDestination(null)}
            >
              {({ isActive }) => (
                <>
                  {hoveredDestination === item.to && (
                    <motion.span
                      aria-hidden="true"
                      className="prism-nav-flow"
                      data-motion="prism-nav-flow"
                      data-testid="prism-nav-flow"
                      initial={false}
                      layoutId="prism-flowing-navigation"
                      transition={reduceMotion ? { duration: 0.01 } : { type: "spring", stiffness: 360, damping: 30, mass: 0.7 }}
                    />
                  )}
                  {isActive && (
                    <motion.span
                      aria-hidden="true"
                      className="prism-nav-beam"
                      data-motion="prism-nav-beam"
                      data-testid="prism-nav-beam"
                      initial={false}
                      layoutId="prism-active-navigation"
                      transition={reduceMotion ? { duration: 0.01 } : { type: "spring", stiffness: 460, damping: 34 }}
                    />
                  )}
                  <span className="nav-link-label">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <p className="nav-footer">Prototype workspace</p>
      </aside>
      <main className="dashboard-main">
        <AnimatePresence mode="wait">
          {outlet && React.cloneElement(outlet as React.ReactElement, { key: location.pathname })}
        </AnimatePresence>
      </main>
    </div>
  );
}
