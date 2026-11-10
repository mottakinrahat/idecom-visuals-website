"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Phone, Mail, Trash2, CheckCircle2 } from "@/components/dashboard/icons";
import { useStudioStore } from "@/components/dashboard/store";
import { Toaster, useToast } from "@/components/ui";
import { inquiriesApi, type Inquiry, type InquiryStatus } from "@/lib/inquiries";

const TABS: { id: InquiryStatus; label: string; empty: string }[] = [
  { id: "pending", label: "Pending", empty: "No new requests. New messages from the website contact form appear here." },
  { id: "verified", label: "Verified", empty: "Nothing waiting. Requests you have confirmed by phone appear here, ready to accept." },
  { id: "accepted", label: "Accepted", empty: "No accepted requests yet." },
  { id: "rejected", label: "Rejected", empty: "No rejected requests." },
];

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

const BTN = "inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full text-[12.5px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const PRIMARY = `${BTN} bg-[var(--d-primary)] hover:bg-[var(--d-primary-hi)] text-[var(--d-ink)]`;
const OUTLINE = `${BTN} border border-[var(--d-line)] hover:border-[var(--d-accent)] text-[var(--d-fg)]`;
const MUTED = `${BTN} border border-[var(--d-line)] text-[var(--d-muted)] hover:text-red-500 hover:border-red-500/50`;

/** pending → verified → accepted, shown as three dots */
function Steps({ status }: { status: InquiryStatus }) {
  const at = status === "pending" ? 0 : status === "verified" ? 1 : status === "accepted" ? 2 : -1;
  const steps = ["Request", "Phone verified", "Accepted"];
  if (status === "rejected") return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">Rejected</span>;
  return (
    <ol className="flex items-center gap-1.5 text-[11px]" aria-label="Progress">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${i <= at ? "bg-[var(--d-accent)]" : "bg-[var(--d-line)]"}`} />
          <span className={i <= at ? "text-[var(--d-fg)] font-medium" : "text-[var(--d-muted)]"}>{s}</span>
          {i < steps.length - 1 && <span className="w-4 h-px bg-[var(--d-line)]" />}
        </li>
      ))}
    </ol>
  );
}

export default function RequestsPage() {
  return (
    <Toaster>
      <Requests />
    </Toaster>
  );
}

function Requests() {
  const toast = useToast();
  const { leads, updateLeads } = useStudioStore();
  const [items, setItems] = useState<Inquiry[] | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<InquiryStatus>("pending");
  const [panel, setPanel] = useState<{ id: string; kind: "verify" | "reject" } | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      setItems(await inquiriesApi.list());
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    let live = true;
    inquiriesApi.list().then((l) => live && (setItems(l), setError(""))).catch((e: Error) => live && setError(e.message));
    return () => { live = false; };
  }, []);

  const run = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(id);
    try {
      await fn();
      toast.success(ok);
      setPanel(null);
      setText("");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  const accept = (q: Inquiry) =>
    run(
      q.id,
      async () => {
        const leadId = `web-${q.id.slice(0, 8)}`;
        await inquiriesApi.accept(q.id, leadId); // the server refuses unless it was verified first
        if (!leads.some((l) => l.id === leadId)) {
          updateLeads((prev) => [
            {
              id: leadId,
              client: q.name,
              company: q.category,
              email: q.email,
              phone: q.phone,
              service: "Video Production",
              budget: 0,
              stage: "New Inquiry",
              dueDate: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
              notes: [q.description, q.verifyNote && `Phone call: ${q.verifyNote}`, `Facebook: ${q.facebookUrl}`, q.website && `Website: ${q.website}`].filter(Boolean).join("\n\n"),
            },
            ...prev,
          ]);
        }
      },
      `${q.name} accepted and added to CRM`,
    );

  const count = (s: InquiryStatus) => (items ?? []).filter((i) => i.status === s).length;
  const visible = (items ?? []).filter((i) => i.status === tab);
  const current = TABS.find((t) => t.id === tab)!;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Requests</h1>
        <p className="text-[13px] text-[var(--d-muted)] mt-1">
          Call every customer first. Once you have confirmed the request by phone, mark it verified, then accept it to add it to CRM.
        </p>
      </div>

      <div role="tablist" className="inline-flex flex-wrap gap-1 p-1 rounded-full bg-[var(--d-card)] border border-[var(--d-line)] w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => { setTab(t.id); setPanel(null); }}
            className={`px-4 h-8 rounded-full text-[12.5px] font-medium cursor-pointer transition-colors ${
              tab === t.id ? "bg-[var(--d-primary)] text-[var(--d-ink)] font-semibold" : "text-[var(--d-muted)] hover:text-[var(--d-fg)]"
            }`}
          >
            {t.label} <span className="opacity-70">({count(t.id)})</span>
          </button>
        ))}
      </div>

      {error && <p className="text-[13px] text-red-500">{error}. Is the backend running?</p>}
      {!error && items === null && <p className="text-[13px] text-[var(--d-muted)]">Loading…</p>}
      {!error && items && visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--d-line)] p-10 text-center text-[13px] text-[var(--d-muted)]">{current.empty}</div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((q) => {
          const working = busy === q.id;
          const open = panel?.id === q.id ? panel.kind : null;
          return (
            <article key={q.id} className="rounded-2xl bg-[var(--d-card)] border border-[var(--d-line)] p-5 flex flex-col gap-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold text-[15px] truncate">{q.name}</h2>
                  <p className="text-[12px] text-[var(--d-muted)]">{q.category} · sent {fmt(q.createdAt)}</p>
                </div>
                <Steps status={q.status} />
              </div>

              {q.description ? (
                <p className="text-[13px] leading-relaxed whitespace-pre-line">{q.description}</p>
              ) : (
                <p className="text-[13px] text-[var(--d-muted)] italic">No message — the customer left this blank.</p>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px]">
                <a href={`tel:${q.phone}`} className="inline-flex items-center gap-1.5 text-[var(--d-accent)] font-medium hover:underline"><Phone className="w-3.5 h-3.5" />{q.phone}</a>
                {q.email && <a href={`mailto:${q.email}`} className="inline-flex items-center gap-1.5 text-[var(--d-accent)] hover:underline"><Mail className="w-3.5 h-3.5" />{q.email}</a>}
                <a href={q.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--d-accent)] hover:underline">Facebook page ↗</a>
                {q.website && <a href={q.website} target="_blank" rel="noopener noreferrer" className="text-[var(--d-accent)] hover:underline">Website ↗</a>}
              </div>

              {/* state-specific info */}
              {q.status === "verified" && (
                <div className="rounded-xl bg-[var(--d-tint)] px-3.5 py-2.5 text-[12.5px]">
                  <b className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[var(--d-accent)]" />Verified by phone · {fmt(q.verifiedAt)}</b>
                  {q.verifyNote && <p className="mt-1 text-[var(--d-muted)]">“{q.verifyNote}”</p>}
                </div>
              )}
              {q.status === "accepted" && (
                <div className="rounded-xl bg-[var(--d-tint)] px-3.5 py-2.5 text-[12.5px] flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[var(--d-accent)]" />Added to CRM · {fmt(q.acceptedAt)}</span>
                  <Link href="/dashboard/crm" className="font-semibold text-[var(--d-accent)] hover:underline">Open CRM →</Link>
                </div>
              )}
              {q.status === "rejected" && q.rejectReason && (
                <p className="text-[12.5px] text-[var(--d-muted)]">Reason: {q.rejectReason}</p>
              )}

              {/* inline note box for verify / reject */}
              {open && (
                <div className="rounded-xl border border-[var(--d-line)] p-3 flex flex-col gap-2.5">
                  <label className="text-[12px] font-medium text-[var(--d-muted)]" htmlFor={`note-${q.id}`}>
                    {open === "verify" ? "What did the customer say on the call? (optional)" : "Reason for rejecting (optional)"}
                  </label>
                  <textarea
                    id={`note-${q.id}`}
                    rows={2}
                    autoFocus
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={open === "verify" ? "e.g. Confirmed, wants 8 reels a month, budget ৳30k" : "e.g. Wrong number / not interested"}
                    className="w-full rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] px-3 py-2 text-[13px] outline-none focus:border-[var(--d-accent)]"
                  />
                  <div className="flex gap-2">
                    {open === "verify" ? (
                      <button type="button" disabled={working} className={PRIMARY} onClick={() => run(q.id, () => inquiriesApi.verify(q.id, text), `${q.name} verified`)}>Confirm verified</button>
                    ) : (
                      <button type="button" disabled={working} className={`${BTN} bg-red-500 hover:bg-red-600 text-white`} onClick={() => run(q.id, () => inquiriesApi.reject(q.id, text), `${q.name} rejected`)}>Reject request</button>
                    )}
                    <button type="button" className={OUTLINE} onClick={() => { setPanel(null); setText(""); }}>Cancel</button>
                  </div>
                </div>
              )}

              {/* actions */}
              {!open && (
                <div className="flex flex-wrap items-center gap-2 pt-3 mt-auto border-t border-[var(--d-line)]">
                  {q.status === "pending" && (
                    <>
                      <a href={`tel:${q.phone}`} className={PRIMARY}><Phone className="w-4 h-4" />Call now</a>
                      <button type="button" className={OUTLINE} onClick={() => { setPanel({ id: q.id, kind: "verify" }); setText(""); }}>Accept</button>
                      <button type="button" className={MUTED} onClick={() => { setPanel({ id: q.id, kind: "reject" }); setText(""); }}>Reject</button>
                    </>
                  )}
                  {q.status === "verified" && (
                    <>
                      <button type="button" disabled={working} className={PRIMARY} onClick={() => accept(q)}>{working ? "Adding…" : "Accept & add to CRM"}</button>
                      <button type="button" disabled={working} className={OUTLINE} onClick={() => run(q.id, () => inquiriesApi.reopen(q.id), "Moved back to pending")}>Back to pending</button>
                      <button type="button" className={MUTED} onClick={() => { setPanel({ id: q.id, kind: "reject" }); setText(""); }}>Reject</button>
                    </>
                  )}
                  {q.status === "rejected" && (
                    <button type="button" disabled={working} className={OUTLINE} onClick={() => run(q.id, () => inquiriesApi.reopen(q.id), "Restored to pending")}>Restore</button>
                  )}
                  {q.status !== "accepted" && (
                    <button
                      type="button"
                      aria-label="Delete request"
                      className="ml-auto w-9 h-9 grid place-items-center rounded-lg border border-[var(--d-line)] text-[var(--d-muted)] hover:text-red-500 hover:border-red-500/50 cursor-pointer"
                      onClick={() => { if (window.confirm(`Delete the request from ${q.name}?`)) run(q.id, () => inquiriesApi.remove(q.id), "Request deleted"); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
