// US-2.07: Comment detail sheet (slide-in panel with full context)
// US-2.16: Edit classification + manual indicator
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CATEGORY_CONFIG } from "@/lib/category-colors";
import { COMMENT_CATEGORIES, type CommentCategory } from "@/lib/llm/classifier";
import { ExternalLink, FileCode, MessageSquare, UserPen } from "lucide-react";
import type { ClassifiedComment } from "./comments-table";

interface CommentDetailSheetProps {
  comment: ClassifiedComment | null;
  onClose: () => void;
  onReclassify: (
    commentType: "review_comment" | "pr_comment",
    commentId: number,
    category: string,
  ) => void;
  repoUrl: string | null;
}

export function CommentDetailSheet({
  comment,
  onClose,
  onReclassify,
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
                  {comment.isManual && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <UserPen className="h-3 w-3" data-testid="manual-indicator-detail" />
                      Manual
                    </span>
                  )}
                </div>
                {comment.reasoning && (
                  <p className="text-sm text-muted-foreground italic">
                    {comment.reasoning}
                  </p>
                )}
                {/* US-2.16: Edit classification dropdown */}
                <div className="pt-1">
                  <Select
                    value={comment.category}
                    onValueChange={(value) => {
                      onReclassify(comment.commentType, comment.commentId, value);
                    }}
                  >
                    <SelectTrigger
                      className="w-[200px] h-8 text-xs"
                      data-testid="detail-category-select"
                    >
                      <SelectValue placeholder="Change category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMENT_CATEGORIES.map((cat) => {
                        const catConfig = CATEGORY_CONFIG[cat];
                        return (
                          <SelectItem key={cat} value={cat}>
                            <span className={`${catConfig.text}`}>
                              {catConfig.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
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
