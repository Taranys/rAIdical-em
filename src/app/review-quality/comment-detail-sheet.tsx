// US-2.07: Comment detail sheet (slide-in panel with full context)
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CATEGORY_CONFIG } from "@/lib/category-colors";
import type { CommentCategory } from "@/lib/llm/classifier";
import { ExternalLink, FileCode, MessageSquare } from "lucide-react";
import type { ClassifiedComment } from "./comments-table";

interface CommentDetailSheetProps {
  comment: ClassifiedComment | null;
  onClose: () => void;
  repoUrl: string | null;
}

export function CommentDetailSheet({
  comment,
  onClose,
  repoUrl,
}: CommentDetailSheetProps) {
  if (!comment) return null;

  const config = comment.category
    ? CATEGORY_CONFIG[comment.category as CommentCategory]
    : null;

  return (
    <Sheet open={!!comment} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comment Detail
          </SheetTitle>
          <SheetDescription>
            By {comment.reviewer} on{" "}
            {new Date(comment.createdAt).toLocaleDateString()}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Classification */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Classification
            </h3>
            {comment.category && config ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={`${config.bg} ${config.text} border-0`}>
                    {config.label}
                  </Badge>
                  <span className="text-sm font-mono">
                    {comment.confidence}% confidence
                  </span>
                </div>
                {comment.reasoning && (
                  <p className="text-sm text-muted-foreground italic">
                    {comment.reasoning}
                  </p>
                )}
              </div>
            ) : (
              <Badge variant="outline" className="opacity-50">
                Pending classification
              </Badge>
            )}
          </div>

          <Separator />

          {/* Comment body */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Comment
            </h3>
            <div className="text-sm whitespace-pre-wrap bg-muted rounded-md p-3">
              {comment.body}
            </div>
          </div>

          <Separator />

          {/* File path */}
          {comment.filePath && (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  File
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {comment.filePath}
                  </code>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* PR link */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Pull Request
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span>{comment.prTitle}</span>
              {repoUrl && (
                <a
                  href={`${repoUrl}/pull/${comment.prNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  #{comment.prNumber}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
