"use client";

// US-2.01: LLM provider configuration form
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
  const [feedback, setFeedback] = useState<Feedback | null>(null);

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

  useEffect(() => {
    checkConfigured();
  }, [checkConfigured]);

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

        <div>
          <label className="text-sm font-medium">API Key</label>
          <Input
            type="password"
            placeholder={currentProvider?.placeholder ?? "API key"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="mt-2 font-mono"
          />
          {isConfigured && !apiKey && (
            <p className="text-xs text-muted-foreground mt-1">
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
              {isTesting ? "Testing..." : "Test Connection"}
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
      </CardContent>
    </Card>
  );
}
