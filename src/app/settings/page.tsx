// US-005, US-006, US-020: Settings page
import { GitHubPatForm } from "./github-pat-form";
import { GitHubRepoForm } from "./github-repo-form";
import { AiHeuristicsForm } from "./ai-heuristics-form";

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Settings</h1>
      <div className="space-y-6">
        <GitHubPatForm />
        <GitHubRepoForm />
        <AiHeuristicsForm />
      </div>
    </div>
  );
}
