// Custom category management page
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Pencil,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  RefreshCw,
  Loader2,
  GripVertical,
} from "lucide-react";

interface Category {
  id: number;
  slug: string;
  label: string;
  description: string;
  color: string;
  sortOrder: number;
}

interface EditingCategory {
  id: number | null; // null = new category
  slug: string;
  label: string;
  description: string;
  color: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; slug: string; count: number } | null>(null);
  const [reclassifying, setReclassifying] = useState(false);
  const [reclassifyResult, setReclassifyResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // --- CRUD handlers ---

  async function handleSave() {
    if (!editing) return;
    setError(null);

    const payload = {
      slug: editing.slug,
      label: editing.label,
      description: editing.description,
      color: editing.color,
    };

    if (editing.id === null) {
      // Create
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create category");
        return;
      }
    } else {
      // Update
      const res = await fetch(`/api/categories/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update category");
        return;
      }
    }

    setEditing(null);
    await fetchCategories();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    setDeleteTarget(null);
    await fetchCategories();
  }

  async function prepareDelete(cat: Category) {
    const res = await fetch(`/api/categories`);
    const allCats = await res.json();
    // We don't have per-category count from the list endpoint,
    // so we fetch it from the delete endpoint info
    setDeleteTarget({ id: cat.id, slug: cat.slug, count: 0 });
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const newCategories = [...categories];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCategories.length) return;

    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];

    setCategories(newCategories);
    await fetch("/api/categories/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: newCategories.map((c) => c.id) }),
    });
  }

  async function handleReset() {
    const res = await fetch("/api/categories/reset", { method: "POST" });
    const data = await res.json();
    setCategories(data);
  }

  async function handleReclassify() {
    setReclassifying(true);
    setReclassifyResult(null);
    try {
      const res = await fetch("/api/categories/reclassify", { method: "POST" });
      const data = await res.json();
      setReclassifyResult(
        `Classification complete: ${data.commentsProcessed} comments processed, ${data.errors} errors.`,
      );
    } catch {
      setReclassifyResult("Reclassification failed.");
    } finally {
      setReclassifying(false);
    }
  }

  function startNew() {
    setEditing({ id: null, slug: "", label: "", description: "", color: "#6b7280" });
    setError(null);
  }

  function startEdit(cat: Category) {
    setEditing({ id: cat.id, slug: cat.slug, label: cat.label, description: cat.description, color: cat.color });
    setError(null);
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold tracking-tight mb-8">Skills</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading categories...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Skills</h1>
          <p className="text-muted-foreground mt-1">
            Define the review skills used by the LLM to classify review comments.
          </p>
        </div>
      </div>

      {/* Category list */}
      <div className="space-y-2 mb-6">
        {categories.map((cat, index) => (
          <Card key={cat.id} className="py-0">
            <CardContent className="flex items-center gap-4 py-3">
              <GripVertical className="size-4 text-muted-foreground shrink-0" />

              {/* Color swatch */}
              <div
                className="size-6 rounded-full border shrink-0"
                style={{ backgroundColor: cat.color }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{cat.label}</span>
                  <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {cat.slug}
                  </code>
                </div>
                <p className="text-sm text-muted-foreground truncate">{cat.description}</p>
              </div>

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
                  disabled={index === categories.length - 1}
                  onClick={() => handleMove(index, "down")}
                >
                  <ChevronDown className="size-3" />
                </Button>
              </div>

              {/* Edit / Delete */}
              <Button variant="ghost" size="icon" onClick={() => startEdit(cat)}>
                <Pencil className="size-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => prepareDelete(cat)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete category &quot;{cat.label}&quot;?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the category. Existing classifications using this category will become orphaned.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(cat.id)}>Delete</AlertDialogAction>
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
            <CardTitle>{editing.id === null ? "Add Category" : "Edit Category"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="cat-label">Label</Label>
                <Input
                  id="cat-label"
                  value={editing.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setEditing({
                      ...editing,
                      label,
                      // Auto-generate slug only for new categories
                      slug: editing.id === null ? slugify(label) : editing.slug,
                    });
                  }}
                  placeholder="e.g. Accessibility"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cat-slug">Slug</Label>
                <Input
                  id="cat-slug"
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  placeholder="e.g. accessibility"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cat-description">LLM Description</Label>
              <textarea
                id="cat-description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="Describe how the LLM should identify this category..."
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cat-color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="cat-color"
                  type="color"
                  value={editing.color}
                  onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                  className="size-10 rounded border cursor-pointer"
                />
                <Input
                  value={editing.color}
                  onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                  className="w-[120px]"
                  placeholder="#6b7280"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!editing.slug || !editing.label || !editing.description}>
                {editing.id === null ? "Add" : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" onClick={startNew} className="mb-6">
          <Plus className="size-4 mr-2" /> Add Category
        </Button>
      )}

      {/* Action buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Manage categories and reclassify existing comments.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <RotateCcw className="size-4 mr-2" /> Reset to Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset to default categories?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all custom categories and restore the 8 default categories. Existing classifications will not be affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={reclassifying}>
                {reclassifying ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="size-4 mr-2" />
                )}
                Reclassify All Comments
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reclassify all comments?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all LLM-generated classifications and re-run classification using the current categories. Manual classifications will be preserved. This may take a while.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReclassify}>Reclassify</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
        {reclassifyResult && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">{reclassifyResult}</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
