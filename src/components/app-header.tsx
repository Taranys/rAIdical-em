"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { PeriodSelector } from "@/app/period-selector";

export function AppHeader() {
  return (
    <header className="flex h-12 items-center gap-2 border-b px-4 print:hidden">
      <SidebarTrigger />
      <div className="ml-auto">
        <PeriodSelector />
      </div>
    </header>
  );
}
