import { render, screen } from "@testing-library/react";

import { OverviewSection } from "./OverviewSection";

describe("OverviewSection", () => {
  it("renders a semantic labelled section with an optional visual slot", () => {
    render(
      <OverviewSection eyebrow="How it works" id="how-it-works" title="Five signals, one clearer start.">
        <p>Supporting narrative.</p>
      </OverviewSection>,
    );

    expect(screen.getByRole("region", { name: "Five signals, one clearer start." })).toHaveAttribute("id", "how-it-works");
    expect(screen.getByText("How it works")).toBeInTheDocument();
    expect(screen.getByText("Supporting narrative.")).toBeInTheDocument();
  });
});
