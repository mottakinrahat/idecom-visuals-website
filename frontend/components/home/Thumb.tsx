"use client";

import { useState, type CSSProperties } from "react";
import { parseVideo } from "@/lib/embed";

const DEFAULT_THUMB = "/default-thumb.svg";

/** Thumbnail order: your uploaded/pasted image → auto-thumbnail from the link → IDeCom default. */
export function thumbCandidates(videoUrl?: string, thumbUrl?: string): string[] {
  const list: string[] = [];
  if (thumbUrl) list.push(thumbUrl);
  const src = parseVideo(videoUrl);
  if (src?.kind === "youtube") {
    const id = new URL(src.embed).pathname.split("/").pop();
    list.push(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, `https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
  } else if (src?.kind === "facebook" && videoUrl) {
    list.push(`/api/thumb?url=${encodeURIComponent(videoUrl.trim())}`);
  }
  list.push(DEFAULT_THUMB);
  return list;
}

export default function Thumb({
  videoUrl, thumbUrl, alt = "", className, style,
}: { videoUrl?: string; thumbUrl?: string; alt?: string; className?: string; style?: CSSProperties }) {
  const key = `${videoUrl}|${thumbUrl}`;
  const [fail, setFail] = useState<{ key: string; n: number }>({ key, n: 0 });
  const list = thumbCandidates(videoUrl, thumbUrl);
  const idx = Math.min(fail.key === key ? fail.n : 0, list.length - 1);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={list[idx]}
      src={list[idx]}
      alt={alt}
      className={className}
      style={style}
      referrerPolicy="no-referrer"
      onLoad={(e) => {
        // YouTube returns a tiny 120px placeholder (not an error) when maxres doesn't exist
        const im = e.currentTarget;
        if (list[idx].includes("maxresdefault") && im.naturalWidth <= 120) setFail({ key, n: idx + 1 });
      }}
      onError={() => setFail({ key, n: idx + 1 })}
    />
  );
}
