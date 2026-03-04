"use client";

// US-005, US-006, US-020, US-2.01, US-2.17: Settings page
import { useState } from "react";
import { GitHubPatForm } from "./github-pat-form";
import { RepositoriesCard } from "./repositories-card";
import { LlmProviderForm } from "./llm-provider-form";
import { DatabaseImportForm } from "./database-import-form";
import { DatabaseResetForm } from "./database-reset-form";
import { getCardStatusClasses } from "./card-status-classes";

export default function SettingsPage() {
  const [isPatConfigured, setIsPatConfigured] = useState<boolean | undefined>(undefined);
  const [isReposConfigured, setIsReposConfigured] = useState<boolean | undefined>(undefined);
  const [isLlmConfigured, setIsLlmConfigured] = useState<boolean | undefined>(undefined);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Settings</h1>
      <div className="space-y-6">
        <GitHubPatForm className={getCardStatusClasses(isPatConfigured)} onPatChange={setIsPatConfigured} />
        <RepositoriesCard className={getCardStatusClasses(isReposConfigured)} isPatConfigured={isPatConfigured} onConfiguredChange={setIsReposConfigured} />
        <LlmProviderForm className={getCardStatusClasses(isLlmConfigured)} onConfiguredChange={setIsLlmConfigured} />
        <DatabaseImportForm />
        <DatabaseResetForm />
      </div>
    </div>
  );
}
