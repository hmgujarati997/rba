import React from "react";
import { Phone, MessageCircle, Globe, Instagram, Share2, Bookmark, MapPin, ChevronDown } from "lucide-react";
import { BACKEND_URL } from "../lib/api";

function absUrl(u) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return `${BACKEND_URL}${u}`;
}

function saveVCard(ex) {
  const vcf = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${ex.member_name || ex.business_name}`,
    `ORG:${ex.business_name || ""}`,
    `TEL;TYPE=CELL:${ex.mobile || ""}`,
    ex.email ? `EMAIL:${ex.email}` : "",
    ex.website ? `URL:${ex.website}` : "",
    ex.address ? `ADR:;;${ex.address};;;;` : "",
    "END:VCARD",
  ].filter(Boolean).join("\n");
  const blob = new Blob([vcf], { type: "text/vcard" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${(ex.business_name || "contact").replace(/\s+/g, "_")}.vcf`;
  a.click();
}

function shareCard(ex) {
  const url = `${window.location.origin}/roster#${ex.id}`;
  const text = `${ex.business_name} — Rama Bazaar 1.0`;
  if (navigator.share) navigator.share({ title: ex.business_name, text, url }).catch(() => {});
  else navigator.clipboard?.writeText(url);
}

function toggleFav(ex, setFav) {
  const set = new Set(JSON.parse(localStorage.getItem("rama_fav") || "[]"));
  if (set.has(ex.id)) set.delete(ex.id); else set.add(ex.id);
  localStorage.setItem("rama_fav", JSON.stringify([...set]));
  setFav(set.has(ex.id));
}

export default function ExhibitorCard({ exhibitor: ex }) {
  const [fav, setFav] = React.useState(() => new Set(JSON.parse(localStorage.getItem("rama_fav") || "[]")).has(ex.id));
  const [expanded, setExpanded] = React.useState(false);
  const waNumber = (ex.whatsapp || ex.mobile || "").replace(/\D/g, "");

  return (
    <article
      id={ex.id}
      data-testid={`exhibitor-card-${ex.id}`}
      className="card-luxe overflow-hidden animate-fadeUp"
    >
      {/* SLIM ROW — always visible, tap to expand */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        data-testid={`exhibitor-row-${ex.id}`}
        aria-expanded={expanded}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#fbf8f0]"
      >
        {/* Compact logo tile */}
        <div
          className="w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border"
          style={{ background: "#fbf8f0", borderColor: "rgba(178,135,61,0.30)" }}
        >
          {ex.logo_url ? (
            <img
              loading="lazy"
              src={absUrl(ex.logo_url)}
              alt={ex.business_name}
              style={{ maxWidth: "82%", maxHeight: "82%", objectFit: "contain" }}
            />
          ) : (
            <span className="font-serif-display text-2xl" style={{ color: "#b2873d" }}>
              {(ex.business_name || "R")[0]}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3
              className="font-serif-display text-base leading-tight truncate"
              style={{ color: "#1f1f27" }}
            >
              {ex.business_name}
            </h3>
            {ex.featured && (
              <span
                className="shrink-0 text-[9px] uppercase font-medium px-1.5 py-0.5 rounded-full"
                style={{ background: "#1f1f27", color: "#f8f7f4", letterSpacing: "0.16em" }}
              >
                ★
              </span>
            )}
          </div>
          <div className="text-xs mt-0.5 truncate" style={{ color: "#7a7868" }}>
            {[ex.member_name, ex.category].filter(Boolean).join(" · ")}
          </div>
        </div>

        <ChevronDown
          size={16}
          style={{
            color: "#b2873d",
            transition: "transform 220ms ease",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* EXPANDED DETAILS — only when row tapped */}
      {expanded && (
        <div className="border-t animate-fadeIn" style={{ borderColor: "rgba(178,135,61,0.18)" }}>
          {/* LOGO SHOWCASE — full stage, only when expanded */}
          <div
            className="flex items-center justify-center"
            style={{ background: "#fbf8f0", height: 140, padding: "20px 28px" }}
          >
            {ex.logo_url ? (
              <img
                src={absUrl(ex.logo_url)}
                alt={ex.business_name}
                style={{ maxHeight: "100%", maxWidth: "78%", objectFit: "contain" }}
              />
            ) : (
              <div className="font-serif-display" style={{ fontSize: 56, color: "#b2873d" }}>
                {(ex.business_name || "R")[0]}
              </div>
            )}
          </div>

          <div className="p-5 border-t" style={{ borderColor: "rgba(178,135,61,0.18)" }}>
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-full overflow-hidden bg-[#efeae0] border flex items-center justify-center shrink-0"
                style={{ borderColor: "#d8bc84" }}
              >
                {ex.profile_photo_url ? (
                  <img src={absUrl(ex.profile_photo_url)} alt={ex.member_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-serif-display text-lg" style={{ color: "#b2873d" }}>
                    {(ex.member_name || ex.business_name || "R")[0]}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="eyebrow truncate">{ex.category || "Exhibitor"}</div>
                <h4 className="font-serif-display text-lg leading-tight mt-0.5 truncate" style={{ color: "#1f1f27" }}>
                  {ex.business_name}
                </h4>
                <div className="text-sm mt-0.5" style={{ color: "#7a7868" }}>{ex.member_name}</div>
              </div>
            </div>

            {ex.description && (
              <p className="mt-4 text-sm leading-relaxed" style={{ color: "#3b3b46" }}>
                {ex.description}
              </p>
            )}

            {ex.products_services && (
              <div className="mt-4">
                <div className="eyebrow" style={{ color: "#b2873d", fontSize: 10 }}>Products & Services</div>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line" style={{ color: "#3b3b46" }}>
                  {ex.products_services}
                </p>
              </div>
            )}

            {(ex.address || ex.maps_link) && (
              <div className="mt-4 flex items-start gap-2 text-xs" style={{ color: "#7a7868" }}>
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <span className="break-words">
                  {ex.maps_link ? (
                    <a href={ex.maps_link} target="_blank" rel="noreferrer" className="underline underline-offset-2 decoration-[#d8bc84]">
                      {ex.address || "View on Maps"}
                    </a>
                  ) : (
                    ex.address
                  )}
                </span>
              </div>
            )}

            <div className="divider-thin my-4" />

            <div className="grid grid-cols-3 gap-2">
              <a
                data-testid={`card-call-${ex.id}`}
                href={`tel:${ex.mobile}`}
                className="flex items-center justify-center gap-1.5 py-2 rounded-full border text-[11px] uppercase tracking-luxe"
                style={{ borderColor: "#d8bc84", color: "#1f1f27" }}
              >
                <Phone size={13} /> Call
              </a>
              <a
                data-testid={`card-wa-${ex.id}`}
                href={`https://wa.me/${waNumber.length === 10 ? "91" + waNumber : waNumber}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 rounded-full border text-[11px] uppercase tracking-luxe"
                style={{ borderColor: "#d8bc84", color: "#1f1f27" }}
              >
                <MessageCircle size={13} /> WhatsApp
              </a>
              {ex.website ? (
                <a
                  data-testid={`card-site-${ex.id}`}
                  href={ex.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 rounded-full border text-[11px] uppercase tracking-luxe"
                  style={{ borderColor: "#d8bc84", color: "#1f1f27" }}
                >
                  <Globe size={13} /> Site
                </a>
              ) : ex.instagram ? (
                <a
                  data-testid={`card-ig-${ex.id}`}
                  href={ex.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 rounded-full border text-[11px] uppercase tracking-luxe"
                  style={{ borderColor: "#d8bc84", color: "#1f1f27" }}
                >
                  <Instagram size={13} /> Insta
                </a>
              ) : (
                <button
                  onClick={() => shareCard(ex)}
                  data-testid={`card-share-${ex.id}`}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-full border text-[11px] uppercase tracking-luxe"
                  style={{ borderColor: "#d8bc84", color: "#1f1f27" }}
                >
                  <Share2 size={13} /> Share
                </button>
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => saveVCard(ex)}
                data-testid={`card-save-${ex.id}`}
                className="flex items-center justify-center gap-1.5 py-2 rounded-full text-[11px] uppercase tracking-luxe text-[#f8f7f4]"
                style={{ background: "#1f1f27" }}
              >
                <Bookmark size={13} /> Save Contact
              </button>
              <button
                onClick={() => toggleFav(ex, setFav)}
                data-testid={`card-fav-${ex.id}`}
                className="flex items-center justify-center gap-1.5 py-2 rounded-full text-[11px] uppercase tracking-luxe border"
                style={{ borderColor: "#d8bc84", color: fav ? "#b2873d" : "#1f1f27" }}
              >
                {fav ? "★ Favorited" : "☆ Favorite"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
