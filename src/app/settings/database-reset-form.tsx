"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

interface Feedback {
  type: "success" | "error";
  message: string;
}

export function DatabaseResetForm() {
  const [isResetting, setIsResetting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleResetClick() {
    setShowConfirm(true);
  }

  async function handleConfirmReset() {
    setShowConfirm(false);
    setIsResetting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/settings/database/reset", {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({
          type: "success",
          message:
            "Database reset successfully. All data has been cleared — you can now reconfigure your settings.",
        });
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Failed to reset database.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to reset database." });
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Reset Database</CardTitle>
          <CardDescription>
            Delete all data and start fresh with an empty database. Use this if
            you encounter encryption errors after a hostname change.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleResetClick}
              disabled={isResetting}
            >
              {isResetting ? "Resetting..." : "Reset Database"}
            </Button>
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
        </CardContent>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset entire database?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete ALL current data (settings, team
              members, pull requests, reviews, comments, sync history) and create
              a fresh empty database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmReset}
            >
              Reset Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
