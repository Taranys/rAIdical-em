"use client";

// US-013: Shared sync status hook for sync page and sidebar
import { useCallback, useEffect, useRef, useState } from "react";

export interface SyncRun {
  id: number;
  status: "running" | "success" | "error";
  prCount: number;
  commentCount: number;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

interface UseSyncStatusOptions {
  pollingInterval?: number;
  fetchOnMount?: boolean;
}

interface UseSyncStatusReturn {
  syncRun: SyncRun | null;
  history: SyncRun[];
  isLoading: boolean;
  fetchStatus: () => Promise<SyncRun | null>;
  startPolling: () => void;
}

export function useSyncStatus(
  options: UseSyncStatusOptions = {},
): UseSyncStatusReturn {
  const { pollingInterval = 1000, fetchOnMount = true } = options;
  const [syncRun, setSyncRun] = useState<SyncRun | null>(null);
  const [history, setHistory] = useState<SyncRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/sync");
      const data = await res.json();
      setSyncRun(data.syncRun);
      setHistory(data.history ?? []);
      return data.syncRun as SyncRun | null;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      const run = await fetchStatus();
      if (run && run.status !== "running") {
        stopPolling();
      }
    }, pollingInterval);
  }, [fetchStatus, stopPolling, pollingInterval]);

  useEffect(() => {
    if (fetchOnMount) {
      fetchStatus().then((run) => {
        if (run && run.status === "running") {
          startPolling();
        }
      });
    }
    return () => stopPolling();
  }, [fetchOnMount, fetchStatus, startPolling, stopPolling]);

  return { syncRun, history, isLoading, fetchStatus, startPolling };
}
