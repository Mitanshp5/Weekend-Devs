import { orbitStateForSection } from "./useOverviewMotion";

describe("orbitStateForSection", () => {
  it("maps narrative sections to explicit orbit states", () => {
    expect(orbitStateForSection("challenge")).toBe("pathSplit");
    expect(orbitStateForSection("tutor")).toBe("conceptGraph");
    expect(orbitStateForSection("architecture")).toBe("systemMap");
    expect(orbitStateForSection("unknown")).toBe("ambient");
  });
});
