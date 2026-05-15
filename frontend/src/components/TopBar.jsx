import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function TopBar({ title, back = false, right = null }) {
  return (
    <header className="sticky top-0 z-30 bg-[#f8f7f4]/85 backdrop-blur-md border-b" style={{ borderColor: "rgba(178,135,61,0.18)" }}>
      <div className="max-w-xl mx-auto px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {back && (
            <Link to="/" data-testid="topbar-home" className="text-[#1f1f27] text-sm tracking-luxe uppercase" style={{ letterSpacing: "0.22em", fontSize: 11 }}>
              ← Home
            </Link>
          )}
          {!back && <Logo size="sm" withTagline={false} />}
        </div>
        {title && <div className="font-serif-display text-lg" style={{ color: "#1f1f27" }}>{title}</div>}
        <div>{right}</div>
      </div>
    </header>
  );
}
