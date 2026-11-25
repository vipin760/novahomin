"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { pagesMenu, primaryNav } from "@/lib/content";
import { ButtonLink } from "./button";
import { BrandMark, ChevronDown } from "./icons";

/** Routes whose hero is a dark full-bleed image: the header sits on it in white. */
const darkHeroRoutes = new Set(["/", "/about", "/portfolio"]);

/**
 * Behaviour copied from the reference's header script: once scrolled, a backdrop fades
 * in (0.3 s) and the top spacer collapses; scrolling down past 100 px slides the
 * header up 175 px (0.3 s power2.out); scrolling up brings it back (0.15 s).
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const pagesRef = useRef<HTMLLIElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tone = darkHeroRoutes.has(pathname) ? "dark" : "light";

  // Close menus on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
    setPagesOpen(false);
  }

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 0);
      if (y !== last) setHidden(y > 100 && y > last);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!pagesOpen && !menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPagesOpen(false);
      setMenuOpen(false);
    };
    const onClick = (event: MouseEvent) => {
      if (!pagesRef.current?.contains(event.target as Node)) setPagesOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [pagesOpen, menuOpen]);

  // Hover opens on pointer devices; close after the reference's 300 ms delay.
  const hoverOpen = (open: boolean) => {
    if (!matchMedia("(hover: hover) and (min-width: 992px)").matches) return;
    clearTimeout(closeTimer.current);
    if (open) setPagesOpen(true);
    else closeTimer.current = setTimeout(() => setPagesOpen(false), 300);
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className="site-header"
      data-tone={tone}
      data-menu={menuOpen || undefined}
      data-scrolled={scrolled || menuOpen || undefined}
      data-hidden={(hidden && !menuOpen && !pagesOpen) || undefined}
    >
      <div className="header-over" aria-hidden="true" />
      <div className="header-gap" aria-hidden="true" />
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label="Novahomin home">
          <BrandMark />
          <span>Novahomin</span>
        </Link>

        <nav className="nav" aria-label="Main" id="site-nav">
          <ul className="nav-list">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  className="nav-link"
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li
              className="nav-dropdown"
              ref={pagesRef}
              data-open={pagesOpen || undefined}
              onMouseEnter={() => hoverOpen(true)}
              onMouseLeave={() => hoverOpen(false)}
            >
              <button
                type="button"
                className="nav-link"
                aria-expanded={pagesOpen}
                aria-controls="pages-menu"
                onClick={(event) => {
                  // A mouse click right after hover-open keeps it open; keyboard toggles.
                  const hoverOpened = event.detail > 0 && matchMedia("(hover: hover) and (min-width: 992px)").matches;
                  setPagesOpen((open) => (hoverOpened ? true : !open));
                }}
              >
                Pages <ChevronDown />
              </button>
              <div className="dropdown" id="pages-menu">
                <ul>
                  {pagesMenu.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive(item.href) ? "page" : undefined}
                        tabIndex={pagesOpen ? undefined : -1}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          </ul>
          <ButtonLink href="/contact" className="nav-cta-mobile" block>
            Contact
          </ButtonLink>
        </nav>

        <div className="header-actions">
          <ButtonLink href="/contact" variant={tone === "dark" ? "primary" : "dark"} className="header-cta">
            Contact
          </ButtonLink>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="bar top" />
            <span className="bar middle" />
            <span className="bar bottom" />
          </button>
        </div>
      </div>
    </header>
  );
}
