"use client";

import { Suspense } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PeriodSelector } from "@/app/period-selector";
import { RepoSelector } from "@/components/repo-selector";

export function AppHeader() {
  return (
    <header className="flex h-12 items-center gap-2 border-b px-4 print:hidden">
      <SidebarTrigger />
      <Suspense>
        <RepoSelector />
      </Suspense>
      <div className="ml-auto">
        <PeriodSelector />
      </div>
    </header>
  );
}
