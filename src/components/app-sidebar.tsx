// US-023 + US-013: Application shell sidebar navigation with sync status
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, RefreshCw, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Team", href: "/team", icon: Users },
  { title: "Sync", href: "/sync", icon: RefreshCw },
  { title: "Settings", href: "/settings", icon: Settings },
];

// US-013: Sync status emoji indicator
type SyncStatus = "running" | "success" | "error" | null;

async function fetchSyncStatusFromApi(): Promise<SyncStatus> {
  try {
    const res = await fetch("/api/sync");
    const data = await res.json();
    return data.syncRun?.status ?? null;
  } catch {
    return null;
  }
}

const SYNC_STATUS_EMOJI: Record<"running" | "success" | "error", string> = {
  running: "🔄",
  success: "✅",
  error: "❌",
};

function SyncStatusIndicator({ status }: { status: "running" | "success" | "error" }) {
  return (
    <span
      data-testid="sync-status-dot"
      className="ml-auto text-xs"
      title={`Sync: ${status}`}
    >
      {SYNC_STATUS_EMOJI[status]}
    </span>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const status = await fetchSyncStatusFromApi();
      if (cancelled) return;
      setSyncStatus(status);

      if (status === "running") {
        pollRef.current = setInterval(async () => {
          const s = await fetchSyncStatusFromApi();
          if (cancelled) return;
          setSyncStatus(s);
          if (s && s !== "running") {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          }
        }, 2000);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <span className="text-lg font-bold">em-control-tower</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                      {item.title === "Sync" && syncStatus && (
                        <SyncStatusIndicator status={syncStatus} />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
