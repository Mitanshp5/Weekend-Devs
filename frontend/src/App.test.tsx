import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App";

describe("App", () => {
  beforeEach(() => window.history.pushState({}, "", "/"));

  it("shows PRISM's cinematic overview with honest product direction", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Every learner needs a different next step." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start the 5-question diagnostic" })).toHaveAttribute("href", "/diagnostic");
    expect(screen.getByRole("navigation", { name: "Project overview" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "One grade. Many starting points." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Answer the concept beneath the question." })).toBeInTheDocument();
    expect(screen.getByText("Related weak area")).toHaveClass("concept-map__node--related");
    expect(screen.getByText("Next check")).toHaveClass("concept-map__node--next");
    expect(screen.getByText(/Hackathon prototype/)).toBeInTheDocument();
  });

  it("moves to the diagnostic workspace when the learner starts", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: "Start the 5-question diagnostic" }));

    expect(await screen.findByRole("heading", { name: "Integer Operations (Signed Numbers)" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Diagnostic step 1 of 5" })).toBeInTheDocument();
  });
});
