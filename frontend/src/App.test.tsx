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
    expect(screen.getByText(/Hackathon prototype/)).toBeInTheDocument();
  });

  it("moves to the evidence intake view when the learner starts", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: "Start the 5-question diagnostic" }));

    expect(await screen.findByRole("heading", { name: "Start with evidence, not a label." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore curriculum atlas" })).toBeInTheDocument();
  });
});
