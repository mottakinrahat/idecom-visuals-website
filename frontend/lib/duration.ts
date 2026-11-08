import { parseVideo, resolveVideoUrl } from "./embed";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function formatDuration(sec: number): string {
  const s = Math.round(sec);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
}

const loadScript = (id: string, src: string) =>
  new Promise<void>((resolve, reject) => {
    if (document.getElementById(id)) return resolve();
    const s = document.createElement("script");
    s.id = id;
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("script failed"));
    document.head.appendChild(s);
  });

const hiddenHost = () => {
  const h = document.createElement("div");
  h.style.cssText = "position:fixed;left:-9999px;top:0;width:320px;height:180px;opacity:0;pointer-events:none";
  document.body.appendChild(h);
  return h;
};

/** Poll `read()` until it returns a positive number or the timeout hits. */
const poll = (read: () => number, ms = 12000) =>
  new Promise<number | null>((resolve) => {
    const t0 = Date.now();
    const tick = () => {
      let v = 0;
      try { v = read(); } catch {}
      if (v > 0) return resolve(v);
      if (Date.now() - t0 > ms) return resolve(null);
      setTimeout(tick, 300);
    };
    tick();
  });

function fileDuration(src: string) {
  return new Promise<number | null>((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    const done = (n: number | null) => { v.removeAttribute("src"); v.load(); resolve(n); };
    v.onloadedmetadata = () => done(isFinite(v.duration) ? v.duration : null);
    v.onerror = () => done(null);
    setTimeout(() => done(null), 15000);
    v.src = src;
  });
}

async function youtubeDuration(id: string) {
  await loadScript("yt-iframe-api", "https://www.youtube.com/iframe_api");
  const w = window as any;
  if (!w.YT?.Player) {
    await new Promise<void>((r) => {
      const prev = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => { prev?.(); r(); };
      setTimeout(r, 8000);
    });
  }
  if (!w.YT?.Player) return null;
  const host = hiddenHost();
  const mount = document.createElement("div");
  host.appendChild(mount);
  let player: any;
  try {
    return await new Promise<number | null>((resolve) => {
      player = new w.YT.Player(mount, {
        videoId: id,
        playerVars: { controls: 0, playsinline: 1 },
        events: {
          onReady: () => poll(() => player.getDuration()).then(resolve),
          onError: () => resolve(null),
        },
      });
    });
  } finally {
    try { player?.destroy(); } catch {}
    host.remove();
  }
}

async function facebookDuration(url: string) {
  const w = window as any;
  await loadScript("fb-sdk", "https://connect.facebook.net/en_US/sdk.js");
  if (!w.FB) return null;
  if (!w.__fbInit) {
    w.FB.init({ xfbml: false, version: "v19.0" });
    w.__fbInit = true;
  }
  const host = hiddenHost();
  const el = document.createElement("div");
  el.className = "fb-video";
  el.setAttribute("data-href", url);
  el.setAttribute("data-width", "320");
  host.appendChild(el);
  try {
    return await new Promise<number | null>((resolve) => {
      const timer = setTimeout(() => resolve(null), 15000);
      w.FB.Event.subscribe("xfbml.ready", (msg: any) => {
        if (msg.type === "video") {
          poll(() => msg.instance.getDuration()).then((n) => { clearTimeout(timer); resolve(n); });
        }
      });
      w.FB.XFBML.parse(host);
    });
  } finally {
    host.remove();
  }
}

/** Best-effort duration (seconds) for a pasted YouTube / Facebook / direct-file link. */
export async function detectDuration(url: string): Promise<number | null> {
  url = await resolveVideoUrl(url);
  const src = parseVideo(url);
  if (!src || typeof window === "undefined") return null;
  try {
    if (src.kind === "file") return await fileDuration(src.src);
    if (src.kind === "youtube") return await youtubeDuration(new URL(src.embed).pathname.split("/").pop()!);
    return await facebookDuration(url);
  } catch {
    return null;
  }
}
