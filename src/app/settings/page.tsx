// US-005: Settings page with GitHub PAT configuration
import { GitHubPatForm } from "./github-pat-form";

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Settings</h1>
      <GitHubPatForm />
    </div>
  );
}
