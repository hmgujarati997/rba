import React from "react";

/**
 * Rama Bazaar 1.0 — Brand Lockup
 *
 * Matches the original logo hierarchy:
 *   1. RB serif emblem
 *   2. "RAMA" — large serif, charcoal, wide tracking
 *   3. "—  BAZAAR 1.0  —" — smaller serif sub-mark in gold with hairline rules
 *   4. CONNECT • SHOWCASE • GROW — small caps tagline
 */
const SIZES = {
  sm: { emblem: 28, rama: 18, sub: 8,  tagline: 7,  gap: 5,  rule: 14 },
  md: { emblem: 70, rama: 38, sub: 13, tagline: 9,  gap: 9,  rule: 24 },
  lg: { emblem: 100, rama: 52, sub: 17, tagline: 10, gap: 11, rule: 34 },
  xl: { emblem: 128, rama: 64, sub: 19, tagline: 10, gap: 14, rule: 38 },
};

export default function Logo({ size = "md", variant = "stacked", inverse = false, className = "" }) {
  const s = SIZES[size] || SIZES.md;
  const ink = inverse ? "#f8f7f4" : "#1f1f27";
  const gold = "#b2873d";

  const Emblem = (
    <img
      src="/rb-emblem.png"
      alt=""
      draggable={false}
      style={{
        height: s.emblem,
        width: "auto",
        marginBottom: s.gap,
        filter: inverse ? "invert(95%) brightness(1.05)" : "none",
      }}
    />
  );

  if (variant === "emblem") {
    return (
      <img
        src="/rb-emblem.png"
        alt="Rama Bazaar"
        draggable={false}
        className={`inline-block select-none ${className}`}
        style={{
          height: s.emblem,
          width: "auto",
          filter: inverse ? "invert(95%) brightness(1.05)" : "none",
        }}
      />
    );
  }

  return (
    <div className={`inline-flex flex-col items-center ${className}`} aria-label="Rama Bazaar 1.0">
      {variant === "stacked" && Emblem}

      {/* RAMA — large serif */}
      <div
        className="font-serif-display leading-none"
        style={{
          color: ink,
          fontSize: s.rama,
          letterSpacing: "0.14em",
          paddingLeft: "0.14em",
          fontWeight: 500,
        }}
      >
        RAMA
      </div>

      {/* —  BAZAAR 1.0  — */}
      <div
        className="flex items-center flex-nowrap"
        style={{ marginTop: s.gap * 0.8, gap: s.gap * 0.9 }}
      >
        <span style={{ height: 1, width: s.rule, background: gold, display: "inline-block", flexShrink: 0 }} />
        <span
          className="font-serif-display whitespace-nowrap"
          style={{
            color: gold,
            fontSize: s.sub,
            letterSpacing: "0.26em",
            paddingLeft: "0.26em",
            fontWeight: 500,
          }}
        >
          BAZAAR&nbsp;1.0
        </span>
        <span style={{ height: 1, width: s.rule, background: gold, display: "inline-block", flexShrink: 0 }} />
      </div>

      {/* CONNECT · SHOWCASE · GROW */}
      <div
        className="flex items-center"
        style={{
          marginTop: s.gap * 1.1,
          gap: s.gap * 0.7,
          color: ink,
          fontSize: s.tagline,
          letterSpacing: "0.38em",
          paddingLeft: "0.38em",
          fontWeight: 500,
        }}
      >
        <span>CONNECT</span>
        <span style={{ color: gold }}>•</span>
        <span>SHOWCASE</span>
        <span style={{ color: gold }}>•</span>
        <span>GROW</span>
      </div>
    </div>
  );
}
