"use client";

import { useEffect, useRef, useState } from "react";
import Thumb from "./Thumb";
import FbPlayer from "./FbPlayer";
import { parseVideo, resolveVideoUrl, needsResolve } from "@/lib/embed";

export type Reel = { id: string; title: string; tag: string; videoUrl: string; thumbUrl?: string; vertical: boolean };

/** Direct video file: starts right away with sound (we are inside the click), falls back to muted if the browser refuses. */
function AutoVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = false;
    v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
  }, [src]);
  return <video ref={ref} src={src} autoPlay loop playsInline controls className="reel-media" />;
}

/** Ask the YouTube iframe to play (and unmute) as soon as it is ready. */
function kickYouTube(f: HTMLIFrameElement) {
  const send = (func: string) => f.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*");
  [200, 700, 1500, 2500].forEach((t) => setTimeout(() => { send("unMute"); send("playVideo"); }, t));
}

/** Full-screen, scroll-snap "reels" player. Swipe/scroll on phones, wheel/arrows on desktop. */
export default function ReelsViewer({ reels, start, onClose }: { reels: Reel[]; start: number; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(start);
  const [resolved, setResolved] = useState<Record<string, string>>({});

  // turn Facebook share links into embeddable URLs
  useEffect(() => {
    reels.filter((r) => needsResolve(r.videoUrl)).forEach((r) =>
      resolveVideoUrl(r.videoUrl).then((u) => setResolved((m) => ({ ...m, [r.id]: u }))),
    );
  }, [reels]);

  // jump to the tapped video, lock page scroll while open
  useEffect(() => {
    const el = box.current;
    if (el) el.scrollTo({ top: start * el.clientHeight });
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [start]);

  // which slide is on screen
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.i))),
      { root: el, threshold: 0.6 },
    );
    el.querySelectorAll("[data-i]").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [reels.length]);

  const go = (d: number) => {
    const el = box.current;
    if (el) el.scrollBy({ top: d * el.clientHeight, behavior: "smooth" });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); go(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="reels" role="dialog" aria-modal="true" aria-label="Video reels">
      <div className="reels-scroll" ref={box}>
        {reels.map((r, i) => {
          const pending = needsResolve(r.videoUrl) && !resolved[r.id];
          const src = pending ? null : parseVideo(resolved[r.id] ?? r.videoUrl);
          const live = Math.abs(i - active) === 0; // only the visible slide plays
          return (
            <section className="reel-slide" key={r.id} data-i={i}>
              <div className={`reel-frame ${r.vertical ? "v" : "h"}`}>
                <Thumb videoUrl={r.videoUrl} thumbUrl={r.thumbUrl} className="reel-thumb" />
                {live && src?.kind === "file" && (
                  <AutoVideo src={src.src} />
                )}
                {live && src?.kind === "facebook" && r.vertical && <FbPlayer url={resolved[r.id] ?? r.videoUrl} />}
                {live && src?.kind === "facebook" && !r.vertical && (
                  <iframe
                    src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(resolved[r.id] ?? r.videoUrl)}&show_text=false&autoplay=true&allowfullscreen=true`}
                    title={r.title}
                    className="reel-media"
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                )}
                {live && src?.kind === "youtube" && (
                  <iframe
                    src={src.embed}
                    title={r.title}
                    className="reel-media"
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    referrerPolicy="origin-when-cross-origin"
                    onLoad={(e) => kickYouTube(e.currentTarget)}
                  />
                )}
                <div className="reel-cap">
                  <span className="chip">{r.tag}</span>
                  <b>{r.title}</b>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <button className="reel-btn reel-close" onClick={onClose} aria-label="Close">✕</button>
      <div className="reel-nav">
        <button className="reel-btn" onClick={() => go(-1)} disabled={active === 0} aria-label="Previous video">↑</button>
        <button className="reel-btn" onClick={() => go(1)} disabled={active === reels.length - 1} aria-label="Next video">↓</button>
      </div>
    </div>
  );
}
