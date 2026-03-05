"use client";

import type { ReactNode } from "react";
import { PeriodProvider } from "@/app/dashboard-context";
import { SidebarStatusProvider } from "@/contexts/sidebar-status-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SidebarStatusProvider>
      <PeriodProvider>{children}</PeriodProvider>
    </SidebarStatusProvider>
  );
}
