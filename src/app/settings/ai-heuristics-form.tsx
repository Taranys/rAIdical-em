"use client";

// US-020: AI detection heuristics configuration form
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { AiHeuristicsConfig } from "@/lib/ai-detection";

interface Feedback {
  type: "success" | "error";
  message: string;
}

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinList(items: string[]): string {
  return items.join(", ");
}

export function AiHeuristicsForm() {
  const [config, setConfig] = useState<AiHeuristicsConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Track raw text inputs to avoid cursor issues with parse/join on every keystroke
  const [coAuthorText, setCoAuthorText] = useState("");
  const [authorBotText, setAuthorBotText] = useState("");
  const [branchText, setBranchText] = useState("");
  const [labelText, setLabelText] = useState("");

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/ai-heuristics");
      const data = await res.json();
      setConfig(data.config);
      setCoAuthorText(joinList(data.config.coAuthorPatterns));
      setAuthorBotText(joinList(data.config.authorBotList));
      setBranchText(joinList(data.config.branchNamePatterns));
      setLabelText(joinList(data.config.labels));
    } catch {
      setFeedback({ type: "error", message: "Failed to load configuration." });
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  function buildConfig(): AiHeuristicsConfig | null {
    if (!config) return null;
    return {
      coAuthorPatterns: parseList(coAuthorText),
      authorBotList: parseList(authorBotText),
      branchNamePatterns: parseList(branchText),
      labels: parseList(labelText),
      enabled: config.enabled,
    };
  }

  async function handleSave() {
    const toSave = buildConfig();
    if (!toSave) return;
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/settings/ai-heuristics", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: toSave }),
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({
          type: "success",
          message: "Configuration saved successfully.",
        });
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Failed to save.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to save configuration." });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReset() {
    setFeedback(null);
    try {
      await fetch("/api/settings/ai-heuristics", { method: "DELETE" });
      await loadConfig();
      setFeedback({ type: "success", message: "Reset to defaults." });
    } catch {
      setFeedback({ type: "error", message: "Failed to reset." });
    }
  }

  function toggleEnabled(key: keyof AiHeuristicsConfig["enabled"]) {
    if (!config) return;
    setConfig({
      ...config,
      enabled: { ...config.enabled, [key]: !config.enabled[key] },
    });
    setFeedback(null);
  }

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Detection Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Detection Rules</CardTitle>
        <CardDescription>
          Configure which heuristics determine whether a PR is AI-generated.
          Multiple rules can be active simultaneously.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Co-Author Pattern */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="enable-coauthor"
              checked={config.enabled.coAuthor}
              onCheckedChange={() => toggleEnabled("coAuthor")}
            />
            <Label htmlFor="enable-coauthor">
              Enable co-author detection
            </Label>
          </div>
          <Label htmlFor="coauthor-patterns">Co-author patterns</Label>
          <Input
            id="coauthor-patterns"
            placeholder="e.g., *Claude*, *Copilot*, *[bot]*"
            value={coAuthorText}
            onChange={(e) => {
              setCoAuthorText(e.target.value);
              setFeedback(null);
            }}
            disabled={!config.enabled.coAuthor}
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated glob patterns to match in Co-Authored-By trailers
          </p>
        </div>

        {/* Author Bot List */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="enable-authorbot"
              checked={config.enabled.authorBot}
              onCheckedChange={() => toggleEnabled("authorBot")}
            />
            <Label htmlFor="enable-authorbot">
              Enable author bot detection
            </Label>
          </div>
          <Label htmlFor="author-bots">Bot usernames</Label>
          <Input
            id="author-bots"
            placeholder="e.g., dependabot, renovate"
            value={authorBotText}
            onChange={(e) => {
              setAuthorBotText(e.target.value);
              setFeedback(null);
            }}
            disabled={!config.enabled.authorBot}
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated GitHub usernames of bot accounts
          </p>
        </div>

        {/* Branch Name Pattern */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="enable-branch"
              checked={config.enabled.branchName}
              onCheckedChange={() => toggleEnabled("branchName")}
            />
            <Label htmlFor="enable-branch">
              Enable branch name detection
            </Label>
          </div>
          <Label htmlFor="branch-patterns">Branch name patterns</Label>
          <Input
            id="branch-patterns"
            placeholder="e.g., ai/*, copilot/*, claude/*"
            value={branchText}
            onChange={(e) => {
              setBranchText(e.target.value);
              setFeedback(null);
            }}
            disabled={!config.enabled.branchName}
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated glob patterns to match branch names
          </p>
        </div>

        {/* Label-Based */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="enable-label"
              checked={config.enabled.label}
              onCheckedChange={() => toggleEnabled("label")}
            />
            <Label htmlFor="enable-label">Enable label detection</Label>
          </div>
          <Label htmlFor="labels">GitHub labels</Label>
          <Input
            id="labels"
            placeholder="e.g., ai-generated, ai-assisted, bot"
            value={labelText}
            onChange={(e) => {
              setLabelText(e.target.value);
              setFeedback(null);
            }}
            disabled={!config.enabled.label}
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated label names to match on PRs
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
        </div>

        {/* Feedback */}
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
