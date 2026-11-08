"use client";
import { useEffect, useRef, useState } from "react";
import { useStudioStore } from "@/components/dashboard/store";

const pad = (n: number) => String(n).padStart(2, "0");

const FACT_ICONS = [
  <><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></>,
  <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3z" /></>,
];

export default function Hero() {
  const { content } = useStudioStore();
  const vid = useRef<HTMLVideoElement>(null);
  const [tc, setTc] = useState("00:00:00:00");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      vid.current?.pause();
      return;
    }
    const start = performance.now();
    const id = setInterval(() => {
      const f = Math.floor(((performance.now() - start) / 1000) * 24);
      setTc(`${pad(Math.floor(f / 86400))}:${pad(Math.floor(f / 1440) % 60)}:${pad(Math.floor(f / 24) % 60)}:${pad(f % 24)}`);
    }, 1000 / 24);
    return () => clearInterval(id);
  }, []);

  const toggle = () => {
    const v = vid.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPaused(false); } else { v.pause(); setPaused(true); }
  };

  return (
    <section className="hero">
      {/* Background video hosted on Cloudflare R2 / managed via CMS */}
      <div className="hero-media" aria-hidden="true">
        <span className="lt lt1" /><span className="lt lt2" />
        {!failed && content.hero.videoUrl && (
          <video key={content.hero.videoUrl} ref={vid} className={ready ? "ready" : ""} autoPlay muted loop playsInline preload="auto"
            onLoadedData={() => {
              setReady(true);
              if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { vid.current?.pause(); setPaused(true); }
            }} onError={() => setFailed(true)}>
            <source src={content.hero.videoUrl} type="video/mp4" onError={() => setFailed(true)} />
          </video>
        )}
        <div className="hero-shade" />
      </div>
      <div className="wrap">
        <div className="vf">
          <i /><i /><i /><i />
          <div className="vf-bar">
            <span className="rec">REC</span>
            <span className="hide-sm">{content.hero.specs}</span>
            <span className="vf-r">
              {ready && !failed && <button className="vid-ctl" type="button" onClick={toggle}>{paused ? "▶ Play" : "❚❚ Pause"}</button>}
              <span className="tc">{tc}</span>
            </span>
          </div>
          <div className="hero-body">
            <span className="eyebrow">{content.hero.eyebrow}</span>
            <h1><span className="l1">{content.hero.titleLine1}</span><span className="l2">{content.hero.titleLine2}</span></h1>
            <p>We shoot, edit, design and market. <strong>{content.hero.highlightText}</strong> {content.hero.description}</p>
            <div className="hero-cta">
              <a className="btn btn-lime" href="#contact">{content.hero.ctaPrimary} <span className="arr">→</span></a>
              <a className="btn btn-ghost" href="#videos">{content.hero.ctaSecondary}</a>
            </div>
          </div>
          <div className="facts">
            {content.hero.facts.map((f, idx) => (
              <div className="fact" key={idx}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{FACT_ICONS[idx % FACT_ICONS.length]}</svg>
                <b>{f.title}</b><span>{f.subtitle}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
