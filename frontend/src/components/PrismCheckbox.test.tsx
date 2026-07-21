import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PrismCheckbox } from "./PrismCheckbox";

describe("PrismCheckbox", () => {
  it("renders checkbox label and SVG element", () => {
    render(<PrismCheckbox label="Remember me" />);

    const labelText = screen.getByText("Remember me");
    expect(labelText).toBeInTheDocument();

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it("handles check state change", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<PrismCheckbox label="Accept Terms" onChange={handleChange} />);

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("reflects checked state prop", () => {
    render(<PrismCheckbox label="Subscribed" checked readOnly />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("supports disabled state", () => {
    render(<PrismCheckbox label="Option" disabled />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();
  });
});
