import { checkDbHealth } from "@/db/health";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default function Home() {
  const dbHealth = checkDbHealth();

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          em-control-tower
        </h1>
        <p className="text-muted-foreground text-lg">
          Engineering Manager Control Tower — Track team performance, review
          quality, and prepare better 1:1s.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Next.js
                <Badge variant="default">Working</Badge>
              </CardTitle>
              <CardDescription>
                App Router + Server Components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                If you can see this page, Next.js App Router is working
                correctly.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Tailwind CSS
                <Badge variant="default">Working</Badge>
              </CardTitle>
              <CardDescription>Utility-first CSS framework</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This card is styled with Tailwind CSS utility classes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                shadcn/ui
                <Badge variant="default">Working</Badge>
              </CardTitle>
              <CardDescription>Accessible component library</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This Card and Badge are shadcn/ui components.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                SQLite + Drizzle
                <Badge
                  variant={dbHealth.connected ? "default" : "destructive"}
                >
                  {dbHealth.connected ? "Connected" : "Error"}
                </Badge>
              </CardTitle>
              <CardDescription>
                better-sqlite3 + Drizzle ORM
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dbHealth.connected ? (
                <div className="text-sm space-y-1">
                  <p>SQLite version: {dbHealth.sqliteVersion}</p>
                  <p>Tables: {dbHealth.tableCount}</p>
                  <p className="text-muted-foreground">
                    DB: {dbHealth.dbPath}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-destructive">{dbHealth.error}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Octokit
                <Badge variant="secondary">Installed</Badge>
              </CardTitle>
              <CardDescription>GitHub API client</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Octokit is installed and ready for Phase 1 (GitHub integration).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                TypeScript
                <Badge variant="default">Working</Badge>
              </CardTitle>
              <CardDescription>Strict type checking enabled</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Full TypeScript with strict mode across the entire project.
              </p>
            </CardContent>
          </Card>
        </div>

      <div className="text-center mt-12 text-sm text-muted-foreground">
        <p>Phase 0 — Project skeleton. All technical bricks verified.</p>
      </div>
    </div>
  );
}
