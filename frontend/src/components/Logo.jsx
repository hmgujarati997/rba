import React from "react";

// Use the actual brand logo image. We accept a `variant` prop to switch
// between the light-background (default) and dark-background versions.
export default function Logo({ size = "md", variant = "light", className = "" }) {
  const heights = { sm: 44, md: 88, lg: 140, xl: 220 };
  const src = variant === "dark" ? "/logo-dark.png" : "/logo.png";
  return (
    <img
      src={src}
      alt="Rama Bazaar 1.0"
      className={`inline-block select-none ${className}`}
      style={{ height: heights[size] || heights.md, width: "auto", objectFit: "contain" }}
      draggable={false}
    />
  );
}
