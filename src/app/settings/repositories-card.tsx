"use client";

// Multi-repo support: repository management card (list + add)
import { useEffect, useState } from "react";
import { useSidebarStatusContext } from "@/contexts/sidebar-status-context";
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
import { cn } from "@/lib/utils";

interface Repository {
  id: number;
  owner: string;
  name: string;
  addedAt: string;
}

interface RepositoriesCardProps {
  isPatConfigured?: boolean;
  className?: string;
  onConfiguredChange?: (isConfigured: boolean) => void;
}

export function RepositoriesCard({ isPatConfigured: isPatConfiguredProp, className, onConfiguredChange }: RepositoriesCardProps) {
  const { refresh: refreshSidebarStatus } = useSidebarStatusContext();
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

  useEffect(() => {
    onConfiguredChange?.(repositories.length > 0);
  }, [repositories, onConfiguredChange]);

  async function handleRemove(id: number) {
    await fetch(`/api/repositories/${id}`, { method: "DELETE" });
    setRefreshKey((k) => k + 1);
    refreshSidebarStatus();
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Repositories</CardTitle>
        <CardDescription>
          Configure the GitHub repositories to track for pull requests and reviews.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RepositoryList repositories={repositories} onRemove={handleRemove} />
        <Separator />
        <AddRepositoryForm isPatConfigured={isPatConfigured} onAdded={() => { setRefreshKey((k) => k + 1); refreshSidebarStatus(); }} />
      </CardContent>
    </Card>
  );
}
