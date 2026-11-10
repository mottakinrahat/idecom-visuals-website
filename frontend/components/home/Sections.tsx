"use client";

import { useState, type CSSProperties } from "react";
import { parseVideo } from "@/lib/embed";
import Thumb from "./Thumb";
import ContactForm from "./ContactForm";
import { usePortfolioVideos, toCard } from "@/lib/portfolio";
import ReelsViewer, { type Reel } from "./ReelsViewer";
import { Logo, Marquee, SocialIcon } from "./Shapes";
import {
  useStudioStore,
  getActiveSocials,
  resolveSocialHref,
  type VideoItem,
} from "@/components/dashboard/store";

const Head = ({ eyebrow, title, em, sub }: { eyebrow: string; title: string; em: string; sub?: string }) => (
  <header className="sec-head">
    <span className="eyebrow">{eyebrow}</span>
    <h2>{title}<em>{em}</em></h2>
    {sub && <p className="sec-sub">{sub}</p>}
  </header>
);

const v = (o: Record<string, string>) => o as CSSProperties;

/* ---------- Clients ---------- */
const AVATARS: [string, string][] = [["#9CF60A", "#3c5e08"], ["#d7ff8f", "#55790f"], ["#7fd400", "#26390a"], ["#c4f56b", "#486b0c"], ["#9CF60A", "#1d2b07"], ["#e2ffb0", "#6a9a12"], ["#8be000", "#33500a"], ["#b3f04a", "#3c5e08"], ["#9CF60A", "#2a3f08"], ["#d0ff80", "#4d740d"], ["#86d900", "#1f2e07"], ["#c9fa75", "#5a8610"]];

export function Clients() {
  const { content } = useStudioStore();
  return (
    <section className="sec glow" id="clients">
      <div className="wrap"><Head eyebrow={content.clients.eyebrow} title={content.clients.title} em={content.clients.em} /></div>
      <Marquee style={v({ "--dur": "38s" })}>
        {content.clients.brands.map((b, i) => <div key={i} className={`brand ${b.style}`}>{b.name}</div>)}
      </Marquee>
      <Marquee className="creators" style={v({ "--dur": "46s", "--gap": "12px" })}>
        {AVATARS.map(([a, b], i) => <div key={i} className="av" style={v({ "--c1": a, "--c2": b })}><svg><use href="#person" /></svg></div>)}
      </Marquee>
      <div className="wrap">
        <div className="stats">
          {content.clients.stats.map((st, i) => (
            <div className="stat" key={i}><b>{st.number}<span>+</span></b><small>{st.label}</small></div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Services ---------- */
const SERVICE_ICONS = [
  <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3z" /></>,
  <path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" />,
  <><path d="M4 19V5M4 19h16" /><path d="M8 15l4-4 3 3 5-6" /></>,
];

export function Services() {
  const { content } = useStudioStore();
  return (
    <section className="sec" id="services">
      <div className="wrap">
        <Head eyebrow={content.services.eyebrow} title={content.services.title} em={content.services.em} sub={content.services.sub} />
        <div className="svc-grid">
          {content.services.list.map((s, i) => (
            <article className={`svc ${s.hl ? "hl" : ""}`} key={s.id}>
              <div className="svc-top">
                <div className="svc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{SERVICE_ICONS[i % SERVICE_ICONS.length]}</svg></div>
                <h3>{s.title}</h3>
              </div>
              <ul>{s.items.map((t, idx) => <li key={idx}>{t}</li>)}</ul>
              <a className="btn btn-lime" href="#contact">Get started now <span className="arr">→</span></a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Videos ---------- */
const VidCard = ({ x, ratio, onOpen }: { x: VideoItem; ratio: string; onOpen: () => void }) => {
  const src = parseVideo(x.videoUrl);
  return (
    <a
      className="vid"
      href="#videos"
      onClick={(e) => { e.preventDefault(); if (src) onOpen(); }}
      style={v({ "--a": x.a, "--b": x.b })}
    >
      {!(src?.kind === "file" && !x.thumbUrl) ? (
        <Thumb videoUrl={x.videoUrl} thumbUrl={x.thumbUrl} alt={x.t} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
      ) : null}
      {src?.kind === "file" && !x.thumbUrl ? (
        <video
          src={src.src}
          muted
          loop
          playsInline
          onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
          onMouseLeave={(e) => e.currentTarget.pause()}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
        />
      ) : null}
      <span className="vid-word">{x.w}</span>
      <span className="vid-top"><span className="chip">{ratio === "9:16" && <svg className="reel-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M3 9h18M8.5 3l3 6M14 3l3 6" /><path d="M10.5 13.5v4l3.5-2z" fill="currentColor" /></svg>}{ratio !== "9:16" && x.tag}</span></span>
      <span className="play" />
      <span className="vid-bot"><b>{x.t}</b><span>{x.d}</span></span>
    </a>
  );
};

export function Videos() {
  const { content } = useStudioStore();
  const [open, setOpen] = useState<number | null>(null);

  // videos come from the backend portfolio table: videoType "video" → 16:9 row, "reel" → 9:16 row
  const { videos, failed } = usePortfolioVideos();
  const landscape = failed ? content.videos.landscape : (videos ?? []).filter((v) => v.videoType === "video").map(toCard);
  const vertical = failed ? content.videos.vertical : (videos ?? []).filter((v) => v.videoType === "reel").map(toCard);

  // reels playlist: every video that has a link (reels first, then videos)
  const reels: Reel[] = [
    ...vertical.map((x) => ({ x, vertical: true })),
    ...landscape.map((x) => ({ x, vertical: false })),
  ]
    .filter(({ x }) => parseVideo(x.videoUrl))
    .map(({ x, vertical }) => ({ id: x.id, title: x.t, tag: x.tag, videoUrl: x.videoUrl!, thumbUrl: x.thumbUrl, vertical }));
  const openFor = (id: string) => { const i = reels.findIndex((r) => r.id === id); if (i >= 0) setOpen(i); };

  return (
    <section className="sec" id="videos">
      <div className="wrap">
        <Head eyebrow={content.videos.eyebrow} title={content.videos.title} em={content.videos.em} />
        {landscape.length > 0 && (
          <Marquee className="reel-row land rev" style={v({ "--dur": "32s" })}>
            {landscape.map((x) => <VidCard key={x.id} x={x} ratio="16:9" onOpen={() => openFor(x.id)} />)}
          </Marquee>
        )}
        {vertical.length > 0 && (
          <Marquee className="reel-row vert" style={v({ "--dur": "36s" })}>
            {vertical.map((x) => <VidCard key={x.id} x={x} ratio="9:16" onOpen={() => openFor(x.id)} />)}
          </Marquee>
        )}
        <div className="center">
          <button type="button" className="btn btn-lime" onClick={() => reels.length && setOpen(0)}>Watch as reels <span className="arr">→</span></button>
        </div>
      </div>
      {open !== null && <ReelsViewer reels={reels} start={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

/* ---------- Team ---------- */
export function Team() {
  const { content } = useStudioStore();
  return (
    <section className="sec" id="team">
      <div className="wrap">
        <Head eyebrow={content.team.eyebrow} title={content.team.title} em={content.team.em} />
        <div className="team">
          {content.team.members.map((m) => (
            <div className="member" key={m.id}>
              <div className="portrait">
                {m.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photoUrl} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <svg><use href="#person" /></svg>
                )}
              </div>
              <div><b>{m.name}</b><span>{m.role}</span></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- CTA + Footer ---------- */
export function Cta() {
  const { content } = useStudioStore();
  const activeSocials = getActiveSocials(content);
  const waHref = resolveSocialHref("whatsapp", content.settings?.socialLinks?.whatsapp);

  return (
    <section className="sec cta" id="contact" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="cta-box">
          <span className="eyebrow">{content.contact.eyebrow}</span>
          <h2>{content.contact.title}<em>{content.contact.em}</em></h2>
          <p className="sec-sub">{content.contact.sub}</p>
          <ContactForm />
          <p className="cta-or"><span>or reach us directly</span></p>
          {waHref && (
            <a className="btn btn-lime" href={waHref} target="_blank" rel="noopener noreferrer">
              <svg className="wa" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2.1.7 2.8.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" /></svg>
              Direct chat on WhatsApp
            </a>
          )}
          {activeSocials.length > 0 && (
            <div className="socials">
              {activeSocials.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  aria-label={s.label}
                  title={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SocialIcon name={s.key} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { content } = useStudioStore();
  const activeSocials = getActiveSocials(content);
  return (
    <footer>
      <div className="wrap">
        <div className="foot">
          <div>
            <Logo />
            <span className="tag">Video production · Brand design · Marketing</span>
            <p>{content.contact.footerBio}</p>
            {activeSocials.length > 0 && (
              <div className="socials" style={{ justifyContent: "flex-start", marginTop: 18 }}>
                {activeSocials.map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    aria-label={s.label}
                    title={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SocialIcon name={s.key} />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div>
            <h4>Navigation</h4>
            <ul>{[["Home", "top"], ["Services", "services"], ["Videos", "videos"], ["Team", "team"], ["Contact", "contact"]].map(([l, id]) => <li key={id}><a href={`#${id}`}>{l}</a></li>)}</ul>
          </div>
          <div>
            <h4>Direct inquiries</h4>
            <ul>
              <li>{content.contact.email}</li><li>{content.contact.phone}</li><li>{content.contact.location}</li>
              <li><a href="#contact" style={{ color: "var(--lime)" }}>Start a project →</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bot">
          <span>© {new Date().getFullYear()} IDeCom Visuals. All rights reserved.</span>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
