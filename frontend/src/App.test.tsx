import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App";


describe("App", () => {
  beforeEach(() => window.history.pushState({}, "", "/"));

  it("shows the subject-agnostic diagnostic start screen", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Ready to learn your way?" })).toBeVisible();
    expect(screen.getByText("5-question diagnostic")).toBeVisible();
    expect(screen.getByRole("link", { name: "Begin diagnostic" })).toBeVisible();
  });

  it("moves into the first diagnostic step when the learner begins", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: "Begin diagnostic" }));

    expect(screen.getByText("Question 1 of 5")).toBeVisible();
    expect(screen.getByRole("link", { name: "Continue" })).toBeVisible();
  });
});
