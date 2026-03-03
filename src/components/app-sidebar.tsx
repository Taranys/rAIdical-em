// US-023 + US-013: Application shell sidebar navigation with config status indicators
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  RefreshCw,
  Settings,
  MessageSquareText,
  Radar,
  Handshake,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tags,
} from "lucide-react";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useSidebarStatus, type SidebarStatus } from "@/hooks/use-sidebar-status";

const DASHBOARD_ITEMS = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Review Quality", href: "/review-quality", icon: MessageSquareText },
  { title: "Team Profiles", href: "/team-profiles", icon: Radar },
  { title: "1:1 Prep", href: "/one-on-one", icon: Handshake },
];

const CONFIG_ITEMS = [
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Categories", href: "/settings/categories", icon: Tags },
  { title: "Team", href: "/team", icon: Users },
  { title: "Sync", href: "/sync", icon: RefreshCw },
];

function ConfigStatusIndicator({ title, status }: { title: string; status: SidebarStatus }) {
  if (title === "Settings") {
    return status.settings.configured ? (
      <CheckCircle2 data-testid="status-settings" className="ml-auto size-4 text-green-600" />
    ) : (
      <AlertCircle data-testid="status-settings" className="ml-auto size-4 text-amber-500" />
    );
  }

  if (title === "Team") {
    return status.team.configured ? (
      <CheckCircle2 data-testid="status-team" className="ml-auto size-4 text-green-600" />
    ) : (
      <AlertCircle data-testid="status-team" className="ml-auto size-4 text-amber-500" />
    );
  }

  if (title === "Sync") {
    const { hasRun, status: syncStatus } = status.sync;
    if (syncStatus === "running") {
      return <Loader2 data-testid="status-sync" className="ml-auto size-4 animate-spin text-blue-500" />;
    }
    if (syncStatus === "success") {
      return <CheckCircle2 data-testid="status-sync" className="ml-auto size-4 text-green-600" />;
    }
    if (syncStatus === "error") {
      return <AlertCircle data-testid="status-sync" className="ml-auto size-4 text-red-500" />;
    }
    if (!hasRun) {
      return <AlertCircle data-testid="status-sync" className="ml-auto size-4 text-amber-500" />;
    }
  }

  return null;
}

export function AppSidebar() {
  const pathname = usePathname();
  const sidebarStatus = useSidebarStatus();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <span className="text-lg font-bold">rAIdical-em</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Analyse</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {DASHBOARD_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {CONFIG_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                      <ConfigStatusIndicator title={item.title} status={sidebarStatus} />
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
