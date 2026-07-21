import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import { OverviewNav } from "./OverviewNav";

describe("OverviewNav", () => {
  it("provides real anchor links and route CTAs", () => {
    render(
      <MemoryRouter>
        <OverviewNav onAuthClick={() => undefined} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation", { name: "Project overview" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Challenge" })).toHaveAttribute("href", "#challenge");
    expect(screen.getByRole("link", { name: "Start diagnostic" })).toHaveAttribute("href", "/diagnostic");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });
});
