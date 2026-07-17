import { NavLink, Outlet } from "react-router-dom";

import { navigationItems } from "../app/navigation";

export function DashboardShell() {
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-nav" aria-label="Primary navigation">
        <NavLink className="brand" to="/learn">PRISM</NavLink>
        <nav>
          {navigationItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <p className="nav-footer">Prototype workspace</p>
      </aside>
      <main className="dashboard-main"><Outlet /></main>
    </div>
  );
}
