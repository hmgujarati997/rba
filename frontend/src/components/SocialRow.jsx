import React from "react";
import { Instagram, Facebook, Linkedin, Globe } from "lucide-react";

// Inline WhatsApp glyph (lucide does not ship one)
function WhatsAppIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M20.52 3.48A11.78 11.78 0 0 0 12.06 0C5.5 0 .17 5.32.17 11.88a11.78 11.78 0 0 0 1.6 5.95L0 24l6.34-1.66a11.92 11.92 0 0 0 5.72 1.46h.01c6.55 0 11.88-5.32 11.88-11.88a11.78 11.78 0 0 0-3.43-8.44Zm-8.46 18.27h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.76.98 1-3.66-.23-.37a9.85 9.85 0 1 1 18.3-5.23 9.85 9.85 0 0 1-9.91 9.87Zm5.42-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.94 1.16-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.38-1.47a8.96 8.96 0 0 1-1.65-2.06c-.17-.3-.02-.46.13-.61.13-.14.3-.34.45-.5.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.9-2.18-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.46s1.05 2.86 1.2 3.06c.15.2 2.07 3.16 5.01 4.43.7.3 1.25.48 1.68.62.71.22 1.35.19 1.86.12.57-.08 1.76-.72 2-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.34Z" />
    </svg>
  );
}

/**
 * Social row — renders only icons that have a value.
 * Each chip is a circular gold-bordered link.
 * Order: WhatsApp · Instagram · Facebook · LinkedIn · Website
 */
export default function SocialRow({ exhibitor: ex, size = "md", className = "" }) {
  const waNumber = (ex.whatsapp || ex.mobile || "").replace(/\D/g, "");
  const waHref = waNumber ? `https://wa.me/${waNumber.length === 10 ? "91" + waNumber : waNumber}` : "";

  const items = [
    waHref && { key: "wa", href: waHref, label: "WhatsApp", icon: <WhatsAppIcon size={16} />, color: "#25D366", testid: "social-wa" },
    ex.instagram && { key: "ig", href: ex.instagram, label: "Instagram", icon: <Instagram size={16} strokeWidth={1.6} />, color: "#E1306C", testid: "social-ig" },
    ex.facebook && { key: "fb", href: ex.facebook, label: "Facebook", icon: <Facebook size={16} strokeWidth={1.6} />, color: "#1877F2", testid: "social-fb" },
    ex.linkedin && { key: "in", href: ex.linkedin, label: "LinkedIn", icon: <Linkedin size={16} strokeWidth={1.6} />, color: "#0A66C2", testid: "social-in" },
    ex.website && { key: "web", href: ex.website, label: "Website", icon: <Globe size={16} strokeWidth={1.6} />, color: "#1f1f27", testid: "social-web" },
  ].filter(Boolean);

  if (items.length === 0) return null;

  const dim = size === "sm" ? 30 : 36;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} data-testid="social-row">
      {items.map((it) => (
        <a
          key={it.key}
          href={it.href}
          target="_blank"
          rel="noreferrer"
          aria-label={it.label}
          title={it.label}
          data-testid={it.testid}
          className="inline-flex items-center justify-center rounded-full border transition-colors"
          style={{
            width: dim,
            height: dim,
            borderColor: "#d8bc84",
            background: "#fff",
            color: it.color,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = it.color;
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.borderColor = it.color;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.color = it.color;
            e.currentTarget.style.borderColor = "#d8bc84";
          }}
        >
          {it.icon}
        </a>
      ))}
    </div>
  );
}
