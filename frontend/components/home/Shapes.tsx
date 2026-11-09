"use client";

import { useStudioStore } from "@/components/dashboard/store";
import { assetUrl } from "@/lib/api";

export function Shapes() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="mark" viewBox="205 120 455 675">
        <path fill="#9CF60A" d="M335 130 L428 197 L408 280 L318 212 Z" />
        <path fill="currentColor" d="M315 237 L403 298 L330 643 L218 668 Z" />
        <path fill="currentColor" d="M428 333 L603 303 L648 350 L566 752 L520 785 L362 662 L377 598 L470 665 L532 372 L412 404 Z" />
      </symbol>
      <symbol id="person" viewBox="0 0 200 200" preserveAspectRatio="xMidYMax meet">
        <circle cx="100" cy="74" r="40" fill="currentColor" />
        <path fill="currentColor" d="M20 200 C24 146 58 122 100 122 C142 122 176 146 180 200 Z" />
      </symbol>
    </svg>
  );
}

export function Logo() {
  const { content } = useStudioStore();
  const logoUrl = content.settings?.logoUrl?.trim();
  const showWordmark = Boolean(content.settings?.showWordmarkWithLogo);

  return (
    <a className="logo" href="#top" aria-label="IDeCom Visuals home">
      {logoUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetUrl(logoUrl)}
            alt="IDeCom Visuals"
            className="logo-img"
          />
          {showWordmark && (
            <>
              <span className="bar" />
              <span className="wm">
                <b>
                  <span>IDe</span>Com
                </b>
                <small>VISUALS</small>
              </span>
            </>
          )}
        </>
      ) : (
        <>
          <svg viewBox="205 120 455 675">
            <use href="#mark" />
          </svg>
          <span className="bar" />
          <span className="wm">
            <b>
              <span>IDe</span>Com
            </b>
            <small>VISUALS</small>
          </span>
        </>
      )}
    </a>
  );
}

export const SOCIAL_PATHS: Record<string, string> = {
  whatsapp:
    "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2.1.7 2.8.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z",
  facebook:
    "M13.5 21v-7.5h2.5l.5-3h-3V8.6c0-.9.3-1.5 1.6-1.5H16.7V4.4c-.3 0-1.2-.1-2.2-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8.2v3h2.5V21h2.8z",
  instagram:
    "M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3zm0 1.8A2.7 2.7 0 0 0 4.8 7.5v9a2.7 2.7 0 0 0 2.7 2.7h9a2.7 2.7 0 0 0 2.7-2.7v-9a2.7 2.7 0 0 0-2.7-2.7h-9zM12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 1.8a2.7 2.7 0 1 0 0 5.4 2.7 2.7 0 0 0 0-5.4zm4.9-2.6a1.05 1.05 0 1 1 0 2.1 1.05 1.05 0 0 1 0-2.1z",
  tiktok:
    "M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z",
  youtube:
    "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3L10 15z",
  linkedin:
    "M6.5 8.5a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5zM5 10h3v9.5H5V10zm5 0h2.88v1.3h.04c.4-.76 1.38-1.55 2.84-1.55 3.04 0 3.6 2 3.6 4.6v5.15h-3v-4.56c0-1.09-.02-2.49-1.52-2.49-1.52 0-1.75 1.18-1.75 2.41v4.64H10V10z",
  x:
    "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
};

export function SocialIcon({ name, size = 20 }: { name: string; size?: number }) {
  const d = SOCIAL_PATHS[name.toLowerCase()];
  return d ? (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
      <path d={d} />
    </svg>
  ) : (
    <span>{name.slice(0, 1)}</span>
  );
}

export function Marquee({ children, className = "", style }: { children: React.ReactNode[]; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`marquee ${className}`}>
      <div className={`track ${className.includes("creators") || className.includes("rev") ? "rev" : ""}`} style={style}>
        {children}
        <div style={{ display: "contents" }} aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}
