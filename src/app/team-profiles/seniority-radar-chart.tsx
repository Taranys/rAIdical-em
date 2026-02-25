// US-2.11: Spider/radar chart for seniority profiles
"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const MATURITY_LEVELS: Record<string, number> = {
  junior: 1,
  experienced: 2,
  senior: 3,
};

const MATURITY_LABELS: Record<number, string> = {
  1: "Junior",
  2: "Experienced",
  3: "Senior",
};

interface Profile {
  dimensionName: string;
  dimensionFamily: string;
  maturityLevel: string;
}

interface SeniorityRadarChartProps {
  profiles: Profile[];
  color: string;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  payload: { dimension: string; level: number; label: string };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload?.[0]) return null;
  const entry = payload[0];
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{entry.payload.dimension}</p>
      <p className="text-muted-foreground">{entry.payload.label}</p>
    </div>
  );
}

function formatDimensionName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SeniorityRadarChart({
  profiles,
  color,
}: SeniorityRadarChartProps) {
  if (profiles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No seniority profile computed yet.
      </p>
    );
  }

  const chartData = profiles.map((p) => ({
    dimension: formatDimensionName(p.dimensionName),
    level: MATURITY_LEVELS[p.maturityLevel] ?? 0,
    label: MATURITY_LABELS[MATURITY_LEVELS[p.maturityLevel] ?? 0] ?? "Unknown",
    fullMark: 3,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fontSize: 11 }}
        />
        <PolarRadiusAxis
          domain={[0, 3]}
          tickCount={4}
          tick={{ fontSize: 10 }}
          tickFormatter={(value: number) => MATURITY_LABELS[value] ?? ""}
        />
        <Radar
          dataKey="level"
          stroke={color}
          fill={color}
          fillOpacity={0.25}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
