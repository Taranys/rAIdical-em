// Seniority dimension configuration page
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pencil,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Loader2,
  GripVertical,
} from "lucide-react";

interface DimensionConfig {
  id: number;
  name: string;
  family: "technical" | "soft_skill";
  label: string;
  description: string;
  sourceCategories: string | null;
  isEnabled: number;
  sortOrder: number;
}

interface Category {
  id: number;
  slug: string;
  label: string;
}

interface EditingDimension {
  id: number | null;
  name: string;
  family: "technical" | "soft_skill";
  label: string;
  description: string;
  sourceCategories: string[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export default function DimensionsPage() {
  const [dimensions, setDimensions] = useState<DimensionConfig[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingDimension | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [dimRes, catRes] = await Promise.all([
        fetch("/api/settings/seniority-dimensions"),
        fetch("/api/categories"),
      ]);
      setDimensions(await dimRes.json());
      setCategories(await catRes.json());
      setLoading(false);
    }
    load();
  }, []);

  const fetchDimensions = useCallback(async () => {
    const res = await fetch("/api/settings/seniority-dimensions");
    const data = await res.json();
    setDimensions(data);
  }, []);

  async function handleSave() {
    if (!editing) return;
    setError(null);

    const payload = {
      name: editing.name,
      family: editing.family,
      label: editing.label,
      description: editing.description,
      sourceCategories: editing.family === "technical" ? editing.sourceCategories : undefined,
    };

    if (editing.id === null) {
      const res = await fetch("/api/settings/seniority-dimensions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create dimension");
        return;
      }
    } else {
      const res = await fetch(`/api/settings/seniority-dimensions/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: editing.label,
          description: editing.description,
          sourceCategories: editing.family === "technical" ? editing.sourceCategories : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update dimension");
        return;
      }
    }

    setEditing(null);
    await fetchDimensions();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/settings/seniority-dimensions/${id}`, { method: "DELETE" });
    await fetchDimensions();
  }

  async function handleToggleEnabled(id: number, currentEnabled: number) {
    await fetch(`/api/settings/seniority-dimensions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isEnabled: currentEnabled === 1 ? 0 : 1 }),
    });
    await fetchDimensions();
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const newDims = [...dimensions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newDims.length) return;

    [newDims[index], newDims[targetIndex]] = [newDims[targetIndex], newDims[index]];
    setDimensions(newDims);

    await fetch("/api/settings/seniority-dimensions/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: newDims.map((d) => d.id) }),
    });
  }

  async function handleReset() {
    const res = await fetch("/api/settings/seniority-dimensions/reset", { method: "POST" });
    const data = await res.json();
    setDimensions(data);
  }

  function startNew() {
    setEditing({ id: null, name: "", family: "soft_skill", label: "", description: "", sourceCategories: [] });
    setError(null);
  }

  function startEdit(dim: DimensionConfig) {
    const parsedCategories = dim.sourceCategories ? JSON.parse(dim.sourceCategories) : [];
    setEditing({
      id: dim.id,
      name: dim.name,
      family: dim.family,
      label: dim.label,
      description: dim.description,
      sourceCategories: parsedCategories,
    });
    setError(null);
  }

  function toggleSourceCategory(slug: string) {
    if (!editing) return;
    const current = editing.sourceCategories;
    if (current.includes(slug)) {
      setEditing({ ...editing, sourceCategories: current.filter((s) => s !== slug) });
    } else {
      setEditing({ ...editing, sourceCategories: [...current, slug] });
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold tracking-tight mb-8">Competencies</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading dimensions...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Competencies</h1>
          <p className="text-muted-foreground mt-1">
            Configure which competencies are tracked for your team&apos;s review profiles.
          </p>
        </div>
      </div>

      {/* Dimension list */}
      <div className="space-y-2 mb-6">
        {dimensions.map((dim, index) => (
          <Card key={dim.id} className={`py-0 ${dim.isEnabled === 0 ? "opacity-50" : ""}`}>
            <CardContent className="flex items-center gap-4 py-3">
              <GripVertical className="size-4 text-muted-foreground shrink-0" />

              {/* Family badge */}
              <Badge variant={dim.family === "technical" ? "default" : "secondary"} className="shrink-0 text-xs">
                {dim.family === "technical" ? "Tech" : "Soft"}
              </Badge>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{dim.label}</span>
                  <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {dim.name}
                  </code>
                </div>
                <p className="text-sm text-muted-foreground truncate">{dim.description}</p>
              </div>

              {/* Enable/disable toggle */}
              <Switch
                checked={dim.isEnabled === 1}
                onCheckedChange={() => handleToggleEnabled(dim.id, dim.isEnabled)}
              />

              {/* Move buttons */}
              <div className="flex flex-col gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={index === 0}
                  onClick={() => handleMove(index, "up")}
                >
                  <ChevronUp className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={index === dimensions.length - 1}
                  onClick={() => handleMove(index, "down")}
                >
                  <ChevronDown className="size-3" />
                </Button>
              </div>

              {/* Edit */}
              <Button variant="ghost" size="icon" onClick={() => startEdit(dim)}>
                <Pencil className="size-4" />
              </Button>

              {/* Delete */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" type="button">
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete dimension &quot;{dim.label}&quot;?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove this dimension configuration. Existing profile data for this dimension will become orphaned.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(dim.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit form */}
      {editing ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editing.id === null ? "Add Dimension" : "Edit Dimension"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="dim-label">Label</Label>
                <Input
                  id="dim-label"
                  value={editing.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setEditing({
                      ...editing,
                      label,
                      name: editing.id === null ? slugify(label) : editing.name,
                    });
                  }}
                  placeholder="e.g. Observability"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dim-name">Name (slug)</Label>
                <Input
                  id="dim-name"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="e.g. observability"
                  disabled={editing.id !== null}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="dim-family">Family</Label>
              {editing.id !== null ? (
                <div className="flex items-center gap-2">
                  <Badge variant={editing.family === "technical" ? "default" : "secondary"}>
                    {editing.family === "technical" ? "Technical" : "Soft Skill"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">(cannot be changed after creation)</span>
                </div>
              ) : (
                <Select
                  value={editing.family}
                  onValueChange={(val: "technical" | "soft_skill") => setEditing({ ...editing, family: val, sourceCategories: [] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="soft_skill">Soft Skill</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="dim-description">Description</Label>
              <textarea
                id="dim-description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="Describe what this dimension measures..."
              />
            </div>
            {editing.family === "technical" && (
              <div className="space-y-1">
                <Label>Source Categories</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select which comment classification categories map to this dimension.
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => toggleSourceCategory(cat.slug)}
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                        editing.sourceCategories.includes(cat.slug)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={
                  !editing.name ||
                  !editing.label ||
                  !editing.description ||
                  (editing.family === "technical" && editing.sourceCategories.length === 0)
                }
              >
                {editing.id === null ? "Add" : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" onClick={startNew} className="mb-6">
          <Plus className="size-4 mr-2" /> Add Dimension
        </Button>
      )}

      {/* Action buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Reset dimension configuration to defaults.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <RotateCcw className="size-4 mr-2" /> Reset to Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset to default dimensions?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all custom dimensions and restore the 8 default dimensions (4 technical + 4 soft skills). Existing seniority profiles will need recomputation.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
