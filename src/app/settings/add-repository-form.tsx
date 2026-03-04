"use client";

// Multi-repo support: form to add a new repository
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchableInput } from "./searchable-input";

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

interface AddRepositoryFormProps {
  isPatConfigured: boolean;
  onAdded: () => void;
}

export function AddRepositoryForm({ isPatConfigured, onAdded }: AddRepositoryFormProps) {
  const [owner, setOwner] = useState("");
  const [owners, setOwners] = useState<OwnerResult[]>([]);
  const [name, setName] = useState("");
  const [repos, setRepos] = useState<RepoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (isPatConfigured) {
      loadOwners();
    }
  }, [isPatConfigured, loadOwners]);

  function handleOwnerChange(value: string) {
    setOwner(value);
    setName("");
    setRepos([]);
    setFeedback(null);
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
        }
      } catch {
        // Ignore search errors
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }

  async function handleAdd() {
    if (!owner.trim() || !name.trim()) return;
    setIsAdding(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: owner.trim(), name: name.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setFeedback({ type: "success", message: `Repository ${owner.trim()}/${name.trim()} added.` });
        setOwner("");
        setName("");
        setRepos([]);
        onAdded();
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to add repository." });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to add repository." });
    } finally {
      setIsAdding(false);
    }
  }

  if (!isPatConfigured) {
    return (
      <p className="text-sm text-muted-foreground">
        Configure a GitHub PAT above before adding repositories.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <SearchableInput
            id="add-repo-owner"
            label="Owner"
            placeholder="e.g., my-org"
            value={owner}
            onChange={handleOwnerChange}
            items={owners}
            getKey={(o) => o.login}
            filterItem={(o, q) => o.login.toLowerCase().includes(q.toLowerCase())}
            onSelect={(o) => handleOwnerChange(o.login)}
            renderItem={(o) => (
              <div className="flex items-center gap-2">
                <span className="font-medium">{o.login}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {o.type}
                </span>
              </div>
            )}
            listLabel="Owner suggestions"
            showAllOnFocus
          />
        </div>
        <div className="flex-1">
          <SearchableInput
            id="add-repo-name"
            label="Repository"
            placeholder="Type to search repositories..."
            value={name}
            onChange={(value) => { setName(value); setFeedback(null); searchRepos(value); }}
            disabled={!owner.trim()}
            items={repos}
            getKey={(r) => r.name}
            filterItem={() => true}
            onSelect={(r) => { setName(r.name); setFeedback(null); }}
            renderItem={(r) => (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.name}</span>
                  {r.isPrivate && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      Private
                    </span>
                  )}
                </div>
                {r.description && (
                  <p className="text-xs text-muted-foreground truncate">{r.description}</p>
                )}
              </>
            )}
            isLoading={isSearching}
          />
        </div>
      </div>
      <Button onClick={handleAdd} disabled={isAdding || !owner.trim() || !name.trim()}>
        {isAdding ? "Adding..." : "Add Repository"}
      </Button>
      {feedback && (
        <p className={feedback.type === "success" ? "text-sm text-green-600 dark:text-green-400" : "text-sm text-destructive"}>
          {feedback.message}
        </p>
      )}
    </div>
  );
}
