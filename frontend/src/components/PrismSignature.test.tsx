import { render, screen } from "@testing-library/react";

import { PrismSignature } from "./PrismSignature";


describe("PrismSignature", () => {
  it("renders the branded adaptive-signal motif as decorative motion", () => {
    render(<PrismSignature />);

    expect(screen.getByTestId("prism-signature")).toHaveAttribute("data-motion", "prism-signature");
    expect(screen.getByTestId("prism-signature")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getAllByTestId("prism-orbit-path")).toHaveLength(3);
  });
});
