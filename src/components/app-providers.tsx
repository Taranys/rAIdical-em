"use client";

import type { ReactNode } from "react";
import { PeriodProvider } from "@/app/dashboard-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return <PeriodProvider>{children}</PeriodProvider>;
}
