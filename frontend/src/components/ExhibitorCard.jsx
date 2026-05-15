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
      {ex.banner_url && (
        <div className="h-28 sm:h-32 w-full bg-[#efeae0] overflow-hidden">
          <img loading="lazy" src={absUrl(ex.banner_url)} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-[#efeae0] border" style={{ borderColor: "#d8bc84" }}>
            {ex.logo_url ? (
              <img loading="lazy" src={absUrl(ex.logo_url)} alt={ex.business_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-serif-display text-xl" style={{ color: "#b2873d" }}>
                {(ex.business_name || "R")[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="eyebrow truncate">{ex.category || "Exhibitor"}</div>
            <h3 className="font-serif-display text-xl leading-tight mt-0.5 truncate" style={{ color: "#1f1f27" }}>{ex.business_name}</h3>
            <div className="text-sm mt-0.5" style={{ color: "#7a7868" }}>{ex.member_name}</div>
          </div>
          {ex.featured && (
            <span className="eyebrow" style={{ color: "#b2873d" }}>★ Featured</span>
          )}
        </div>

        {ex.description && (
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "#3b3b46" }}>
            {ex.description.length > 180 ? `${ex.description.slice(0, 180)}…` : ex.description}
          </p>
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
