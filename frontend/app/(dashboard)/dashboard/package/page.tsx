"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Briefcase,
  Camera,
  Check,
  Clock,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  User,
} from "@/components/dashboard/icons";
import { Card } from "@/components/dashboard/ui";
import { SocialIcon } from "@/components/home/Shapes";
import { PackageFormModal } from "@/components/packages/PackageFormModal";
import { calcPackage, equipmentLineTotal, useCustomPackages, type CustomPackage } from "@/lib/customPackages";
import {
  Button,
  ConfirmDialog,
  IconButton,
  Modal,
  TextField,
  Toaster,
  useToast,
} from "@/components/ui";
import { assetUrl } from "@/lib/api";
import {
  usePackagesStore,
  type PackageIconType,
  type StudioPackage,
} from "@/lib/packages";
import { formatBDT } from "@/lib/rental";

const FEATURE_PREVIEW = 5;

function PackageIcon({ type }: { type: PackageIconType }) {
  if (type === "location") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </svg>
    );
  }
  if (type === "user") return <User className="w-5 h-5" />;
  if (type === "store") return <Briefcase className="w-5 h-5" />;
  return <Camera className="w-5 h-5" />;
}

export default function PackagePage() {
  return (
    <Toaster>
      <PackageManager />
    </Toaster>
  );
}

function PackageManager() {
  const toast = useToast();
  const {
    packages,
    meta,
    savePackage,
    deletePackage,
    resetPackages,
    updateMeta,
  } = usePackagesStore();

  const [tierFilter, setTierFilter] = useState<string>("all");
  const [editing, setEditing] = useState<{
    pkg: StudioPackage | null;
  } | null>(null);
  const [deleting, setDeleting] = useState<StudioPackage | null>(null);
  const [editingMeta, setEditingMeta] = useState(false);
  const [details, setDetails] = useState<StudioPackage | null>(null);
  const custom = useCustomPackages();
  const router = useRouter();
  const [customDeleting, setCustomDeleting] = useState<CustomPackage | null>(null);

  const visiblePackages = useMemo(() => {
    if (tierFilter === "all") return packages;
    return packages.filter(
      (p) => p.tierName.toLowerCase() === tierFilter.toLowerCase()
    );
  }, [packages, tierFilter]);

  const nextNumber = String(Math.ceil((packages.length + 1) / 2)).padStart(
    2,
    "0"
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Banner */}
      <div className="rounded-2xl bg-[#12160F] text-white p-6 border border-[#272C20] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#9CF60A]">
            {meta.eyebrow}
          </span>
          <h1 className="text-[22px] sm:text-[26px] font-bold !text-white mt-0.5">
            {meta.heading}
          </h1>
          <p className="text-[13px] text-[#9AA18E] mt-1 max-w-xl">
            {meta.subheading}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setEditingMeta(true)}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 !text-white text-[12px] font-semibold transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-[#9CF60A]" />
            Edit Banner & WhatsApp
          </button>
          <button
            type="button"
            onClick={async () => {
              await resetPackages();
              toast.success("Packages reset to defaults");
            }}
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 !text-white text-[12px] font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#9CF60A]" />
            Reset Defaults
          </button>
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setEditing({ pkg: null })}
          >
            Add Package Card
          </Button>
          <Button
            variant="secondary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => router.push("/dashboard/package/custom")}
          >
            Custom Package
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          className="inline-flex gap-1 p-1 rounded-full bg-[var(--d-card)] border border-[var(--d-line)]"
        >
          {[
            { id: "all", label: `All Packages (${packages.length})` },
            {
              id: "standard",
              label: `Standard (${
                packages.filter((p) => p.tierName.toLowerCase() === "standard")
                  .length
              })`,
            },
            {
              id: "premium",
              label: `Premium (${
                packages.filter((p) => p.tierName.toLowerCase() === "premium")
                  .length
              })`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tierFilter === tab.id}
              onClick={() => setTierFilter(tab.id)}
              className={`px-4 h-8 rounded-full text-[12.5px] font-medium cursor-pointer transition-colors ${
                tierFilter === tab.id
                  ? "bg-[var(--d-primary)] text-[var(--d-ink)] font-semibold"
                  : "text-[var(--d-muted)] hover:text-[var(--d-fg)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Package cards — compact; first 5 deliverables, "See more" opens full details */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {visiblePackages.map((pkg) => {
          const shown = pkg.features.slice(0, FEATURE_PREVIEW);
          const hidden = pkg.features.length - shown.length;
          return (
            <Card
              key={pkg.id}
              className={`!p-0 overflow-hidden flex flex-col transition-all hover:shadow-md ${
                pkg.highlighted ? "!border-[var(--d-accent)]/60 ring-1 ring-[var(--d-accent)]/20" : ""
              }`}
            >
              {/* Cover */}
              <div className="relative h-28 bg-[var(--d-card2)] overflow-hidden">
                {pkg.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assetUrl(pkg.imageUrl)} alt={`${pkg.title} - ${pkg.tierName}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[11px] text-[var(--d-muted)]">No cover photo</div>
                )}
                <span
                  className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                    pkg.highlighted ? "bg-[var(--d-primary)] text-[var(--d-ink)]" : "bg-black/75 text-white backdrop-blur-md"
                  }`}
                >
                  {pkg.tierName}
                </span>
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing({ pkg })}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 hover:bg-black text-white text-[10.5px] font-medium backdrop-blur-md cursor-pointer"
                  >
                    <Pencil className="w-3 h-3 text-[#9CF60A]" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(pkg)}
                    aria-label="Delete package"
                    className="w-6 h-6 rounded-full bg-black/70 hover:bg-red-600 text-white grid place-items-center backdrop-blur-md cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Title + price */}
              <div className="px-3.5 pt-3 pb-2.5 flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[var(--d-tint)] text-[var(--d-accent)] grid place-items-center shrink-0 [&_svg]:w-4 [&_svg]:h-4">
                  <PackageIcon type={pkg.iconType} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[13.5px] font-bold leading-tight line-clamp-2">
                    {pkg.title}
                    {pkg.subtitle && <span className="font-normal text-[11.5px] text-[var(--d-muted)]"> {pkg.subtitle}</span>}
                  </h2>
                  <div className="flex items-baseline justify-between gap-2 mt-1">
                    <span className="text-[18px] font-extrabold tracking-tight leading-none">{formatBDT(pkg.price)}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-[var(--d-muted)] min-w-0">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="truncate">{pkg.duration}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* First 5 deliverables */}
              <ul className="px-3.5 pb-2 flex flex-col gap-1.5 text-[12px] border-t border-dashed border-[var(--d-line)] pt-2.5">
                {shown.map((feat, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[var(--d-accent)] shrink-0 mt-px" />
                    <span className="leading-snug line-clamp-2">{feat}</span>
                  </li>
                ))}
              </ul>

              {/* Footer */}
              <div className="mt-auto px-3.5 py-2.5 border-t border-[var(--d-line)] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setDetails(pkg)}
                  className="text-[12px] font-semibold text-[var(--d-accent)] hover:underline cursor-pointer"
                >
                  {hidden > 0 ? `See more (+${hidden})` : "View details"}
                </button>
                <span className="text-[11px] text-[var(--d-muted)]">{pkg.features.length} deliverables</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Package details */}
      <Modal
        open={!!details}
        size="sm"
        title={details ? `${details.title} · ${details.tierName}` : ""}
        onClose={() => setDetails(null)}
        footer={
          details && (
            <>
              <Button variant="secondary" onClick={() => setDetails(null)}>Close</Button>
              <Button
                icon={<Pencil className="w-3.5 h-3.5" />}
                onClick={() => {
                  setEditing({ pkg: details });
                  setDetails(null);
                }}
              >
                Edit
              </Button>
            </>
          )
        }
      >
        {details && (
          <div className="flex flex-col gap-4">
            {details.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={assetUrl(details.imageUrl)} alt="" className="w-full h-40 object-cover rounded-xl" />
            )}
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[26px] font-extrabold leading-none">{formatBDT(details.price)}</div>
                {details.subtitle && <div className="text-[12px] text-[var(--d-muted)] mt-1">{details.subtitle}</div>}
              </div>
              <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--d-muted)]">
                <Clock className="w-4 h-4" />
                {details.duration}
              </span>
            </div>
            <ul className="flex flex-col gap-2.5 text-[13px] border-t border-[var(--d-line)] pt-3">
              {details.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[var(--d-accent)] shrink-0 mt-0.5" />
                  <span className="leading-snug">{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      {/* Saved custom packages */}
      {custom.packages.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[16px] font-semibold">Custom packages ({custom.packages.length})</h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {custom.packages.map((cp) => {
              const t = calcPackage(cp);
              return (
                <Card key={cp.id} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold truncate">{cp.name}</h3>
                      {cp.client && <p className="text-[12px] text-[var(--d-muted)] truncate">{cp.client}</p>}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <IconButton label="Edit custom package" onClick={() => router.push(`/dashboard/package/custom/${cp.id}`)}><Pencil className="w-4 h-4" /></IconButton>
                      <IconButton label="Delete custom package" onClick={() => setCustomDeleting(cp)}><Trash2 className="w-4 h-4" /></IconButton>
                    </div>
                  </div>
                  <ul className="text-[12.5px] flex flex-col gap-1.5">
                    {cp.equipment.map((l) => (
                      <li key={l.id} className="flex justify-between gap-2">
                        <span className="truncate">{l.name} × {l.qty} · {l.value}{l.unit === "hours" ? " hr" : " min"}</span>
                        <span>{formatBDT(equipmentLineTotal(l))}</span>
                      </li>
                    ))}
                    {cp.editing.enabled && (
                      <li className="flex justify-between"><span>Video editing × {cp.editing.videos}</span><span>{formatBDT(t.editing)}</span></li>
                    )}
                    {t.extras > 0 && <li className="flex justify-between"><span>Additional cost</span><span>{formatBDT(t.extras)}</span></li>}
                    {t.discount > 0 && <li className="flex justify-between text-[var(--d-muted)]"><span>Discount</span><span>− {formatBDT(t.discount)}</span></li>}
                  </ul>
                  <div className="mt-auto pt-3 border-t border-[var(--d-line)] flex items-center justify-between">
                    <span className="text-[12px] text-[var(--d-muted)]">Total</span>
                    <span className="text-[20px] font-extrabold">{formatBDT(t.total)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Bottom Consultation & WhatsApp Banner */}
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-semibold">{meta.ctaTitle}</h3>
          <p className="text-[12.5px] text-[var(--d-muted)] mt-0.5">
            {meta.ctaSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            icon={<SocialIcon name="whatsapp" size={16} />}
            onClick={() =>
              window.open(
                `https://wa.me/88${meta.whatsappPhone.replace(/\D/g, "")}`,
                "_blank",
                "noopener,noreferrer"
              )
            }
          >
            WhatsApp
          </Button>
          <IconButton
            label="Edit consultation banner"
            onClick={() => setEditingMeta(true)}
          >
            <Pencil className="w-4 h-4" />
          </IconButton>
        </div>
      </Card>

      <ConfirmDialog
        open={!!customDeleting}
        danger
        title="Delete custom package?"
        message={<>Remove <b>{customDeleting?.name}</b>?</>}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!customDeleting) return;
          custom.remove(customDeleting.id);
          toast.success(`"${customDeleting.name}" removed`);
          setCustomDeleting(null);
        }}
        onClose={() => setCustomDeleting(null)}
      />

      {/* Add / Edit Package Card Modal */}
      {editing && (
        <PackageFormModal
          initial={editing.pkg}
          nextNumber={nextNumber}
          onClose={() => setEditing(null)}
          onSave={async (saved, isNew) => {
            await savePackage(saved, isNew);
            toast.success(
              isNew
                ? `"${saved.title} (${saved.tierName})" added`
                : `"${saved.title} (${saved.tierName})" updated`
            );
          }}
        />
      )}

      {/* Edit Header & Consultation Banner Modal */}
      <Modal
        open={editingMeta}
        title="Edit Brochure Header & Consultation Banner"
        onClose={() => setEditingMeta(false)}
        footer={<Button onClick={() => setEditingMeta(false)}>Done</Button>}
      >
        <div className="flex flex-col gap-4">
          <TextField
            label="Eyebrow Label"
            value={meta.eyebrow}
            onChange={(e) => updateMeta({ eyebrow: e.target.value })}
          />
          <TextField
            label="Main Heading"
            value={meta.heading}
            onChange={(e) => updateMeta({ heading: e.target.value })}
          />
          <TextField
            label="Subheading"
            value={meta.subheading}
            onChange={(e) => updateMeta({ subheading: e.target.value })}
          />
          <TextField
            label="Bottom CTA Title"
            value={meta.ctaTitle}
            onChange={(e) => updateMeta({ ctaTitle: e.target.value })}
          />
          <TextField
            label="Bottom CTA Subtitle"
            value={meta.ctaSubtitle}
            onChange={(e) => updateMeta({ ctaSubtitle: e.target.value })}
          />
          <TextField
            label="WhatsApp Number"
            value={meta.whatsappPhone}
            onChange={(e) => updateMeta({ whatsappPhone: e.target.value })}
          />
        </div>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleting}
        danger
        title="Delete package card?"
        message={
          <>
            Are you sure you want to remove{" "}
            <b>
              {deleting?.number} — {deleting?.title} ({deleting?.tierName})
            </b>
            ?
          </>
        }
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleting) return;
          const label = `${deleting.title} (${deleting.tierName})`;
          await deletePackage(deleting.id);
          setDeleting(null);
          toast.success(`"${label}" removed`);
        }}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
