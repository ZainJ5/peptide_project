"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { adminUploadImage, UPLOAD_MAX_MB, UPLOAD_TYPES } from "@/lib/admin/api";
import { toDisplayImageUrl } from "@/lib/imageUrl";
import { AdminButton, TextInput, cx } from "../ui";

/**
 * Image picker for a peptide image field. Uploads on select / drop and puts
 * the returned URL into the form; the peptide is saved with the normal Save.
 */
export default function ImageUploadField({ label, hint, value, onChange, kind, slug, error, id }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [manual, setManual] = useState(false);
  const [broken, setBroken] = useState(false);

  useEffect(() => setBroken(false), [value]);

  const upload = async (file) => {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const url = await adminUploadImage(file, { kind, slug });
      onChange(url);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (!uploading) upload(e.dataTransfer.files?.[0]);
  };

  const display = value ? toDisplayImageUrl(value) : "";
  const shownError = uploadError || error;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-semibold text-slate-700">{label}</label>
        <button type="button" onClick={() => setManual((m) => !m)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700">
          <Link2 className="h-3 w-3" /> {manual ? "Hide path" : "Edit path"}
        </button>
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={UPLOAD_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => upload(e.target.files?.[0])}
      />

      {value ? (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="flex aspect-[4/3] items-center justify-center bg-[repeating-conic-gradient(#f8fafc_0%_25%,#f1f5f9_0%_50%)] bg-[length:16px_16px]">
            {!broken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={display} alt={label} onError={() => setBroken(true)} className="h-full w-full object-contain" />
            ) : (
              <span className="px-4 text-center text-xs font-medium text-slate-400">Preview unavailable here — the file will still be used on the live site.</span>
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-2">
            <p className="min-w-0 flex-1 truncate text-xs text-slate-500" title={value}>{value}</p>
            <AdminButton size="sm" variant="ghost" icon={uploading ? undefined : RefreshCw} loading={uploading} onClick={() => inputRef.current?.click()}>
              Replace
            </AdminButton>
            <button type="button" aria-label={`Remove ${label}`} onClick={() => onChange("")} disabled={uploading} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={uploading}
          className={cx(
            "flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 text-center transition-colors",
            dragging ? "border-emerald-400 bg-emerald-50/60" : "border-slate-200 bg-slate-50/50 hover:border-emerald-300 hover:bg-emerald-50/30",
            shownError && "border-red-300"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
              <span className="text-sm font-semibold text-slate-600">Uploading…</span>
            </>
          ) : (
            <>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200">
                {dragging ? <UploadCloud className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {dragging ? "Drop to upload" : <>Drop an image or <span className="text-emerald-600">browse</span></>}
              </span>
              <span className="text-xs text-slate-400">PNG, JPG, WebP or AVIF · up to {UPLOAD_MAX_MB} MB</span>
            </>
          )}
        </button>
      )}

      {manual && (
        <TextInput
          className="mt-2"
          value={value}
          maxLength={500}
          error={error}
          placeholder="/media/peptides/file.webp or https://…"
          aria-label={`${label} path`}
          onChange={(e) => onChange(e.target.value.trim())}
        />
      )}

      {shownError ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">{shownError}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}
