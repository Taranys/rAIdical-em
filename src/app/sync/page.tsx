"use client";

// US-010: Sync page with real-time progress
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SyncState {
  status: "idle" | "syncing" | "success" | "error";
  repository: string | null;
  fetched: number;
  currentPage: number;
  prCount: number;
  durationMs: number;
  errorMessage: string | null;
}

interface RepoConfig {
  configured: boolean;
  owner?: string;
  repo?: string;
}

function parseSSEEvents(text: string) {
  return text
    .split("\n\n")
    .filter(Boolean)
    .map((block) => {
      const eventMatch = block.match(/event: (.+)/);
      const dataMatch = block.match(/data: (.+)/);
      return {
        event: eventMatch?.[1] ?? null,
        data: dataMatch ? JSON.parse(dataMatch[1]) : null,
      };
    });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function SyncPage() {
  const [repoConfig, setRepoConfig] = useState<RepoConfig | null>(null);
  const [syncState, setSyncState] = useState<SyncState>({
    status: "idle",
    repository: null,
    fetched: 0,
    currentPage: 0,
    prCount: 0,
    durationMs: 0,
    errorMessage: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/settings/github-repo");
        const data = await res.json();
        if (!cancelled) setRepoConfig(data);
      } catch {
        if (!cancelled) setRepoConfig({ configured: false });
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function handleSync() {
    setSyncState({
      status: "syncing",
      repository: null,
      fetched: 0,
      currentPage: 0,
      prCount: 0,
      durationMs: 0,
      errorMessage: null,
    });

    try {
      const response = await fetch("/api/sync", { method: "POST" });

      if (!response.ok || !response.body) {
        const data = await response.json();
        setSyncState((prev) => ({
          ...prev,
          status: "error",
          errorMessage: data.error || "Sync failed",
        }));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = parseSSEEvents(buffer);
        buffer = "";

        for (const { event, data } of events) {
          if (!event || !data) continue;

          switch (event) {
            case "sync:start":
              setSyncState((prev) => ({
                ...prev,
                repository: data.repository,
              }));
              break;
            case "sync:progress":
              setSyncState((prev) => ({
                ...prev,
                fetched: data.fetched,
                currentPage: data.currentPage,
              }));
              break;
            case "sync:complete":
              setSyncState((prev) => ({
                ...prev,
                status: "success",
                prCount: data.prCount,
                durationMs: data.durationMs,
              }));
              break;
            case "sync:error":
              setSyncState((prev) => ({
                ...prev,
                status: "error",
                errorMessage: data.message,
              }));
              break;
          }
        }
      }
    } catch {
      setSyncState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: "Failed to connect to sync service",
      }));
    }
  }

  const isSyncing = syncState.status === "syncing";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold tracking-tight mb-6">Sync</h1>

      {repoConfig && !repoConfig.configured && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Please configure a repository in{" "}
              <a href="/settings" className="underline font-medium">
                Settings
              </a>{" "}
              before syncing.
            </p>
          </CardContent>
        </Card>
      )}

      {repoConfig?.configured && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Sync GitHub Data</CardTitle>
            <CardDescription>
              Fetch all pull requests from{" "}
              <span className="font-mono">
                {repoConfig.owner}/{repoConfig.repo}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? "Syncing..." : "Start Sync"}
            </Button>
          </CardContent>
        </Card>
      )}

      {isSyncing && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Progress
              <Badge variant="secondary">Running</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                PRs fetched:{" "}
                <span className="font-semibold">{syncState.fetched}</span>
              </p>
              {syncState.currentPage > 0 && (
                <p>
                  Page:{" "}
                  <span className="font-semibold">
                    {syncState.currentPage}
                  </span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {syncState.status === "success" && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Sync Complete
              <Badge className="bg-green-600 hover:bg-green-600">
                Success
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                Pull requests synced:{" "}
                <span className="font-semibold">{syncState.prCount}</span>
              </p>
              <p>
                Duration:{" "}
                <span className="font-semibold">
                  {formatDuration(syncState.durationMs)}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {syncState.status === "error" && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Sync Failed
              <Badge variant="destructive">Error</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">
              {syncState.errorMessage}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
