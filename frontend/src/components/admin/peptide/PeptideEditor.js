"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Copy, Droplet, ExternalLink, FileText, FlaskConical, Image as ImageIcon, ListChecks, RotateCcw, Save, Sparkles, Tags,
  Trash2, TriangleAlert,
} from "lucide-react";
import { adminRequest, revalidateSite } from "@/lib/admin/api";
import { useToast } from "@/components/ui/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  AdminButton, Badge, Card, CharCount, Field, SectionCard, SelectInput, StatusBadge, Switch, TextArea, TextInput, cx, formatDate,
} from "../ui";
import { CategoryInput, DosingEditor, ListEditor, emptyStep, newKey, parseVialMg } from "./fields";
import ImageUploadField from "./ImageUploadField";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SECTIONS = [
  { id: "basics", label: "Basics", icon: FlaskConical },
  { id: "reconstitution", label: "Reconstitution", icon: Droplet },
  { id: "dosing", label: "Dosing schedule", icon: ListChecks },
  { id: "content", label: "Overview & notes", icon: FileText },
  { id: "benefits", label: "Benefits & side effects", icon: Sparkles },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "media", label: "Images & source", icon: ImageIcon },
];

const slugify = (...parts) =>
  parts.filter(Boolean).join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 280);

const str = (v) => (v === null || v === undefined ? "" : String(v));

function toForm(p) {
  return {
    name: str(p?.name),
    mgAmount: str(p?.mgAmount),
    protocolTitle: str(p?.protocolTitle),
    slug: str(p?.slug),
    type: p?.type || "single",
    reconstitutionMl: str(p?.reconstitutionMl),
    reconstitutionRaw: str(p?.reconstitutionRaw),
    howItWorks: str(p?.howItWorks),
    injectionFrequencyRaw: str(p?.injectionFrequencyRaw),
    cycleDurationRaw: str(p?.cycleDurationRaw),
    preparationNotes: str(p?.preparationNotes),
    sourceUrl: str(p?.sourceUrl),
    imageUrl: str(p?.imageUrl),
    reconstitutionImageUrl: str(p?.reconstitutionImageUrl),
    isActive: p ? Boolean(p.isActive) : false,
    benefits: Array.isArray(p?.benefits) ? p.benefits.map(String) : [],
    sideEffects: Array.isArray(p?.sideEffects) ? p.sideEffects.map(String) : [],
    healthCategories: Array.isArray(p?.healthCategories) ? p.healthCategories.map(String) : [],
  };
}

function toVariants(steps = []) {
  const variants = [];
  const byName = new Map();
  for (const s of steps) {
    if (!byName.has(s.scheduleName)) {
      const v = { key: newKey(), name: s.scheduleName, originalName: s.scheduleName, steps: [] };
      byName.set(s.scheduleName, v);
      variants.push(v);
    }
    byName.get(s.scheduleName).steps.push({
      key: newKey(),
      weekRangeLabel: str(s.weekRangeLabel),
      weekStart: str(s.weekStart),
      weekEnd: str(s.weekEnd),
      dailyDoseLabel: str(s.dailyDoseLabel),
      dailyDoseMcg: str(s.dailyDoseMcg),
      unitsPerInjection: str(s.unitsPerInjection),
      volumeMl: str(s.volumeMl),
    });
  }
  return variants;
}

/** Comparable snapshot that ignores React keys. */
const variantsSignature = (variants) =>
  JSON.stringify(variants.map((v) => [v.name.trim(), v.steps.map(({ key, ...rest }) => rest)]));

function isSafeImage(value) {
  if (/^\/(?!\/)\S*$/.test(value)) return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

function validate(form, variants) {
  const e = {};
  if (!form.name.trim()) e.name = "Name is required.";
  else if (form.name.length > 200) e.name = "Keep the name under 200 characters.";
  if (!form.protocolTitle.trim()) e.protocolTitle = "Protocol title is required.";
  else if (form.protocolTitle.length > 300) e.protocolTitle = "Keep the title under 300 characters.";
  if (form.slug && !SLUG_RE.test(form.slug)) e.slug = "Use lowercase letters, numbers and single hyphens only.";
  if (form.mgAmount.length > 50) e.mgAmount = "Keep the vial size under 50 characters.";
  if (form.reconstitutionMl !== "") {
    const n = Number(form.reconstitutionMl);
    if (!Number.isFinite(n) || n <= 0 || n > 100) e.reconstitutionMl = "Enter a volume between 0 and 100 mL.";
  }
  if (form.reconstitutionRaw.length > 200) e.reconstitutionRaw = "Keep this under 200 characters.";
  if (form.injectionFrequencyRaw.length > 300) e.injectionFrequencyRaw = "Keep this under 300 characters.";
  if (form.cycleDurationRaw.length > 500) e.cycleDurationRaw = "Keep this under 500 characters.";
  if (form.howItWorks.length > 20000) e.howItWorks = "Overview is too long.";
  if (form.preparationNotes.length > 20000) e.preparationNotes = "Notes are too long.";
  if (form.sourceUrl) {
    try {
      if (!/^https?:$/.test(new URL(form.sourceUrl).protocol)) throw new Error();
    } catch { e.sourceUrl = "Enter a full URL starting with https://"; }
  }
  for (const key of ["imageUrl", "reconstitutionImageUrl"]) {
    if (form[key] && !isSafeImage(form[key])) e[key] = "Use a site path like /images/singles/file.webp or an https:// URL.";
  }

  const names = new Set();
  variants.forEach((v, vi) => {
    const name = v.name.trim();
    if (!name) e[`variant-${vi}`] = "Give this variant a name.";
    else if (names.has(name)) e[`variant-${vi}`] = "Two variants can't share the same name.";
    names.add(name);
    v.steps.forEach((s, si) => {
      const nums = ["weekStart", "weekEnd", "dailyDoseMcg", "unitsPerInjection", "volumeMl"];
      const bad = nums.find((k) => s[k] !== "" && (!Number.isFinite(Number(s[k])) || Number(s[k]) < 0));
      if (bad) e[`step-${vi}-${si}`] = "Numbers must be zero or positive.";
      else if (["weekStart", "weekEnd"].some((k) => s[k] !== "" && !Number.isInteger(Number(s[k])))) e[`step-${vi}-${si}`] = "Weeks must be whole numbers.";
      else if (s.weekStart !== "" && s.weekEnd !== "" && Number(s.weekEnd) < Number(s.weekStart)) e[`step-${vi}-${si}`] = "End week can't be before start week.";
    });
  });
  return e;
}

const SERVER_FIELD_MAP = (field) => {
  const m = String(field).match(/^dosingSteps\[(\d+)\]/);
  return m ? "dosing" : field;
};

function buildPayload(form, variants, { includeDosing }) {
  const nullable = (v) => (v.trim() === "" ? null : v.trim());
  const payload = {
    name: form.name.trim(),
    protocolTitle: form.protocolTitle.trim(),
    slug: form.slug.trim() || undefined,
    type: form.type,
    mgAmount: nullable(form.mgAmount),
    reconstitutionMl: form.reconstitutionMl === "" ? null : Number(form.reconstitutionMl),
    reconstitutionRaw: nullable(form.reconstitutionRaw),
    howItWorks: nullable(form.howItWorks),
    injectionFrequencyRaw: nullable(form.injectionFrequencyRaw),
    cycleDurationRaw: nullable(form.cycleDurationRaw),
    preparationNotes: nullable(form.preparationNotes),
    sourceUrl: nullable(form.sourceUrl),
    imageUrl: nullable(form.imageUrl),
    reconstitutionImageUrl: nullable(form.reconstitutionImageUrl),
    isActive: form.isActive,
    benefits: form.benefits.map((b) => b.trim()).filter(Boolean),
    sideEffects: form.sideEffects.map((b) => b.trim()).filter(Boolean),
    healthCategories: form.healthCategories,
  };
  if (includeDosing) {
    const num = (v) => (v === "" ? null : Number(v));
    payload.dosingSteps = variants.flatMap((v) =>
      v.steps.map((s) => ({
        scheduleName: v.name.trim(),
        weekRangeLabel: s.weekRangeLabel.trim() || null,
        weekStart: num(s.weekStart),
        weekEnd: num(s.weekEnd),
        dailyDoseLabel: s.dailyDoseLabel.trim() || null,
        dailyDoseMcg: num(s.dailyDoseMcg),
        unitsPerInjection: num(s.unitsPerInjection),
        volumeMl: num(s.volumeMl),
      }))
    );
    payload.variantRenames = variants
      .filter((v) => v.originalName && v.originalName !== v.name.trim())
      .map((v) => ({ from: v.originalName, to: v.name.trim() }));
  }
  return payload;
}

export default function PeptideEditor({ peptide, usage }) {
  const isNew = !peptide;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [base, setBase] = useState(() => ({ form: toForm(peptide), variants: toVariants(peptide?.dosingSteps) }));
  const [form, setForm] = useState(base.form);
  const [variants, setVariants] = useState(() => (isNew ? [{ key: newKey(), name: "Standard / Gradual Approach", originalName: null, steps: [emptyStep()] }] : base.variants));
  const [current, setCurrent] = useState(peptide);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [titleTouched, setTitleTouched] = useState(!isNew);
  const [errors, setErrors] = useState({});
  const [conflict, setConflict] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const categories = useQuery({ queryKey: ["admin", "categories"], queryFn: () => adminRequest("/categories") });

  const set = useCallback((patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  }, []);

  // Auto-derive slug & title for new peptides until the admin edits them.
  useEffect(() => {
    if (!isNew) return;
    setForm((f) => ({
      ...f,
      slug: slugTouched ? f.slug : slugify(f.name, f.mgAmount),
      protocolTitle: titleTouched ? f.protocolTitle : [f.name.trim(), f.mgAmount.trim().toUpperCase()].filter(Boolean).join(" "),
    }));
  }, [form.name, form.mgAmount, isNew, slugTouched, titleTouched]);

  const formDirty = JSON.stringify(form) !== JSON.stringify(base.form);
  const dosingDirty = variantsSignature(variants) !== variantsSignature(base.variants);
  const dirty = isNew || formDirty || dosingDirty;

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty || isNew) return undefined;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, isNew]);

  const save = useMutation({
    mutationFn: (payload) =>
      isNew
        ? adminRequest("/peptides", { method: "POST", body: payload })
        : adminRequest(`/peptides/${current.id}`, { method: "PATCH", body: payload }),
    onSuccess: (res) => {
      const saved = res.data;
      const oldSlug = current?.slug;
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      if (saved.isActive || current?.isActive) revalidateSite([oldSlug, saved.slug]);

      if (isNew) {
        showToast(saved.isActive ? "Peptide created and published" : "Peptide saved as hidden draft", "success");
        router.replace(`/admin/peptides/${saved.id}`);
        return;
      }
      const next = { form: toForm(saved), variants: toVariants(saved.dosingSteps) };
      setBase(next);
      setForm(next.form);
      setVariants(next.variants);
      setCurrent(saved);
      setConflict(false);
      showToast("Changes saved", "success");
    },
    onError: (err) => {
      if (err.status === 409 && /changed by someone else/i.test(err.message)) setConflict(true);
      const mapped = {};
      Object.entries(err.fieldErrors || {}).forEach(([field, msg]) => { mapped[SERVER_FIELD_MAP(field)] = msg; });
      if (err.status === 409 && /slug/i.test(err.message)) mapped.slug = err.message;
      if (err.status === 409 && /protocol title/i.test(err.message)) mapped.protocolTitle = err.message;
      setErrors((e) => ({ ...e, ...mapped }));
      showToast(err.message, "error");
    },
  });

  const submit = useCallback(() => {
    if (save.isPending) return;
    const found = validate(form, variants);
    setErrors(found);
    if (Object.keys(found).length) {
      showToast("Please fix the highlighted fields", "error");
      const first = Object.keys(found)[0];
      const section = first.startsWith("variant") || first.startsWith("step") ? "dosing"
        : ["imageUrl", "reconstitutionImageUrl", "sourceUrl"].includes(first) ? "media"
          : ["howItWorks", "preparationNotes", "injectionFrequencyRaw", "cycleDurationRaw"].includes(first) ? "content"
            : ["reconstitutionMl", "reconstitutionRaw"].includes(first) ? "reconstitution" : "basics";
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const payload = buildPayload(form, variants, { includeDosing: isNew || dosingDirty });
    if (!isNew) payload.expectedUpdatedAt = current.updatedAt;
    save.mutate(payload);
  }, [form, variants, isNew, dosingDirty, current, save, showToast]);

  // Ctrl/Cmd+S saves.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); if (dirty) submit(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submit, dirty]);

  const discard = () => {
    setForm(base.form);
    setVariants(base.variants);
    setErrors({});
  };

  const reloadLatest = async () => {
    try {
      const res = await adminRequest(`/peptides/${current.id}`);
      const next = { form: toForm(res.data), variants: toVariants(res.data.dosingSteps) };
      setBase(next); setForm(next.form); setVariants(next.variants); setCurrent(res.data);
      setConflict(false); setErrors({});
      showToast("Loaded the latest version", "info");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const duplicate = useMutation({
    mutationFn: () => adminRequest(`/peptides/${current.id}/duplicate`, { method: "POST" }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      showToast("Copy created as a hidden draft", "success");
      router.push(`/admin/peptides/${res.data.id}`);
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const remove = useMutation({
    mutationFn: () => adminRequest(`/peptides/${current.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      revalidateSite([current.slug]);
      showToast("Peptide deleted", "success");
      router.replace("/admin/peptides");
    },
    onError: (err) => { setConfirm(null); showToast(err.message, "error"); },
  });

  const vialMg = parseVialMg(form.mgAmount);
  const bacMl = form.reconstitutionMl !== "" ? Number(form.reconstitutionMl) : null;
  const suggestions = useMemo(() => (categories.data?.data || []).map((c) => c.category), [categories.data]);
  const totalSteps = variants.reduce((n, v) => n + v.steps.length, 0);
  const title = isNew ? "New peptide" : `${current.name}${current.mgAmount ? ` ${current.mgAmount}` : ""}`;

  return (
    <>
      <div className="mb-6">
        <Link href="/admin/peptides" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> All peptides
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          {!isNew && <StatusBadge active={current.isActive} />}
          {!isNew && <Badge tone={current.type === "blend" ? "violet" : "blue"}>{current.type === "blend" ? "Blend" : "Single"}</Badge>}
        </div>
        {!isNew && <p className="mt-1 text-sm text-slate-500">Last updated {formatDate(current.updatedAt, { time: true })}</p>}
      </div>

      {conflict && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <TriangleAlert className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="flex-1 text-sm font-medium text-amber-900">This peptide was changed elsewhere after you opened it. Reload to get the latest version (your unsaved edits here will be replaced).</p>
          <AdminButton size="sm" onClick={reloadLatest} icon={RotateCcw}>Reload latest</AdminButton>
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <SectionCard id="basics" title="Basics" description="How the protocol is named and where it lives on the site." icon={FlaskConical}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Peptide name" required error={errors.name} htmlFor="f-name">
                <TextInput id="f-name" value={form.name} maxLength={200} error={errors.name} placeholder="e.g. BPC-157" onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field label="Vial size" hint="e.g. 10MG, 5000 IU. Used in the unit calculator." error={errors.mgAmount} htmlFor="f-mg">
                <TextInput id="f-mg" value={form.mgAmount} maxLength={50} error={errors.mgAmount} placeholder="10MG" onChange={(e) => set({ mgAmount: e.target.value })} />
              </Field>
              <Field label="Protocol title" required error={errors.protocolTitle} htmlFor="f-title" className="sm:col-span-2" hint="Must be unique across all peptides.">
                <TextInput id="f-title" value={form.protocolTitle} maxLength={300} error={errors.protocolTitle} placeholder="BPC-157 10MG" onChange={(e) => { setTitleTouched(true); set({ protocolTitle: e.target.value }); }} />
              </Field>
              <Field
                label="URL slug"
                error={errors.slug}
                htmlFor="f-slug"
                hint={!isNew && form.slug !== base.form.slug ? "Changing the slug changes the public URL — existing links and search results will break." : "Lowercase letters, numbers and hyphens. Leave blank to generate."}
              >
                <div className={cx("flex items-center overflow-hidden rounded-xl border bg-white focus-within:ring-4", errors.slug ? "border-red-300 focus-within:ring-red-100" : "border-slate-200 focus-within:border-emerald-500 focus-within:ring-emerald-100")}>
                  <span className="select-none border-r border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-400">/library/</span>
                  <input
                    id="f-slug"
                    value={form.slug}
                    maxLength={300}
                    onChange={(e) => { setSlugTouched(true); set({ slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }); }}
                    className="h-10 min-w-0 flex-1 px-3 text-sm focus:outline-none"
                    placeholder="bpc-157-10mg"
                  />
                </div>
              </Field>
              <Field label="Type" htmlFor="f-type">
                <SelectInput id="f-type" value={form.type} onChange={(e) => set({ type: e.target.value })}>
                  <option value="single">Single peptide</option>
                  <option value="blend">Peptide blend</option>
                </SelectInput>
              </Field>
            </div>
          </SectionCard>

          <SectionCard id="reconstitution" title="Reconstitution" description="BAC water volume and the mixing instruction shown to visitors." icon={Droplet}>
            <div className="grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)]">
              <Field label="BAC water (mL)" error={errors.reconstitutionMl} htmlFor="f-ml">
                <TextInput id="f-ml" type="number" inputMode="decimal" min="0" step="any" value={form.reconstitutionMl} error={errors.reconstitutionMl} placeholder="3" onChange={(e) => set({ reconstitutionMl: e.target.value })} />
              </Field>
              <Field label="Reconstitution text" error={errors.reconstitutionRaw} htmlFor="f-recon" counter={<CharCount value={form.reconstitutionRaw} max={200} />}>
                <TextInput id="f-recon" value={form.reconstitutionRaw} maxLength={200} error={errors.reconstitutionRaw} placeholder="3.0 mL BAC water" onChange={(e) => set({ reconstitutionRaw: e.target.value })} />
              </Field>
            </div>
            {vialMg && bacMl > 0 && (
              <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
                {vialMg} mg in {bacMl} mL = <strong className="text-slate-900">{Math.round((vialMg / bacMl) * 1000) / 1000} mg/mL</strong>
                {" "}· 10 units on a U-100 syringe delivers{" "}
                <strong className="text-slate-900">{Math.round((vialMg / bacMl) * 100 * 100) / 100} mcg</strong>
              </p>
            )}
          </SectionCard>

          <SectionCard
            id="dosing"
            title="Dosing schedule"
            description={`Week-by-week escalation table${totalSteps ? ` · ${variants.length} variant${variants.length === 1 ? "" : "s"}, ${totalSteps} step${totalSteps === 1 ? "" : "s"}` : ""}.`}
            icon={ListChecks}
            actions={dosingDirty && !isNew ? <Badge tone="amber">Unsaved</Badge> : null}
          >
            {errors.dosing && <p className="mb-3 text-sm font-medium text-red-600">{errors.dosing}</p>}
            <DosingEditor variants={variants} onChange={setVariants} vialMg={vialMg} bacMl={bacMl} errors={errors} />
          </SectionCard>

          <SectionCard id="content" title="Overview & notes" description="Long-form copy for the protocol page." icon={FileText}>
            <div className="grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Injection frequency" error={errors.injectionFrequencyRaw} htmlFor="f-freq" counter={<CharCount value={form.injectionFrequencyRaw} max={300} />}>
                  <TextInput id="f-freq" value={form.injectionFrequencyRaw} maxLength={300} error={errors.injectionFrequencyRaw} placeholder="Inject once daily" onChange={(e) => set({ injectionFrequencyRaw: e.target.value })} />
                </Field>
                <Field label="Cycle duration" error={errors.cycleDurationRaw} htmlFor="f-cycle" counter={<CharCount value={form.cycleDurationRaw} max={500} />}>
                  <TextInput id="f-cycle" value={form.cycleDurationRaw} maxLength={500} error={errors.cycleDurationRaw} placeholder="8–12 weeks; optional extension to 16 weeks" onChange={(e) => set({ cycleDurationRaw: e.target.value })} />
                </Field>
              </div>
              <Field label="How it works (peptide overview)" error={errors.howItWorks} htmlFor="f-how" counter={<CharCount value={form.howItWorks} max={20000} />} hint="Shown in the “Peptide Overview” section. Plain text; line breaks are kept.">
                <TextArea id="f-how" rows={8} value={form.howItWorks} error={errors.howItWorks} onChange={(e) => set({ howItWorks: e.target.value })} />
              </Field>
              <Field label="Final preparation notes" error={errors.preparationNotes} htmlFor="f-prep" counter={<CharCount value={form.preparationNotes} max={20000} />} hint="One note per line — each line becomes a bullet on the site.">
                <TextArea id="f-prep" rows={7} value={form.preparationNotes} error={errors.preparationNotes} onChange={(e) => set({ preparationNotes: e.target.value })} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard id="benefits" title="Benefits & side effects" description="Each entry is shown as a bullet point. Press Enter to add the next one." icon={Sparkles}>
            <div className="grid gap-8 lg:grid-cols-2">
              <Field label={`Benefits (${form.benefits.filter((b) => b.trim()).length})`}>
                <ListEditor items={form.benefits} onChange={(benefits) => set({ benefits })} placeholder="Describe a benefit" addLabel="Add benefit" />
              </Field>
              <Field label={`Side effects (${form.sideEffects.filter((b) => b.trim()).length})`}>
                <ListEditor items={form.sideEffects} onChange={(sideEffects) => set({ sideEffects })} placeholder="Describe a side effect" addLabel="Add side effect" />
              </Field>
            </div>
          </SectionCard>

          <SectionCard id="categories" title="Health categories" description="Used for library filters and related-protocol links." icon={Tags}>
            <CategoryInput value={form.healthCategories} onChange={(healthCategories) => set({ healthCategories })} suggestions={suggestions} />
          </SectionCard>

          <SectionCard id="media" title="Images & source" description="Upload images directly — they're stored on the server and served from the website. Remember to save the peptide afterwards." icon={ImageIcon}>
            <div className="grid gap-6 md:grid-cols-2">
              <ImageUploadField
                id="f-img"
                label="Dosage protocol image"
                hint="Shown in the mobile app."
                kind="protocol"
                slug={form.slug}
                value={form.imageUrl}
                error={errors.imageUrl}
                onChange={(imageUrl) => set({ imageUrl })}
              />
              <ImageUploadField
                id="f-rimg"
                label="Reconstitution image"
                hint="Shown in the Reconstitution section of the public page and in the app."
                kind="reconstitution"
                slug={form.slug}
                value={form.reconstitutionImageUrl}
                error={errors.reconstitutionImageUrl}
                onChange={(reconstitutionImageUrl) => set({ reconstitutionImageUrl })}
              />
              <Field label="Source URL" error={errors.sourceUrl} htmlFor="f-src" className="md:col-span-2">
                <TextInput id="f-src" type="url" value={form.sourceUrl} maxLength={500} error={errors.sourceUrl} placeholder="https://…" onChange={(e) => set({ sourceUrl: e.target.value.trim() })} />
              </Field>
            </div>
          </SectionCard>
        </div>

        {/* Right rail */}
        <aside className="space-y-4 xl:sticky xl:top-20">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">Visible on website</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  {form.isActive ? "Listed in the library and searchable." : "Hidden — only admins can see it."}
                </p>
              </div>
              <Switch checked={form.isActive} onChange={(isActive) => set({ isActive })} label="Visible on website" />
            </div>
            <div className="mt-5 space-y-2">
              <AdminButton variant="primary" size="lg" icon={Save} className="w-full" loading={save.isPending} disabled={!dirty} onClick={submit}>
                {isNew ? (form.isActive ? "Create & publish" : "Create as draft") : "Save changes"}
              </AdminButton>
              {!isNew && dirty && (
                <AdminButton variant="ghost" className="w-full" icon={RotateCcw} onClick={discard} disabled={save.isPending}>Discard changes</AdminButton>
              )}
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-400">
              {dirty && !isNew ? "You have unsaved changes · " : ""}Press <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-sans">Ctrl</kbd> + <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-sans">S</kbd> to save
            </p>
            {!isNew && current.isActive && (
              <a href={`/library/${current.slug}`} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50">
                <ExternalLink className="h-4 w-4" /> View live page
              </a>
            )}
          </Card>

          <Card className="hidden p-2 xl:block">
            <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Jump to</p>
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const hasError = Object.keys(errors).some((k) =>
                (s.id === "dosing" && (k.startsWith("variant") || k.startsWith("step") || k === "dosing"))
                || (s.id === "basics" && ["name", "protocolTitle", "slug", "mgAmount"].includes(k))
                || (s.id === "reconstitution" && ["reconstitutionMl", "reconstitutionRaw"].includes(k))
                || (s.id === "content" && ["howItWorks", "preparationNotes", "injectionFrequencyRaw", "cycleDurationRaw"].includes(k))
                || (s.id === "media" && ["imageUrl", "reconstitutionImageUrl", "sourceUrl"].includes(k)));
              return (
                <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900">
                  <Icon className="h-4 w-4 text-slate-400" /> {s.label}
                  {hasError && <span className="ml-auto h-2 w-2 rounded-full bg-red-500" />}
                </a>
              );
            })}
          </Card>

          {!isNew && (
            <Card className="p-5">
              <p className="text-sm font-bold text-slate-900">Usage</p>
              <dl className="mt-3 space-y-2 text-[13px]">
                <div className="flex justify-between"><dt className="text-slate-500">In user schedules</dt><dd className="font-semibold text-slate-800">{usage?.scheduleItemCount ?? 0}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Community posts</dt><dd className="font-semibold text-slate-800">{usage?.communityPostCount ?? 0}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Created</dt><dd className="font-semibold text-slate-800">{formatDate(current.createdAt)}</dd></div>
              </dl>
              <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                <AdminButton className="w-full" icon={Copy} loading={duplicate.isPending} onClick={() => duplicate.mutate()}>Duplicate as draft</AdminButton>
                <AdminButton
                  variant="dangerSoft"
                  className="w-full"
                  icon={Trash2}
                  disabled={(usage?.scheduleItemCount ?? 0) > 0}
                  title={(usage?.scheduleItemCount ?? 0) > 0 ? "Used in user schedules — hide it instead" : undefined}
                  onClick={() => setConfirm("delete")}
                >
                  Delete peptide
                </AdminButton>
                {(usage?.scheduleItemCount ?? 0) > 0 && (
                  <p className="text-[11px] leading-relaxed text-slate-400">Can&apos;t be deleted while users have it in a schedule. Turn off “Visible on website” to retire it.</p>
                )}
              </div>
            </Card>
          )}
        </aside>
      </div>

      {confirm === "delete" && (
        <ConfirmDialog
          title={`Delete ${title}?`}
          message={`This permanently removes the protocol, its dosing table${usage?.communityPostCount ? ` and ${usage.communityPostCount} community post(s)` : ""}. This can't be undone.`}
          confirmLabel="Delete permanently"
          loading={remove.isPending}
          onConfirm={() => remove.mutate()}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
