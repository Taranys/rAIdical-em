// US-2.11: Team profiles page content — member cards with radar charts
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SeniorityRadarChart, formatDimensionName } from "./seniority-radar-chart";
import type { Profile, SupportingMetrics } from "./seniority-radar-chart";

interface ProfileWithTimestamp extends Profile {
  lastComputedAt: string;
}

interface MemberWithProfiles {
  id: number;
  githubUsername: string;
  displayName: string;
  avatarUrl: string | null;
  color: string;
  profiles: ProfileWithTimestamp[];
}

const MATURITY_COLORS: Record<string, string> = {
  senior: "bg-green-100 text-green-800",
  experienced: "bg-blue-100 text-blue-800",
  junior: "bg-orange-100 text-orange-800",
};

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      <span className="font-medium">{label}:</span> {value}
    </span>
  );
}

function DimensionRow({ profile }: { profile: ProfileWithTimestamp }) {
  const [expanded, setExpanded] = useState(false);
  const metrics = profile.supportingMetrics;
  const hasMetrics = metrics != null;

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${!hasMetrics ? "cursor-default" : ""}`}
        onClick={() => hasMetrics && setExpanded(!expanded)}
        disabled={!hasMetrics}
      >
        <span className="flex items-center gap-2">
          <span>{formatDimensionName(profile.dimensionName)}</span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${MATURITY_COLORS[profile.maturityLevel] ?? ""}`}>
            {profile.maturityLevel.charAt(0).toUpperCase() + profile.maturityLevel.slice(1)}
          </span>
          {profile.dimensionFamily === "soft_skill" && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">soft skill</Badge>
          )}
        </span>
        {hasMetrics ? (
          <span className="text-muted-foreground text-xs">{expanded ? "▲" : "▼"}</span>
        ) : (
          <span className="text-muted-foreground text-xs">No details available</span>
        )}
      </button>
      {expanded && hasMetrics && (
        <DimensionDetails metrics={metrics} family={profile.dimensionFamily} />
      )}
    </div>
  );
}

function DimensionDetails({ metrics, family }: { metrics: SupportingMetrics; family: string }) {
  return (
    <div className="px-3 pb-3 space-y-2">
      {metrics.rationale && (
        <p className="text-sm text-muted-foreground italic">{metrics.rationale}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {family === "technical" ? (
          <>
            {metrics.depthScore != null && (
              <MetricPill label="Depth" value={`${Math.round(metrics.depthScore)}/100`} />
            )}
            {metrics.volume != null && (
              <MetricPill label="Comments" value={String(metrics.volume)} />
            )}
            {metrics.highValueRatio != null && (
              <MetricPill label="High-value" value={`${Math.round(metrics.highValueRatio * 100)}%`} />
            )}
          </>
        ) : (
          <>
            {metrics.llmScore != null && (
              <MetricPill label="LLM Score" value={`${metrics.llmScore}/100`} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function TeamProfilesContent() {
  const [members, setMembers] = useState<MemberWithProfiles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function fetchData() {
      try {
        const res = await fetch("/api/team-profiles");
        const data = await res.json();
        setMembers(data.members ?? []);
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight mb-6">
        Team Profiles
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[380px] w-full" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <p className="text-muted-foreground">
          No team members found. Add members on the Team page first.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {members.map((member) => (
            <Card key={member.id} data-testid="member-profile-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={member.avatarUrl ?? undefined}
                      alt={member.displayName}
                    />
                    <AvatarFallback>
                      {member.displayName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className="inline-block h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: member.color }}
                  />
                  <div>
                    <CardTitle className="text-lg">
                      {member.displayName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      @{member.githubUsername}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <SeniorityRadarChart
                  profiles={member.profiles}
                  color={member.color}
                />
                {member.profiles.length > 0 && (
                  <div className="mt-4 rounded-md border">
                    {member.profiles.map((profile) => (
                      <DimensionRow
                        key={`${profile.dimensionFamily}-${profile.dimensionName}`}
                        profile={profile}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
