import { render, screen } from "@testing-library/react";

import { PageTransition } from "./PageTransition";


describe("PageTransition", () => {
  it("marks the animated page container", () => {
    render(<PageTransition><p>Screen content</p></PageTransition>);

    expect(screen.getByText("Screen content").parentElement).toHaveAttribute(
      "data-motion",
      "page-transition",
    );
  });
});
