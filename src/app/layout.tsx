// US-023: Application shell with sidebar navigation
import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { AppProviders } from "@/components/app-providers";
import { VibeKanbanDevTools } from "@/components/vibe-kanban-web-companion";

export const metadata: Metadata = {
  title: "EM Lighthouse",
  description:
    "EM Lighthouse — Track team performance, review quality, and prepare better 1:1s.",
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
        <AppProviders>
          <SidebarProvider>
            <Suspense>
              <AppSidebar />
            </Suspense>
            <SidebarInset>
              <AppHeader />
              <main className="flex-1">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </AppProviders>
      </body>
    </html>
  );
}
