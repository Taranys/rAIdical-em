"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { SidebarStatus } from "@/hooks/use-sidebar-status";

const INITIAL_STATUS: SidebarStatus = {
  settings: { configured: false },
  team: { configured: false },
  sync: { hasRun: false, status: null },
};

interface SidebarStatusContextValue {
  status: SidebarStatus;
  refresh: () => Promise<void>;
}

const SidebarStatusContext = createContext<SidebarStatusContextValue | null>(null);

export function SidebarStatusProvider({ children }: { children: ReactNode }) {
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

  const refresh = useCallback(async () => {
    await fetchStatus();
  }, [fetchStatus]);

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

  return (
    <SidebarStatusContext.Provider value={{ status, refresh }}>
      {children}
    </SidebarStatusContext.Provider>
  );
}

export function useSidebarStatusContext(): SidebarStatusContextValue {
  const context = useContext(SidebarStatusContext);
  if (!context) {
    throw new Error("useSidebarStatusContext must be used within a SidebarStatusProvider");
  }
  return context;
}
