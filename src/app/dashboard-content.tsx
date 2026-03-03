"use client";

// US-015 + US-019 + US-016 + US-017 + US-018 + US-021: Dashboard client shell — wraps metric cards with global PeriodProvider
import { TeamColorsProvider } from "./team-colors-context";
import { PrsOpenedCard } from "./prs-opened-card";
import { PrsMergedCard } from "./prs-merged-card";
import { PrSizeCard } from "./pr-size-card";
import { PrsReviewedCard } from "./prs-reviewed-card";
import { CommentsPerReviewCard } from "./comments-per-review-card";
import { AiRatioCard } from "./ai-ratio-card";

export function DashboardContent() {
  return (
    <TeamColorsProvider>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <div className="grid gap-6">
        <PrsOpenedCard />
        <PrsMergedCard />
        <PrSizeCard />
        <PrsReviewedCard />
        <CommentsPerReviewCard />
        <AiRatioCard />
      </div>
    </TeamColorsProvider>
  );
}
