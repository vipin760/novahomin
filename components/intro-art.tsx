/**
 * Original illustration drawn for Novahomin (no stock or third-party artwork, so there is
 * nothing to license). A website, a phone app and a growth chart working as one product.
 */
export function IntroArt() {
  return (
    <svg
      className="intro-art"
      viewBox="0 0 560 420"
      role="img"
      aria-labelledby="intro-art-title"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id="intro-art-title">
        Illustration of a website, a mobile app and a growth chart built together as one digital product
      </title>

      <rect x="24" y="36" width="400" height="290" fill="#fff" stroke="#e7e6e6" />
      <rect x="24" y="36" width="400" height="36" fill="#f2efe9" />
      <circle cx="46" cy="54" r="5" fill="#c7ceb7" />
      <circle cx="64" cy="54" r="5" fill="#f5c9b0" />
      <circle cx="82" cy="54" r="5" fill="#b2d6ff" />
      <rect x="120" y="46" width="180" height="16" fill="#fff" />

      <rect x="48" y="96" width="170" height="14" fill="#1d362d" />
      <rect x="48" y="120" width="120" height="14" fill="#1d362d" />
      <rect x="48" y="150" width="150" height="8" fill="#d9d9d9" />
      <rect x="48" y="166" width="130" height="8" fill="#d9d9d9" />
      <rect x="48" y="196" width="96" height="30" fill="#34d399" />
      <rect x="60" y="208" width="72" height="6" fill="#0a1712" />

      <g className="art-float art-float-slow">
        <rect x="292" y="10" width="132" height="34" fill="#fff" stroke="#e7e6e6" />
        <circle cx="312" cy="27" r="8" fill="#34d399" />
        <path d="m308 27 3 3 5-6" fill="none" stroke="#0a1712" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <text x="328" y="31" fontSize="12" fontWeight="700" fill="#1d362d" fontFamily="inherit">Live &amp; fast</text>
      </g>

      <rect x="248" y="92" width="152" height="150" fill="#f5f5f5" />
      <g fill="#1d362d">
        <rect className="art-bar" style={{ "--d": 0 } as React.CSSProperties} x="266" y="196" width="22" height="30" />
        <rect className="art-bar" style={{ "--d": 1 } as React.CSSProperties} x="298" y="176" width="22" height="50" />
        <rect className="art-bar" style={{ "--d": 2 } as React.CSSProperties} x="330" y="152" width="22" height="74" />
        <rect className="art-bar" style={{ "--d": 3 } as React.CSSProperties} x="362" y="118" width="22" height="108" fill="#34d399" />
      </g>
      <path className="art-line" d="M262 190 308 168 342 142 378 108" fill="none" stroke="#047857" strokeWidth="2" strokeDasharray="4 4" />

      <rect x="48" y="262" width="352" height="1" fill="#e7e6e6" />
      <rect x="48" y="280" width="60" height="8" fill="#d9d9d9" />
      <rect x="124" y="280" width="60" height="8" fill="#d9d9d9" />
      <rect x="200" y="280" width="60" height="8" fill="#d9d9d9" />

      <g className="art-float art-float-slow">
        <rect x="372" y="132" width="148" height="262" rx="22" fill="#0a1712" />
        <rect x="382" y="148" width="128" height="230" rx="14" fill="#fff" />
        <rect x="396" y="166" width="60" height="8" fill="#1d362d" />
        <rect x="396" y="184" width="100" height="6" fill="#d9d9d9" />
        <rect x="396" y="208" width="100" height="56" fill="#c7eccf" />
        <path d="M404 252 424 236 440 244 466 222 488 230" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
        <rect x="396" y="280" width="100" height="26" fill="#f5f5f5" />
        <rect x="396" y="314" width="100" height="26" fill="#f5f5f5" />
        <rect x="404" y="324" width="42" height="6" fill="#aaa" />
        <rect x="404" y="290" width="54" height="6" fill="#aaa" />
        <rect x="420" y="152" width="32" height="5" rx="2.5" fill="#0a1712" />
      </g>

      <g className="art-float">
        <rect x="52" y="318" width="188" height="64" fill="#1d362d" />
        <rect x="68" y="334" width="32" height="32" fill="#34d399" />
        <path d="m84 338 3.2 8.8 8.8 3.2-8.8 3.2L84 362l-3.2-8.8L72 350l8.8-3.2L84 338Z" fill="#0a1712" />
        <rect x="112" y="338" width="100" height="8" fill="#fff" />
        <rect x="112" y="354" width="68" height="8" fill="#6b8f80" />
      </g>
    </svg>
  );
}
