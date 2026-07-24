import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(process.cwd(), "src/App.css"), "utf8");

describe("overview CTA styling", () => {
  it("disables the legacy skew panels so the long diagnostic label stays visually clear", () => {
    expect(css).toContain(".overview-primary-cta::before, .overview-primary-cta::after { display: none; }");
  });
});
