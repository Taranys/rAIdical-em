"use client";

// US-006: GitHub repository configuration form
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Feedback {
  type: "success" | "error";
  message: string;
}

interface OwnerResult {
  login: string;
  type: "user" | "org";
}

interface RepoResult {
  name: string;
  fullName: string;
  description: string | null;
  isPrivate: boolean;
}

interface VerifyResult {
  fullName: string;
  description: string | null;
  isPrivate: boolean;
  defaultBranch: string;
}

export function GitHubRepoForm() {
  const [isPatConfigured, setIsPatConfigured] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [owner, setOwner] = useState("");
  const [owners, setOwners] = useState<OwnerResult[]>([]);
  const [isOwnersOpen, setIsOwnersOpen] = useState(false);
  const [repo, setRepo] = useState("");
  const [repos, setRepos] = useState<RepoResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ownerContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const checkPatConfigured = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/github-pat");
      const data = await res.json();
      setIsPatConfigured(data.configured);
    } catch {
      // Ignore — assume not configured
    }
  }, []);

  const loadExistingConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/github-repo");
      const data = await res.json();
      if (data.configured) {
        setIsConfigured(true);
        setOwner(data.owner);
        setRepo(data.repo);
      }
    } catch {
      // Ignore
    }
  }, []);

  const loadOwners = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/github-owners");
      const data = await res.json();
      if (data.owners) {
        setOwners(data.owners);
      }
    } catch {
      // Ignore — owner suggestions are optional
    }
  }, []);

  useEffect(() => {
    checkPatConfigured();
    loadExistingConfig();
  }, [checkPatConfigured, loadExistingConfig]);

  // Prefetch owners once PAT is confirmed configured
  useEffect(() => {
    if (isPatConfigured) {
      loadOwners();
    }
  }, [isPatConfigured, loadOwners]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        ownerContainerRef.current &&
        !ownerContainerRef.current.contains(event.target as Node)
      ) {
        setIsOwnersOpen(false);
      }
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [showAllOwners, setShowAllOwners] = useState(false);

  const filteredOwners = showAllOwners
    ? owners
    : owners.filter((o) =>
        o.login.toLowerCase().includes(owner.toLowerCase()),
      );

  function selectOwner(o: OwnerResult) {
    setOwner(o.login);
    setIsOwnersOpen(false);
    setShowAllOwners(false);
    setVerifyResult(null);
    setFeedback(null);
  }

  function handleOwnerChange(value: string) {
    setOwner(value);
    setShowAllOwners(false);
    setVerifyResult(null);
    setFeedback(null);
    // Filter against the new value (not stale state)
    const matches = owners.filter((o) =>
      o.login.toLowerCase().includes(value.toLowerCase()),
    );
    setIsOwnersOpen(matches.length > 0);
  }

  function searchRepos(query: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!owner.trim()) return;

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams({ owner: owner.trim() });
        if (query.trim()) params.set("q", query.trim());
        const res = await fetch(`/api/settings/github-repos?${params}`);
        const data = await res.json();
        if (data.repos) {
          setRepos(data.repos);
          setIsSearchOpen(data.repos.length > 0);
        }
      } catch {
        // Ignore search errors
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }

  function handleRepoInputChange(value: string) {
    setRepo(value);
    setVerifyResult(null);
    setFeedback(null);
    searchRepos(value);
  }

  function selectRepo(r: RepoResult) {
    setRepo(r.name);
    setIsSearchOpen(false);
    setVerifyResult(null);
    setFeedback(null);
  }

  async function handleVerify() {
    if (!owner.trim() || !repo.trim()) return;
    setIsVerifying(true);
    setFeedback(null);
    setVerifyResult(null);

    try {
      const res = await fetch("/api/settings/github-repo/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: owner.trim(), repo: repo.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setVerifyResult(data.repository);
        setFeedback({
          type: "success",
          message: "Repository verified successfully.",
        });
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Verification failed.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Verification failed." });
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleSave() {
    if (!owner.trim() || !repo.trim()) return;
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/settings/github-repo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: owner.trim(), repo: repo.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({
          type: "success",
          message: "Repository configuration saved.",
        });
        setIsConfigured(true);
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Failed to save.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to save." });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setFeedback(null);
    setVerifyResult(null);

    try {
      await fetch("/api/settings/github-repo", { method: "DELETE" });
      setIsConfigured(false);
      setOwner("");
      setRepo("");
      setFeedback({ type: "success", message: "Repository configuration deleted." });
    } catch {
      setFeedback({
        type: "error",
        message: "Failed to delete configuration.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Target Repository</CardTitle>
        <CardDescription>
          Specify the GitHub repository to track for pull requests and reviews.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isPatConfigured ? (
          <p className="text-sm text-muted-foreground">
            Configure a GitHub PAT above before selecting a repository.
          </p>
        ) : (
          <>
            <div className="space-y-2 relative" ref={ownerContainerRef}>
              <Label htmlFor="github-owner">Owner (organization or user)</Label>
              <Input
                id="github-owner"
                placeholder="e.g., my-org"
                value={owner}
                onChange={(e) => handleOwnerChange(e.target.value)}
                onFocus={() => {
                  if (owners.length > 0) {
                    setShowAllOwners(true);
                    setIsOwnersOpen(true);
                  }
                }}
              />
              {isOwnersOpen && filteredOwners.length > 0 && (
                <ul
                  role="listbox"
                  aria-label="Owner suggestions"
                  className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-md shadow-md max-h-60 overflow-auto"
                >
                  {filteredOwners.map((o) => (
                    <li
                      key={o.login}
                      role="option"
                      aria-selected={o.login === owner}
                      className="px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                      onClick={() => selectOwner(o)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{o.login}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {o.type}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2 relative" ref={containerRef}>
              <Label htmlFor="github-repo">Repository</Label>
              <Input
                id="github-repo"
                placeholder="Type to search repositories..."
                value={repo}
                onChange={(e) => handleRepoInputChange(e.target.value)}
                onFocus={() => {
                  if (repos.length > 0) setIsSearchOpen(true);
                }}
                disabled={!owner.trim()}
              />
              {isSearching && (
                <p className="text-xs text-muted-foreground">Searching...</p>
              )}
              {isSearchOpen && repos.length > 0 && (
                <ul
                  role="listbox"
                  className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-md shadow-md max-h-60 overflow-auto"
                >
                  {repos.map((r) => (
                    <li
                      key={r.name}
                      role="option"
                      aria-selected={r.name === repo}
                      className="px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                      onClick={() => selectRepo(r)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.name}</span>
                        {r.isPrivate && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            Private
                          </span>
                        )}
                      </div>
                      {r.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {r.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleVerify}
                variant="outline"
                disabled={isVerifying || !owner.trim() || !repo.trim()}
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !owner.trim() || !repo.trim()}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
              {isConfigured && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>

            {verifyResult && (
              <div className="text-sm p-3 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <p>
                  <strong>{verifyResult.fullName}</strong>{" "}
                  {verifyResult.isPrivate ? "(Private)" : "(Public)"}
                </p>
                {verifyResult.description && (
                  <p className="text-muted-foreground">
                    {verifyResult.description}
                  </p>
                )}
                <p className="text-muted-foreground">
                  Default branch: {verifyResult.defaultBranch}
                </p>
              </div>
            )}

            {feedback && (
              <p
                className={
                  feedback.type === "success"
                    ? "text-sm text-green-600 dark:text-green-400"
                    : "text-sm text-destructive"
                }
              >
                {feedback.message}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
