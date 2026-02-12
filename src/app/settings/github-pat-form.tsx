"use client";

// US-005: GitHub PAT configuration form
import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Feedback {
  type: "success" | "error";
  message: string;
}

export function GitHubPatForm() {
  const [token, setToken] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const checkConfigured = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/github-pat");
      const data = await res.json();
      setIsConfigured(data.configured);
    } catch {
      // Ignore — assume not configured
    }
  }, []);

  useEffect(() => {
    checkConfigured();
  }, [checkConfigured]);

  async function handleSave() {
    if (!token.trim()) return;
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/settings/github-pat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({ type: "success", message: "PAT saved successfully." });
        setToken("");
        setIsConfigured(true);
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Failed to save PAT.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to save PAT." });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTestConnection() {
    setIsTesting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/settings/github-pat/test", {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({
          type: "success",
          message: `Connected as ${data.user.login}${data.user.name ? ` (${data.user.name})` : ""}`,
        });
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Connection test failed.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Connection test failed." });
    } finally {
      setIsTesting(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setFeedback(null);

    try {
      await fetch("/api/settings/github-pat", { method: "DELETE" });
      setIsConfigured(false);
      setFeedback({ type: "success", message: "PAT deleted." });
    } catch {
      setFeedback({ type: "error", message: "Failed to delete PAT." });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub Personal Access Token</CardTitle>
        <CardDescription>
          Required for accessing the GitHub API to fetch pull requests, reviews,
          and comments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm space-y-1">
          <p>
            <a
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Generate a fine-grained PAT
            </a>{" "}
            with these permissions:
          </p>
          <ul className="list-disc list-inside text-muted-foreground ml-2">
            <li>
              <strong>Pull requests</strong>: Read
            </li>
            <li>
              <strong>Contents</strong>: Read
            </li>
            <li>
              <strong>Metadata</strong>: Read (included automatically)
            </li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Input
            type="password"
            placeholder="ghp_..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="font-mono"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleSave} disabled={isSaving || !token.trim()}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={isTesting}
          >
            {isTesting ? "Testing..." : "Test Connection"}
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
      </CardContent>
    </Card>
  );
}
