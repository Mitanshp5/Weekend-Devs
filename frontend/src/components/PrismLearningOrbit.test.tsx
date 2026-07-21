import { render, screen } from "@testing-library/react";

import { PrismLearningOrbit } from "./PrismLearningOrbit";

describe("PrismLearningOrbit", () => {
  it("keeps the decorative SVG hidden while exposing the current phase labels", () => {
    render(<PrismLearningOrbit state="conceptGraph" />);

    expect(screen.getByTestId("prism-learning-orbit-svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Observe")).toBeInTheDocument();
    expect(screen.getByText("Map")).toBeInTheDocument();
    expect(screen.getByText("Guide")).toBeInTheDocument();
    expect(screen.getByText("Verify")).toBeInTheDocument();
  });

  it("exposes a static state for reduced motion without changing stable node placement", () => {
    const { rerender } = render(<PrismLearningOrbit state="pathSplit" reducedMotion />);
    const firstNode = screen.getByTestId("orbit-node-observe");
    const firstPlacement = firstNode.getAttribute("style");

    expect(screen.getByTestId("prism-learning-orbit")).toHaveAttribute("data-static", "true");
    rerender(<PrismLearningOrbit state="pathSplit" reducedMotion />);
    expect(screen.getByTestId("orbit-node-observe")).toHaveAttribute("style", firstPlacement);
  });
});
