// US-005, US-006: Settings page with GitHub PAT and repository configuration
import { GitHubPatForm } from "./github-pat-form";
import { GitHubRepoForm } from "./github-repo-form";

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Settings</h1>
      <div className="space-y-6">
        <GitHubPatForm />
        <GitHubRepoForm />
      </div>
    </div>
  );
}
