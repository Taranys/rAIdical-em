"use client";

// US-2.01 / US-2.06: LLM provider configuration form
import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LLM_PROVIDERS,
  PROVIDER_IDS,
  type LlmProvider,
} from "@/lib/llm-providers";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AiHeuristicsForm } from "./ai-heuristics-form";

interface Feedback {
  type: "success" | "error";
  message: string;
}

export function LlmProviderForm() {
  const [provider, setProvider] = useState<LlmProvider | "">("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // US-2.06: Auto-classify toggle state
  const [autoClassifyEnabled, setAutoClassifyEnabled] = useState(true);
  const [autoClassifyLoading, setAutoClassifyLoading] = useState(true);

  const checkConfigured = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/llm-provider");
      const data = await res.json();
      setIsConfigured(data.configured);
      if (data.configured) {
        setProvider(data.provider ?? "");
        setModel(data.model ?? "");
      }
    } catch {
      // Ignore — assume not configured
    }
  }, []);

  const loadAutoClassify = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/auto-classify");
      const data = await res.json();
      setAutoClassifyEnabled(data.enabled);
    } catch {
      // Default to enabled on error
    } finally {
      setAutoClassifyLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConfigured();
    loadAutoClassify();
  }, [checkConfigured, loadAutoClassify]);

  // Reset model when provider changes
  function handleProviderChange(value: string) {
    setProvider(value as LlmProvider);
    setModel("");
    setFeedback(null);
  }

  const currentProvider = provider ? LLM_PROVIDERS[provider] : null;
  const canSave = provider && model && apiKey.trim();

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/settings/llm-provider", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model, apiKey: apiKey.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({
          type: "success",
          message: "LLM configuration saved successfully.",
        });
        setApiKey("");
        setIsConfigured(true);
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Failed to save LLM configuration.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Failed to save LLM configuration.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTestConnection() {
    setIsTesting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/settings/llm-provider/test", {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({
          type: "success",
          message: data.message || "Connection successful.",
        });
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Connection test failed.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Connection test failed." });
    } finally {
      setIsTesting(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setFeedback(null);

    try {
      await fetch("/api/settings/llm-provider", { method: "DELETE" });
      setIsConfigured(false);
      setProvider("");
      setModel("");
      setApiKey("");
      setFeedback({ type: "success", message: "LLM configuration deleted." });
    } catch {
      setFeedback({
        type: "error",
        message: "Failed to delete LLM configuration.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  // US-2.06: Toggle auto-classify with optimistic update
  async function handleAutoClassifyToggle(checked: boolean) {
    setAutoClassifyEnabled(checked);
    try {
      await fetch("/api/settings/auto-classify", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: checked }),
      });
    } catch {
      setAutoClassifyEnabled(!checked);
    }
  }

  async function handleImportClaudeCode() {
    setIsImporting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/settings/llm-provider/import-claude-code", {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setProvider(data.provider);
        setModel(data.model);
        setApiKey("");
        setIsConfigured(true);
        setFeedback({
          type: "success",
          message: data.message || "API key imported from Claude Code.",
        });
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Failed to import from Claude Code.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Failed to import from Claude Code.",
      });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI / LLM</CardTitle>
        <CardDescription>
          Configure which LLM provider and model to use for review comment
          classification and analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Provider</label>
            <Select value={provider} onValueChange={handleProviderChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_IDS.map((id) => (
                  <SelectItem key={id} value={id}>
                    {LLM_PROVIDERS[id].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <Select
              value={model}
              onValueChange={setModel}
              disabled={!provider}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {currentProvider?.models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">API Key</label>
          <div className="rounded-md border p-3 space-y-2">
            <p className="text-sm text-muted-foreground">
              Auto-detect the API key stored by Claude Code on this machine.
            </p>
            <Button
              variant="secondary"
              onClick={handleImportClaudeCode}
              disabled={isImporting}
            >
              {isImporting ? "Importing..." : "Import from Claude Code"}
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or enter manually</span>
            </div>
          </div>
          <Input
            type="password"
            placeholder={currentProvider?.placeholder ?? "API key"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="font-mono"
          />
          {isConfigured && !apiKey && (
            <p className="text-xs text-muted-foreground">
              A key is already configured. Enter a new one to replace it.
            </p>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleSave}
            disabled={isSaving || !canSave}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
          {isConfigured && (
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? "Verifying..." : "Verify Key"}
            </Button>
          )}
          {isConfigured && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>

        {feedback && (
          <p
            className={
              feedback.type === "success"
                ? "text-sm text-green-600 dark:text-green-400"
                : "text-sm text-destructive"
            }
          >
            {feedback.message}
          </p>
        )}

        {/* US-2.06: Auto-classification toggle */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-1">Auto-Classification</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Automatically classify new review comments after each GitHub sync.
          </p>
          <div className="flex items-center gap-2">
            <Checkbox
              id="auto-classify-on-sync"
              checked={autoClassifyEnabled}
              onCheckedChange={(checked) => handleAutoClassifyToggle(checked === true)}
              disabled={autoClassifyLoading || !isConfigured}
            />
            <Label htmlFor="auto-classify-on-sync">
              Enable auto-classification on sync
            </Label>
          </div>
          {!isConfigured && (
            <p className="text-xs text-muted-foreground mt-1">
              Configure an LLM provider above to enable auto-classification.
            </p>
          )}
        </div>

        {/* AI Detection Rules — embedded sub-section */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-1">AI Detection Rules</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure which heuristics determine whether a PR is AI-generated.
          </p>
          <AiHeuristicsForm embedded />
        </div>
      </CardContent>
    </Card>
  );
}
