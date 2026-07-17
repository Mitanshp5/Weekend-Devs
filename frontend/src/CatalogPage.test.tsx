import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import App from "./App";


describe("Grade 8 catalog", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/learn");
  });

  afterEach(() => vi.unstubAllGlobals());

  it("fetches and renders subjects from the catalog API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            grade: 8,
            subjects: [
              { slug: "mathematics", name: "Mathematics", unit_count: 3 },
              { slug: "science", name: "Science", unit_count: 3 },
              { slug: "english", name: "English", unit_count: 3 },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    render(<App />);

    expect(await screen.findByText("Mathematics")).toBeVisible();
    expect(screen.getByText("Science")).toBeVisible();
    expect(screen.getByText("English")).toBeVisible();
    expect(fetch).toHaveBeenCalledWith("/api/catalog/subjects?grade=8");
  });
});
