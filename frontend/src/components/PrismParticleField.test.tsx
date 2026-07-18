import { render, screen } from "@testing-library/react";

import { PrismParticleField } from "./PrismParticleField";


describe("PrismParticleField", () => {
  it("renders a decorative field of restrained PRISM particles", () => {
    render(<PrismParticleField />);

    expect(screen.getByTestId("prism-particle-field")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getAllByTestId("prism-particle")).toHaveLength(10);
  });
});
