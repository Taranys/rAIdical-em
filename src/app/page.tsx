// US-019 + US-015: Dashboard page — metrics filtered by period selector
import { GitHubSetupCta } from "./github-setup-cta";
import { DashboardContent } from "./dashboard-content";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <GitHubSetupCta />
      <DashboardContent />
    </div>
  );
}
