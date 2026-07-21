import { render, screen } from "@testing-library/react";

import { ScreenTearTransition } from "./ScreenTearTransition";

describe("ScreenTearTransition", () => {
  it("uses a lightweight transform-only route curtain instead of cloning the current page", () => {
    render(<ScreenTearTransition originX={120} originY={240} onComplete={() => undefined} />);

    expect(screen.getByTestId("route-transition-curtain")).toBeInTheDocument();
    expect(screen.queryByTestId("route-transition-page-clone")).not.toBeInTheDocument();
  });
});
