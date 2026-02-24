// US-2.05: Batch classification service
import { createLLMServiceFromSettings } from "@/lib/llm";
import type { LLMService } from "@/lib/llm";
import {
  buildClassificationPrompt,
  parseClassificationResponse,
  isClassificationError,
} from "@/lib/llm/classifier";
import { getSetting } from "@/db/settings";
import {
  createClassificationRun,
  updateClassificationRunProgress,
  completeClassificationRun,
} from "@/db/classification-runs";
import {
  getUnclassifiedReviewComments,
  getUnclassifiedPrComments,
  insertClassification,
  getClassificationSummary,
  type CommentToClassify,
} from "@/db/comment-classifications";

export interface ClassifyOptions {
  batchSize?: number;
  // Dependency injection for testing
  llmService?: LLMService;
}

export interface ClassifyResult {
  runId: number;
  status: "success" | "error";
  commentsProcessed: number;
  totalComments: number;
  errors: number;
  summary: {
    categories: { category: string; count: number }[];
    totalClassified: number;
    averageConfidence: number;
  };
}

// US-2.05: Main entry point for batch classification
export async function classifyComments(
  options: ClassifyOptions = {},
): Promise<ClassifyResult> {
  const { batchSize = 10 } = options;

  const modelUsed = getSetting("llm_model") ?? "unknown";
  const llmService = options.llmService ?? createLLMServiceFromSettings();

  // Create a classification run
  const run = createClassificationRun(modelUsed);

  // Gather all unclassified comments
  const unclassifiedReviewComments = getUnclassifiedReviewComments();
  const unclassifiedPrComments = getUnclassifiedPrComments();
  const allComments: CommentToClassify[] = [
    ...unclassifiedReviewComments,
    ...unclassifiedPrComments,
  ];

  const totalComments = allComments.length;

  if (totalComments === 0) {
    completeClassificationRun(run.id, "success", 0, 0);
    return {
      runId: run.id,
      status: "success",
      commentsProcessed: 0,
      totalComments: 0,
      errors: 0,
      summary: { categories: [], totalClassified: 0, averageConfidence: 0 },
    };
  }

  let commentsProcessed = 0;
  let errors = 0;

  // Process in batches
  for (let i = 0; i < allComments.length; i += batchSize) {
    const batch = allComments.slice(i, i + batchSize);

    for (const comment of batch) {
      try {
        const prompt = buildClassificationPrompt({
          body: comment.body,
          filePath: comment.filePath ?? undefined,
          prTitle: comment.prTitle,
        });

        const response = await llmService.classify(prompt);
        const result = parseClassificationResponse(response.content);

        if (isClassificationError(result)) {
          errors++;
        } else {
          insertClassification({
            commentType: comment.commentType,
            commentId: comment.commentId,
            category: result.category,
            confidence: result.confidence,
            modelUsed,
            classificationRunId: run.id,
            reasoning: result.reasoning,
          });
          commentsProcessed++;
        }
      } catch {
        errors++;
      }
    }

    // Update progress after each batch
    updateClassificationRunProgress(run.id, commentsProcessed, errors);
  }

  // Complete the run
  const finalStatus = commentsProcessed > 0 ? "success" : "error";
  completeClassificationRun(run.id, finalStatus, commentsProcessed, errors);

  const summary = getClassificationSummary(run.id);

  return {
    runId: run.id,
    status: finalStatus,
    commentsProcessed,
    totalComments,
    errors,
    summary,
  };
}
