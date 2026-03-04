"use client";

// Multi-repo: App-level repository selector persisted via URL query param
import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Repository {
  id: number;
  owner: string;
  name: string;
}

const ALL_REPOS_VALUE = "all";

export function RepoSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [repositories, setRepositories] = useState<Repository[]>([]);

  const currentRepo = searchParams.get("repo") ?? ALL_REPOS_VALUE;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/repositories");
        const data = await res.json();
        if (!cancelled) setRepositories(data);
      } catch {
        // Ignore — will show empty selector
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL_REPOS_VALUE) {
      params.delete("repo");
    } else {
      params.set("repo", value);
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  // Don't render if no repos are configured
  if (repositories.length === 0) return null;

  return (
    <Select value={currentRepo} onValueChange={handleChange}>
      <SelectTrigger className="w-[220px] h-8 text-sm" data-testid="repo-selector">
        <SelectValue placeholder="All repositories" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_REPOS_VALUE}>All repositories</SelectItem>
        {repositories.map((repo) => (
          <SelectItem key={repo.id} value={String(repo.id)}>
            {repo.owner}/{repo.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
