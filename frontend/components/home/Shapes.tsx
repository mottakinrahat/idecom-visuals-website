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
  return (
    <a className="logo" href="#top" aria-label="IDeCom Visuals home">
      <svg viewBox="205 120 455 675"><use href="#mark" /></svg>
      <span className="bar" />
      <span className="wm"><b><span>IDe</span>Com</b><small>VISUALS</small></span>
    </a>
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
