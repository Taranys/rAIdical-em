"use client";

// US-021: AI vs Human authorship ratio — stacked bar chart + team aggregate
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePeriod } from "./dashboard-context";

interface RawRow {
  author: string;
  aiGenerated: string;
  count: number;
}

interface TotalRow {
  aiGenerated: string;
  count: number;
}

interface ChartRow {
  author: string;
  human: number;
  ai: number;
  mixed: number;
  bot: number;
  total: number;
}

interface PrDetail {
  number: number;
  title: string;
  aiGenerated: string;
  classificationReason: string | null;
  createdAt: string;
  state: string;
}

const COLORS = {
  human: "hsl(142 71% 45%)", // green
  ai: "hsl(262 83% 58%)", // violet
  mixed: "hsl(32 95% 44%)", // orange
  bot: "hsl(210 10% 58%)", // gray
};

const BADGE_CLASSES: Record<string, string> = {
  human: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  ai: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  mixed: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  bot: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

function buildChartData(raw: RawRow[]): ChartRow[] {
  const map = new Map<string, ChartRow>();

  for (const row of raw) {
    let entry = map.get(row.author);
    if (!entry) {
      entry = { author: row.author, human: 0, ai: 0, mixed: 0, bot: 0, total: 0 };
      map.set(row.author, entry);
    }
    const key = row.aiGenerated as keyof typeof COLORS;
    if (key in entry) {
      entry[key] = row.count;
    }
    entry.total += row.count;
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export function AiRatioCard() {
  const { period } = usePeriod();
  const [byMember, setByMember] = useState<RawRow[]>([]);
  const [teamTotal, setTeamTotal] = useState<TotalRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchIdRef = useRef(0);

  // Expandable details state
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [prDetails, setPrDetails] = useState<PrDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Reclassify button state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback((startDate: string, endDate: string) => {
    const id = ++fetchIdRef.current;
    const params = new URLSearchParams({ startDate, endDate });

    fetch(`/api/dashboard/ai-ratio?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (id !== fetchIdRef.current) return;
        setByMember(json.byMember ?? []);
        setTeamTotal(json.teamTotal ?? []);
        setSelectedAuthor(null);
        setPrDetails([]);
        setIsLoading(false);
      })
      .catch(() => {
        if (id !== fetchIdRef.current) return;
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData(period.startDate, period.endDate);
  }, [period.startDate, period.endDate, fetchData]);

  // Cleanup poll on unmount
  useEffect(() => {
    return () => {
      if (syncPollRef.current) clearInterval(syncPollRef.current);
    };
  }, []);

  const fetchDetails = useCallback((author: string) => {
    setDetailsLoading(true);
    const params = new URLSearchParams({
      author,
      startDate: period.startDate,
      endDate: period.endDate,
    });
    fetch(`/api/dashboard/ai-ratio/details?${params}`)
      .then((res) => res.json())
      .then((json) => {
        setPrDetails(json.prs ?? []);
        setDetailsLoading(false);
      })
      .catch(() => {
        setDetailsLoading(false);
      });
  }, [period.startDate, period.endDate]);

  const handleBarClick = (data: { author?: string; activeLabel?: string }) => {
    const author = data.author ?? data.activeLabel;
    if (!author) return;
    if (selectedAuthor === author) {
      setSelectedAuthor(null);
      setPrDetails([]);
    } else {
      setSelectedAuthor(author);
      fetchDetails(author);
    }
  };

  const handleReclassify = async () => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.status === 409) {
        setSyncError("Un sync est déjà en cours");
        setIsSyncing(false);
        return;
      }

      if (!res.ok) {
        const json = await res.json();
        setSyncError(json.error ?? "Erreur lors du sync");
        setIsSyncing(false);
        return;
      }

      // Poll sync status until complete
      syncPollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch("/api/sync");
          const status = await statusRes.json();
          const syncRun = status.syncRun;
          if (syncRun && syncRun.status !== "running") {
            if (syncPollRef.current) clearInterval(syncPollRef.current);
            syncPollRef.current = null;
            setIsSyncing(false);
            if (syncRun.status === "error") {
              setSyncError(syncRun.errorMessage ?? "Erreur pendant le sync");
            } else {
              // Refresh data
              setSelectedAuthor(null);
              setPrDetails([]);
              fetchData(period.startDate, period.endDate);
            }
          }
        } catch {
          // Continue polling
        }
      }, 2000);
    } catch {
      setSyncError("Erreur réseau");
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI vs Human Authorship</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" data-testid="ai-ratio-skeleton" />
        </CardContent>
      </Card>
    );
  }

  const chartData = buildChartData(byMember);
  const totalPRs = teamTotal.reduce((sum, t) => sum + t.count, 0);
  const aiCount = teamTotal.find((t) => t.aiGenerated === "ai")?.count ?? 0;
  const humanCount = teamTotal.find((t) => t.aiGenerated === "human")?.count ?? 0;
  const mixedCount = teamTotal.find((t) => t.aiGenerated === "mixed")?.count ?? 0;
  const botCount = teamTotal.find((t) => t.aiGenerated === "bot")?.count ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI vs Human Authorship</CardTitle>
            <CardDescription>
              {totalPRs} PR{totalPRs !== 1 ? "s" : ""} — {humanCount} human,{" "}
              {aiCount} AI, {mixedCount} mixed, {botCount} bot during {period.label}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReclassify}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sync en cours…
              </>
            ) : (
              "Reclassifier"
            )}
          </Button>
        </div>
        {syncError && (
          <p className="text-sm text-destructive mt-2">{syncError}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-8">
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No PRs found for the selected period. Make sure you have team
            members configured and have synced your GitHub data.
          </p>
        ) : (
          <>
            {/* Stacked bar chart per member */}
            <div>
              <h3 className="text-sm font-medium mb-4">By team member</h3>
              <p className="text-xs text-muted-foreground mb-2">
                Cliquez sur une barre pour voir le détail des PRs
              </p>
              <ResponsiveContainer
                width="100%"
                height={Math.max(200, chartData.length * 50)}
              >
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 20, right: 20 }}
                  onClick={(data) => {
                    if (data?.activeLabel) {
                      handleBarClick({ activeLabel: String(data.activeLabel) });
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="author" type="category" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="human"
                    name="Human"
                    stackId="a"
                    fill={COLORS.human}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={`human-${entry.author}`}
                        opacity={selectedAuthor && selectedAuthor !== entry.author ? 0.4 : 1}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="ai"
                    name="AI"
                    stackId="a"
                    fill={COLORS.ai}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={`ai-${entry.author}`}
                        opacity={selectedAuthor && selectedAuthor !== entry.author ? 0.4 : 1}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="mixed"
                    name="Mixed"
                    stackId="a"
                    fill={COLORS.mixed}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={`mixed-${entry.author}`}
                        opacity={selectedAuthor && selectedAuthor !== entry.author ? 0.4 : 1}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="bot"
                    name="Bot"
                    stackId="a"
                    fill={COLORS.bot}
                    radius={[0, 4, 4, 0]}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={`bot-${entry.author}`}
                        opacity={selectedAuthor && selectedAuthor !== entry.author ? 0.4 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Expandable PR details */}
            {selectedAuthor && (
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">
                    PRs de {selectedAuthor}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSelectedAuthor(null); setPrDetails([]); }}
                  >
                    Fermer
                  </Button>
                </div>
                {detailsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : prDetails.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune PR trouvée pour cette période.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {prDetails.map((pr) => (
                      <div
                        key={pr.number}
                        className="flex items-start gap-3 p-2 rounded bg-background border text-sm"
                      >
                        <span className="font-mono text-muted-foreground shrink-0">
                          #{pr.number}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{pr.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {pr.classificationReason ?? "Raison non disponible — resynchroniser"}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={BADGE_CLASSES[pr.aiGenerated] ?? ""}
                        >
                          {pr.aiGenerated}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Team aggregate */}
            <div>
              <h3 className="text-sm font-medium mb-4">Team aggregate</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: COLORS.human }}
                  />
                  <span className="text-sm">
                    Human: {humanCount} (
                    {totalPRs > 0
                      ? ((humanCount / totalPRs) * 100).toFixed(0)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: COLORS.ai }}
                  />
                  <span className="text-sm">
                    AI: {aiCount} (
                    {totalPRs > 0
                      ? ((aiCount / totalPRs) * 100).toFixed(0)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: COLORS.mixed }}
                  />
                  <span className="text-sm">
                    Mixed: {mixedCount} (
                    {totalPRs > 0
                      ? ((mixedCount / totalPRs) * 100).toFixed(0)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: COLORS.bot }}
                  />
                  <span className="text-sm">
                    Bot: {botCount} (
                    {totalPRs > 0
                      ? ((botCount / totalPRs) * 100).toFixed(0)
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
