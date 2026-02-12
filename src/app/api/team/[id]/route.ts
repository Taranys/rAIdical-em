// US-008: Delete (deactivate) a team member by ID
import { NextResponse } from "next/server";
import { deactivateTeamMember } from "@/db/team-members";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: "Invalid team member ID" },
      { status: 400 },
    );
  }

  const deactivated = deactivateTeamMember(id);

  if (!deactivated) {
    return NextResponse.json(
      { error: "Team member not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ message: "Team member removed successfully" });
}
