// US-023: Application shell with sidebar navigation
import type { Metadata } from "next";
import "./globals.css";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { VibeKanbanDevTools } from "@/components/vibe-kanban-web-companion";

export const metadata: Metadata = {
  title: "rAIdical-em",
  description:
    "rAIdical-em — Track team performance, review quality, and prepare better 1:1s.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <VibeKanbanDevTools />
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-12 items-center gap-2 border-b px-4">
              <SidebarTrigger />
            </header>
            <main className="flex-1">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
