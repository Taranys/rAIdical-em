"use client";

// Multi-repo support: form to add a new repository
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Feedback {
  type: "success" | "error";
  message: string;
}

interface AddRepositoryFormProps {
  isPatConfigured: boolean;
  onAdded: () => void;
}

export function AddRepositoryForm({ isPatConfigured, onAdded }: AddRepositoryFormProps) {
  const [owner, setOwner] = useState("");
  const [name, setName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

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
          <Label htmlFor="add-repo-owner">Owner</Label>
          <Input
            id="add-repo-owner"
            placeholder="e.g., my-org"
            value={owner}
            onChange={(e) => { setOwner(e.target.value); setFeedback(null); }}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="add-repo-name">Repository</Label>
          <Input
            id="add-repo-name"
            placeholder="e.g., frontend"
            value={name}
            onChange={(e) => { setName(e.target.value); setFeedback(null); }}
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
