// US-010: Sync API route with SSE streaming
import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { getSetting } from "@/db/settings";
import { upsertPullRequests } from "@/db/pull-requests";
import { createSyncRun, completeSyncRun, failSyncRun } from "@/db/sync-runs";
import { syncPullRequests } from "@/lib/sync-service";

export const dynamic = "force-dynamic";

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST() {
  const token = getSetting("github_pat");
  const owner = getSetting("github_owner");
  const repo = getSetting("github_repo");

  if (!token || !owner || !repo) {
    return NextResponse.json(
      { error: "GitHub PAT and repository must be configured" },
      { status: 400 },
    );
  }

  const repository = `${owner}/${repo}`;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(event, data)));
      };

      let syncRun: { id: number } | undefined;
      try {
        syncRun = createSyncRun(repository);
        send("sync:start", { syncRunId: syncRun.id, repository });

        const octokit = new Octokit({ auth: token });
        const result = await syncPullRequests(
          octokit,
          owner,
          repo,
          upsertPullRequests,
          {
            onProgress: (progress) => {
              send("sync:progress", {
                fetched: progress.fetched,
                currentPage: progress.currentPage,
              });
            },
            onError: (message) => {
              send("sync:error", {
                message,
                syncRunId: syncRun?.id ?? null,
              });
            },
          },
        );

        completeSyncRun(syncRun.id, result.prCount);
        send("sync:complete", {
          syncRunId: syncRun.id,
          prCount: result.prCount,
          durationMs: result.durationMs,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Sync failed";
        if (syncRun) {
          failSyncRun(syncRun.id, message);
        }
        send("sync:error", { message, syncRunId: syncRun?.id ?? null });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
