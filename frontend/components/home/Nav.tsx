"use client";
import { useEffect, useState } from "react";
import { Logo } from "./Shapes";

const LINKS = [["Home", "top"], ["Services", "services"], ["Videos", "videos"], ["Designs", "designs"], ["Team", "team"]] as const;

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("top");

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ["services", "videos", "designs", "team"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <header className="nav" id="top">
      <div className="wrap">
        <nav className="nav-in" aria-label="Main">
          <Logo />
          <ul className="nav-links">
            {LINKS.map(([l, id]) => (
              <li key={id}><a className={active === id ? "on" : ""} href={`#${id}`}>{l}</a></li>
            ))}
          </ul>
          <a className="btn btn-lime" href="#contact">Contact now <span className="arr">→</span></a>
          <button className="menu-btn" aria-expanded={open} aria-controls="mobileMenu" onClick={() => setOpen(!open)}>
            <span /><b className="sr">Open menu</b>
          </button>
        </nav>
        <div className="mobile-menu" id="mobileMenu" hidden={!open} onClick={(e) => (e.target as HTMLElement).tagName === "A" && setOpen(false)}>
          {LINKS.map(([l, id]) => <a key={id} href={`#${id}`}>{l}</a>)}
          <a href="#contact" style={{ color: "var(--lime)" }}>Contact now →</a>
        </div>
      </div>
    </header>
  );
}
