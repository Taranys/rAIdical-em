"use client";

// Multi-repo support: repository management card (list + add)
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RepositoryList } from "./repository-list";
import { AddRepositoryForm } from "./add-repository-form";
import { Separator } from "@/components/ui/separator";

interface Repository {
  id: number;
  owner: string;
  name: string;
  addedAt: string;
}

interface RepositoriesCardProps {
  isPatConfigured?: boolean;
}

export function RepositoriesCard({ isPatConfigured: isPatConfiguredProp }: RepositoriesCardProps) {
  const [isPatConfiguredLocal, setIsPatConfiguredLocal] = useState(false);
  const isPatConfigured = isPatConfiguredProp ?? isPatConfiguredLocal;
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [patRes, repoRes] = await Promise.all([
          fetch("/api/settings/github-pat"),
          fetch("/api/repositories"),
        ]);
        const patData = await patRes.json();
        const repoData = await repoRes.json();
        if (!cancelled) {
          setIsPatConfiguredLocal(patData.configured);
          setRepositories(repoData);
        }
      } catch {
        // Ignore
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  async function handleRemove(id: number) {
    await fetch(`/api/repositories/${id}`, { method: "DELETE" });
    setRefreshKey((k) => k + 1);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repositories</CardTitle>
        <CardDescription>
          Configure the GitHub repositories to track for pull requests and reviews.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RepositoryList repositories={repositories} onRemove={handleRemove} />
        <Separator />
        <AddRepositoryForm isPatConfigured={isPatConfigured} onAdded={() => setRefreshKey((k) => k + 1)} />
      </CardContent>
    </Card>
  );
}
