import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { DashboardShell } from "./DashboardShell";


describe("DashboardShell", () => {
  function renderShell() {
    render(
      <MemoryRouter initialEntries={["/learn"]}>
        <Routes>
          <Route element={<DashboardShell />}>
            <Route path="/learn" element={<p>Learning space</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
  }

  it("renders a PRISM beam behind the active navigation destination", () => {
    renderShell();

    expect(screen.getByTestId("prism-nav-beam")).toHaveAttribute("data-motion", "prism-nav-beam");
  });

  it("moves a flowing glass surface to the hovered destination", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.hover(screen.getByRole("link", { name: "Tutor" }));

    expect(screen.getByTestId("prism-nav-flow")).toHaveAttribute("data-motion", "prism-nav-flow");
  });
});
