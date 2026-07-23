import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App";


describe("App", () => {
  beforeEach(() => window.history.pushState({}, "", "/"));

  it("shows PRISM's evidence-first learning entry", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Make the next step clear." })).toBeInTheDocument();
    expect(screen.getByText(/Begin with a short check-in/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Student working at a desk inside layers of translucent prism light" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start diagnostic" })).toBeInTheDocument();
  });

  it("moves to the diagnostic workspace when the learner starts", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: "Start diagnostic" }));

    expect(await screen.findByRole("heading", { name: "Integer Operations (Signed Numbers)" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Diagnostic step 1 of 5" })).toBeInTheDocument();
  });
});
