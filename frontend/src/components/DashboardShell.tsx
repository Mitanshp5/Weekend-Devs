import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate, useOutlet } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { navigationItems } from "../app/navigation";

export function DashboardShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const outlet = useOutlet();
  const reduceMotion = useReducedMotion();
  const [hoveredDestination, setHoveredDestination] = useState<string | null>(null);
  const [user, setUser] = useState<{ username?: string; email?: string; role?: string } | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage && typeof window.localStorage.getItem === "function") {
        const stored = window.localStorage.getItem("prism_user");
        if (stored) {
          setUser(JSON.parse(stored));
          return;
        }
      }
    } catch (e) {
      // Fallback on storage error
    }
    setUser({ username: "Demo User" });
  }, [location.pathname]);

  const handleLogout = () => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem("prism_token");
        window.localStorage.removeItem("prism_user");
      }
    } catch (e) {
      // Ignore
    }
    navigate("/auth");
  };

  const handleSwitchRole = () => {
    navigate("/onboarding");
  };

  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";

  // Filter navigation items strictly based on active user role:
  // Teacher -> Teacher view ONLY
  // Student -> Student pages ONLY (Learn, Tutor, Progress)
  // Default/Unassigned -> All navigation items
  const visibleNavItems = navigationItems.filter((item) => {
    if (isTeacher) {
      return item.to === "/teacher";
    }
    if (isStudent) {
      return item.to !== "/teacher";
    }
    return true;
  });

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-nav" aria-label="Primary navigation">
        <NavLink className="brand" to={isTeacher ? "/teacher" : "/learn"}>PRISM</NavLink>
        <nav>
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
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
                      transition={
                        reduceMotion
                          ? { duration: 0.01 }
                          : { type: "spring", stiffness: 360, damping: 30, mass: 0.7 }
                      }
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
                      transition={
                        reduceMotion ? { duration: 0.01 } : { type: "spring", stiffness: 460, damping: 34 }
                      }
                    />
                  )}
                  <span className="nav-link-label">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Session Badge & Role Switcher */}
        <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid rgba(145, 221, 196, 0.15)" }}>
          {user && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f4f7ef" }}>
                  {user.username || user.email?.split("@")[0] || "User"}
                </span>
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "2px 6px",
                    borderRadius: "999px",
                    background: user.role === "teacher" ? "rgba(223, 242, 138, 0.2)" : "rgba(159, 201, 230, 0.2)",
                    color: user.role === "teacher" ? "#dff28a" : "#9fc9e6",
                    border: "1px solid rgba(145, 221, 196, 0.3)",
                  }}
                >
                  {user.role || "student"}
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={handleSwitchRole}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#91ddc4",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: 0,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#dff28a")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#91ddc4")}
                >
                  Switch role
                </button>
                <span style={{ color: "#587064", fontSize: "0.75rem" }}>•</span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#587064",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: 0,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#dff28a")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#587064")}
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
          <p className="nav-footer" style={{ marginTop: "0.5rem", fontSize: "0.7rem", color: "#587064" }}>
            Prototype workspace
          </p>
        </div>
      </aside>

      <main className="dashboard-main">
        <AnimatePresence mode="wait">
          {outlet && React.cloneElement(outlet as React.ReactElement, { key: location.pathname })}
        </AnimatePresence>
      </main>
    </div>
  );
}
