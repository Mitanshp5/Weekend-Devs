import React from "react";
import { NavLink, useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { navigationItems } from "../app/navigation";

export function DashboardShell() {
  const location = useLocation();
  const outlet = useOutlet();
  const reduceMotion = useReducedMotion();

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-nav" aria-label="Primary navigation">
        <NavLink className="brand" to="/learn">PRISM</NavLink>
        <nav>
          {navigationItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              {({ isActive }) => (
                <>
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
