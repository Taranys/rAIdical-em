"use client";

// US-007, US-008, US-024: Team members page with add/remove/import member functionality
import { useCallback, useEffect, useState } from "react";
import { ImportGitHubSheet } from "./import-github-sheet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TeamMember {
  id: number;
  githubUsername: string;
  displayName: string;
  avatarUrl: string | null;
  color: string;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

// US-009: Format ISO date string for display
function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface Feedback {
  type: "success" | "error";
  message: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      setMembers(data.members);
    } catch {
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setFeedback({
          type: "success",
          message: `Successfully added ${data.member.displayName} (@${data.member.githubUsername})`,
        });
        setUsername("");
        fetchMembers();
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Failed to add team member.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to add team member." });
    } finally {
      setIsSubmitting(false);
    }
  }

  // US-008: Remove a team member
  async function handleRemove(member: TeamMember) {
    setRemovingId(member.id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/team/${member.id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        setFeedback({
          type: "success",
          message: `Successfully removed ${member.displayName} (@${member.githubUsername})`,
        });
        fetchMembers();
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Failed to remove team member.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to remove team member." });
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold tracking-tight">Team Members</h1>
        {/* US-024: Import from GitHub button */}
        <Button variant="outline" onClick={() => setIsImportOpen(true)}>
          Import from GitHub
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add Team Member</CardTitle>
          <CardDescription>
            Enter a GitHub username to add a team member. The app will validate
            the username and fetch their profile information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">GitHub Username</Label>
              <div className="flex gap-2">
                <Input
                  id="username"
                  type="text"
                  placeholder="octocat"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                />
                <Button
                  type="submit"
                  disabled={isSubmitting || !username.trim()}
                >
                  {isSubmitting ? "Adding..." : "Add Member"}
                </Button>
              </div>
            </div>

            {feedback && (
              <p
                className={
                  feedback.type === "success"
                    ? "text-sm text-green-600 dark:text-green-400"
                    : "text-sm text-destructive"
                }
              >
                {feedback.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team ({members.length})</CardTitle>
          <CardDescription>
            All registered team members tracked by the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : members.length === 0 ? (
            <p className="text-muted-foreground">
              No team members yet. Add your first member above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>GitHub Username</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={member.avatarUrl ?? undefined}
                            alt={member.displayName}
                          />
                          <AvatarFallback>
                            {member.displayName
                              .substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className="inline-block h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: member.color }}
                          data-testid="member-color-dot"
                        />
                        <span className="font-semibold">
                          {member.displayName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      @{member.githubUsername}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(member.createdAt)}
                    </TableCell>
                    {/* US-008: Remove button */}
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={removingId === member.id}
                        onClick={() => setMemberToRemove(member)}
                      >
                        {removingId === member.id ? "Removing..." : "Remove"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* US-008: Confirmation dialog for removing a team member */}
      <AlertDialog
        open={memberToRemove !== null}
        onOpenChange={(open) => {
          if (!open) setMemberToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{memberToRemove?.displayName}</strong> (@
              {memberToRemove?.githubUsername}) from the team? Their historical
              data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (memberToRemove) handleRemove(memberToRemove);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* US-024: Import from GitHub sheet */}
      <ImportGitHubSheet
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        existingMembers={members.map((m) => m.githubUsername)}
        onImportComplete={fetchMembers}
      />
    </div>
  );
}
