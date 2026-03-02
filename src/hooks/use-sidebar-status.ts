"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SidebarStatus {
  settings: { configured: boolean };
  team: { configured: boolean };
  sync: { hasRun: boolean; status: "running" | "success" | "error" | null };
}

const INITIAL_STATUS: SidebarStatus = {
  settings: { configured: false },
  team: { configured: false },
  sync: { hasRun: false, status: null },
};

export function useSidebarStatus(): SidebarStatus {
  const [status, setStatus] = useState<SidebarStatus>(INITIAL_STATUS);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async (): Promise<SidebarStatus> => {
    try {
      const res = await fetch("/api/sidebar-status");
      const data: SidebarStatus = await res.json();
      setStatus(data);
      return data;
    } catch {
      return INITIAL_STATUS;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const data = await fetchStatus();
      if (cancelled) return;

      if (data.sync.status === "running") {
        pollRef.current = setInterval(async () => {
          const updated = await fetchStatus();
          if (cancelled) return;
          if (updated.sync.status !== "running") {
            stopPolling();
          }
        }, 2000);
      }
    }

    init();

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [fetchStatus, stopPolling]);

  return status;
}
