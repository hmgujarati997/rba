import React from "react";
import { Phone, MessageCircle, Globe, Instagram, Share2, Bookmark, MapPin } from "lucide-react";
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
  const waNumber = (ex.whatsapp || ex.mobile || "").replace(/\D/g, "");
  return (
    <article
      id={ex.id}
      data-testid={`exhibitor-card-${ex.id}`}
      className="card-luxe overflow-hidden animate-fadeUp"
    >
      {/* LOGO SHOWCASE — same stage for every card; logos contain inside */}
      <div
        className="relative flex items-center justify-center border-b"
        style={{
          background: "#fbf8f0",
          borderColor: "rgba(178,135,61,0.18)",
          height: 150,
          padding: "20px 28px",
        }}
      >
        {ex.logo_url ? (
          <img
            loading="lazy"
            src={absUrl(ex.logo_url)}
            alt={ex.business_name}
            style={{ maxHeight: "100%", maxWidth: "78%", objectFit: "contain" }}
          />
        ) : (
          <div className="flex flex-col items-center">
            <div className="font-serif-display" style={{ fontSize: 72, color: "#b2873d", lineHeight: 1 }}>
              {(ex.business_name || "R")[0]}
            </div>
            <div className="eyebrow mt-2" style={{ color: "#7a7868" }}>{ex.business_name}</div>
          </div>
        )}
        {ex.featured && (
          <span
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] uppercase font-medium"
            style={{ background: "#1f1f27", color: "#f8f7f4", letterSpacing: "0.22em" }}
          >
            ★ Featured
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Owner profile photo — circular, replaces former logo circle */}
          <div
            className="w-14 h-14 rounded-full overflow-hidden bg-[#efeae0] border flex items-center justify-center shrink-0"
            style={{ borderColor: "#d8bc84" }}
          >
            {ex.profile_photo_url ? (
              <img
                loading="lazy"
                src={absUrl(ex.profile_photo_url)}
                alt={ex.member_name || ex.business_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-serif-display text-xl" style={{ color: "#b2873d" }}>
                {(ex.member_name || ex.business_name || "R")[0]}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="eyebrow truncate">{ex.category || "Exhibitor"}</div>
            <h3 className="font-serif-display text-xl leading-tight mt-0.5 truncate" style={{ color: "#1f1f27" }}>{ex.business_name}</h3>
            <div className="text-sm mt-0.5" style={{ color: "#7a7868" }}>{ex.member_name}</div>
          </div>
        </div>

        {ex.description && (
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "#3b3b46" }}>
            {ex.description.length > 180 ? `${ex.description.slice(0, 180)}…` : ex.description}
          </p>
        )}

        {ex.products_services && (
          <div className="mt-4">
            <div className="eyebrow" style={{ color: "#b2873d", fontSize: 10 }}>Products & Services</div>
            <p
              className="mt-2 text-sm leading-relaxed whitespace-pre-line"
              style={{ color: "#3b3b46" }}
            >
              {ex.products_services.length > 220 ? `${ex.products_services.slice(0, 220)}…` : ex.products_services}
            </p>
          </div>
        )}

        {(ex.address || ex.maps_link) && (
          <div className="mt-3 flex items-start gap-2 text-xs" style={{ color: "#7a7868" }}>
            <MapPin size={14} className="mt-0.5" />
            <span className="truncate">
              {ex.maps_link ? <a href={ex.maps_link} target="_blank" rel="noreferrer" className="underline underline-offset-2 decoration-[#d8bc84]">{ex.address || "View on Maps"}</a> : ex.address}
            </span>
          </div>
        )}

        <div className="divider-thin my-5" />

        <div className="grid grid-cols-3 gap-2">
          <a data-testid={`card-call-${ex.id}`} href={`tel:${ex.mobile}`} className="flex items-center justify-center gap-1.5 py-2.5 rounded-full border text-xs uppercase tracking-luxe" style={{ borderColor: "#d8bc84", color: "#1f1f27" }}>
            <Phone size={14} /> Call
          </a>
          <a data-testid={`card-wa-${ex.id}`} href={`https://wa.me/${waNumber.length === 10 ? "91" + waNumber : waNumber}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2.5 rounded-full border text-xs uppercase tracking-luxe" style={{ borderColor: "#d8bc84", color: "#1f1f27" }}>
            <MessageCircle size={14} /> WhatsApp
          </a>
          {ex.website ? (
            <a data-testid={`card-site-${ex.id}`} href={ex.website} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2.5 rounded-full border text-xs uppercase tracking-luxe" style={{ borderColor: "#d8bc84", color: "#1f1f27" }}>
              <Globe size={14} /> Site
            </a>
          ) : ex.instagram ? (
            <a data-testid={`card-ig-${ex.id}`} href={ex.instagram} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-2.5 rounded-full border text-xs uppercase tracking-luxe" style={{ borderColor: "#d8bc84", color: "#1f1f27" }}>
              <Instagram size={14} /> Insta
            </a>
          ) : (
            <button onClick={() => shareCard(ex)} data-testid={`card-share-${ex.id}`} className="flex items-center justify-center gap-1.5 py-2.5 rounded-full border text-xs uppercase tracking-luxe" style={{ borderColor: "#d8bc84", color: "#1f1f27" }}>
              <Share2 size={14} /> Share
            </button>
          )}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={() => saveVCard(ex)} data-testid={`card-save-${ex.id}`} className="flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs uppercase tracking-luxe text-[#f8f7f4]" style={{ background: "#1f1f27" }}>
            <Bookmark size={14} /> Save Contact
          </button>
          <button onClick={() => toggleFav(ex, setFav)} data-testid={`card-fav-${ex.id}`} className="flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs uppercase tracking-luxe border" style={{ borderColor: "#d8bc84", color: fav ? "#b2873d" : "#1f1f27" }}>
            {fav ? "★ Favorited" : "☆ Favorite"}
          </button>
        </div>
      </div>
    </article>
  );
}
