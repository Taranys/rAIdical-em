"use client";

// US-2.06: Shared classification status hook for sync page indicator
import { useCallback, useEffect, useRef, useState } from "react";

export interface ClassificationRun {
  id: number;
  status: "running" | "success" | "error";
  commentsProcessed: number;
  errors: number;
  startedAt: string;
  completedAt: string | null;
  modelUsed: string;
}

interface UseClassificationStatusOptions {
  pollingInterval?: number;
  fetchOnMount?: boolean;
}

interface UseClassificationStatusReturn {
  classificationRun: ClassificationRun | null;
  isLoading: boolean;
  fetchStatus: () => Promise<ClassificationRun | null>;
  startPolling: () => void;
}

export function useClassificationStatus(
  options: UseClassificationStatusOptions = {},
): UseClassificationStatusReturn {
  const { pollingInterval = 1000, fetchOnMount = true } = options;
  const [classificationRun, setClassificationRun] = useState<ClassificationRun | null>(null);
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
      const res = await fetch("/api/classify/progress");
      const data = await res.json();
      setClassificationRun(data.run);
      return data.run as ClassificationRun | null;
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

  return { classificationRun, isLoading, fetchStatus, startPolling };
}
