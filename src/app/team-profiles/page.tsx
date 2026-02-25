// US-2.11: Team Profiles page — view seniority profiles for all team members
import { TeamProfilesContent } from "./team-profiles-content";

export const dynamic = "force-dynamic";

export default function TeamProfilesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <TeamProfilesContent />
    </div>
  );
}
