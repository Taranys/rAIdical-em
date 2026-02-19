"use client";

// US-2.17: Database import form component
import { useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function DatabaseImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setFeedback(null);
  }

  function handleImportClick() {
    setShowConfirm(true);
  }

  async function handleConfirmImport() {
    if (!file) return;

    setShowConfirm(false);
    setIsUploading(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/settings/database/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        const totalRows = Object.values(data.tables as Record<string, number>).reduce(
          (sum: number, count: number) => sum + count,
          0,
        );
        setFeedback({
          type: "success",
          message: `Database imported successfully! ${totalRows} total rows across ${Object.keys(data.tables).length} tables.`,
        });
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Failed to import database.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to import database." });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Import Database</CardTitle>
          <CardDescription>
            Replace the entire database with a SQLite file from another
            environment. This is a destructive operation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".db,.sqlite,.sqlite3"
            onChange={handleFileChange}
          />

          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleImportClick}
              disabled={!file || isUploading}
            >
              {isUploading ? "Importing..." : "Import Database"}
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
            <AlertDialogTitle>Replace entire database?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently replace ALL current data (settings, team
              members, pull requests, reviews, comments, sync history) with the
              contents of the imported file. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmImport}
            >
              Replace Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
