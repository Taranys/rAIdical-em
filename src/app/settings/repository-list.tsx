"use client";

// Multi-repo support: list configured repositories with remove action
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Repository {
  id: number;
  owner: string;
  name: string;
  addedAt: string;
}

interface RepositoryListProps {
  repositories: Repository[];
  onRemove: (id: number) => Promise<void>;
}

export function RepositoryList({ repositories, onRemove }: RepositoryListProps) {
  const [removingId, setRemovingId] = useState<number | null>(null);

  async function handleRemove(id: number) {
    setRemovingId(id);
    try {
      await onRemove(id);
    } finally {
      setRemovingId(null);
    }
  }

  if (repositories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No repositories configured yet. Add one below.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {repositories.map((repo) => (
        <li key={repo.id} className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
          <div>
            <span className="font-medium">{repo.owner}/{repo.name}</span>
            <span className="text-xs text-muted-foreground ml-2">
              Added {new Date(repo.addedAt).toLocaleDateString()}
            </span>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={removingId === repo.id}
              >
                {removingId === repo.id ? "Removing..." : "Remove"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove repository?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete <strong>{repo.owner}/{repo.name}</strong> and
                  all its synced data (PRs, reviews, comments). This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleRemove(repo.id)}>
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </li>
      ))}
    </ul>
  );
}
