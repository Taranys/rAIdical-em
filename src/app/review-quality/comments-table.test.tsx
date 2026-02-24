// @vitest-environment jsdom
// US-2.16: Comments table component tests — edit classification + manual indicator
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommentsTable, type ClassifiedComment } from "./comments-table";

const baseComment: ClassifiedComment = {
  commentType: "review_comment",
  commentId: 1,
  reviewer: "bob",
  body: "This is a test comment",
  filePath: "src/app.ts",
  createdAt: "2026-02-02T10:00:00Z",
  prTitle: "Add feature",
  prNumber: 1,
  category: "bug_correctness",
  confidence: 90,
  reasoning: "Bug found",
  classifiedAt: "2026-02-23T10:00:00Z",
  isManual: false,
};

const manualComment: ClassifiedComment = {
  ...baseComment,
  commentId: 2,
  isManual: true,
  confidence: 100,
};

const unclassifiedComment: ClassifiedComment = {
  ...baseComment,
  commentId: 3,
  category: null,
  confidence: null,
  reasoning: null,
  classifiedAt: null,
  isManual: false,
};

const defaultProps = {
  sortBy: "date",
  sortOrder: "desc",
  onSortChange: vi.fn(),
  onSelect: vi.fn(),
  onReclassify: vi.fn(),
  repoUrl: null,
};

describe("CommentsTable", () => {
  it("renders the edit classification button for classified comments", () => {
    render(
      <CommentsTable
        {...defaultProps}
        comments={[baseComment]}
      />,
    );

    expect(screen.getByTestId("edit-classification")).toBeInTheDocument();
  });

  it("does not render the edit classification button for unclassified comments", () => {
    render(
      <CommentsTable
        {...defaultProps}
        comments={[unclassifiedComment]}
      />,
    );

    expect(screen.queryByTestId("edit-classification")).not.toBeInTheDocument();
  });

  it("shows manual indicator for manually classified comments", () => {
    render(
      <CommentsTable
        {...defaultProps}
        comments={[manualComment]}
      />,
    );

    expect(screen.getByTestId("manual-indicator")).toBeInTheDocument();
  });

  it("does not show manual indicator for LLM-classified comments", () => {
    render(
      <CommentsTable
        {...defaultProps}
        comments={[baseComment]}
      />,
    );

    expect(screen.queryByTestId("manual-indicator")).not.toBeInTheDocument();
  });

  it("switches to editing mode when edit button is clicked", () => {
    render(
      <CommentsTable
        {...defaultProps}
        comments={[baseComment]}
      />,
    );

    // Before clicking, edit button is visible and no select trigger
    expect(screen.getByTestId("edit-classification")).toBeInTheDocument();
    expect(screen.queryByTestId("category-select")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("edit-classification"));

    // After clicking, edit button should be gone (replaced by select)
    expect(screen.queryByTestId("edit-classification")).not.toBeInTheDocument();
    expect(screen.getByTestId("category-select")).toBeInTheDocument();
  });
});
