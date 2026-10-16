"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpDown, CalendarRange, ChevronRight, EyeOff, FileText, FlaskConical, ImageOff, Layers, ListChecks, Plus, Tags, Users,
} from "lucide-react";
import { adminRequest } from "@/lib/admin/api";
import { useAdminStore } from "@/lib/admin/store";
import {
  AdminButton, Badge, Card, ErrorState, PageHeader, Skeleton, StatusBadge, cx, timeAgo,
} from "@/components/admin/ui";

function StatCard({ label, value, icon: Icon, tone = "blue", sub, href }) {
  const tones = {
    blue: "bg-sky-50 text-sky-600",
    green: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };
  const body = (
    <Card className={cx("group h-full p-5 transition-all", href && "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md")}>
      <div className="flex items-start justify-between">
        <div className={cx("flex h-10 w-10 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </div>
        {href && <ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500" />}
      </div>
      <p className="mt-4 text-[28px] font-extrabold leading-none tracking-tight text-slate-900 tabular-nums">
        {value ?? "—"}
      </p>
      <p className="mt-1.5 text-[13px] font-semibold text-slate-500">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function HealthRow({ icon: Icon, label, count, href, hint }) {
  const ok = count === 0;
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-slate-50">
      <div className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", ok ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-400">{hint}</p>
      </div>
      {ok ? <Badge tone="green">All good</Badge> : <Badge tone="amber">{count}</Badge>}
      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
    </Link>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function AdminDashboardPage() {
  const admin = useAdminStore((s) => s.admin);
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: () => adminRequest("/stats") });
  const d = stats.data?.data;
  const p = d?.peptides;

  return (
    <>
      <PageHeader
        title={`${greeting()}${admin?.displayName ? `, ${admin.displayName}` : ""}`}
        description="Here's an overview of the peptide library and website activity."
        actions={
          <Link href="/admin/peptides/new">
            <AdminButton variant="primary" icon={Plus}>New peptide</AdminButton>
          </Link>
        }
      />

      {stats.isError ? (
        <Card><ErrorState error={stats.error} onRetry={stats.refetch} /></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {stats.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[150px] rounded-2xl" />)
            ) : (
              <>
                <StatCard label="Live peptides" value={p.active} icon={FlaskConical} tone="green" sub={`${p.hidden} hidden · ${p.total} total`} href="/admin/peptides?status=active" />
                <StatCard label="Singles / Blends" value={`${p.singles} / ${p.blends}`} icon={Layers} tone="blue" sub="Protocol types" href="/admin/peptides" />
                <StatCard label="Registered users" value={d.users.toLocaleString()} icon={Users} tone="violet" href="/admin/users" />
                <StatCard label="Schedules created" value={d.schedules.toLocaleString()} icon={CalendarRange} tone="amber" sub={`${d.communityPosts.toLocaleString()} community posts`} />
              </>
            )}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <Card>
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900">Recently updated</h2>
                  <p className="text-[13px] text-slate-500">Latest changes to peptide protocols</p>
                </div>
                <Link href="/admin/peptides?sort=updated" className="text-sm font-semibold text-emerald-700 hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-slate-100">
                {stats.isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3.5"><Skeleton className="h-9 w-9" /><Skeleton className="h-4 flex-1" /></div>
                  ))
                  : d.recentlyUpdated.map((item) => (
                    <Link key={item.id} href={`/admin/peptides/${item.id}`} className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/80">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                        {item.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {item.name} {item.mgAmount && <span className="font-medium text-slate-400">{item.mgAmount}</span>}
                        </p>
                        <p className="text-xs text-slate-400">Updated {timeAgo(item.updatedAt)}</p>
                      </div>
                      <Badge tone={item.type === "blend" ? "violet" : "blue"}>{item.type === "blend" ? "Blend" : "Single"}</Badge>
                      <StatusBadge active={item.isActive} />
                    </Link>
                  ))}
              </div>
            </Card>

            <Card>
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-[15px] font-bold text-slate-900">Content health</h2>
                <p className="text-[13px] text-slate-500">Protocols that may need attention</p>
              </div>
              <div className="p-2">
                {stats.isLoading ? (
                  <div className="space-y-2 p-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                ) : (
                  <>
                    <HealthRow icon={FileText} label="Missing overview" hint="No “how it works” text" count={p.missingOverview} href="/admin/peptides?issue=missingOverview" />
                    <HealthRow icon={ListChecks} label="Missing dosing table" hint="No dosing steps defined" count={p.missingDosing} href="/admin/peptides?issue=missingDosing" />
                    <HealthRow icon={Tags} label="Uncategorised" hint="No health categories" count={p.missingCategories} href="/admin/peptides?issue=missingCategories" />
                    <HealthRow icon={ImageOff} label="No protocol image" hint="Image used by the mobile app" count={p.missingImage} href="/admin/peptides?issue=missingImage" />
                    <HealthRow icon={EyeOff} label="Hidden from site" hint="Drafts and retired protocols" count={p.hidden} href="/admin/peptides?status=inactive" />
                  </>
                )}
              </div>
            </Card>
          </div>

          <Card className="mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ArrowUpDown className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-bold text-slate-900">Edits publish automatically</p>
                <p className="text-[13px] text-slate-500">Saving a peptide refreshes its public page, the library and the sitemap.</p>
              </div>
            </div>
            <a href="/library" target="_blank" rel="noopener noreferrer">
              <AdminButton>Open public library</AdminButton>
            </a>
          </Card>
        </>
      )}
    </>
  );
}
