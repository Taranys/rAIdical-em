// US-005: Dashboard CTA when no GitHub PAT is configured
import { hasSetting } from "@/db/settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function GitHubSetupCta() {
  const isConfigured = hasSetting("github_pat");
  if (isConfigured) return null;

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 mb-6">
      <CardHeader>
        <CardTitle>GitHub Connection Required</CardTitle>
        <CardDescription>
          Connect your GitHub account to start tracking team performance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          A Personal Access Token (PAT) is needed to fetch pull requests,
          reviews, and comments from your repositories.
        </p>
        <Button asChild>
          <Link href="/settings">Configure GitHub PAT</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
