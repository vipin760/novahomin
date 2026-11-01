"use client";

import { useEffect, useRef } from "react";
import { navigation } from "@/lib/content";
import { ArrowIcon, BrandMark } from "./icons";

export function Header() {
  const disclosure = useRef<HTMLDetailsElement>(null);

  function closeAndNavigate(event: React.MouseEvent<HTMLAnchorElement>) {
    if (disclosure.current) disclosure.current.open = false;
    const target = document.querySelector<HTMLElement>(event.currentTarget.hash);
    if (target) {
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape" && disclosure.current?.open) {
          disclosure.current.open = false;
          disclosure.current.querySelector("summary")?.focus();
        }
      },
      options,
    );
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (
          disclosure.current?.open &&
          !disclosure.current.contains(event.target as Node)
        )
          disclosure.current.open = false;
      },
      options,
    );
    matchMedia("(min-width: 1024px)").addEventListener(
      "change",
      () => {
        if (disclosure.current) disclosure.current.open = false;
      },
      options,
    );
    return () => controller.abort();
  }, []);

  return (
    <header className="site-header">
      <div className="header-inner shell">
        <a className="wordmark" href="#top" aria-label="Novahomin home">
          <BrandMark />
          <span>NOVAHOMIN</span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <a href="#contact" className="header-cta">
          Start a project <ArrowIcon />
        </a>
        <details className="mobile-nav" ref={disclosure}>
          <summary aria-label="Toggle navigation">
            <span className="menu-line" />
            <span className="menu-line" />
          </summary>
          <nav aria-label="Mobile navigation">
            {navigation.map((link, index) => (
              <a key={link.href} href={link.href} onClick={closeAndNavigate}>
                <span className="mono">0{index + 1}</span>
                {link.label}
              </a>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
