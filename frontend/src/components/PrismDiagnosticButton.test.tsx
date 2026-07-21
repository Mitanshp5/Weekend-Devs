import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { PrismDiagnosticButton } from "./PrismDiagnosticButton";

describe("PrismDiagnosticButton", () => {
  it("renders with default text and btn-17 class", () => {
    render(
      <BrowserRouter>
        <PrismDiagnosticButton to="/diagnostic" />
      </BrowserRouter>
    );

    const button = screen.getByRole("link", { name: "Start diagnostic" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("btn-17");
    expect(button.querySelector(".text-container")).toBeInTheDocument();
  });

  it("renders as button element when 'to' prop is not provided", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<PrismDiagnosticButton text="Click Me" onClick={handleClick} />);

    const button = screen.getByRole("button", { name: "Click Me" });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
