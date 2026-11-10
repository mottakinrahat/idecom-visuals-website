"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL, api, assetUrl } from "./api";
import type { VideoItem } from "@/components/dashboard/store";

/** videoType "video" = 16:9 Featured videos · "reel" = 9:16 Reels */
export type VideoType = "video" | "reel";

/** One row of the video portfolio table (backend: GET /api/portfolio-videos). */
export type PortfolioVideo = {
  id: string;
  title: string;
  link: string;
  thumbnailUrl: string;
  category: string;
  videoType: VideoType;
  duration: string;
  watermark: string;
  glowColor: string;
  baseColor: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PortfolioInput = Partial<Omit<PortfolioVideo, "id" | "createdAt" | "updatedAt">>;

/* ---- the website / CMS cards use the short VideoItem shape; these convert both ways ---- */

export const toCard = (v: PortfolioVideo): VideoItem => ({
  id: v.id,
  w: v.watermark,
  tag: v.category,
  t: v.title,
  d: v.duration,
  a: v.glowColor,
  b: v.baseColor,
  videoUrl: v.link,
  thumbUrl: v.thumbnailUrl ? assetUrl(v.thumbnailUrl) : "",
});

export const fromCard = (p: Partial<VideoItem>): PortfolioInput => {
  const out: PortfolioInput = {};
  if (p.t !== undefined) out.title = p.t;
  if (p.tag !== undefined) out.category = p.tag;
  if (p.w !== undefined) out.watermark = p.w;
  if (p.d !== undefined) out.duration = p.d;
  if (p.a !== undefined) out.glowColor = p.a;
  if (p.b !== undefined) out.baseColor = p.b;
  if (p.videoUrl !== undefined) out.link = p.videoUrl;
  if (p.thumbUrl !== undefined) out.thumbnailUrl = p.thumbUrl;
  return out;
};

/* ---- API ---- */

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/portfolio-videos${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((Array.isArray(body?.message) ? body.message[0] : body?.message) || `Request failed (${res.status})`);
  return body as T;
}

export const portfolioApi = {
  list: (type?: VideoType) => call<PortfolioVideo[]>(type ? `?type=${type}` : ""),
  create: (input: PortfolioInput & { title: string; videoType: VideoType }) => call<PortfolioVideo>("", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: PortfolioInput) => call<PortfolioVideo>(`/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  remove: (id: string) => call<void>(`/${id}`, { method: "DELETE" }),
};

/* ---- hooks ---- */

/** Public website: the whole portfolio. `failed` = backend unreachable. */
export function usePortfolioVideos() {
  const [videos, setVideos] = useState<PortfolioVideo[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    portfolioApi
      .list()
      .then((l) => live && setVideos(l))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  return { videos, failed };
}

/** Dashboard: load + add / edit / delete. Edits show instantly and are saved to the server ~0.6 s after you stop typing. */
export function usePortfolioAdmin() {
  const [items, setItems] = useState<PortfolioVideo[] | null>(null);
  const [error, setError] = useState("");
  const pending = useRef<Record<string, PortfolioInput>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const reload = useCallback(async () => {
    try {
      setItems(await portfolioApi.list());
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    let live = true;
    portfolioApi
      .list()
      .then((l) => live && (setItems(l), setError("")))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, []);

  // leaving the page within the debounce window must not lose the last edit
  useEffect(() => {
    const t = timers.current;
    const p = pending.current;
    return () => {
      for (const [id, body] of Object.entries(p)) {
        clearTimeout(t[id]);
        void fetch(`${API_URL}/portfolio-videos/${id}`, {
          method: "PATCH",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
    };
  }, []);

  const patch = useCallback(
    (id: string, input: PortfolioInput) => {
      setItems((cur) => cur?.map((v) => (v.id === id ? { ...v, ...input } : v)) ?? cur);
      pending.current[id] = { ...pending.current[id], ...input };
      clearTimeout(timers.current[id]);
      timers.current[id] = setTimeout(async () => {
        const body = pending.current[id];
        delete pending.current[id];
        try {
          await portfolioApi.update(id, body);
          setError("");
        } catch (e) {
          setError((e as Error).message);
        }
      }, 600);
    },
    [],
  );

  const add = useCallback(async (type: VideoType) => {
    try {
      const created = await portfolioApi.create({
        videoType: type,
        title: type === "reel" ? "New reel" : "New video",
        watermark: type === "reel" ? "Reel" : "New",
        duration: type === "reel" ? "00:00:30" : "00:01:00",
      });
      setItems((cur) => [created, ...(cur ?? [])]);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    delete pending.current[id];
    clearTimeout(timers.current[id]);
    setItems((cur) => cur?.filter((v) => v.id !== id) ?? cur);
    try {
      await portfolioApi.remove(id);
    } catch (e) {
      setError((e as Error).message);
      void reload();
    }
  }, [reload]);

  /** One-time move of videos that were only saved in this browser (old CMS) to the server. Returns how many were imported. */
  const importFrom = useCallback(
    async (list: { card: VideoItem; type: VideoType }[]) => {
      let done = 0;
      // the server puts each new item first, so create them back-to-front to keep your order
      for (const { card, type } of [...list].reverse()) {
        let thumb = card.thumbUrl || "";
        if (thumb.startsWith("data:")) {
          // old CMS stored thumbnails as inline base64 — upload them so only a short URL is kept
          try {
            const blob = await (await fetch(thumb)).blob();
            thumb = (await api.uploadImage(new File([blob], "thumbnail", { type: blob.type || "image/png" }))).url;
          } catch {
            thumb = "";
          }
        }
        try {
          await portfolioApi.create({ ...fromCard({ ...card, thumbUrl: thumb }), title: card.t || "Untitled", videoType: type });
          done++;
        } catch (e) {
          setError((e as Error).message);
        }
      }
      await reload();
      return done;
    },
    [reload],
  );

  return { items, error, patch, add, remove, reload, importFrom };
}
