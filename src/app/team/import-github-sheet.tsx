"use client";

// US-024: Import team members from GitHub (search or browse org)
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface GitHubUser {
  login: string;
  name?: string | null;
  avatarUrl: string;
}

interface RateLimit {
  remaining: number;
  reset: number;
}

type ImportResult = "success" | "skipped" | "error";

interface ImportGitHubSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingMembers: string[];
  onImportComplete: () => void;
}

export function ImportGitHubSheet({
  open,
  onOpenChange,
  existingMembers,
  onImportComplete,
}: ImportGitHubSheetProps) {
  const [mode, setMode] = useState<"search" | "browse">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<GitHubUser[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<Map<string, ImportResult>>(new Map());
  const [rateLimit, setRateLimit] = useState<RateLimit | null>(null);
  const [orgs, setOrgs] = useState<{ login: string; type: string }[]>([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const existingSet = new Set(existingMembers.map((m) => m.toLowerCase()));

  // Fetch orgs when switching to browse mode
  const fetchOrgs = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/github-owners");
      if (res.ok) {
        const data = await res.json();
        setOrgs(data.owners.filter((o: { type: string }) => o.type === "org"));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (mode === "browse" && orgs.length === 0) {
      fetchOrgs();
    }
  }, [mode, orgs.length, fetchOrgs]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setResults([]);
      setSelected(new Set());
      setImportResults(new Map());
      setRateLimit(null);
      setSelectedOrg("");
      setMode("search");
    }
  }, [open]);

  async function searchUsers(query: string) {
    if (query.trim().length < 2) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/team/github-search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.users);
        setRateLimit(data.rateLimit);
      }
    } catch {
      // ignore
    } finally {
      setIsSearching(false);
    }
  }

  async function fetchOrgMembers(org: string) {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/team/github-org-members?org=${encodeURIComponent(org)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.members);
        setRateLimit(data.rateLimit);
      }
    } catch {
      // ignore
    } finally {
      setIsSearching(false);
    }
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setImportResults(new Map());
    setSelected(new Set());

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      searchUsers(value);
    }, 300);
  }

  function handleOrgChange(org: string) {
    setSelectedOrg(org);
    setImportResults(new Map());
    setSelected(new Set());
    if (org) {
      fetchOrgMembers(org);
    } else {
      setResults([]);
    }
  }

  function toggleUser(login: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(login)) {
        next.delete(login);
      } else {
        next.add(login);
      }
      return next;
    });
  }

  async function handleImport() {
    setIsImporting(true);
    const newResults = new Map<string, ImportResult>();
    const usernames = Array.from(selected);
    setImportProgress({ current: 0, total: usernames.length });

    for (let i = 0; i < usernames.length; i++) {
      const username = usernames[i];
      setImportProgress({ current: i + 1, total: usernames.length });
      try {
        const res = await fetch("/api/team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        if (res.ok) {
          newResults.set(username, "success");
        } else if (res.status === 409) {
          newResults.set(username, "skipped");
        } else {
          newResults.set(username, "error");
        }
      } catch {
        newResults.set(username, "error");
      }
    }

    setImportResults(newResults);
    setSelected(new Set());
    setIsImporting(false);
    onImportComplete();
  }

  function isExisting(login: string) {
    return existingSet.has(login.toLowerCase());
  }

  const selectedCount = selected.size;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Import from GitHub</SheetTitle>
          <SheetDescription>
            Search users or browse organization members to import.
          </SheetDescription>
        </SheetHeader>

        {/* Mode toggle */}
        <div className="flex gap-2 px-4">
          <Button
            variant={mode === "search" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setMode("search");
              setResults([]);
              setSelected(new Set());
              setImportResults(new Map());
            }}
          >
            Search Users
          </Button>
          <Button
            variant={mode === "browse" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setMode("browse");
              setResults([]);
              setSelected(new Set());
              setImportResults(new Map());
            }}
          >
            Browse Organization
          </Button>
        </div>

        {/* Search / Browse input */}
        <div className="px-4">
          {mode === "search" ? (
            <Input
              placeholder="Search GitHub users..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              disabled={isImporting}
            />
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Select an organization</p>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedOrg}
                onChange={(e) => handleOrgChange(e.target.value)}
                disabled={isImporting}
              >
                <option value="">Choose an organization...</option>
                {orgs.map((org) => (
                  <option key={org.login} value={org.login}>
                    {org.login}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Rate limit info */}
        {rateLimit !== null && (
          <div className="px-4">
            <p className="text-xs text-muted-foreground">
              {rateLimit.remaining} requests remaining
            </p>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 min-h-0">
          {isSearching ? (
            <p className="text-sm text-muted-foreground">Searching...</p>
          ) : results.length === 0 && (searchQuery.length >= 2 || selectedOrg) ? (
            <p className="text-sm text-muted-foreground">No results found.</p>
          ) : (
            <div className="space-y-2">
              {results.map((user) => {
                const existing = isExisting(user.login);
                const result = importResults.get(user.login);

                return (
                  <div
                    key={user.login}
                    className="flex items-center gap-3 p-2 rounded-md border"
                  >
                    <Checkbox
                      checked={existing || selected.has(user.login)}
                      disabled={existing || isImporting || !!result}
                      onCheckedChange={() => toggleUser(user.login)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl} alt={user.login} />
                      <AvatarFallback>
                        {user.login.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.login}</p>
                      {user.name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.name}
                        </p>
                      )}
                    </div>
                    {existing && (
                      <Badge variant="secondary">Already added</Badge>
                    )}
                    {result === "success" && <Badge>Imported</Badge>}
                    {result === "skipped" && (
                      <Badge variant="secondary">Already added</Badge>
                    )}
                    {result === "error" && (
                      <Badge variant="destructive">Error</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <SheetFooter className="flex-row items-center justify-between border-t pt-4">
          <span className="text-sm text-muted-foreground">
            {selectedCount > 0 ? `${selectedCount} selected` : "No users selected"}
          </span>
          <Button
            onClick={handleImport}
            disabled={selectedCount === 0 || isImporting}
          >
            {isImporting
              ? `Importing ${importProgress.current}/${importProgress.total}...`
              : `Import${selectedCount > 0 ? ` ${selectedCount} member${selectedCount > 1 ? "s" : ""}` : ""}`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
