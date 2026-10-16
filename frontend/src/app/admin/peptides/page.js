"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft, ChevronRight, Copy, ExternalLink, FlaskConical, MoreHorizontal, Pencil, Plus, Search, Trash2, X,
} from "lucide-react";
import { adminRequest, revalidateSite } from "@/lib/admin/api";
import { useToast } from "@/components/ui/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  AdminButton, Badge, Card, EmptyState, ErrorState, PageHeader, SelectInput, Skeleton, StatusBadge, Switch, cx, timeAgo,
} from "@/components/admin/ui";

const PAGE_SIZE = 25;
const ISSUE_LABELS = {
  missingOverview: "Missing overview",
  missingDosing: "Missing dosing table",
  missingCategories: "Uncategorised",
  missingImage: "No protocol image",
};
const DEFAULTS = { search: "", status: "all", type: "", category: "", sort: "name", issue: "", page: 1 };

function readUrlFilters() {
  if (typeof window === "undefined") return DEFAULTS;
  const q = new URLSearchParams(window.location.search);
  return {
    search: q.get("search") || "",
    status: ["active", "inactive"].includes(q.get("status")) ? q.get("status") : "all",
    type: ["single", "blend"].includes(q.get("type")) ? q.get("type") : "",
    category: q.get("category") || "",
    sort: ["updated", "created"].includes(q.get("sort")) ? q.get("sort") : "name",
    issue: ISSUE_LABELS[q.get("issue")] ? q.get("issue") : "",
    page: Math.max(1, parseInt(q.get("page") || "1", 10) || 1),
  };
}

function RowMenu({ peptide, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const item = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors";
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`More actions for ${peptide.name}`}
        aria-expanded={open}
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
          {peptide.isActive && (
            <a href={`/library/${peptide.slug}`} target="_blank" rel="noopener noreferrer" className={cx(item, "text-slate-700 hover:bg-slate-50")}>
              <ExternalLink className="h-4 w-4 text-slate-400" /> View on site
            </a>
          )}
          <button type="button" onClick={() => { setOpen(false); onDuplicate(peptide); }} className={cx(item, "text-slate-700 hover:bg-slate-50")}>
            <Copy className="h-4 w-4 text-slate-400" /> Duplicate
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button type="button" onClick={() => { setOpen(false); onDelete(peptide); }} className={cx(item, "text-red-600 hover:bg-red-50")}>
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminPeptidesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [filters, setFilters] = useState(DEFAULTS);
  const [searchInput, setSearchInput] = useState("");
  const [ready, setReady] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const initial = readUrlFilters();
    setFilters(initial);
    setSearchInput(initial.search);
    setReady(true);
  }, []);

  // Debounce search input into filters.
  useEffect(() => {
    if (!ready) return undefined;
    const t = setTimeout(() => {
      setFilters((f) => (f.search === searchInput.trim() ? f : { ...f, search: searchInput.trim(), page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, ready]);

  // Keep the URL shareable / back-button friendly.
  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== DEFAULTS[k]) q.set(k, String(v));
    });
    const qs = q.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [filters, ready]);

  const update = (patch) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));

  const queryString = useMemo(() => {
    const q = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String((filters.page - 1) * PAGE_SIZE), sort: filters.sort, status: filters.status });
    if (filters.search) q.set("search", filters.search);
    if (filters.type) q.set("type", filters.type);
    if (filters.category) q.set("category", filters.category);
    if (filters.issue) q.set("issue", filters.issue);
    return q.toString();
  }, [filters]);

  const list = useQuery({
    queryKey: ["admin", "peptides", queryString],
    queryFn: () => adminRequest(`/peptides?${queryString}`),
    enabled: ready,
    placeholderData: keepPreviousData,
  });
  const categories = useQuery({ queryKey: ["admin", "categories"], queryFn: () => adminRequest("/categories") });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
  };

  const toggleStatus = useMutation({
    mutationFn: ({ id, isActive }) => adminRequest(`/peptides/${id}/status`, { method: "PATCH", body: { isActive } }),
    onSuccess: (res) => {
      showToast(res.data.isActive ? "Peptide is now live on the site" : "Peptide hidden from the site", "success");
      revalidateSite([res.data.slug]);
      invalidate();
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const duplicate = useMutation({
    mutationFn: (p) => adminRequest(`/peptides/${p.id}/duplicate`, { method: "POST" }),
    onSuccess: (res) => {
      showToast("Copy created as a hidden draft", "success");
      invalidate();
      router.push(`/admin/peptides/${res.data.id}`);
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const remove = useMutation({
    mutationFn: (p) => adminRequest(`/peptides/${p.id}`, { method: "DELETE" }),
    onSuccess: (res) => {
      showToast("Peptide deleted", "success");
      revalidateSite([res.data.slug]);
      setDeleting(null);
      invalidate();
    },
    onError: (err) => {
      showToast(err.message, "error");
      setDeleting(null);
    },
  });

  const total = list.data?.total ?? 0;
  const rows = list.data?.data ?? [];
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = filters.search || filters.type || filters.category || filters.issue || filters.status !== "all";

  const statusTabs = [
    { value: "all", label: "All" },
    { value: "active", label: "Live" },
    { value: "inactive", label: "Hidden" },
  ];

  return (
    <>
      <PageHeader
        title="Peptides"
        description="Create, edit and publish peptide protocols shown in the public library."
        actions={
          <Link href="/admin/peptides/new">
            <AdminButton variant="primary" icon={Plus}>New peptide</AdminButton>
          </Link>
        }
      />

      <Card className="overflow-visible">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {statusTabs.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => update({ status: t.value })}
                className={cx(
                  "rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all",
                  filters.status === t.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, title, slug or vial size…"
              aria-label="Search peptides"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-sm placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            />
            {searchInput && (
              <button type="button" onClick={() => setSearchInput("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex">
            <SelectInput aria-label="Type" value={filters.type} onChange={(e) => update({ type: e.target.value })} className="lg:w-32">
              <option value="">All types</option>
              <option value="single">Singles</option>
              <option value="blend">Blends</option>
            </SelectInput>
            <SelectInput aria-label="Category" value={filters.category} onChange={(e) => update({ category: e.target.value })} className="order-first col-span-2 sm:order-none sm:col-span-1 lg:w-48">
              <option value="">All categories</option>
              {(categories.data?.data || []).map((c) => (
                <option key={c.category} value={c.category}>{c.category} ({c.total})</option>
              ))}
            </SelectInput>
            <SelectInput aria-label="Sort" value={filters.sort} onChange={(e) => update({ sort: e.target.value })} className="lg:w-40">
              <option value="name">Name A–Z</option>
              <option value="updated">Recently updated</option>
              <option value="created">Newest first</option>
            </SelectInput>
          </div>
        </div>

        {(filters.issue || hasFilters) && (
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-4 py-2.5 text-sm">
            <span className="font-medium text-slate-500">{list.isFetching ? "Filtering…" : `${total} result${total === 1 ? "" : "s"}`}</span>
            {filters.issue && (
              <button type="button" onClick={() => update({ issue: "" })} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20 hover:bg-amber-100">
                {ISSUE_LABELS[filters.issue]} <X className="h-3 w-3" />
              </button>
            )}
            <button type="button" onClick={() => { setSearchInput(""); setFilters({ ...DEFAULTS, sort: filters.sort }); }} className="ml-auto text-xs font-semibold text-emerald-700 hover:underline">
              Clear filters
            </button>
          </div>
        )}

        {list.isError ? (
          <ErrorState error={list.error} onRetry={list.refetch} />
        ) : list.isLoading || !ready ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4"><Skeleton className="h-10 w-10 rounded-xl" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-6 w-16 rounded-full" /></div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title={hasFilters ? "No peptides match these filters" : "No peptides yet"}
            description={hasFilters ? "Try a different search or clear the filters." : "Create the first protocol to populate the library."}
            action={!hasFilters && <Link href="/admin/peptides/new"><AdminButton variant="primary" icon={Plus}>New peptide</AdminButton></Link>}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className={cx("hidden md:block", list.isFetching && "opacity-70 transition-opacity")}>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="w-[36%] px-5 py-3">Peptide</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="hidden w-[22%] px-3 py-3 xl:table-cell">Categories</th>
                    <th className="px-3 py-3">Dosing</th>
                    <th className="px-3 py-3">Updated</th>
                    <th className="px-3 py-3">Live</th>
                    <th className="w-24 px-5 py-3 text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((p) => (
                    <tr key={p.id} className="group transition-colors hover:bg-slate-50/70">
                      <td className="max-w-0 px-5 py-3.5">
                        <Link href={`/admin/peptides/${p.id}`} className="flex items-center gap-3">
                          <div className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold", p.type === "blend" ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-600")}>
                            {p.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900 group-hover:text-emerald-600">
                              {p.name} {p.mgAmount && <span className="font-medium text-slate-400">· {p.mgAmount}</span>}
                            </p>
                            <p className="truncate text-xs text-slate-400">/library/{p.slug}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-3.5"><Badge tone={p.type === "blend" ? "violet" : "blue"}>{p.type === "blend" ? "Blend" : "Single"}</Badge></td>
                      <td className="hidden max-w-0 px-3 py-3.5 xl:table-cell">
                        <p className="truncate text-xs capitalize text-slate-500">{p.healthCategories?.length ? p.healthCategories.join(", ") : <span className="text-amber-600">None</span>}</p>
                      </td>
                      <td className="px-3 py-3.5">
                        {p.dosingStepCount > 0
                          ? <span className="text-xs font-semibold text-slate-600">{p.dosingStepCount} step{p.dosingStepCount === 1 ? "" : "s"}</span>
                          : <Badge tone="amber">Missing</Badge>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-xs text-slate-500">{timeAgo(p.updatedAt)}</td>
                      <td className="px-3 py-3.5">
                        <Switch
                          size="sm"
                          checked={p.isActive}
                          disabled={toggleStatus.isPending && toggleStatus.variables?.id === p.id}
                          label={`${p.isActive ? "Hide" : "Publish"} ${p.name}`}
                          onChange={(isActive) => toggleStatus.mutate({ id: p.id, isActive })}
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/peptides/${p.id}`} aria-label={`Edit ${p.name}`} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-600">
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <RowMenu peptide={p} onDuplicate={(x) => duplicate.mutate(x)} onDelete={setDeleting} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {rows.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                  <Link href={`/admin/peptides/${p.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{p.name} {p.mgAmount && <span className="text-slate-400">· {p.mgAmount}</span>}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge active={p.isActive} />
                      <span className="text-xs text-slate-400">{p.dosingStepCount} step{p.dosingStepCount === 1 ? "" : "s"} · {timeAgo(p.updatedAt)}</span>
                    </div>
                  </Link>
                  <Switch size="sm" checked={p.isActive} label={`${p.isActive ? "Hide" : "Publish"} ${p.name}`} onChange={(isActive) => toggleStatus.mutate({ id: p.id, isActive })} />
                  <RowMenu peptide={p} onDuplicate={(x) => duplicate.mutate(x)} onDelete={setDeleting} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
              <p className="text-xs font-medium text-slate-500">
                Showing <span className="font-semibold text-slate-700">{(filters.page - 1) * PAGE_SIZE + 1}–{Math.min(filters.page * PAGE_SIZE, total)}</span> of <span className="font-semibold text-slate-700">{total}</span>
              </p>
              <div className="flex items-center gap-1.5">
                <AdminButton size="icon" aria-label="Previous page" icon={ChevronLeft} disabled={filters.page <= 1} onClick={() => update({ page: filters.page - 1 })} />
                <span className="px-2 text-xs font-semibold text-slate-600 tabular-nums">{filters.page} / {pages}</span>
                <AdminButton size="icon" aria-label="Next page" icon={ChevronRight} disabled={filters.page >= pages} onClick={() => update({ page: filters.page + 1 })} />
              </div>
            </div>
          </>
        )}
      </Card>

      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.name}${deleting.mgAmount ? ` ${deleting.mgAmount}` : ""}?`}
          message="This permanently removes the protocol, its dosing table and any community posts about it. To take it off the site but keep the data, hide it instead."
          confirmLabel="Delete permanently"
          loading={remove.isPending}
          onConfirm={() => remove.mutate(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
