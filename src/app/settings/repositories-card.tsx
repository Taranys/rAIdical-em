"use client";

// Multi-repo support: repository management card (list + add)
import { useCallback, useEffect, useState } from "react";
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

  const loadRepositories = useCallback(async () => {
    try {
      const res = await fetch("/api/repositories");
      const data = await res.json();
      setRepositories(data);
    } catch {
      // Ignore
    }
  }, []);

  const checkPatConfigured = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/github-pat");
      const data = await res.json();
      setIsPatConfiguredLocal(data.configured);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    checkPatConfigured();
    loadRepositories();
  }, [checkPatConfigured, loadRepositories]);

  async function handleRemove(id: number) {
    await fetch(`/api/repositories/${id}`, { method: "DELETE" });
    loadRepositories();
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
        <AddRepositoryForm isPatConfigured={isPatConfigured} onAdded={loadRepositories} />
      </CardContent>
    </Card>
  );
}
