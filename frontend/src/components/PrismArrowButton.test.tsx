import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PrismArrowButton } from "./PrismArrowButton";

describe("PrismArrowButton", () => {
  it("renders with default text and arrow icon on left", () => {
    render(<PrismArrowButton />);

    const button = screen.getByRole("button", { name: "let's go!" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("Btn-Container", "prism-theme-btn", "icon-left");
    expect(button.querySelector(".icon-Container")).toBeInTheDocument();
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("renders custom text content", () => {
    render(<PrismArrowButton text="Sign In to PRISM" />);

    expect(screen.getByRole("button", { name: "Sign In to PRISM" })).toBeInTheDocument();
  });

  it("supports fullWidth prop", () => {
    render(<PrismArrowButton text="Create Account" fullWidth />);

    const button = screen.getByRole("button", { name: "Create Account" });
    expect(button).toHaveClass("full-width");
  });

  it("applies text-fading class when isFadingText is true", () => {
    render(<PrismArrowButton text="Sign In / Sign Up" isFadingText />);

    const textSpan = screen.getByText("Sign In / Sign Up");
    expect(textSpan).toHaveClass("text-fading");
  });

  it("handles click events", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<PrismArrowButton text="Click Me" onClick={handleClick} />);

    await user.click(screen.getByRole("button", { name: "Click Me" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("respects disabled state", () => {
    render(<PrismArrowButton text="Processing..." disabled />);

    const button = screen.getByRole("button", { name: "Processing..." });
    expect(button).toBeDisabled();
  });
});
