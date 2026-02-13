"use client";

// US-010: Sync page — fetch PRs from GitHub with real-time progress
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";

interface SyncRun {
  id: number;
  status: "running" | "success" | "error";
  prCount: number;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

interface RateLimit {
  limit: number;
  remaining: number;
  resetAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function SyncStatusIndicator({ syncRun }: { syncRun: SyncRun | null }) {
  if (!syncRun) {
    return (
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium text-muted-foreground">Never synced</p>
          <p className="text-sm text-muted-foreground">
            Click &quot;Sync Now&quot; to fetch pull requests from GitHub.
          </p>
        </div>
      </div>
    );
  }

  if (syncRun.status === "running") {
    return (
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
        <div>
          <p className="font-medium text-blue-600 dark:text-blue-400">
            Syncing...
          </p>
          <p className="text-sm text-muted-foreground">
            {syncRun.prCount} PRs fetched so far
          </p>
        </div>
      </div>
    );
  }

  if (syncRun.status === "error") {
    return (
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <div>
          <p className="font-medium text-destructive">Sync error</p>
          <p className="text-sm text-destructive">{syncRun.errorMessage}</p>
          {syncRun.completedAt && (
            <p className="text-sm text-muted-foreground">
              {formatDate(syncRun.completedAt)} — {syncRun.prCount} PRs fetched
              before error
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <CheckCircle2 className="h-5 w-5 text-green-500" />
      <div>
        <p className="font-medium text-green-600 dark:text-green-400">
          Up to date
        </p>
        <p className="text-sm text-muted-foreground">
          {syncRun.prCount} PRs synced
          {syncRun.completedAt && ` — ${formatDate(syncRun.completedAt)}`}
        </p>
      </div>
    </div>
  );
}

export default function SyncPage() {
  const [syncRun, setSyncRun] = useState<SyncRun | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/sync");
      const data = await res.json();
      setSyncRun(data.syncRun);
      return data.syncRun as SyncRun | null;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRateLimit = useCallback(async () => {
    try {
      const res = await fetch("/api/sync/rate-limit");
      const data = await res.json();
      if (data.rateLimit) {
        setRateLimit(data.rateLimit);
      }
    } catch {
      // Ignore — rate limit info is optional
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      const run = await fetchStatus();
      if (run && run.status !== "running") {
        stopPolling();
        fetchRateLimit();
      }
    }, 1000);
  }, [fetchStatus, fetchRateLimit]);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => {
    fetchStatus().then((run) => {
      if (run && run.status === "running") {
        startPolling();
      }
    });
    fetchRateLimit();

    return () => stopPolling();
  }, [fetchStatus, fetchRateLimit, startPolling]);

  async function handleSync() {
    setIsTriggering(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await fetchStatus();
        startPolling();
      }
    } catch {
      // Error will be picked up by next status fetch
    } finally {
      setIsTriggering(false);
    }
  }

  const isSyncing = syncRun?.status === "running";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold tracking-tight mb-6">Sync</h1>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>GitHub Pull Requests</CardTitle>
              <CardDescription>
                Sync pull requests from your configured GitHub repository.
              </CardDescription>
            </div>
            <Button
              onClick={handleSync}
              disabled={isTriggering || isSyncing}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <SyncStatusIndicator syncRun={syncRun} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GitHub API Rate Limit</CardTitle>
          <CardDescription>
            Your current GitHub API usage and limits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rateLimit ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Requests remaining</span>
                <span className="font-mono font-medium">
                  {rateLimit.remaining} / {rateLimit.limit}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{
                    width: `${(rateLimit.remaining / rateLimit.limit) * 100}%`,
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Resets at {formatDate(rateLimit.resetAt)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Configure a GitHub PAT to see rate limit information.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
