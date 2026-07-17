import { render, screen } from "@testing-library/react";

import App from "./App";


describe("app skeleton", () => {
  it("offers the main learner and teacher destinations inside the dashboard shell", () => {
    window.history.pushState({}, "", "/learn");
    render(<App />);

    expect(screen.getByRole("link", { name: "Learn" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Tutor" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Progress" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Teacher view" })).toBeVisible();
  });
});
