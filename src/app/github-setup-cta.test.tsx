// @vitest-environment jsdom
// US-005: Unit tests for dashboard GitHub setup CTA
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/db/settings", () => ({
  hasSetting: vi.fn(),
}));

import { hasSetting } from "@/db/settings";
import { GitHubSetupCta } from "./github-setup-cta";

const mockedHasSetting = vi.mocked(hasSetting);

describe("GitHubSetupCta", () => {
  it("renders CTA card when no PAT is configured", () => {
    mockedHasSetting.mockReturnValue(false);
    render(<GitHubSetupCta />);

    expect(screen.getByText("GitHub Connection Required")).toBeInTheDocument();
    const link = screen.getByRole("link", {
      name: /configure github pat/i,
    });
    expect(link).toHaveAttribute("href", "/settings");
  });

  it("renders nothing when PAT is configured", () => {
    mockedHasSetting.mockReturnValue(true);
    const { container } = render(<GitHubSetupCta />);
    expect(container).toBeEmptyDOMElement();
  });
});
