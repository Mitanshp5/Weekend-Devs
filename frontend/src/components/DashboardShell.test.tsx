import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { DashboardShell } from "./DashboardShell";


describe("DashboardShell", () => {
  it("renders a PRISM beam behind the active navigation destination", () => {
    render(
      <MemoryRouter initialEntries={["/learn"]}>
        <Routes>
          <Route element={<DashboardShell />}>
            <Route path="/learn" element={<p>Learning space</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("prism-nav-beam")).toHaveAttribute("data-motion", "prism-nav-beam");
  });
});
