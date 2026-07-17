import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App";


describe("App", () => {
  beforeEach(() => window.history.pushState({}, "", "/"));

  it("shows the subject-agnostic diagnostic start screen", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Ready to learn your way?" })).toBeInTheDocument();
    expect(screen.getByText("5-question diagnostic")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Begin diagnostic" })).toBeInTheDocument();
  });

  it("moves into the first diagnostic step when the learner begins", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: "Begin diagnostic" }));

    expect(await screen.findByText("Question 1 of 5")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue" })).toBeInTheDocument();
  });
});
