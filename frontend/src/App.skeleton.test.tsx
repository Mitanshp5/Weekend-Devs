import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import App from "./App";


describe("app skeleton", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/learn");
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("offers the main learner and teacher destinations inside the dashboard shell", () => {
    render(<App />);

    expect(screen.getByRole("link", { name: "Learn" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Tutor" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Progress" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Teacher view" })).toBeVisible();
  });
});
