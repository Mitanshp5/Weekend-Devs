import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import App from "./App";


describe("Subject path", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/learn/mathematics");
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      grade: 8,
      subject: { slug: "mathematics", name: "Mathematics" },
      units: [{ slug: "rational-numbers", name: "Rational Numbers", position: 1, concept_count: 3 }],
    }), { status: 200 }))));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("turns a database-backed subject into a visible learning path", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Mathematics learning path" })).toBeInTheDocument();
    expect(screen.getByText("Rational Numbers")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/catalog/subjects/mathematics/units?grade=8");
  });
});
