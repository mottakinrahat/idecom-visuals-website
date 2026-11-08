"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  Trash2,
  DollarSign,
  Briefcase,
  CheckCircle2,
  Clock,
  MessageSquare,
} from "@/components/dashboard/icons";
import { useStudioStore, type CrmLead } from "@/components/dashboard/store";

const STAGES: CrmLead["stage"][] = [
  "New Inquiry",
  "Proposal Sent",
  "In Production",
  "Review",
  "Completed",
];

const SERVICES: CrmLead["service"][] = [
  "Video Production",
  "Brand Design",
  "Reels Package",
  "Marketing",
  "Full Retainer",
];

export default function DashboardCrmPage() {
  const { leads, updateLeads } = useStudioStore();
  const [filterStage, setFilterStage] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState<Omit<CrmLead, "id">>({
    client: "",
    company: "",
    email: "",
    phone: "",
    service: "Video Production",
    budget: 2500,
    stage: "New Inquiry",
    dueDate: "2026-12-01",
    notes: "",
  });

  const filtered = leads.filter((l) => {
    const matchStage = filterStage === "All" || l.stage === filterStage;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      l.client.toLowerCase().includes(q) ||
      l.company.toLowerCase().includes(q) ||
      l.service.toLowerCase().includes(q) ||
      l.notes.toLowerCase().includes(q);
    return matchStage && matchSearch;
  });

  const addLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client.trim() || !form.company.trim()) return;
    updateLeads((prev) => [
      { ...form, id: `crm-${Date.now()}` },
      ...prev,
    ]);
    setForm({
      client: "",
      company: "",
      email: "",
      phone: "",
      service: "Video Production",
      budget: 2500,
      stage: "New Inquiry",
      dueDate: "2026-12-01",
      notes: "",
    });
    setShowAdd(false);
  };

  const changeStage = (id: string, stage: CrmLead["stage"]) => {
    updateLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, stage } : l))
    );
  };

  const removeLead = (id: string) => {
    updateLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const totalRevenue = leads.reduce((acc, l) => acc + l.budget, 0);
  const activeValue = leads
    .filter((l) => l.stage !== "Completed")
    .reduce((acc, l) => acc + l.budget, 0);
  const wonValue = leads
    .filter((l) => l.stage === "Completed")
    .reduce((acc, l) => acc + l.budget, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* CRM Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--d-card)] border border-[var(--d-line)] flex items-center justify-between">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--d-muted)]">
              Total Pipeline Value
            </span>
            <div className="text-2xl font-extrabold text-[var(--d-fg)] mt-1">
              ${totalRevenue.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--d-primary)]/15 text-[var(--d-accent)]">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--d-card)] border border-[var(--d-line)] flex items-center justify-between">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--d-muted)]">
              Active Production Deals
            </span>
            <div className="text-2xl font-extrabold text-[var(--d-accent)] mt-1">
              ${activeValue.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--d-card2)] text-[var(--d-accent)] border border-[var(--d-line)]">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--d-card)] border border-[var(--d-line)] flex items-center justify-between">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--d-muted)]">
              Completed & Delivered
            </span>
            <div className="text-2xl font-extrabold text-[var(--d-fg)] mt-1">
              ${wonValue.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--d-card2)] text-[var(--d-accent)] border border-[var(--d-line)]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar & Add Client Button */}
      <div className="p-4 rounded-2xl bg-[var(--d-card)] border border-[var(--d-line)] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {["All", ...STAGES].map((stage) => {
            const count =
              stage === "All"
                ? leads.length
                : leads.filter((l) => l.stage === stage).length;
            const active = filterStage === stage;
            return (
              <button
                key={stage}
                type="button"
                onClick={() => setFilterStage(stage)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  active
                    ? "bg-[var(--d-primary)] text-[var(--d-ink)]"
                    : "bg-[var(--d-card2)] text-[var(--d-muted)] hover:text-[var(--d-fg)] border border-[var(--d-line)]"
                }`}
              >
                <span>{stage}</span>
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${
                    active ? "bg-[var(--d-bg)]/20 text-[var(--d-ink)]" : "bg-[var(--d-card)] text-[var(--d-muted)]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-[var(--d-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search client, brand, service..."
              className="w-full pl-9 pr-4 py-2 rounded-full bg-[var(--d-card2)] border border-[var(--d-line)] text-xs text-[var(--d-fg)] placeholder:text-[var(--d-muted)] focus:outline-none focus:border-[var(--d-primary)]"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(!showAdd)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--d-primary)] hover:bg-[var(--d-primary-hi)] text-[var(--d-ink)] text-xs font-bold shrink-0 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Client Deal
          </button>
        </div>
      </div>

      {/* New Client Modal / Drawer Form */}
      {showAdd && (
        <form
          onSubmit={addLead}
          className="p-6 rounded-3xl bg-[var(--d-card)] border border-[var(--d-primary)]/40 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--d-accent)]">
                New Studio Deal
              </span>
              <h3 className="text-lg font-bold text-[var(--d-fg)]">
                Add Client or Production Inquiry
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="text-xs text-[var(--d-muted)] hover:text-[var(--d-fg)] cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1">
                Client Name *
              </label>
              <input
                required
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                placeholder="e.g. Tariq Hasan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm text-[var(--d-fg)]"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1">
                Brand / Company *
              </label>
              <input
                required
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="e.g. Urban Brew Café"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm text-[var(--d-fg)]"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="client@brand.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm text-[var(--d-fg)]"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1">
                Phone / WhatsApp
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+880 17XX-XXXXXX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm text-[var(--d-fg)]"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1">
                Service Package
              </label>
              <select
                value={form.service}
                onChange={(e) =>
                  setForm({ ...form, service: e.target.value as CrmLead["service"] })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm text-[var(--d-fg)]"
              >
                {SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1">
                Budget (USD)
              </label>
              <input
                type="number"
                value={form.budget}
                onChange={(e) =>
                  setForm({ ...form, budget: Number(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm text-[var(--d-fg)]"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1">
                Stage
              </label>
              <select
                value={form.stage}
                onChange={(e) =>
                  setForm({ ...form, stage: e.target.value as CrmLead["stage"] })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm text-[var(--d-fg)]"
              >
                {STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1">
                Delivery Deadline
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm text-[var(--d-fg)]"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1">
              Project Scope & Deliverables Notes
            </label>
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. 2 commercial films + 6 vertical reels + thumbnail design..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm text-[var(--d-fg)]"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-[var(--d-primary)] text-[var(--d-ink)] text-xs font-bold cursor-pointer"
            >
              Save Client Deal
            </button>
          </div>
        </form>
      )}

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((lead) => (
          <div
            key={lead.id}
            className="p-5 rounded-2xl bg-[var(--d-card)] border border-[var(--d-line)] hover:border-[var(--d-primary)]/40 transition-all flex flex-col justify-between gap-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-bold text-[var(--d-fg)]">
                    {lead.company}
                  </h3>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--d-primary)]/12 text-[var(--d-accent)] border border-[var(--d-primary)]/30">
                    <Briefcase className="w-3 h-3" />
                    {lead.service}
                  </span>
                </div>
                <p className="text-xs text-[var(--d-muted)] mt-1">
                  Contact: <strong className="text-[var(--d-fg)]">{lead.client}</strong>
                </p>
              </div>

              <div className="text-right">
                <div className="font-mono text-lg font-extrabold text-[var(--d-accent)]">
                  ${lead.budget.toLocaleString()}
                </div>
                <div className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--d-muted)]">
                  <Calendar className="w-3 h-3" />
                  {lead.dueDate}
                </div>
              </div>
            </div>

            <p className="text-xs text-[var(--d-fg)] bg-[var(--d-card2)]/80 p-3 rounded-xl border border-[var(--d-line)]">
              {lead.notes || "No project notes added."}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--d-line)]">
              <div className="flex items-center gap-2">
                {lead.phone && (
                  <a
                    href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--d-card2)] hover:border-[var(--d-primary)] border border-[var(--d-line)] text-xs text-[var(--d-fg)]"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[var(--d-accent)]" />
                    WhatsApp
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--d-card2)] hover:border-[var(--d-primary)] border border-[var(--d-line)] text-xs text-[var(--d-fg)]"
                  >
                    <Mail className="w-3.5 h-3.5 text-[var(--d-muted)]" />
                    Email
                  </a>
                )}
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[var(--d-muted)]">
                  <Phone className="w-3 h-3" />
                  {lead.phone}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={lead.stage}
                  onChange={(e) =>
                    changeStage(lead.id, e.target.value as CrmLead["stage"])
                  }
                  className="px-3 py-1.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] font-mono text-xs text-[var(--d-accent)] focus:outline-none focus:border-[var(--d-primary)] cursor-pointer"
                >
                  {STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeLead(lead.id)}
                  className="p-2 rounded-xl bg-[var(--d-card2)] hover:bg-red-500/20 border border-[var(--d-line)] text-[var(--d-muted)] hover:text-red-400 cursor-pointer transition-colors"
                  title="Delete Deal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

