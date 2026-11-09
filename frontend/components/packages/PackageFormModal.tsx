"use client";

import { useState } from "react";
import { Plus, Trash2 } from "@/components/dashboard/icons";
import {
  Button,
  ImageUpload,
  Modal,
  SelectField,
  TextField,
} from "@/components/ui";
import type { PackageIconType, StudioPackage } from "@/lib/packages";

export function PackageFormModal({
  initial,
  nextNumber,
  onClose,
  onSave,
}: {
  initial?: StudioPackage | null;
  nextNumber: string;
  onClose: () => void;
  onSave: (pkg: StudioPackage, isNew: boolean) => Promise<void> | void;
}) {
  const isNew = !initial;
  const [number, setNumber] = useState(initial?.number ?? nextNumber);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [iconType, setIconType] = useState<PackageIconType>(
    initial?.iconType ?? "camera"
  );
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [tierName, setTierName] = useState(initial?.tierName ?? "Standard");
  const [highlighted, setHighlighted] = useState(
    initial?.highlighted ?? false
  );
  const [price, setPrice] = useState(String(initial?.price ?? 4500));
  const [duration, setDuration] = useState(initial?.duration ?? "2 Hours");
  const [features, setFeatures] = useState<string[]>(
    initial?.features ?? [
      "1x Sony A7 V, tripod-mounted",
      "Basic 2-point lighting",
      "Raw footage delivered same day",
    ]
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const updateFeature = (idx: number, val: string) => {
    setFeatures((prev) => prev.map((f, i) => (i === idx ? val : f)));
  };

  const addFeature = () => {
    setFeatures((prev) => [...prev, ""]);
  };

  const removeFeature = (idx: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) {
      setError("Please enter a package title (at least 2 characters).");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const pkg: StudioPackage = {
        id: initial?.id ?? `pkg-${Date.now()}`,
        number: number.trim() || nextNumber,
        title: title.trim(),
        subtitle: subtitle.trim(),
        iconType,
        imageUrl: imageUrl.trim(),
        tierName: tierName.trim() || "Standard",
        highlighted,
        price: Number(price) || 0,
        duration: duration.trim(),
        features: features.map((f) => f.trim()).filter(Boolean),
        updatedAt: new Date().toISOString(),
      };
      await onSave(pkg, isNew);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save package");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={
        isNew
          ? "Add New Package Card"
          : `Edit Package · ${initial.title} (${initial.tierName})`
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="pkg-form" loading={saving}>
            {isNew ? "Create Package Card" : "Save Changes"}
          </Button>
        </>
      }
    >
      <form id="pkg-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Top metadata */}
        <div className="grid gap-4 sm:grid-cols-12">
          <div className="sm:col-span-2">
            <TextField
              label="No."
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="01"
            />
          </div>
          <div className="sm:col-span-5">
            <TextField
              label="Package Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Content Shooting"
            />
          </div>
          <div className="sm:col-span-5">
            <TextField
              label="Subtitle / Location Note"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. (Indoor) or (Near IDeCom Office)"
            />
          </div>
        </div>

        {/* Cover image & icon */}
        <div className="grid gap-4 sm:grid-cols-12 items-start">
          <div className="sm:col-span-5">
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              label="Card Cover Photo"
            />
          </div>
          <div className="sm:col-span-7 flex flex-col gap-3">
            <TextField
              label="Or Paste Cover Image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
            <SelectField
              label="Badge Icon Style"
              value={iconType}
              onChange={(e) => setIconType(e.target.value as PackageIconType)}
            >
              <option value="camera">Camera (Content Shooting)</option>
              <option value="location">Location Pin (Outdoor Shoot)</option>
              <option value="user">Person (Personal Branding)</option>
              <option value="store">Store / Briefcase (Small Business)</option>
            </SelectField>
          </div>
        </div>

        {/* Plan Tier, Price & Duration */}
        <div className="rounded-2xl border border-[var(--d-line)] bg-[var(--d-card2)]/60 p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] font-semibold">
              Plan Tier, Price & Duration
            </span>
            <label className="inline-flex items-center gap-2 text-[12px] text-[var(--d-muted)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={highlighted}
                onChange={(e) => setHighlighted(e.target.checked)}
                className="accent-[var(--d-accent)]"
              />
              Highlight as Green &ldquo;Premium&rdquo; Card
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <TextField
              label="Tier Name (Standard / Premium)"
              value={tierName}
              onChange={(e) => {
                setTierName(e.target.value);
                if (e.target.value.toLowerCase() === "premium") {
                  setHighlighted(true);
                } else if (e.target.value.toLowerCase() === "standard") {
                  setHighlighted(false);
                }
              }}
              placeholder="Standard or Premium"
            />
            <TextField
              label="Price (৳ BDT)"
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="4500"
            />
            <TextField
              label="Duration / Time Label"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 2 Hours or 4 hours + 30 min extra"
            />
          </div>

          {/* Features checklist */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[var(--d-line)]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[var(--d-muted)]">
                Included Deliverables ({features.length})
              </span>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={addFeature}
              >
                Add Item
              </Button>
            </div>

            {features.map((feat, fIdx) => (
              <div key={fIdx} className="flex items-center gap-2">
                <input
                  value={feat}
                  onChange={(e) => updateFeature(fIdx, e.target.value)}
                  placeholder="e.g. 1x Sony A7 V, tripod-mounted"
                  className="flex-1 h-9 rounded-xl bg-[var(--d-card)] border border-[var(--d-line)] px-3 text-[13px] text-[var(--d-fg)] focus:border-[var(--d-accent)] outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeFeature(fIdx)}
                  aria-label="Remove feature"
                  className="p-2 text-[var(--d-muted)] hover:text-red-500 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-[13px] text-red-500">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
