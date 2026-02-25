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
import { SeniorityRadarChart } from "./seniority-radar-chart";

interface Profile {
  dimensionName: string;
  dimensionFamily: string;
  maturityLevel: string;
  lastComputedAt: string;
}

interface MemberWithProfiles {
  id: number;
  githubUsername: string;
  displayName: string;
  avatarUrl: string | null;
  color: string;
  profiles: Profile[];
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
