"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Pencil, Search, Tags, Trash2 } from "lucide-react";
import { adminRequest, revalidateSite } from "@/lib/admin/api";
import { useToast } from "@/components/ui/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  AdminButton, Card, EmptyState, ErrorState, Field, Modal, PageHeader, Skeleton, TextInput,
} from "@/components/admin/ui";

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [filter, setFilter] = useState("");
  const [renaming, setRenaming] = useState(null);
  const [newName, setNewName] = useState("");
  const [deleting, setDeleting] = useState(null);

  const query = useQuery({ queryKey: ["admin", "categories"], queryFn: () => adminRequest("/categories") });
  const rows = useMemo(
    () => (query.data?.data || []).filter((c) => c.category.includes(filter.trim().toLowerCase())),
    [query.data, filter]
  );
  const existing = useMemo(() => new Set((query.data?.data || []).map((c) => c.category)), [query.data]);

  const onDone = (message) => {
    showToast(message, "success");
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    revalidateSite([]);
  };

  const rename = useMutation({
    mutationFn: ({ from, to }) => adminRequest("/categories/rename", { method: "POST", body: { from, to } }),
    onSuccess: (res) => {
      onDone(`Renamed on ${res.data.updated} peptide${res.data.updated === 1 ? "" : "s"}`);
      setRenaming(null);
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const remove = useMutation({
    mutationFn: (name) => adminRequest("/categories/delete", { method: "POST", body: { name } }),
    onSuccess: (res) => {
      onDone(`Removed from ${res.data.updated} peptide${res.data.updated === 1 ? "" : "s"}`);
      setDeleting(null);
    },
    onError: (err) => { showToast(err.message, "error"); setDeleting(null); },
  });

  const target = newName.replace(/\s+/g, " ").trim().toLowerCase();
  const merging = renaming && target && target !== renaming.category && existing.has(target);
  const renameError = !target ? "Enter a name." : target.length > 100 ? "Keep it under 100 characters." : target === renaming?.category ? "That's the current name." : "";

  return (
    <>
      <PageHeader
        title="Categories"
        description="Health categories power the library filters and related-protocol links. Rename or merge them here; assign them on each peptide."
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <TextInput value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter categories…" aria-label="Filter categories" className="pl-10" />
          </div>
          <p className="text-sm font-medium text-slate-500">{query.data ? `${query.data.data.length} categories` : ""}</p>
        </div>

        {query.isError ? (
          <ErrorState error={query.error} onRetry={query.refetch} />
        ) : query.isLoading ? (
          <div className="space-y-3 p-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Tags} title={filter ? "No categories match" : "No categories yet"} description={filter ? "Try another search." : "Add categories from a peptide's edit page."} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((c) => (
              <li key={c.category} className="group flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/70">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Tags className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold capitalize text-slate-900">{c.category}</p>
                  <p className="text-xs text-slate-400">{c.active} live · {c.total - c.active} hidden</p>
                </div>
                <Link href={`/admin/peptides?category=${encodeURIComponent(c.category)}`} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                  {c.total} peptide{c.total === 1 ? "" : "s"} <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <div className="flex items-center gap-1">
                  <AdminButton size="sm" variant="ghost" icon={Pencil} onClick={() => { setRenaming(c); setNewName(c.category); }}>Rename</AdminButton>
                  <button type="button" aria-label={`Remove ${c.category}`} onClick={() => setDeleting(c)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={Boolean(renaming)}
        title="Rename category"
        description={renaming ? `Updates ${renaming.total} peptide${renaming.total === 1 ? "" : "s"} using “${renaming.category}”.` : ""}
        onClose={() => setRenaming(null)}
        busy={rename.isPending}
        footer={
          <>
            <AdminButton variant="ghost" onClick={() => setRenaming(null)} disabled={rename.isPending}>Cancel</AdminButton>
            <AdminButton variant="navy" loading={rename.isPending} disabled={Boolean(renameError)} onClick={() => rename.mutate({ from: renaming.category, to: target })}>
              {merging ? "Merge categories" : "Rename"}
            </AdminButton>
          </>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); if (!renameError) rename.mutate({ from: renaming.category, to: target }); }}>
          <Field label="New name" htmlFor="cat-name" hint={merging ? `“${target}” already exists — the two will be merged without duplicates.` : "Stored in lowercase."}>
            <TextInput id="cat-name" autoFocus value={newName} maxLength={100} onChange={(e) => setNewName(e.target.value)} />
          </Field>
        </form>
      </Modal>

      {deleting && (
        <ConfirmDialog
          title={`Remove “${deleting.category}”?`}
          message={`The category will be removed from ${deleting.total} peptide${deleting.total === 1 ? "" : "s"}. The peptides themselves are not affected.`}
          confirmLabel="Remove category"
          loading={remove.isPending}
          onConfirm={() => remove.mutate(deleting.category)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
