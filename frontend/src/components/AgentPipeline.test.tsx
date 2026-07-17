import { render, screen } from "@testing-library/react";

import { AgentPipeline } from "./AgentPipeline";


describe("AgentPipeline", () => {
  it("makes PRISM's explainable adaptive loop visible", () => {
    render(<AgentPipeline />);

    expect(screen.getByTestId("agentic-pipeline")).toHaveAttribute("data-motion", "agentic-pipeline");
    expect(screen.getByText("Observe")).toBeInTheDocument();
    expect(screen.getByText("Map")).toBeInTheDocument();
    expect(screen.getByText("Guide")).toBeInTheDocument();
    expect(screen.getByText("Verify")).toBeInTheDocument();
  });
});
