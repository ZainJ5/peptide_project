"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Clock, KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { adminRequest } from "@/lib/admin/api";
import { useAdminStore } from "@/lib/admin/store";
import { useToast } from "@/components/ui/ToastProvider";
import {
  AdminButton, Card, Field, PageHeader, SectionCard, TextInput, cx, formatDate,
} from "@/components/admin/ui";

const RULES = [
  { label: "At least 12 characters", test: (p) => p.length >= 12 },
  { label: "Upper & lowercase letters", test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "A number", test: (p) => /[0-9]/.test(p) },
  { label: "A symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const admin = useAdminStore((s) => s.admin);
  const expiresAt = useAdminStore((s) => s.expiresAt);
  const setSession = useAdminStore((s) => s.setSession);
  const clearSession = useAdminStore((s) => s.clearSession);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const strong = RULES.every((r) => r.test(next)) && next.length <= 128;

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!current) found.current = "Enter your current password.";
    if (!strong) found.next = "Choose a password that meets every requirement.";
    else if (next === current) found.next = "The new password must be different.";
    if (confirm !== next) found.confirm = "Passwords don't match.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const res = await adminRequest("/auth/password", { method: "PATCH", body: { currentPassword: current, newPassword: next } });
      setSession(res);
      setCurrent(""); setNext(""); setConfirm("");
      showToast("Password updated. Other sessions were signed out.", "success");
    } catch (err) {
      if (err.status === 400) setErrors({ current: err.message });
      else showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const signOutEverywhere = async () => {
    setSigningOut(true);
    try {
      await adminRequest("/auth/logout", { method: "POST" });
    } catch {
      /* clear locally regardless */
    }
    clearSession();
    router.replace("/admin/login");
  };

  return (
    <>
      <PageHeader title="Settings" description="Your admin account and security." />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <SectionCard title="Change password" description="Changing your password signs out every other admin session." icon={KeyRound}>
          <form onSubmit={submit} noValidate className="max-w-md space-y-4">
            <input type="text" name="username" autoComplete="username" value={admin?.username || ""} readOnly hidden />
            <Field label="Current password" error={errors.current} htmlFor="pw-current">
              <TextInput id="pw-current" type="password" autoComplete="current-password" value={current} error={errors.current} onChange={(e) => setCurrent(e.target.value)} />
            </Field>
            <Field label="New password" error={errors.next} htmlFor="pw-new">
              <TextInput id="pw-new" type="password" autoComplete="new-password" maxLength={128} value={next} error={errors.next} onChange={(e) => setNext(e.target.value)} />
            </Field>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl bg-slate-50 px-4 py-3">
              {RULES.map((r) => {
                const ok = r.test(next);
                return (
                  <li key={r.label} className={cx("flex items-center gap-1.5 text-xs font-medium", ok ? "text-emerald-700" : "text-slate-400")}>
                    <CircleCheck className={cx("h-3.5 w-3.5", ok ? "text-emerald-500" : "text-slate-300")} /> {r.label}
                  </li>
                );
              })}
            </ul>
            <Field label="Confirm new password" error={errors.confirm} htmlFor="pw-confirm">
              <TextInput id="pw-confirm" type="password" autoComplete="new-password" maxLength={128} value={confirm} error={errors.confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
            <AdminButton type="submit" variant="navy" loading={saving}>Update password</AdminButton>
          </form>
        </SectionCard>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-base font-bold text-white">
                {(admin?.displayName || admin?.username || "A").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900">{admin?.displayName || "Administrator"}</p>
                <p className="truncate text-sm text-slate-500">@{admin?.username}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-1.5 text-slate-500"><ShieldCheck className="h-3.5 w-3.5" /> Last sign-in</dt>
                <dd className="font-semibold text-slate-800">{formatDate(admin?.lastLoginAt, { time: true })}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-1.5 text-slate-500"><KeyRound className="h-3.5 w-3.5" /> Password changed</dt>
                <dd className="font-semibold text-slate-800">{formatDate(admin?.passwordChangedAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-1.5 text-slate-500"><Clock className="h-3.5 w-3.5" /> Session expires</dt>
                <dd className="font-semibold text-slate-800">{expiresAt ? formatDate(expiresAt, { time: true }) : "—"}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-bold text-slate-900">Sign out everywhere</p>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">Revokes every active admin session, including this one.</p>
            <AdminButton variant="dangerSoft" icon={LogOut} className="mt-4 w-full" loading={signingOut} onClick={signOutEverywhere}>
              Sign out of all sessions
            </AdminButton>
          </Card>
        </div>
      </div>
    </>
  );
}
