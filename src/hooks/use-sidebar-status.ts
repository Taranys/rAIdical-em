"use client";

import { useSidebarStatusContext } from "@/contexts/sidebar-status-context";

export interface SidebarStatus {
  settings: { configured: boolean };
  team: { configured: boolean };
  sync: { hasRun: boolean; status: "running" | "success" | "error" | null };
}

/** Returns the current sidebar status from the SidebarStatusContext. */
export function useSidebarStatus(): SidebarStatus {
  const { status } = useSidebarStatusContext();
  return status;
}
