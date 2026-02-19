"use client";

// US-010 + US-011 + US-013 + US-025: Sync page — fetch PRs and reviews from GitHub with real-time progress, history, and quarter selector
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Users,
} from "lucide-react";
import { useSyncStatus, type SyncRun } from "@/hooks/use-sync-status";
import { getQuarterOptions, getDefaultQuarter } from "@/lib/date-periods";

interface RateLimit {
  limit: number;
  remaining: number;
  resetAt: string;
}

interface TeamMember {
  id: number;
  githubUsername: string;
  displayName: string;
}

interface ProgressData {
  teamProgress: { author: string; count: number }[];
  nonTeamCount: number;
  totalCount: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

// US-013: Format duration between two ISO timestamps
function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function SyncStatusIndicator({ syncRun }: { syncRun: SyncRun | null }) {
  if (!syncRun) {
    return (
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium text-muted-foreground">Never synced</p>
          <p className="text-sm text-muted-foreground">
            Click &quot;Sync Now&quot; to fetch pull requests from GitHub.
          </p>
        </div>
      </div>
    );
  }

  if (syncRun.status === "running") {
    return (
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
        <div>
          <p className="font-medium text-blue-600 dark:text-blue-400">
            Syncing...
          </p>
          <p className="text-sm text-muted-foreground">
            {syncRun.prCount} PRs, {syncRun.reviewCount} reviews, {syncRun.commentCount} comments fetched so
            far
          </p>
        </div>
      </div>
    );
  }

  if (syncRun.status === "error") {
    return (
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <div>
          <p className="font-medium text-destructive">Sync error</p>
          <p className="text-sm text-destructive">{syncRun.errorMessage}</p>
          {syncRun.completedAt && (
            <p className="text-sm text-muted-foreground">
              {formatDate(syncRun.completedAt)} — {syncRun.prCount} PRs,{" "}
              {syncRun.reviewCount} reviews, {syncRun.commentCount} comments fetched before error
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <CheckCircle2 className="h-5 w-5 text-green-500" />
      <div>
        <p className="font-medium text-green-600 dark:text-green-400">
          Up to date
        </p>
        <p className="text-sm text-muted-foreground">
          {syncRun.prCount} PRs, {syncRun.reviewCount} reviews, {syncRun.commentCount} comments synced
          {syncRun.completedAt && ` — ${formatDate(syncRun.completedAt)}`}
        </p>
      </div>
    </div>
  );
}

// US-013: Status badge for history table
function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "success"
      ? "default"
      : status === "error"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

// US-013: Sync history table
function SyncHistoryTable({ history }: { history: SyncRun[] }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No sync history yet.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Started</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">PRs</TableHead>
          <TableHead className="text-right">Reviews</TableHead>
          <TableHead className="text-right">Comments</TableHead>
          <TableHead>Duration</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.map((run) => (
          <TableRow key={run.id}>
            <TableCell>{formatDate(run.startedAt)}</TableCell>
            <TableCell>
              <StatusBadge status={run.status} />
            </TableCell>
            <TableCell className="text-right">{run.prCount}</TableCell>
            <TableCell className="text-right">{run.reviewCount}</TableCell>
            <TableCell className="text-right">{run.commentCount}</TableCell>
            <TableCell>
              {run.completedAt
                ? formatDuration(run.startedAt, run.completedAt)
                : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// US-025: Progress per team member
function SyncProgressCard({
  progress,
  isLoading,
}: {
  progress: ProgressData | null;
  isLoading: boolean;
}) {
  if (isLoading || !progress) return null;
  if (progress.totalCount === 0) return null;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Sync Progress by Team Member</CardTitle>
        <CardDescription>
          Total: {progress.totalCount} PRs
          {progress.nonTeamCount > 0 &&
            ` | ${progress.nonTeamCount} from non-team members`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {progress.teamProgress.map((member) => (
            <div
              key={member.author}
              className="flex items-center justify-between py-1"
            >
              <span className="text-sm font-medium">{member.author}</span>
              <Badge variant="secondary">{member.count} PRs</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SyncPage() {
  const { syncRun, history, isLoading, fetchStatus, startPolling } =
    useSyncStatus();
  const [rateLimit, setRateLimit] = useState<RateLimit | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressData | null>(null);

  // US-025: Quarter selector state
  const quarterOptions = getQuarterOptions();
  const [selectedQuarter, setSelectedQuarter] = useState(getDefaultQuarter());
  const selectedOption = quarterOptions.find(
    (q) => q.value === selectedQuarter,
  );

  const fetchRateLimit = useCallback(async () => {
    try {
      const res = await fetch("/api/sync/rate-limit");
      const data = await res.json();
      if (data.rateLimit) {
        setRateLimit(data.rateLimit);
      }
    } catch {
      // Ignore — rate limit info is optional
    }
  }, []);

  // US-025: Fetch team members to check if any exist
  const fetchTeamMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      setTeamMembers(data.members ?? []);
    } catch {
      // Ignore — will show empty state
    } finally {
      setTeamLoading(false);
    }
  }, []);

  // US-025: Fetch progress per member
  const progressPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchProgress = useCallback(
    async (sinceDate: string) => {
      try {
        const params = new URLSearchParams({ sinceDate });
        const res = await fetch(`/api/sync/progress?${params}`);
        const data = await res.json();
        setProgress(data);
      } catch {
        // Ignore
      }
    },
    [],
  );

  useEffect(() => {
    fetchRateLimit();
    fetchTeamMembers();
  }, [fetchRateLimit, fetchTeamMembers]);

  // US-025: Poll progress while sync is running
  useEffect(() => {
    if (syncRun?.status === "running" && selectedOption) {
      fetchProgress(selectedOption.startDate);
      progressPollRef.current = setInterval(() => {
        fetchProgress(selectedOption.startDate);
      }, 2000);
    } else if (syncRun?.status !== "running" && progressPollRef.current) {
      clearInterval(progressPollRef.current);
      progressPollRef.current = null;
      // Final fetch after sync completes
      if (selectedOption) {
        fetchProgress(selectedOption.startDate);
      }
    }

    return () => {
      if (progressPollRef.current) {
        clearInterval(progressPollRef.current);
        progressPollRef.current = null;
      }
    };
  }, [syncRun?.status, selectedOption, fetchProgress]);

  async function handleSync() {
    if (!selectedOption) return;
    setIsTriggering(true);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sinceDate: selectedOption.startDate }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchStatus();
        startPolling();
      }
    } catch {
      // Error will be picked up by next status fetch
    } finally {
      setIsTriggering(false);
    }
  }

  const isSyncing = syncRun?.status === "running";
  const hasTeamMembers = teamMembers.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold tracking-tight mb-6">Sync</h1>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>GitHub Pull Requests</CardTitle>
              <CardDescription>
                Sync pull requests from your configured GitHub repository.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {/* US-025: Quarter selector */}
              <Select
                value={selectedQuarter}
                onValueChange={setSelectedQuarter}
                disabled={isSyncing}
              >
                <SelectTrigger className="w-[200px]" data-testid="quarter-selector">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quarterOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleSync}
                disabled={isTriggering || isSyncing || !hasTeamMembers}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Sync Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* US-025: Team member check */}
          {!teamLoading && !hasTeamMembers ? (
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-muted-foreground">
                  No team members configured
                </p>
                <p className="text-sm text-muted-foreground">
                  <a
                    href="/team"
                    className="text-primary underline underline-offset-4"
                  >
                    Add team members
                  </a>{" "}
                  before syncing to track per-member progress.
                </p>
              </div>
            </div>
          ) : isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <SyncStatusIndicator syncRun={syncRun} />
          )}
        </CardContent>
      </Card>

      {/* US-025: Progress per team member */}
      <SyncProgressCard
        progress={progress}
        isLoading={isLoading}
      />

      {/* US-013: Sync history */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>
            Last 10 sync runs with their status and counts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <SyncHistoryTable history={history} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GitHub API Rate Limit</CardTitle>
          <CardDescription>
            Your current GitHub API usage and limits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rateLimit ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Requests remaining
                </span>
                <span className="font-mono font-medium">
                  {rateLimit.remaining} / {rateLimit.limit}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{
                    width: `${(rateLimit.remaining / rateLimit.limit) * 100}%`,
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Resets at {formatDate(rateLimit.resetAt)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Configure a GitHub PAT to see rate limit information.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
