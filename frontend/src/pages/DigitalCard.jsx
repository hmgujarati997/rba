import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { BACKEND_URL } from "../lib/api";
import {
  Phone, MessageCircle, Mail, MapPin, Instagram, Facebook, Linkedin, Globe,
  Download, ExternalLink, UserPlus, Share2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const abs = (u) => (!u ? "" : u.startsWith("http") ? u : `${BACKEND_URL}${u}`);

export default function DigitalCard() {
  const { slug } = useParams();
  const [ex, setEx] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    document.title = "Loading… · Rama Bazaar";
    api.get(`/c/${slug}`).then((r) => {
      setEx(r.data);
      const name = (r.data.business_name || r.data.member_name || "Card").trim();
      document.title = `${name} · Digital Card`;
    }).catch((e) => setErr(e?.response?.data?.detail || "Card not found"));
  }, [slug]);

  if (err) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#f5efe1" }}>
        <div className="text-center max-w-sm" data-testid="card-not-found">
          <div className="eyebrow">404</div>
          <h1 className="font-serif-display text-3xl mt-3">Card not found</h1>
          <p className="mt-3 text-sm" style={{ color: "#7a7868" }}>This digital card link is no longer active.</p>
          <Link to="/" className="btn-outline-gold mt-6 inline-flex">Visit Rama Bazaar 1.0</Link>
        </div>
      </div>
    );
  }
  if (!ex) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5efe1" }}>
      <div className="font-serif-display text-2xl" style={{ color: "#b2873d" }}>···</div>
    </div>;
  }

  const phone = (ex.whatsapp || ex.mobile || "").replace(/\D/g, "");
  const tel = phone ? `+91${phone}` : "";
  const initial = (ex.business_name || ex.member_name || "R").trim()[0];
  const photo = abs(ex.profile_photo_url);
  const banner = abs(ex.banner_url);
  const focusX = (ex.photo_focus_x ?? 0.5) * 100;
  const focusY = (ex.photo_focus_y ?? 0.35) * 100;
  const zoom = ex.photo_zoom || 1;
  const gallery = Array.isArray(ex.catalogue_gallery) ? ex.catalogue_gallery.filter((g) => g && (g.image_url || g.name)) : [];
  const testimonials = Array.isArray(ex.testimonials) ? ex.testimonials.filter((t) => t && (t.text || t.name)) : [];
  const links = Array.isArray(ex.custom_links) ? ex.custom_links.filter((l) => l && l.url) : [];

  const shareCard = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: ex.business_name || "Digital Card", url }); } catch { /* user cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(url); toast.success("Link copied"); } catch { toast.error("Copy failed"); }
    }
  };

  return (
    <div className="digital-card" data-testid="digital-card" style={{ background: "#f5efe1", minHeight: "100vh", color: "#1f1f27" }}>
      {/* HERO */}
      <div className="relative" style={{ background: banner ? `url(${banner}) center/cover` : "linear-gradient(180deg,#efe7d2 0%,#f5efe1 100%)" }}>
        <div className="relative" style={{ background: banner ? "linear-gradient(180deg, rgba(27,25,75,0.55) 0%, rgba(245,239,225,0.95) 90%)" : "transparent", paddingBottom: 80, paddingTop: 32 }}>
          {/* Top bar */}
          <div className="px-6 flex items-center justify-between">
            <Link to="/" className="eyebrow" style={{ color: banner ? "#fbf6e8" : "#b2873d" }}>RAMA BAZAAR 1.0</Link>
            <button onClick={shareCard} data-testid="card-share-btn" className="text-xs uppercase tracking-luxe inline-flex items-center gap-2"
              style={{ color: banner ? "#fbf6e8" : "#1f1f27" }}>
              <Share2 size={14} /> Share
            </button>
          </div>

          {/* Avatar */}
          <div className="mt-10 flex justify-center">
            <div className="rounded-full overflow-hidden border-2 flex items-center justify-center"
                 style={{ width: 152, height: 152, borderColor: "#d8bc84", background: "#fbf8f0", boxShadow: "0 12px 36px -10px rgba(27,25,75,0.3)" }}>
              {photo ? (
                <img src={photo} alt={ex.business_name || ""} className="w-full h-full" style={{ objectFit: "cover", objectPosition: `${focusX}% ${focusY}%`, transform: `scale(${zoom})` }} />
              ) : (
                <span className="font-serif-display" style={{ fontSize: 64, color: "#b2873d" }}>{initial}</span>
              )}
            </div>
          </div>

          {/* Name lockup */}
          <div className="mt-6 px-6 text-center">
            {ex.category && (
              <div className="eyebrow" style={{ color: banner ? "#fbf6e8" : "#b2873d" }}>{ex.category}</div>
            )}
            <h1 className="font-serif-display mt-2" style={{ fontSize: 36, lineHeight: 1.08, color: banner ? "#fbf6e8" : "#1B194B" }}>
              {ex.business_name || ex.member_name}
            </h1>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span style={{ display: "inline-block", height: 1, width: 28, background: "#b2873d" }} />
              <span style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: banner ? "#efe7d2" : "#7a7868" }}>
                {ex.member_name}{ex.position ? ` · ${ex.position}` : ""}
              </span>
              <span style={{ display: "inline-block", height: 1, width: 28, background: "#b2873d" }} />
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="px-5 -mt-10 pb-12" style={{ position: "relative", zIndex: 2 }}>
        <div className="max-w-md mx-auto card-luxe p-6" style={{ borderRadius: 22, boxShadow: "0 24px 60px -28px rgba(27,25,75,0.32)", background: "#ffffff" }}>
          {/* Company crest — normalised cream chip so any logo (any aspect / any bg colour) looks premium */}
          {ex.logo_url && (
            <div
              data-testid="company-crest"
              style={{
                marginTop: -54,
                marginBottom: 18,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 92,
                  height: 92,
                  background: "#fbf8f0",
                  border: "1px solid #d8bc84",
                  borderRadius: 18,
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "0 14px 32px -10px rgba(27,25,75,0.38), inset 0 1px 0 rgba(255,255,255,0.7)",
                }}
              >
                <img
                  src={abs(ex.logo_url)}
                  alt={`${ex.business_name || "Company"} logo`}
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
                />
              </div>
            </div>
          )}

          {/* Save to contacts — hero CTA */}
          <a
            href={`${BACKEND_URL}/api/c/${slug}/vcard`}
            data-testid="save-to-contacts"
            className="flex items-center justify-center gap-2 rounded-full"
            style={{ width: "100%", background: "#1B194B", color: "#fbf6e8", padding: "16px 14px", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12, boxShadow: "0 12px 30px -10px rgba(27,25,75,0.45)", whiteSpace: "nowrap" }}
          >
            <UserPlus size={16} /> Save to Contacts
          </a>

          {/* Quick contact icons */}
          <div className="mt-6 grid grid-cols-4 gap-3" data-testid="quick-actions">
            <QuickIcon href={tel ? `tel:${tel}` : null} label="Call" testid="qa-call"><Phone size={20} /></QuickIcon>
            <QuickIcon href={phone ? `https://wa.me/91${phone}` : null} target="_blank" label="WhatsApp" testid="qa-wa"><MessageCircle size={20} /></QuickIcon>
            <QuickIcon href={ex.email ? `mailto:${ex.email}` : null} label="Email" testid="qa-email"><Mail size={20} /></QuickIcon>
            <QuickIcon href={ex.shop_maps_link || ex.maps_link || null} target="_blank" label="Map" testid="qa-map"><MapPin size={20} /></QuickIcon>
          </div>

          {/* Social — moved up so visitors discover socials immediately */}
          {(ex.instagram || ex.facebook || ex.linkedin || ex.website) && (
            <Section label="Follow">
              <div className="flex flex-wrap gap-2" data-testid="social-row">
                <SocialPill icon={<Instagram size={16} />} url={ex.instagram} label="Instagram" />
                <SocialPill icon={<Facebook size={16} />} url={ex.facebook} label="Facebook" />
                <SocialPill icon={<Linkedin size={16} />} url={ex.linkedin} label="LinkedIn" />
                <SocialPill icon={<Globe size={16} />} url={ex.website} label="Website" />
              </div>
            </Section>
          )}

          {/* About */}
          {ex.description && (
            <Section label="About">
              <p className="text-base leading-relaxed" style={{ color: "#3b3b46" }}>{ex.description}</p>
            </Section>
          )}

          {/* Products / Services - text */}
          {ex.products_services && (
            <Section label="Offerings">
              <p className="text-sm leading-relaxed" style={{ color: "#3b3b46", whiteSpace: "pre-wrap" }}>{ex.products_services}</p>
            </Section>
          )}

          {/* Catalogue PDF */}
          {ex.catalogue_pdf_url && (
            <Section label="Catalogue">
              <a
                href={abs(ex.catalogue_pdf_url)}
                target="_blank"
                rel="noreferrer"
                data-testid="catalogue-pdf-link"
                className="inline-flex items-center justify-between w-full card-luxe p-4 hover:shadow-gold"
                style={{ borderRadius: 14 }}
              >
                <span className="inline-flex items-center gap-3">
                  <span className="inline-flex items-center justify-center rounded-full" style={{ width: 40, height: 40, background: "#fbf6e8", border: "1px solid #d8bc84", color: "#b2873d" }}>
                    <Download size={18} />
                  </span>
                  <span>
                    <div className="font-serif-display text-lg leading-tight">Full Catalogue</div>
                    <div className="text-xs" style={{ color: "#7a7868" }}>PDF · Tap to view</div>
                  </span>
                </span>
                <ExternalLink size={16} style={{ color: "#b2873d" }} />
              </a>
            </Section>
          )}

          {/* Gallery carousel */}
          {gallery.length > 0 && (
            <Section label="Products & Services">
              <Carousel items={gallery} />
            </Section>
          )}

          {/* Testimonials */}
          {testimonials.length > 0 && (
            <Section label="What clients say">
              <TestimonialsCarousel items={testimonials} />
            </Section>
          )}

          {/* Find us */}
          {(ex.shop_address || ex.shop_maps_link) && (
            <Section label="Find us">
              {ex.shop_address && (
                <p className="text-sm leading-relaxed" style={{ color: "#3b3b46" }}>{ex.shop_address}</p>
              )}
              {ex.shop_maps_link && (
                <a href={ex.shop_maps_link} target="_blank" rel="noreferrer" data-testid="open-in-maps"
                   className="mt-3 btn-outline-gold inline-flex items-center gap-2">
                  <MapPin size={14} /> Open in Maps
                </a>
              )}
            </Section>
          )}

          {/* Custom links */}
          {links.length > 0 && (
            <Section label="More">
              <div className="space-y-2" data-testid="custom-links">
                {links.map((l, i) => (
                  <a key={i} href={normalizeUrl(l.url)} target="_blank" rel="noreferrer"
                     className="card-luxe flex items-center justify-between p-3 hover:shadow-gold" style={{ borderRadius: 12 }}>
                    <span className="text-sm" style={{ color: "#1f1f27" }}>{l.label || l.url}</span>
                    <ExternalLink size={14} style={{ color: "#b2873d" }} />
                  </a>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-10">
          <div className="eyebrow" style={{ color: "#b2873d" }}>Powered by</div>
          <Link to="/" className="font-serif-display text-xl mt-1 inline-block" style={{ color: "#1B194B" }}>Rama Bazaar 1.0</Link>
          <div className="text-xs mt-1" style={{ color: "#7a7868" }}>by LVB Rama · Connect · Showcase · Grow</div>
        </div>
      </div>
    </div>
  );
}

function normalizeUrl(u) {
  if (!u) return "#";
  if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("mailto:") || u.startsWith("tel:")) return u;
  return `https://${u}`;
}

function Section({ label, children }) {
  return (
    <div className="mt-7">
      <div className="flex items-center gap-3">
        <span style={{ height: 1, flex: 1, background: "rgba(178,135,61,0.35)" }} />
        <span className="eyebrow" style={{ color: "#b2873d", fontSize: 10 }}>{label}</span>
        <span style={{ height: 1, flex: 1, background: "rgba(178,135,61,0.35)" }} />
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function QuickIcon({ href, target, label, testid, children }) {
  const disabled = !href;
  const Comp = disabled ? "div" : "a";
  return (
    <Comp
      href={disabled ? undefined : href}
      target={target}
      rel={target === "_blank" ? "noreferrer" : undefined}
      data-testid={testid}
      className="flex flex-col items-center gap-1.5"
      style={{ opacity: disabled ? 0.35 : 1, pointerEvents: disabled ? "none" : "auto" }}
    >
      <span className="inline-flex items-center justify-center rounded-full"
            style={{ width: 52, height: 52, background: "#fbf8f0", border: "1px solid #d8bc84", color: "#1B194B" }}>
        {children}
      </span>
      <span className="text-[10px] uppercase tracking-luxe" style={{ color: "#7a7868" }}>{label}</span>
    </Comp>
  );
}

function SocialPill({ icon, url, label }) {
  if (!url) return null;
  return (
    <a href={normalizeUrl(url)} target="_blank" rel="noreferrer"
       className="inline-flex items-center gap-2 px-3 py-2 rounded-full"
       style={{ background: "#fbf6e8", border: "1px solid #d8bc84", color: "#1B194B", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
      {icon}
      <span>{label}</span>
    </a>
  );
}

function Carousel({ items }) {
  const [active, setActive] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState(-1);
  const ref = React.useRef(null);
  const scrollTo = (i) => {
    const el = ref.current;
    if (!el) return;
    const child = el.children[i];
    if (child) el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: "smooth" });
    setActive(i);
  };
  const onCardKey = (e, i) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLightboxIdx(i); }
  };
  return (
    <div className="relative">
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-3 -mx-2 px-2"
           style={{ scrollSnapType: "x mandatory", scrollBehavior: "smooth" }}
           data-testid="gallery-carousel">
        {items.map((g, i) => (
          <div key={i} className="card-luxe shrink-0" style={{ width: 220, scrollSnapAlign: "start", borderRadius: 16, overflow: "hidden" }}>
            {g.image_url ? (
              <button
                type="button"
                onClick={() => setLightboxIdx(i)}
                onKeyDown={(e) => onCardKey(e, i)}
                aria-label={`Open ${g.name || "product"} image`}
                data-testid={`gallery-img-${i}`}
                style={{ all: "unset", display: "block", cursor: "zoom-in", width: "100%" }}
              >
                <img src={abs(g.image_url)} alt={g.name || ""} style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} />
              </button>
            ) : (
              <div style={{ width: "100%", height: 220, background: "#fbf6e8", display: "flex", alignItems: "center", justifyContent: "center", color: "#b2873d", fontFamily: "Cormorant Garamond, serif", fontSize: 28 }}>
                {(g.name || "·")[0]}
              </div>
            )}
            {(g.name || g.description) && (
              <div className="p-3">
                {g.name && <div className="font-serif-display text-lg leading-tight" style={{ color: "#1B194B" }}>{g.name}</div>}
                {g.description && <div className="text-xs mt-1 leading-relaxed" style={{ color: "#7a7868" }}>{g.description}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="flex items-center justify-between mt-1">
          <div className="flex gap-1.5">
            {items.map((_, i) => (
              <span key={i} style={{ width: i === active ? 18 : 6, height: 4, borderRadius: 2, background: i === active ? "#b2873d" : "rgba(178,135,61,0.25)", transition: "all 200ms" }} />
            ))}
          </div>
          <div className="flex gap-1">
            <button aria-label="prev" onClick={() => scrollTo(Math.max(0, active - 1))} className="p-1.5 rounded-full" style={{ border: "1px solid #d8bc84", color: "#b2873d" }}><ChevronLeft size={14} /></button>
            <button aria-label="next" onClick={() => scrollTo(Math.min(items.length - 1, active + 1))} className="p-1.5 rounded-full" style={{ border: "1px solid #d8bc84", color: "#b2873d" }}><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
      {lightboxIdx >= 0 && (
        <Lightbox items={items} index={lightboxIdx} onClose={() => setLightboxIdx(-1)} onChange={setLightboxIdx} />
      )}
    </div>
  );
}

function Lightbox({ items, index, onClose, onChange }) {
  const item = items[index];
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onChange(Math.min(items.length - 1, index + 1));
      if (e.key === "ArrowLeft") onChange(Math.max(0, index - 1));
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, items.length, onClose, onChange]);
  if (!item) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="gallery-lightbox"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(15,14,40,0.92)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        data-testid="lightbox-close"
        aria-label="Close"
        style={{ position: "absolute", top: 18, right: 18, color: "#fbf6e8", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(216,188,132,0.4)", borderRadius: 999, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, lineHeight: 1 }}
      >×</button>

      {items.length > 1 && index > 0 && (
        <button onClick={(e) => { e.stopPropagation(); onChange(index - 1); }} aria-label="Previous"
          style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#fbf6e8", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(216,188,132,0.4)", borderRadius: 999, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={22} />
        </button>
      )}
      {items.length > 1 && index < items.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); onChange(index + 1); }} aria-label="Next"
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#fbf6e8", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(216,188,132,0.4)", borderRadius: 999, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChevronRight size={22} />
        </button>
      )}

      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "100%", maxHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <img
          src={abs(item.image_url)}
          alt={item.name || ""}
          data-testid="lightbox-image"
          style={{ maxWidth: "100%", maxHeight: "78vh", objectFit: "contain", borderRadius: 10, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}
        />
        {(item.name || item.description) && (
          <div style={{ color: "#fbf6e8", textAlign: "center", maxWidth: 520 }}>
            {item.name && <div className="font-serif-display" style={{ fontSize: 22, lineHeight: 1.2 }}>{item.name}</div>}
            {item.description && <div style={{ fontSize: 13, marginTop: 6, color: "#e7dfc6", lineHeight: 1.5 }}>{item.description}</div>}
            <div style={{ fontSize: 11, marginTop: 8, letterSpacing: "0.18em", textTransform: "uppercase", color: "#b2873d" }}>
              {index + 1} / {items.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TestimonialsCarousel({ items }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2"
         style={{ scrollSnapType: "x mandatory" }}
         data-testid="testimonials-carousel">
      {items.map((t, i) => (
        <div key={i} className="card-luxe shrink-0 p-5" style={{ width: 270, scrollSnapAlign: "start", borderRadius: 16, background: "#fbf8f0" }}>
          <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 48, lineHeight: 0.4, color: "#b2873d" }}>&ldquo;</div>
          <p className="mt-2 text-sm leading-relaxed italic" style={{ color: "#1f1f27" }}>{t.text}</p>
          {(t.name || t.role) && (
            <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(178,135,61,0.25)" }}>
              <div className="font-serif-display text-base" style={{ color: "#1B194B" }}>{t.name}</div>
              {t.role && <div className="text-[11px] uppercase tracking-luxe" style={{ color: "#7a7868" }}>{t.role}</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
