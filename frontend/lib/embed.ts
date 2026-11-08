export type VideoSource =
  | { kind: "youtube"; embed: string }
  | { kind: "facebook"; embed: string }
  | { kind: "file"; src: string };

const YT = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/i;

/** Turn a pasted YouTube / Facebook / direct-file link into something we can play inline. */
export function parseVideo(raw: string | undefined): VideoSource | null {
  const url = (raw || "").trim();
  if (!url) return null;

  const yt = url.match(YT);
  if (yt) {
    const id = yt[1];
    return {
      kind: "youtube",
      embed: `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1&playsinline=1&loop=1&playlist=${id}&rel=0&modestbranding=1`,
    };
  }

  if (/(?:^|\/\/|\.)(?:facebook\.com|fb\.watch|fb\.com)\b/i.test(url)) {
    return {
      kind: "facebook",
      embed: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true&mute=true&allowfullscreen=true`,
    };
  }

  return { kind: "file", src: url };
}

/** Facebook share / short links can't be embedded until they are resolved to the real video URL. */
export const needsResolve = (url: string | undefined) =>
  /facebook\.com\/share\/|fb\.watch\//i.test((url || "").trim());

const cache = new Map<string, Promise<string>>();

/** Resolve a share link to its canonical URL (falls back to the original on failure). */
export function resolveVideoUrl(url: string): Promise<string> {
  if (!needsResolve(url)) return Promise.resolve(url);
  let p = cache.get(url);
  if (!p) {
    p = fetch(`/api/resolve?url=${encodeURIComponent(url)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (j?.url as string) || url)
      .catch(() => url);
    cache.set(url, p);
  }
  return p;
}
