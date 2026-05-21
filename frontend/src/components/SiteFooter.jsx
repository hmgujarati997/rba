import React from "react";

/**
 * Slim site-wide footer credit. Rendered on every public page
 * just above the BottomNav (sits in normal page flow, not sticky).
 */
export default function SiteFooter({ inset = true }) {
  return (
    <div
      data-testid="site-footer"
      className="w-full border-t"
      style={{
        borderColor: "rgba(178,135,61,0.18)",
        paddingBottom: inset ? 96 : 32, // leave space for sticky BottomNav (96px) when inset=true
        background: "#f8f7f4",
      }}
    >
      <div className="max-w-xl mx-auto px-6 py-7 flex flex-col items-center text-center">
        <div className="flex items-center justify-center gap-2.5">
          <span style={{ height: 1, width: 22, background: "rgba(178,135,61,0.45)", display: "inline-block" }} />
          <span className="eyebrow" style={{ fontSize: 9, color: "#7a7868" }}>Technology Partner</span>
          <span style={{ height: 1, width: 22, background: "rgba(178,135,61,0.45)", display: "inline-block" }} />
        </div>
        <a
          href="https://rapidexpresstech.com"
          target="_blank"
          rel="noreferrer"
          data-testid="footer-rxt"
          className="mt-3 inline-flex items-center gap-3 group"
        >
          <img
            src="/partners/rxt.png"
            alt="Rapid Express Technologies"
            style={{ height: 26, width: "auto" }}
            loading="lazy"
          />
          <span
            className="font-serif-display"
            style={{ color: "#1f1f27", fontSize: 16, letterSpacing: "0.06em" }}
          >
            Rapid Express <span style={{ color: "#b2873d" }}>Technologies</span>
          </span>
        </a>
        <div className="mt-4 eyebrow" style={{ fontSize: 9, color: "#9a9685" }}>
          © Rama Bazaar 1.0 · LVB Rama
        </div>
      </div>
    </div>
  );
}
