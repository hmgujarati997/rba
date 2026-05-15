import React from "react";

// Inline SVG-styled luxury monogram + wordmark + sub-line (matches uploaded reference)
export default function Logo({ size = "md", inverse = false, withTagline = true, className = "" }) {
  const ink = inverse ? "#f8f7f4" : "#1f1f27";
  const gold = "#b2873d";
  const sizes = {
    sm: { mono: 28, name: 18, sub: 9 },
    md: { mono: 42, name: 28, sub: 10 },
    lg: { mono: 60, name: 42, sub: 11 },
    xl: { mono: 84, name: 60, sub: 12 },
  };
  const s = sizes[size] || sizes.md;
  return (
    <div className={`inline-flex flex-col items-center ${className}`} aria-label="Rama Bazaar 1.0">
      {/* RB monogram */}
      <svg width={s.mono * 2.4} height={s.mono * 1.3} viewBox="0 0 240 130" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="60" y="100" fontFamily="'Cormorant Garamond', serif" fontWeight="600" fontSize="120" fill={ink} style={{letterSpacing: "-0.04em"}} transform="scale(-1,1) translate(-160,0)">R</text>
        <text x="100" y="100" fontFamily="'Cormorant Garamond', serif" fontWeight="600" fontSize="120" fill={ink} style={{letterSpacing: "-0.04em"}}>B</text>
      </svg>
      <div className="font-serif-display" style={{ color: ink, fontSize: s.name, lineHeight: 1, letterSpacing: "0.02em" }}>RAMA</div>
      <div className="flex items-center gap-3 mt-1.5 mb-1">
        <span style={{ height: 1, width: 24, background: gold, display: "inline-block" }} />
        <div className="font-serif-display" style={{ color: gold, fontSize: s.name * 0.5, letterSpacing: "0.18em" }}>BAZAAR 1.0</div>
        <span style={{ height: 1, width: 24, background: gold, display: "inline-block" }} />
      </div>
      {withTagline && (
        <div className="flex items-center gap-2 mt-1" style={{ color: ink, fontSize: s.sub, letterSpacing: "0.32em" }}>
          <span>CONNECT</span>
          <span style={{ color: gold }}>•</span>
          <span>SHOWCASE</span>
          <span style={{ color: gold }}>•</span>
          <span>GROW</span>
        </div>
      )}
    </div>
  );
}
