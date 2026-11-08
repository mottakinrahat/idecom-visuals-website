"use client";

import { useEffect, useState } from "react";
import Thumb from "@/components/home/Thumb";
import { parseVideo } from "@/lib/embed";
import { detectDuration, formatDuration } from "@/lib/duration";
import {
  Video,
  Film,
  Smartphone,
  Palette,
  Sparkles,
  Users,
  PhoneCall,
  Plus,
  Trash2,
  RotateCcw,
  Upload,
  Check,
  Award,
} from "@/components/dashboard/icons";
import {
  useStudioStore,
  type VideoItem,
  type DesignItem,
} from "@/components/dashboard/store";

type CmsTab =
  | "hero"
  | "videos"
  | "reels"
  | "designs"
  | "clients"
  | "services"
  | "team"
  | "contact";

const TABS: { id: CmsTab; label: string; sub: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
  { id: "hero", label: "Hero & BG Video", sub: "Viewfinder & R2 video", icon: Video },
  { id: "videos", label: "16:9 Videos", sub: "Left → Right marquee", icon: Film },
  { id: "reels", label: "9:16 Reels", sub: "Right → Left marquee", icon: Smartphone },
  { id: "designs", label: "Design Works", sub: "Images & portfolio grid", icon: Palette },
  { id: "clients", label: "Clients & Stats", sub: "Brands & counters", icon: Award },
  { id: "services", label: "Services", sub: "3 service pillars", icon: Sparkles },
  { id: "team", label: "Team Members", sub: "Portraits & roles", icon: Users },
  { id: "contact", label: "CTA & Footer", sub: "WhatsApp & contact", icon: PhoneCall },
];

/** Reads the pasted link, detects its length and writes it into the Duration field. */
function AutoDuration({ url, onDetect }: { url?: string; onDetect: (d: string) => void }) {
  const [state, setState] = useState<"idle" | "busy" | "ok" | "fail">("idle");
  useEffect(() => {
    if (!url || !parseVideo(url)) return;
    let live = true;
    const t = setTimeout(async () => {
      setState("busy");
      const sec = await detectDuration(url);
      if (!live) return;
      if (sec) { onDetect(formatDuration(sec)); setState("ok"); } else setState("fail");
    }, 700);
    return () => { live = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
  if (!url) return null;
  const msg = { idle: "", busy: "detecting…", ok: "auto", fail: "couldn't detect — type it" }[state];
  return <span className={`ml-2 normal-case ${state === "fail" ? "text-red-400" : "text-[var(--d-accent)]"}`}>{msg}</span>;
}

export default function DashboardCmsPage() {
  const { content, updateContent, resetContent } = useStudioStore();
  const [activeTab, setActiveTab] = useState<CmsTab>("hero");
  const [savedToast, setSavedToast] = useState(false);

  const notifySaved = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleImageUpload = (file: File, onResult: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onResult(reader.result);
        notifySaved();
      }
    };
    reader.readAsDataURL(file);
  };

  /* Helpers for Videos & Reels */
  const addVideoItem = (kind: "landscape" | "vertical") => {
    const newItem: VideoItem =
      kind === "landscape"
        ? {
            id: `l-${Date.now()}`,
            w: "New",
            tag: "Brand film",
            t: "New landscape project",
            d: "00:01:00:00",
            a: "#3f6f12",
            b: "#1a2a0b",
            videoUrl: "",
            thumbUrl: "",
          }
        : {
            id: `v-${Date.now()}`,
            w: "Reel",
            tag: "Reel",
            t: "New vertical reel",
            d: "00:00:30",
            a: "#5a2f7a",
            b: "#170c24",
            videoUrl: "",
            thumbUrl: "",
          };

    updateContent((prev) => ({
      ...prev,
      videos: {
        ...prev.videos,
        [kind]: [newItem, ...prev.videos[kind]],
      },
    }));
    notifySaved();
  };

  const updateVideoItem = (
    kind: "landscape" | "vertical",
    id: string,
    patch: Partial<VideoItem>
  ) => {
    updateContent((prev) => ({
      ...prev,
      videos: {
        ...prev.videos,
        [kind]: prev.videos[kind].map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      },
    }));
    notifySaved();
  };

  const deleteVideoItem = (kind: "landscape" | "vertical", id: string) => {
    updateContent((prev) => ({
      ...prev,
      videos: {
        ...prev.videos,
        [kind]: prev.videos[kind].filter((item) => item.id !== id),
      },
    }));
    notifySaved();
  };

  /* Helpers for Designs */
  const addDesignItem = () => {
    const newDesign: DesignItem = {
      id: `d-${Date.now()}`,
      cls: "",
      art: "art-can",
      cap: "Brand Design · New project",
      label: "NEW WORK",
      imageUrl: "",
    };
    updateContent((prev) => ({
      ...prev,
      designs: {
        ...prev.designs,
        items: [newDesign, ...prev.designs.items],
      },
    }));
    notifySaved();
  };

  const updateDesignItem = (id: string, patch: Partial<DesignItem>) => {
    updateContent((prev) => ({
      ...prev,
      designs: {
        ...prev.designs,
        items: prev.designs.items.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      },
    }));
    notifySaved();
  };

  const deleteDesignItem = (id: string) => {
    updateContent((prev) => ({
      ...prev,
      designs: {
        ...prev.designs,
        items: prev.designs.items.filter((item) => item.id !== id),
      },
    }));
    notifySaved();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top CMS Bar */}
      <div className="p-5 rounded-3xl bg-[var(--d-card)] border border-[var(--d-line)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--d-accent)]">
            Visual Content Management System
          </span>
          <h2 className="text-xl font-bold text-[var(--d-fg)] mt-0.5 tracking-tight normal-case">
            Manage All Sections, Videos, Reels & Design Assets
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {savedToast && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--d-primary)]/15 border border-[var(--d-primary)]/40 text-xs font-mono text-[var(--d-accent)]">
              <Check className="w-3.5 h-3.5" />
              Auto-saved to live site
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              resetContent();
              notifySaved();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--d-card2)] hover:border-red-400/60 border border-[var(--d-line)] text-xs font-semibold text-[var(--d-muted)] hover:text-[var(--d-fg)] cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                active
                  ? "bg-[var(--d-primary)] text-[var(--d-ink)] border-[var(--d-primary)] shadow-[0_8px_25px_rgba(156,246,10,0.2)]"
                  : "bg-[var(--d-card)] text-[var(--d-fg)] border-[var(--d-line)] hover:border-[var(--d-primary)]/40"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  active ? "text-[var(--d-ink)]" : "text-[var(--d-accent)]"
                }`}
              />
              <div>
                <div className="font-bold text-xs leading-tight">{t.label}</div>
                <div
                  className={`text-[10px] mt-0.5 truncate ${
                    active ? "text-[var(--d-ink)]/75 font-medium" : "text-[var(--d-muted)]"
                  }`}
                >
                  {t.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HERO & BG VIDEO */}
      {activeTab === "hero" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-3xl bg-[var(--d-card)] border border-[var(--d-line)] flex flex-col gap-5">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--d-accent)]">
                Hero Section Configuration
              </span>
              <h3 className="text-lg font-bold text-[var(--d-fg)] mt-0.5">
                Headlines, Viewfinder HUD & Background Video
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1.5">
                  Eyebrow Badge
                </label>
                <input
                  value={content.hero.eyebrow}
                  onChange={(e) => {
                    updateContent((p) => ({
                      ...p,
                      hero: { ...p.hero, eyebrow: e.target.value },
                    }));
                    notifySaved();
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm text-[var(--d-fg)]"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1.5">
                  Camera Specs HUD
                </label>
                <input
                  value={content.hero.specs}
                  onChange={(e) => {
                    updateContent((p) => ({
                      ...p,
                      hero: { ...p.hero, specs: e.target.value },
                    }));
                    notifySaved();
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm font-mono text-[var(--d-fg)]"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1.5">
                  Title Line 1 (White)
                </label>
                <input
                  value={content.hero.titleLine1}
                  onChange={(e) => {
                    updateContent((p) => ({
                      ...p,
                      hero: { ...p.hero, titleLine1: e.target.value },
                    }));
                    notifySaved();
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm font-bold text-[var(--d-fg)]"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1.5">
                  Title Line 2 (Lime Green)
                </label>
                <input
                  value={content.hero.titleLine2}
                  onChange={(e) => {
                    updateContent((p) => ({
                      ...p,
                      hero: { ...p.hero, titleLine2: e.target.value },
                    }));
                    notifySaved();
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm font-bold text-[var(--d-accent)]"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1.5">
                Background Video URL (.mp4 / Cloudflare R2 / CDN)
              </label>
              <input
                value={content.hero.videoUrl}
                onChange={(e) => {
                  updateContent((p) => ({
                    ...p,
                    hero: { ...p.hero, videoUrl: e.target.value },
                  }));
                  notifySaved();
                }}
                placeholder="https://.../video.mp4"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-xs font-mono text-[var(--d-accent)]"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1.5">
                Highlighted Bold Phrase in Subtitle
              </label>
              <input
                value={content.hero.highlightText}
                onChange={(e) => {
                  updateContent((p) => ({
                    ...p,
                    hero: { ...p.hero, highlightText: e.target.value },
                  }));
                  notifySaved();
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm text-[var(--d-fg)]"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1.5">
                Subtitle Continuation Text
              </label>
              <textarea
                rows={2}
                value={content.hero.description}
                onChange={(e) => {
                  updateContent((p) => ({
                    ...p,
                    hero: { ...p.hero, description: e.target.value },
                  }));
                  notifySaved();
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm text-[var(--d-fg)]"
              />
            </div>

            {/* 3 Hero Facts */}
            <div className="pt-3 border-t border-[var(--d-line)]">
              <span className="block font-mono text-[11px] uppercase tracking-wider text-[var(--d-muted)] mb-3">
                Bottom Viewfinder Facts (3 Columns)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {content.hero.facts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] flex flex-col gap-2"
                  >
                    <input
                      value={fact.title}
                      onChange={(e) => {
                        const nextFacts = [...content.hero.facts];
                        nextFacts[idx] = { ...fact, title: e.target.value };
                        updateContent((p) => ({
                          ...p,
                          hero: { ...p.hero, facts: nextFacts },
                        }));
                        notifySaved();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[var(--d-card)] border border-[var(--d-line)] text-xs font-bold text-[var(--d-fg)]"
                    />
                    <input
                      value={fact.subtitle}
                      onChange={(e) => {
                        const nextFacts = [...content.hero.facts];
                        nextFacts[idx] = { ...fact, subtitle: e.target.value };
                        updateContent((p) => ({
                          ...p,
                          hero: { ...p.hero, facts: nextFacts },
                        }));
                        notifySaved();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[var(--d-card)] border border-[var(--d-line)] text-xs text-[var(--d-muted)]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Video & Viewfinder Preview */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-[var(--d-card)] border border-[var(--d-line)] flex flex-col gap-4">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--d-accent)]">
              Live Hero Viewfinder Preview
            </span>
            <div className="relative rounded-2xl overflow-hidden border border-[var(--d-line)] aspect-video bg-[var(--d-bg)] flex flex-col justify-between p-5">
              {content.hero.videoUrl && (
                <video
                  key={content.hero.videoUrl}
                  src={content.hero.videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover opacity-55"
                />
              )}
              <div className="relative z-10 flex items-center justify-between font-mono text-[10px] text-[var(--d-muted)]">
                <span className="inline-flex items-center gap-1.5 text-white">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  REC
                </span>
                <span>{content.hero.specs}</span>
                <span className="text-[var(--d-accent)]">00:08:46:01</span>
              </div>

              <div className="relative z-10 text-center my-auto py-4">
                <span className="inline-block font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-[var(--d-primary)]/15 text-[var(--d-accent)] border border-[var(--d-primary)]/30 mb-2">
                  {content.hero.eyebrow}
                </span>
                <div className="font-extrabold uppercase leading-none tracking-wider">
                  <div className="text-2xl sm:text-3xl text-white font-medium">
                    {content.hero.titleLine1}
                  </div>
                  <div className="text-xl sm:text-2xl text-[var(--d-accent)] font-extrabold mt-0.5">
                    {content.hero.titleLine2}
                  </div>
                </div>
              </div>

              <div className="relative z-10 text-center text-[11px] text-[var(--d-fg)] line-clamp-2">
                We shoot, edit, design and market.{" "}
                <strong className="text-white">{content.hero.highlightText}</strong>{" "}
                {content.hero.description}
              </div>
            </div>
            <p className="text-xs text-[var(--d-muted)]">
              Changes made here automatically update the main Hero section on{" "}
              <code className="text-[var(--d-accent)]">/</code>.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2 & 3: 16:9 LANDSCAPE VIDEOS OR 9:16 VERTICAL REELS */}
      {(activeTab === "videos" || activeTab === "reels") && (
        <div className="flex flex-col gap-5">
          <div className="p-5 rounded-2xl bg-[var(--d-card)] border border-[var(--d-line)] flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--d-accent)]">
                {activeTab === "videos"
                  ? "Upper Marquee Row (Moves Left → Right, Pauses on Hover)"
                  : "Bottom Marquee Row (Moves Right → Left, Pauses on Hover)"}
              </span>
              <h3 className="text-lg font-bold text-[var(--d-fg)] mt-0.5">
                {activeTab === "videos"
                  ? `16:9 Landscape Featured Videos (${content.videos.landscape.length})`
                  : `9:16 Vertical Short-Form Reels (${content.videos.vertical.length})`}
              </h3>
            </div>
            <button
              type="button"
              onClick={() =>
                addVideoItem(activeTab === "videos" ? "landscape" : "vertical")
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--d-primary)] hover:bg-[var(--d-primary-hi)] text-[var(--d-ink)] text-xs font-bold cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              {activeTab === "videos" ? "Add 16:9 Video" : "Add 9:16 Reel"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(activeTab === "videos"
              ? content.videos.landscape
              : content.videos.vertical
            ).map((item) => {
              const kind = activeTab === "videos" ? "landscape" : "vertical";
              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-[var(--d-card)] border border-[var(--d-line)] flex flex-col gap-4"
                >
                  {/* Visual Card Preview */}
                  <div
                    className={`relative rounded-xl overflow-hidden border border-[var(--d-line)] ${
                      activeTab === "videos" ? "aspect-video" : "aspect-[16/10]"
                    }`}
                    style={{
                      background: `radial-gradient(70% 80% at 30% 30%, ${item.a}, transparent 70%), linear-gradient(155deg, ${item.b}, #0b0c09 85%)`,
                    }}
                  >
                    {!(parseVideo(item.videoUrl)?.kind === "file" && !item.thumbUrl) && (
                      <Thumb videoUrl={item.videoUrl} thumbUrl={item.thumbUrl} alt={item.t} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                    )}
                    {parseVideo(item.videoUrl)?.kind === "file" && (
                      <video
                        src={item.videoUrl}
                        muted
                        loop
                        playsInline
                        onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                        onMouseLeave={(e) => e.currentTarget.pause()}
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center font-extrabold uppercase text-3xl tracking-wider text-white/10 select-none pointer-events-none">
                      {item.w}
                    </div>
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between font-mono text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-black/60 text-white border border-white/10">
                        {item.tag}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-black/60 text-white border border-white/10">
                        {activeTab === "videos" ? "16:9" : "9:16"}
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 left-3 right-3">
                      <div className="font-bold text-sm text-white truncate">
                        {item.t}
                      </div>
                      <div className="font-mono text-[10px] text-[var(--d-accent)]">
                        {item.d}
                      </div>
                    </div>
                  </div>

                  {/* Editable Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block font-mono text-[10px] text-[var(--d-muted)] mb-1">
                        Project Title
                      </label>
                      <input
                        value={item.t}
                        onChange={(e) =>
                          updateVideoItem(kind, item.id, { t: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-xs font-semibold text-[var(--d-fg)]"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-[var(--d-muted)] mb-1">
                        Category Tag
                      </label>
                      <input
                        value={item.tag}
                        onChange={(e) =>
                          updateVideoItem(kind, item.id, { tag: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-xs text-[var(--d-fg)]"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-[var(--d-muted)] mb-1">
                        Watermark Word
                      </label>
                      <input
                        value={item.w}
                        onChange={(e) =>
                          updateVideoItem(kind, item.id, { w: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-xs text-[var(--d-fg)]"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-[var(--d-muted)] mb-1">
                        Duration (auto from link)
                        <AutoDuration url={item.videoUrl} onDetect={(d) => updateVideoItem(kind, item.id, { d })} />
                      </label>
                      <input
                        value={item.d}
                        onChange={(e) =>
                          updateVideoItem(kind, item.id, { d: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-xs font-mono text-[var(--d-accent)]"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block font-mono text-[10px] text-[var(--d-muted)] mb-1">
                          Glow Color
                        </label>
                        <input
                          type="color"
                          value={item.a}
                          onChange={(e) =>
                            updateVideoItem(kind, item.id, { a: e.target.value })
                          }
                          className="w-full h-8 rounded-lg bg-[var(--d-card2)] border border-[var(--d-line)] cursor-pointer"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block font-mono text-[10px] text-[var(--d-muted)] mb-1">
                          Base Color
                        </label>
                        <input
                          type="color"
                          value={item.b}
                          onChange={(e) =>
                            updateVideoItem(kind, item.id, { b: e.target.value })
                          }
                          className="w-full h-8 rounded-lg bg-[var(--d-card2)] border border-[var(--d-line)] cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block font-mono text-[10px] text-[var(--d-muted)] mb-1">
                        Video Link (YouTube / Facebook / .mp4)
                      </label>
                      <input
                        value={item.videoUrl || ""}
                        onChange={(e) =>
                          updateVideoItem(kind, item.id, {
                            videoUrl: e.target.value,
                          })
                        }
                        placeholder="Paste YouTube or Facebook video link"
                        className="w-full px-3 py-2 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-xs font-mono text-[var(--d-fg)]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block font-mono text-[10px] text-[var(--d-muted)] mb-1">
                        Thumbnail Image URL or Upload
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={item.thumbUrl || ""}
                          onChange={(e) =>
                            updateVideoItem(kind, item.id, {
                              thumbUrl: e.target.value,
                            })
                          }
                          placeholder="Paste image URL or upload →"
                          className="flex-1 px-3 py-2 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-xs text-[var(--d-fg)]"
                        />
                        <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--d-card2)] hover:border-[var(--d-primary)] border border-[var(--d-line)] text-xs text-[var(--d-accent)] cursor-pointer shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file, (dataUrl) =>
                                  updateVideoItem(kind, item.id, {
                                    thumbUrl: dataUrl,
                                  })
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-[var(--d-line)]">
                    <button
                      type="button"
                      onClick={() => deleteVideoItem(kind, item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--d-card2)] hover:bg-red-500/20 text-xs text-[var(--d-muted)] hover:text-red-400 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: DESIGN WORKS (IMAGES & PORTFOLIO) */}
      {activeTab === "designs" && (
        <div className="flex flex-col gap-5">
          <div className="p-5 rounded-2xl bg-[var(--d-card)] border border-[var(--d-line)] flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--d-accent)]">
                Design Portfolio Grid
              </span>
              <h3 className="text-lg font-bold text-[var(--d-fg)] mt-0.5">
                Manage Design Works & Upload Artwork Images ({content.designs.items.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={addDesignItem}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--d-primary)] hover:bg-[var(--d-primary-hi)] text-[var(--d-ink)] text-xs font-bold cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Design Work
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {content.designs.items.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[var(--d-card)] border border-[var(--d-line)] flex flex-col gap-4"
              >
                {/* Preview */}
                <div className="relative h-44 rounded-xl overflow-hidden border border-[var(--d-line)] bg-[var(--d-card2)] flex items-center justify-center">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.cap}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <div className="font-extrabold text-xl text-[var(--d-accent)] uppercase tracking-wider">
                        {item.label}
                      </div>
                      <div className="font-mono text-[10px] text-[var(--d-muted)] mt-1">
                        Preset style: {item.art}
                      </div>
                    </div>
                  )}
                  <span className="absolute bottom-2.5 left-2.5 font-mono text-[10px] px-2.5 py-1 rounded-full bg-black/75 text-white">
                    {item.cap}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] text-[var(--d-muted)] mb-1">
                      Caption Tag (Bottom Pill)
                    </label>
                    <input
                      value={item.cap}
                      onChange={(e) =>
                        updateDesignItem(item.id, { cap: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-xs font-semibold text-[var(--d-fg)]"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-[var(--d-muted)] mb-1">
                      Display Text / Label
                    </label>
                    <input
                      value={item.label}
                      onChange={(e) =>
                        updateDesignItem(item.id, { label: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-xs text-[var(--d-fg)]"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-[var(--d-muted)] mb-1">
                      Grid Tile Size
                    </label>
                    <select
                      value={item.cls}
                      onChange={(e) =>
                        updateDesignItem(item.id, {
                          cls: e.target.value as DesignItem["cls"],
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-xs text-[var(--d-fg)]"
                    >
                      <option value="">Standard (1x1)</option>
                      <option value="w-wide">Wide Banner (2x1)</option>
                      <option value="w-a">Featured Large (2x2)</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block font-mono text-[10px] text-[var(--d-muted)] mb-1">
                      Artwork Image (Upload or Paste URL)
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={item.imageUrl || ""}
                        onChange={(e) =>
                          updateDesignItem(item.id, { imageUrl: e.target.value })
                        }
                        placeholder="https://.../poster.jpg or Upload →"
                        className="flex-1 px-3 py-2 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-xs text-[var(--d-fg)]"
                      />
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--d-card2)] hover:border-[var(--d-primary)] border border-[var(--d-line)] text-xs text-[var(--d-accent)] cursor-pointer shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, (dataUrl) =>
                                updateDesignItem(item.id, { imageUrl: dataUrl })
                              );
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[var(--d-line)]">
                  {item.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => updateDesignItem(item.id, { imageUrl: "" })}
                      className="text-[11px] text-[var(--d-muted)] hover:text-[var(--d-fg)] cursor-pointer"
                    >
                      Clear custom image
                    </button>
                  ) : (
                    <span className="text-[11px] text-[var(--d-muted)]">
                      Using studio CSS artwork
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteDesignItem(item.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--d-card2)] hover:bg-red-500/20 text-xs text-[var(--d-muted)] hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CLIENTS & STATS */}
      {activeTab === "clients" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-3xl bg-[var(--d-card)] border border-[var(--d-line)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--d-accent)]">
                  Client Marquee Logos
                </span>
                <h3 className="text-lg font-bold text-[var(--d-fg)]">
                  Brands We&apos;ve Worked With ({content.clients.brands.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  updateContent((p) => ({
                    ...p,
                    clients: {
                      ...p.clients,
                      brands: [
                        ...p.clients.brands,
                        { style: "b1", name: "NEW BRAND" },
                      ],
                    },
                  }));
                  notifySaved();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--d-primary)] text-[var(--d-ink)] text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Brand
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {content.clients.brands.map((b, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] flex items-center gap-2"
                >
                  <input
                    value={b.name}
                    onChange={(e) => {
                      const next = [...content.clients.brands];
                      next[i] = { ...b, name: e.target.value };
                      updateContent((p) => ({
                        ...p,
                        clients: { ...p.clients, brands: next },
                      }));
                      notifySaved();
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--d-card)] border border-[var(--d-line)] text-xs font-bold text-[var(--d-fg)]"
                  />
                  <select
                    value={b.style}
                    onChange={(e) => {
                      const next = [...content.clients.brands];
                      next[i] = { ...b, style: e.target.value };
                      updateContent((p) => ({
                        ...p,
                        clients: { ...p.clients, brands: next },
                      }));
                      notifySaved();
                    }}
                    className="px-2 py-1.5 rounded-lg bg-[var(--d-card)] border border-[var(--d-line)] font-mono text-xs text-[var(--d-accent)]"
                  >
                    <option value="b1">Bold Display</option>
                    <option value="b2">Minimal Sans</option>
                    <option value="b3">Condensed</option>
                    <option value="b4">Mono Spaced</option>
                    <option value="b5">Heavy Sans</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      updateContent((p) => ({
                        ...p,
                        clients: {
                          ...p.clients,
                          brands: p.clients.brands.filter((_, idx) => idx !== i),
                        },
                      }));
                      notifySaved();
                    }}
                    className="p-1.5 text-[var(--d-muted)] hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-3xl bg-[var(--d-card)] border border-[var(--d-line)] flex flex-col gap-4">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--d-accent)]">
              Key Studio Numbers
            </span>
            <h3 className="text-lg font-bold text-[var(--d-fg)]">
              3 Highlight Counters
            </h3>
            <div className="flex flex-col gap-3">
              {content.clients.stats.map((st, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-[var(--d-card2)] border border-[var(--d-line)] grid grid-cols-2 gap-3"
                >
                  <div>
                    <label className="block font-mono text-[10px] text-[var(--d-muted)] mb-1">
                      Number (e.g. 250, 50M)
                    </label>
                    <input
                      value={st.number}
                      onChange={(e) => {
                        const next = [...content.clients.stats];
                        next[i] = { ...st, number: e.target.value };
                        updateContent((p) => ({
                          ...p,
                          clients: { ...p.clients, stats: next },
                        }));
                        notifySaved();
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--d-card)] border border-[var(--d-line)] text-sm font-extrabold text-[var(--d-accent)]"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-[var(--d-muted)] mb-1">
                      Label
                    </label>
                    <input
                      value={st.label}
                      onChange={(e) => {
                        const next = [...content.clients.stats];
                        next[i] = { ...st, label: e.target.value };
                        updateContent((p) => ({
                          ...p,
                          clients: { ...p.clients, stats: next },
                        }));
                        notifySaved();
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--d-card)] border border-[var(--d-line)] text-xs text-[var(--d-fg)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SERVICES */}
      {activeTab === "services" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {content.services.list.map((svc, sIdx) => (
            <div
              key={svc.id}
              className="p-6 rounded-3xl bg-[var(--d-card)] border border-[var(--d-line)] flex flex-col justify-between gap-4"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--d-accent)]">
                    Service Pillar #{sIdx + 1}
                  </span>
                  <label className="inline-flex items-center gap-2 text-xs text-[var(--d-muted)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={svc.hl}
                      onChange={(e) => {
                        const next = [...content.services.list];
                        next[sIdx] = { ...svc, hl: e.target.checked };
                        updateContent((p) => ({
                          ...p,
                          services: { ...p.services, list: next },
                        }));
                        notifySaved();
                      }}
                      className="accent-[var(--d-primary)]"
                    />
                    Featured Glow
                  </label>
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-[var(--d-muted)] mb-1">
                    Card Title
                  </label>
                  <input
                    value={svc.title}
                    onChange={(e) => {
                      const next = [...content.services.list];
                      next[sIdx] = { ...svc, title: e.target.value };
                      updateContent((p) => ({
                        ...p,
                        services: { ...p.services, list: next },
                      }));
                      notifySaved();
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm font-bold text-[var(--d-fg)]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--d-muted)]">
                    Deliverables List
                  </span>
                  {svc.items.map((item, iIdx) => (
                    <div key={iIdx} className="flex items-center gap-2">
                      <input
                        value={item}
                        onChange={(e) => {
                          const nextList = [...content.services.list];
                          const nextItems = [...svc.items];
                          nextItems[iIdx] = e.target.value;
                          nextList[sIdx] = { ...svc, items: nextItems };
                          updateContent((p) => ({
                            ...p,
                            services: { ...p.services, list: nextList },
                          }));
                          notifySaved();
                        }}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-xs text-[var(--d-fg)]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextList = [...content.services.list];
                          nextList[sIdx] = {
                            ...svc,
                            items: svc.items.filter((_, idx) => idx !== iIdx),
                          };
                          updateContent((p) => ({
                            ...p,
                            services: { ...p.services, list: nextList },
                          }));
                          notifySaved();
                        }}
                        className="p-1.5 text-[var(--d-muted)] hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextList = [...content.services.list];
                  nextList[sIdx] = {
                    ...svc,
                    items: [...svc.items, "New service item"],
                  };
                  updateContent((p) => ({
                    ...p,
                    services: { ...p.services, list: nextList },
                  }));
                  notifySaved();
                }}
                className="w-full py-2 rounded-xl bg-[var(--d-card2)] hover:border-[var(--d-primary)] border border-[var(--d-line)] text-xs font-semibold text-[var(--d-accent)] cursor-pointer"
              >
                + Add Deliverable
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 7: TEAM MEMBERS */}
      {activeTab === "team" && (
        <div className="flex flex-col gap-5">
          <div className="p-5 rounded-2xl bg-[var(--d-card)] border border-[var(--d-line)] flex items-center justify-between">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--d-accent)]">
                Studio Roster
              </span>
              <h3 className="text-lg font-bold text-[var(--d-fg)]">
                The Core Behind IDeCom ({content.team.members.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                updateContent((p) => ({
                  ...p,
                  team: {
                    ...p.team,
                    members: [
                      ...p.team.members,
                      {
                        id: `tm-${Date.now()}`,
                        name: "New Member",
                        role: "Creative Specialist",
                        photoUrl: "",
                      },
                    ],
                  },
                }));
                notifySaved();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--d-primary)] text-[var(--d-ink)] text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Team Member
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {content.team.members.map((m, idx) => (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-[var(--d-card)] border border-[var(--d-line)] flex flex-col gap-4"
              >
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-[var(--d-line)] bg-[var(--d-card2)] flex items-center justify-center">
                  {m.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.photoUrl}
                      alt={m.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-3/4 h-3/4 text-[var(--d-accent)]/30">
                      <use href="#person" />
                    </svg>
                  )}
                </div>

                <div className="flex flex-col gap-2.5">
                  <div>
                    <label className="block font-mono text-[10px] text-[var(--d-muted)] mb-1">
                      Full Name
                    </label>
                    <input
                      value={m.name}
                      onChange={(e) => {
                        const next = [...content.team.members];
                        next[idx] = { ...m, name: e.target.value };
                        updateContent((p) => ({
                          ...p,
                          team: { ...p.team, members: next },
                        }));
                        notifySaved();
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-xs font-bold text-[var(--d-fg)]"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-[var(--d-muted)] mb-1">
                      Role / Title
                    </label>
                    <input
                      value={m.role}
                      onChange={(e) => {
                        const next = [...content.team.members];
                        next[idx] = { ...m, role: e.target.value };
                        updateContent((p) => ({
                          ...p,
                          team: { ...p.team, members: next },
                        }));
                        notifySaved();
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-xs text-[var(--d-accent)]"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-[var(--d-muted)] mb-1">
                      Portrait Photo URL or Upload
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        value={m.photoUrl || ""}
                        onChange={(e) => {
                          const next = [...content.team.members];
                          next[idx] = { ...m, photoUrl: e.target.value };
                          updateContent((p) => ({
                            ...p,
                            team: { ...p.team, members: next },
                          }));
                          notifySaved();
                        }}
                        placeholder="Paste URL or Upload →"
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-xs text-[var(--d-fg)]"
                      />
                      <label className="p-2 rounded-xl bg-[var(--d-card2)] hover:border-[var(--d-primary)] border border-[var(--d-line)] text-[var(--d-accent)] cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, (dataUrl) => {
                                const next = [...content.team.members];
                                next[idx] = { ...m, photoUrl: dataUrl };
                                updateContent((p) => ({
                                  ...p,
                                  team: { ...p.team, members: next },
                                }));
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    updateContent((p) => ({
                      ...p,
                      team: {
                        ...p.team,
                        members: p.team.members.filter((x) => x.id !== m.id),
                      },
                    }));
                    notifySaved();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[var(--d-card2)] hover:bg-red-500/20 text-xs text-[var(--d-muted)] hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Member
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: CONTACT & FOOTER */}
      {activeTab === "contact" && (
        <div className="p-6 rounded-3xl bg-[var(--d-card)] border border-[var(--d-line)] flex flex-col gap-5 max-w-3xl">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--d-accent)]">
              CTA & Footer Inquiries
            </span>
            <h3 className="text-lg font-bold text-[var(--d-fg)]">
              WhatsApp Direct Chat, Contact Details & Bio
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1">
                WhatsApp Number (Country code, no +)
              </label>
              <input
                value={content.contact.whatsappNumber}
                onChange={(e) => {
                  updateContent((p) => ({
                    ...p,
                    contact: { ...p.contact, whatsappNumber: e.target.value },
                  }));
                  notifySaved();
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm font-mono text-[var(--d-accent)]"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1">
                Public Email
              </label>
              <input
                value={content.contact.email}
                onChange={(e) => {
                  updateContent((p) => ({
                    ...p,
                    contact: { ...p.contact, email: e.target.value },
                  }));
                  notifySaved();
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm text-[var(--d-fg)]"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1">
                Display Phone Number
              </label>
              <input
                value={content.contact.phone}
                onChange={(e) => {
                  updateContent((p) => ({
                    ...p,
                    contact: { ...p.contact, phone: e.target.value },
                  }));
                  notifySaved();
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm text-[var(--d-fg)]"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1">
                Studio Location
              </label>
              <input
                value={content.contact.location}
                onChange={(e) => {
                  updateContent((p) => ({
                    ...p,
                    contact: { ...p.contact, location: e.target.value },
                  }));
                  notifySaved();
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm text-[var(--d-fg)]"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[11px] text-[var(--d-muted)] mb-1">
              Footer Studio Description
            </label>
            <textarea
              rows={3}
              value={content.contact.footerBio}
              onChange={(e) => {
                updateContent((p) => ({
                  ...p,
                  contact: { ...p.contact, footerBio: e.target.value },
                }));
                notifySaved();
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] text-sm text-[var(--d-fg)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

