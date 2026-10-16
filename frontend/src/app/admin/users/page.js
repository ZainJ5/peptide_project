"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, Users } from "lucide-react";
import { adminRequest } from "@/lib/admin/api";
import { useToast } from "@/components/ui/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  AdminButton, Badge, Card, EmptyState, ErrorState, PageHeader, SelectInput, Skeleton, TextInput, cx, formatDate,
} from "@/components/admin/ui";

const PAGE_SIZE = 25;

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const qs = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE), status, ...(search ? { search } : {}) }).toString();
  const query = useQuery({ queryKey: ["admin", "users", qs], queryFn: () => adminRequest(`/users?${qs}`), placeholderData: keepPreviousData });

  const setActive = useMutation({
    mutationFn: ({ id, isActive }) => adminRequest(`/users/${id}/status`, { method: "PATCH", body: { isActive } }),
    onSuccess: (res) => {
      showToast(res.data.isActive ? "Account reactivated" : "Account deactivated — the user can no longer sign in", "success");
      setPending(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err) => { showToast(err.message, "error"); setPending(null); },
  });

  const rows = query.data?.data || [];
  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader title="Users" description="Registered website and app accounts. Deactivating an account blocks sign-in without deleting data." />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <TextInput value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by name or email…" aria-label="Search users" className="pl-10" />
          </div>
          <SelectInput aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="sm:w-44">
            <option value="all">All accounts</option>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
          </SelectInput>
        </div>

        {query.isError ? (
          <ErrorState error={query.error} onRetry={query.refetch} />
        ) : query.isLoading ? (
          <div className="space-y-3 p-5">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Users} title="No users found" description={search || status !== "all" ? "Try a different search or filter." : "Nobody has registered yet."} />
        ) : (
          <>
            <div className={cx("overflow-x-auto", query.isFetching && "opacity-70")}>
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3">User</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Schedules</th>
                    <th className="px-3 py-3">Joined</th>
                    <th className="px-5 py-3 text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((u) => {
                    const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email.split("@")[0];
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold text-white">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">{name} {u.role === "admin" && <Badge tone="blue" className="ml-1">Admin</Badge>}</p>
                              <p className="truncate text-xs text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {u.isActive ? <Badge tone="green" dot>Active</Badge> : <Badge tone="red" dot>Deactivated</Badge>}
                            {!u.isVerified && <Badge tone="amber">Unverified</Badge>}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-slate-600 tabular-nums">{u.scheduleCount}</td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                        <td className="px-5 py-3.5 text-right">
                          {u.isActive ? (
                            <AdminButton size="sm" variant="dangerSoft" onClick={() => setPending(u)}>Deactivate</AdminButton>
                          ) : (
                            <AdminButton size="sm" loading={setActive.isPending && setActive.variables?.id === u.id} onClick={() => setActive.mutate({ id: u.id, isActive: true })}>Reactivate</AdminButton>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
              <p className="text-xs font-medium text-slate-500">{total.toLocaleString()} account{total === 1 ? "" : "s"}</p>
              <div className="flex items-center gap-1.5">
                <AdminButton size="icon" aria-label="Previous page" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage(page - 1)} />
                <span className="px-2 text-xs font-semibold text-slate-600 tabular-nums">{page} / {pages}</span>
                <AdminButton size="icon" aria-label="Next page" icon={ChevronRight} disabled={page >= pages} onClick={() => setPage(page + 1)} />
              </div>
            </div>
          </>
        )}
      </Card>

      {pending && (
        <ConfirmDialog
          title={`Deactivate ${pending.email}?`}
          message="They will be signed out and unable to sign in until reactivated. Their schedules and posts are kept."
          confirmLabel="Deactivate"
          loading={setActive.isPending}
          onConfirm={() => setActive.mutate({ id: pending.id, isActive: false })}
          onCancel={() => setPending(null)}
        />
      )}
    </>
  );
}
