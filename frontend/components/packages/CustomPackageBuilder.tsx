"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "@/components/dashboard/icons";
import { Button, Dropdown, Field, IconButton, TextField } from "@/components/ui";
import { api, ApiError, type Equipment } from "@/lib/api";
import {
  LABOUR_RATE,
  PURPOSE_LABEL,
  calcPackage,
  equipmentLineTotal,
  extraAmount,
  type CostPurpose,
  type CustomPackage,
  type EquipmentLine,
  type ExtraCost,
  useCustomPackages,
} from "@/lib/customPackages";
import { formatBDT, type DurationUnit } from "@/lib/rental";

const uid = () => Math.random().toString(36).slice(2, 10);
const num = (s: string) => (s.trim() === "" || Number.isNaN(Number(s)) ? 0 : Math.max(0, Number(s)));

const UNITS = [{ value: "minutes", label: "Minutes" }, { value: "hours", label: "Hours" }];
const PURPOSES = (Object.keys(PURPOSE_LABEL) as CostPurpose[]).map((p) => ({ value: p, label: PURPOSE_LABEL[p] }));
const LABOUR_QTY = Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: `${i + 1} labour` }));

// numbers are kept as text while typing
type EqRow = { id: string; equipmentId: string; value: string; unit: DurationUnit; qty: string };
type ExRow = { id: string; purpose: CostPurpose; label: string; qty: string; amount: string };

const blankEq = (): EqRow => ({ id: uid(), equipmentId: "", value: "1", unit: "hours", qty: "1" });
const blankEx = (): ExRow => ({ id: uid(), purpose: "car", label: "", qty: "1", amount: "" });

export function CustomPackageBuilder({ initial }: { initial: CustomPackage | null }) {
  const router = useRouter();
  const { save } = useCustomPackages();
  const cancel = () => router.push("/dashboard/package");
  const [catalog, setCatalog] = useState<Equipment[]>([]);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState(initial?.name ?? "");
  const [client, setClient] = useState(initial?.client ?? "");
  const [eq, setEq] = useState<EqRow[]>(
    initial?.equipment.map((l) => ({ id: l.id, equipmentId: l.equipmentId, value: String(l.value), unit: l.unit, qty: String(l.qty) })) ?? [blankEq()],
  );
  const [editOn, setEditOn] = useState(initial?.editing.enabled ?? false);
  const [videos, setVideos] = useState(String(initial?.editing.videos ?? 1));
  const [perVideo, setPerVideo] = useState(initial?.editing.pricePerVideo ? String(initial.editing.pricePerVideo) : "");
  const [ex, setEx] = useState<ExRow[]>(
    initial?.extras.map((c) => ({ id: c.id, purpose: c.purpose, label: c.label, qty: String(c.qty), amount: c.amount ? String(c.amount) : "" })) ?? [],
  );
  const [dType, setDType] = useState<"percent" | "fixed">(initial?.discount.type ?? "percent");
  const [dValue, setDValue] = useState(initial?.discount.value ? String(initial.discount.value) : "");
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    api
      .listEquipment()
      .then((l) => live && setCatalog(l.filter((e) => e.status === "active")))
      .catch((e) => live && setLoadError(e instanceof ApiError ? e.message : "Could not load equipment"));
    return () => {
      live = false;
    };
  }, []);

  const byId = useMemo(() => new Map(catalog.map((e) => [e.id, e])), [catalog]);
  const eqOptions = catalog.map((e) => ({ value: e.id, label: `${e.name} — ${formatBDT(e.pricePerHour)}/hr` }));

  // saved lines whose equipment was later removed keep their saved name/price
  const lineFor = (r: EqRow): EquipmentLine | null => {
    const e = byId.get(r.equipmentId);
    const saved = initial?.equipment.find((l) => l.equipmentId === r.equipmentId);
    const base = e ? { name: e.name, pricePerHour: e.pricePerHour } : saved ? { name: saved.name, pricePerHour: saved.pricePerHour } : null;
    if (!base) return null;
    return { id: r.id, equipmentId: r.equipmentId, ...base, value: num(r.value), unit: r.unit, qty: Math.max(1, Math.round(num(r.qty))) };
  };

  const lines = eq.map(lineFor).filter((l): l is EquipmentLine => !!l);
  const extras: ExtraCost[] = ex.map((r) => ({ id: r.id, purpose: r.purpose, label: r.label.trim(), qty: Math.max(1, Math.round(num(r.qty))), amount: num(r.amount) }));
  const draft = {
    equipment: lines,
    editing: { enabled: editOn, videos: Math.max(1, Math.round(num(videos))), pricePerVideo: num(perVideo) },
    extras,
    discount: { type: dType, value: num(dValue) },
  };
  const t = calcPackage(draft);

  const setEqRow = (id: string, patch: Partial<EqRow>) => setEq((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const setExRow = (id: string, patch: Partial<ExRow>) => setEx((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const submit = () => {
    if (name.trim().length < 2) return setError("Give the package a name");
    if (lines.length === 0 && !(editOn && t.editing > 0) && t.extras === 0) return setError("Add at least one equipment, service or cost");
    if (lines.some((l) => l.value <= 0)) return setError("Set a duration for every equipment");
    setError("");
    save({ id: initial?.id ?? uid(), name: name.trim(), client: client.trim(), createdAt: initial?.createdAt ?? new Date().toISOString(), ...draft });
    router.push("/dashboard/package");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <Link href="/dashboard/package" className="text-[12.5px] text-[var(--d-muted)] hover:text-[var(--d-fg)]">← Back to packages</Link>
          <h1 className="text-2xl font-semibold mt-1">{initial ? "Edit custom package" : "Create custom package"}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={cancel}>Cancel</Button>
          <Button onClick={submit}>{initial ? "Save changes" : "Create package"}</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
      <div className="flex flex-col gap-6 min-w-0">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Package name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wedding shoot — 3 hr" />
          <TextField label="Client (optional)" value={client} onChange={(e) => setClient(e.target.value)} />
        </div>

        {/* Equipment */}
        <section className="flex flex-col gap-3">
          <h3 className="text-[14px] font-semibold">Equipment</h3>
          {loadError && <p className="text-[12px] text-red-500">{loadError}</p>}
          {eq.map((r) => {
            const line = lineFor(r);
            return (
              <div key={r.id} className="rounded-xl border border-[var(--d-line)] p-3 flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Field label="Equipment" htmlFor={`eq-${r.id}`}>
                    <Dropdown id={`eq-${r.id}`} value={r.equipmentId} options={eqOptions} onChange={(v) => setEqRow(r.id, { equipmentId: v })} ariaLabel="Equipment" />
                  </Field>
                  <div className="flex items-end">
                    <IconButton label="Remove equipment" onClick={() => setEq((rows) => rows.filter((x) => x.id !== r.id))}>
                      <Trash2 className="w-4 h-4" />
                    </IconButton>
                  </div>
                </div>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_auto] items-end">
                  <TextField label="Time" type="number" min="0" value={r.value} onChange={(e) => setEqRow(r.id, { value: e.target.value })} />
                  <Field label="Unit" htmlFor={`un-${r.id}`}>
                    <Dropdown id={`un-${r.id}`} value={r.unit} options={UNITS} onChange={(v) => setEqRow(r.id, { unit: v as DurationUnit })} ariaLabel="Unit" />
                  </Field>
                  <TextField label="Quantity" type="number" min="1" value={r.qty} onChange={(e) => setEqRow(r.id, { qty: e.target.value })} />
                  <div className="col-span-2 sm:col-span-1 text-right pb-2">
                    <div className="text-[11px] text-[var(--d-muted)]">Line total</div>
                    <div className="text-[15px] font-semibold">{line ? formatBDT(equipmentLineTotal(line)) : "—"}</div>
                  </div>
                </div>
              </div>
            );
          })}
          <div>
            <Button variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setEq((rows) => [...rows, blankEq()])}>
              Add equipment
            </Button>
          </div>
        </section>

        {/* Video editing */}
        <section className="flex flex-col gap-3">
          <label className="inline-flex items-center gap-2 text-[14px] font-semibold cursor-pointer w-fit">
            <input type="checkbox" checked={editOn} onChange={(e) => setEditOn(e.target.checked)} className="accent-[var(--d-primary)] w-4 h-4" />
            Add video editing service
          </label>
          {editOn && (
            <div className="grid gap-3 sm:grid-cols-3 items-end">
              <TextField label="Number of videos" type="number" min="1" value={videos} onChange={(e) => setVideos(e.target.value)} />
              <TextField label="Price per video (৳)" type="number" min="0" value={perVideo} onChange={(e) => setPerVideo(e.target.value)} />
              <div className="text-right pb-2">
                <div className="text-[11px] text-[var(--d-muted)]">Editing total</div>
                <div className="text-[15px] font-semibold">{formatBDT(t.editing)}</div>
              </div>
            </div>
          )}
        </section>

        {/* Additional cost */}
        <section className="flex flex-col gap-3">
          <h3 className="text-[14px] font-semibold">Additional cost</h3>
          {ex.map((r) => (
            <div key={r.id} className="rounded-xl border border-[var(--d-line)] p-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
              <Field label="Purpose" htmlFor={`pu-${r.id}`}>
                <Dropdown id={`pu-${r.id}`} value={r.purpose} options={PURPOSES} onChange={(v) => setExRow(r.id, { purpose: v as CostPurpose })} ariaLabel="Purpose" />
              </Field>
              {r.purpose === "labour" ? (
                <Field label={`Labour (${formatBDT(LABOUR_RATE)} each)`} htmlFor={`lq-${r.id}`}>
                  <Dropdown id={`lq-${r.id}`} value={r.qty} options={LABOUR_QTY} onChange={(v) => setExRow(r.id, { qty: v })} ariaLabel="Labour count" />
                </Field>
              ) : (
                <div className="grid gap-3 grid-cols-1">
                  {r.purpose === "other" && (
                    <TextField label="What for?" value={r.label} onChange={(e) => setExRow(r.id, { label: e.target.value })} placeholder="e.g. Parking" />
                  )}
                  <TextField label="Price (৳)" type="number" min="0" value={r.amount} onChange={(e) => setExRow(r.id, { amount: e.target.value })} />
                </div>
              )}
              <div className="flex items-center gap-3 justify-end pb-1">
                <span className="text-[15px] font-semibold">{formatBDT(extraAmount({ id: r.id, purpose: r.purpose, label: r.label, qty: Math.max(1, Math.round(num(r.qty))), amount: num(r.amount) }))}</span>
                <IconButton label="Remove cost" onClick={() => setEx((rows) => rows.filter((x) => x.id !== r.id))}>
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </div>
            </div>
          ))}
          <div>
            <Button variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setEx((rows) => [...rows, blankEx()])}>
              Add cost
            </Button>
          </div>
        </section>

        {/* Discount */}
        <section className="flex flex-col gap-3">
          <h3 className="text-[14px] font-semibold">Discount</h3>
          <div className="grid gap-3 grid-cols-2 max-w-sm">
            <Field label="Type" htmlFor="disc-type">
              <Dropdown id="disc-type" value={dType} options={[{ value: "percent", label: "Percent (%)" }, { value: "fixed", label: "Fixed (৳)" }]} onChange={(v) => setDType(v as "percent" | "fixed")} ariaLabel="Discount type" />
            </Field>
            <TextField label={dType === "percent" ? "Discount (%)" : "Discount (৳)"} type="number" min="0" value={dValue} onChange={(e) => setDValue(e.target.value)} />
          </div>
        </section>


        {error && <p role="alert" className="text-[12.5px] text-red-500">{error}</p>}
      </div>

      <aside className="lg:sticky lg:top-24">
        {/* Summary */}
        <section className="rounded-2xl bg-[var(--d-card)] border border-[var(--d-line)] p-5 flex flex-col gap-1.5 text-[13px]">
          <Row k="Equipment" v={t.equipment} />
          {editOn && <Row k="Video editing" v={t.editing} />}
          <Row k="Additional cost" v={t.extras} />
          <Row k="Subtotal" v={t.subtotal} />
          <Row k="Discount" v={-t.discount} />
          <div className="mt-2 pt-2 border-t border-[var(--d-line)] flex items-center justify-between text-[16px] font-bold">
            <span>Total</span>
            <span className="text-[var(--d-accent)]">{formatBDT(t.total)}</span>
          </div>
        </section>
      </aside>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--d-muted)]">{k}</span>
      <span>{v < 0 ? `− ${formatBDT(-v)}` : formatBDT(v)}</span>
    </div>
  );
}
