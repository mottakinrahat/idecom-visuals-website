"use client";

import { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

let sdk: Promise<any> | null = null;
const loadFB = () => {
  if (!sdk) {
    sdk = new Promise((resolve, reject) => {
      const w = window as any;
      const done = () => { w.FB.init({ xfbml: false, version: "v19.0" }); resolve(w.FB); };
      if (w.FB) return done();
      const s = document.createElement("script");
      s.src = "https://connect.facebook.net/en_US/sdk.js";
      s.async = true;
      s.onload = done;
      s.onerror = () => { sdk = null; reject(new Error("fb sdk")); };
      document.head.appendChild(s);
    });
  }
  return sdk;
};

/**
 * Facebook video that starts by itself. Uses the SDK player so we can call play()/unmute()
 * right after the viewer's click (the plain iframe plugin usually stays on a play button).
 */
export default function FbPlayer({ url }: { url: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let off = false;
    let handler: ((m: any) => void) | null = null;
    let FB: any;
    // if the SDK player never shows up (common for landscape / some share links), fall back to the plain iframe player
    const watchdog = setTimeout(() => { if (!off && !el.querySelector("iframe")) setFallback(true); }, 3500);

    loadFB().then((fb) => {
      if (off || !host.current) return;
      FB = fb;
      const box = document.createElement("div");
      box.className = "fb-video";
      box.setAttribute("data-href", url);
      box.setAttribute("data-width", String(Math.round(el.clientWidth)));
      box.setAttribute("data-show-text", "false");
      box.setAttribute("data-autoplay", "true");
      box.setAttribute("data-allowfullscreen", "true");
      el.innerHTML = "";
      el.appendChild(box);

      handler = (msg: any) => {
        if (msg.type !== "video" || !el.contains(msg.node)) return;
        const p = msg.instance;
        [0, 400, 1200, 2400].forEach((t) => setTimeout(() => { try { p.play(); } catch {} }, t));
        // we're inside the viewer's click, so sound is allowed — try to turn it on
        setTimeout(() => { try { p.unmute(); } catch {} }, 400);
      };
      fb.Event.subscribe("xfbml.ready", handler);
      fb.XFBML.parse(el);
    }).catch(() => {});

    return () => {
      off = true;
      clearTimeout(watchdog);
      try { if (FB && handler) FB.Event.unsubscribe("xfbml.ready", handler); } catch {}
      el.innerHTML = "";
    };
  }, [url]);

  if (fallback) {
    const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true&allowfullscreen=true`;
    return (
      <iframe
        src={src}
        title="Facebook video"
        className="reel-media"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }
  return <div ref={host} className="reel-media fb-host" />;
}
