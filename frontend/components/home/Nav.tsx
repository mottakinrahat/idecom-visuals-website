"use client";
import { useEffect, useState } from "react";
import { Logo } from "./Shapes";

const LINKS = [["Home", "top"], ["Services", "services"], ["Videos", "videos"], ["Team", "team"]] as const;

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("top");

  useEffect(() => {
    const sectionIds = ["services", "videos", "team"] as const;

    const updateActive = () => {
      if (window.scrollY < 180) {
        setActive("top");
        return;
      }
      const threshold = window.innerHeight * 0.38;
      let current = "top";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= threshold) {
          current = id;
        }
      }
      setActive(current);
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, []);

  return (
    <header className="nav" id="top">
      <div className="wrap">
        <nav className="nav-in" aria-label="Main">
          <Logo />
          <ul className="nav-links">
            {LINKS.map(([l, id]) => (
              <li key={id}>
                <a
                  className={active === id ? "on" : ""}
                  href={`#${id}`}
                  onClick={(e) => {
                    setActive(id);
                    if (id === "top") {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      window.history.replaceState(null, "", window.location.pathname);
                    }
                  }}
                >
                  {l}
                </a>
              </li>
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
