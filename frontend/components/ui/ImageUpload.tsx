"use client";

import { useRef, useState } from "react";
import { Upload, X } from "@/components/dashboard/icons";
import { api, assetUrl } from "@/lib/api";
import { Button } from "./Button";

/** Image picker: uploads to the backend, previews, and lets you replace or remove the image. */
export function ImageUpload({ value, onChange, label = "Image" }: { value: string; onChange: (url: string) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (file?: File) => {
    if (!file) return;
    setError("");
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return setError("Use a JPG, PNG, WEBP or GIF image");
    if (file.size > 5 * 1024 * 1024) return setError("Image must be 5 MB or smaller");
    setBusy(true);
    try {
      const { url } = await api.uploadImage(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      <span className="block text-[12px] font-medium text-[var(--d-muted)] mb-1.5">{label}</span>
      <div className="flex items-center gap-3">
        <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-[var(--d-card2)] border border-dashed border-[var(--d-line)] grid place-items-center text-[var(--d-muted)]">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={assetUrl(value)} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
          {busy && <div className="absolute inset-0 grid place-items-center bg-black/40"><span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /></div>}
        </div>
        <div className="flex flex-col items-start gap-2">
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => pick(e.target.files?.[0])} />
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" loading={busy} onClick={() => input.current?.click()}>{value ? "Change image" : "Upload image"}</Button>
            {value && <Button variant="ghost" size="sm" icon={<X className="w-3.5 h-3.5" />} onClick={() => onChange("")}>Remove</Button>}
          </div>
          <p className="text-[12px] text-[var(--d-muted)]">JPG, PNG, WEBP or GIF · up to 5 MB</p>
        </div>
      </div>
      {error && <p role="alert" className="mt-1.5 text-[12px] text-red-500">{error}</p>}
    </div>
  );
}

