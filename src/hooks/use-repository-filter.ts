"use client";

// Multi-repo: hook to read the current repository filter from the URL query param
import { useSearchParams } from "next/navigation";

/**
 * Returns the current repositoryId from the ?repo= URL query param.
 * Returns undefined when "All repositories" is selected (no filter).
 */
export function useRepositoryFilter(): number | undefined {
  const searchParams = useSearchParams();
  const repo = searchParams.get("repo");
  if (!repo) return undefined;
  const parsed = parseInt(repo, 10);
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Appends repositoryId to a URLSearchParams if a filter is active.
 */
export function appendRepoParam(params: URLSearchParams, repositoryId?: number): URLSearchParams {
  if (repositoryId !== undefined) {
    params.set("repositoryId", String(repositoryId));
  }
  return params;
}
