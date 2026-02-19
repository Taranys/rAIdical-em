"use client";

// Shared context providing team member color mapping to all dashboard cards
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { buildTeamColorMap } from "@/lib/team-colors";

const TeamColorsContext = createContext<Record<string, string>>({});

export function TeamColorsProvider({ children }: { children: ReactNode }) {
  const [colorMap, setColorMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        if (data.members) {
          setColorMap(buildTeamColorMap(data.members));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <TeamColorsContext.Provider value={colorMap}>
      {children}
    </TeamColorsContext.Provider>
  );
}

export function useTeamColors(): Record<string, string> {
  return useContext(TeamColorsContext);
}
