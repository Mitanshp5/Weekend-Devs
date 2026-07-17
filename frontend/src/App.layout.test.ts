import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "App.css"),
  "utf8",
);


describe("landing layout", () => {
  it("locks the non-dashboard landing screen to the viewport", () => {
    expect(appCss).toMatch(/\.app-shell\s*\{[^}]*height:\s*100dvh;/s);
    expect(appCss).toMatch(/\.app-shell\s*\{[^}]*overflow:\s*hidden;/s);
  });
});
