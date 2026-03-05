// @vitest-environment jsdom
// Unit test for dimensions settings page
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import DimensionsPage from "./page";

// Mock fetch
const mockDimensions = [
  { id: 1, name: "security", family: "technical", label: "Security", description: "Security desc", sourceCategories: '["security"]', isEnabled: 1, sortOrder: 0, createdAt: "", updatedAt: "" },
  { id: 5, name: "pedagogy", family: "soft_skill", label: "Pedagogy", description: "Pedagogy desc", sourceCategories: null, isEnabled: 1, sortOrder: 4, createdAt: "", updatedAt: "" },
];

const mockCategories = [
  { id: 1, slug: "security", label: "Security", description: "", color: "#ef4444", sortOrder: 0 },
  { id: 2, slug: "performance", label: "Performance", description: "", color: "#eab308", sortOrder: 1 },
];

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes("/api/settings/seniority-dimensions")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDimensions),
      });
    }
    if (url.includes("/api/categories")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
});

describe("DimensionsPage", () => {
  it("renders the page title", async () => {
    render(<DimensionsPage />);
    expect(screen.getByText("Dimensions")).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    render(<DimensionsPage />);
    expect(screen.getByText("Loading dimensions...")).toBeInTheDocument();
  });

  it("displays dimensions after loading", async () => {
    render(<DimensionsPage />);

    await waitFor(() => {
      expect(screen.getByText("Security")).toBeInTheDocument();
      expect(screen.getByText("Pedagogy")).toBeInTheDocument();
    });
  });

  it("shows family badges", async () => {
    render(<DimensionsPage />);

    await waitFor(() => {
      expect(screen.getByText("Tech")).toBeInTheDocument();
      expect(screen.getByText("Soft")).toBeInTheDocument();
    });
  });

  it("renders Add Dimension button", async () => {
    render(<DimensionsPage />);

    await waitFor(() => {
      expect(screen.getByText("Add Dimension")).toBeInTheDocument();
    });
  });

  it("renders Reset to Defaults button", async () => {
    render(<DimensionsPage />);

    await waitFor(() => {
      expect(screen.getByText("Reset to Defaults")).toBeInTheDocument();
    });
  });
});
