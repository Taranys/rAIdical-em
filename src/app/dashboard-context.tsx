"use client";

// US-019: Dashboard period context — provides global date range to all metric cards
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  type DateRange,
  type PeriodPreset,
  getDateRangeForPreset,
} from "@/lib/date-periods";

interface PeriodContextValue {
  period: DateRange;
  preset: PeriodPreset;
  setPeriod: (preset: PeriodPreset) => void;
}

const PeriodContext = createContext<PeriodContextValue | null>(null);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [preset, setPreset] = useState<PeriodPreset>("this-month");
  const period = getDateRangeForPreset(preset);

  return (
    <PeriodContext.Provider value={{ period, preset, setPeriod: setPreset }}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod(): PeriodContextValue {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error("usePeriod must be used within PeriodProvider");
  return ctx;
}
