import {
  architecturePrinciples,
  diagnosticDetails,
  evaluatorCapabilities,
  impactAudiences,
  journeyPhases,
  prototypeDisclosure,
  requiredOutcomes,
} from "./prismOverview";

describe("PRISM overview content", () => {
  it("describes the required five-question diagnostic and three learning paths", () => {
    expect(diagnosticDetails.questionCount).toBe(5);
    expect(diagnosticDetails.pathLabels).toEqual(["Foundational", "Grade-Level", "Advanced"]);
    expect(diagnosticDetails.lessonDuration).toBe("10-minute");
    expect(diagnosticDetails.practiceCount).toBe(3);
  });

  it("keeps learner, tutor, evaluator, offline, and concept-graph requirements in the narrative", () => {
    const narrative = [
      ...requiredOutcomes,
      ...journeyPhases.map((phase) => `${phase.label} ${phase.description}`),
      ...evaluatorCapabilities,
      ...architecturePrinciples,
    ].join(" ");

    expect(narrative).toMatch(/handwritten photo/i);
    expect(narrative).toMatch(/concept graph/i);
    expect(narrative).toMatch(/session history/i);
    expect(narrative).toMatch(/completion rate/i);
    expect(narrative).toMatch(/offline/i);
  });

  it("frames the extended vision honestly without fabricated proof", () => {
    expect(prototypeDisclosure).toMatch(/Hackathon prototype/i);
    expect(prototypeDisclosure).toMatch(/implementation depth varies by module/i);
    expect(impactAudiences).toHaveLength(3);

    const narrative = JSON.stringify({
      requiredOutcomes,
      journeyPhases,
      evaluatorCapabilities,
      architecturePrinciples,
      impactAudiences,
      prototypeDisclosure,
    });
    expect(narrative).not.toMatch(/\b\d+%\b|testimonial|schools served|trusted by/i);
  });
});
