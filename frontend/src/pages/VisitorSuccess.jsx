import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import TopBar from "../components/TopBar";
import api, { API } from "../lib/api";
import { Download, Share2, MessageCircle, MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";

function TitleSponsorBand() {
  return (
    <section className="max-w-xl mx-auto px-6 pt-5 pb-1" data-testid="visitor-title-sponsor">
      <div className="flex items-center justify-center gap-2.5 mb-3">
        <span style={{ height: 1, width: 22, background: "#b2873d", display: "inline-block" }} />
        <span className="eyebrow" style={{ color: "#b2873d", fontSize: 10 }}>Title Sponsor</span>
        <span style={{ height: 1, width: 22, background: "#b2873d", display: "inline-block" }} />
      </div>
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "#1B194B",
          border: "1px solid rgba(193,155,48,0.45)",
          boxShadow: "0 10px 28px -14px rgba(27,25,75,0.55), inset 0 0 0 1px rgba(193,155,48,0.10)",
        }}
      >
        <div className="px-5 py-3 flex items-center justify-center">
          <img
            src="/sponsors/coco-salons.svg"
            alt="Coco Salons — Hair, Beauty Salon & Nail Studio"
            className="w-full h-auto"
            style={{ maxWidth: 300 }}
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
}

export default function VisitorSuccess() {
  const { qrId } = useParams();
  const [sending, setSending] = useState(false);
  const [info, setInfo] = useState(null);
  const [settings, setSettings] = useState({});
  const qrUrl = `${API}/visitors/qr/${qrId}.png`;
  const qrPreviewUrl = `${qrUrl}?plain=1`;

  useEffect(() => {
    api.get(`/visitors/by-qr/${qrId}`).then((r) => setInfo(r.data?.visitor || null)).catch(() => {});
    api.get(`/settings`).then((r) => setSettings(r.data || {})).catch(() => {});
  }, [qrId]);

  const download = async () => {
    try {
      const blob = await (await fetch(qrUrl)).blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `rama-bazaar-qr.png`;
      a.click();
    } catch { toast.error("Could not download QR"); }
  };

  const share = async () => {
    try {
      if (navigator.canShare) {
        const res = await fetch(qrUrl);
        const blob = await res.blob();
        const file = new File([blob], `rama-bazaar-qr.png`, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "Rama Bazaar 1.0 — My Pass" });
          return;
        }
      }
      await navigator.share?.({ title: "Rama Bazaar 1.0", url: window.location.href });
    } catch (err) {
      console.debug("Visitor pass share:", err);
    }
  };

  const sendWa = async () => {
    setSending(true);
    try {
      const r = await api.post(`/visitors/send-whatsapp/${qrId}`);
      if (r.data?.result?.skipped) toast("WhatsApp delivery is not configured yet — admin can enable it.");
      else toast.success("WhatsApp message dispatched");
    } catch { toast.error("Could not send"); }
    finally { setSending(false); }
  };

  const eventDate = (() => {
    const s = settings?.start_date || "";
    const e = settings?.end_date || "";
    if (s && e && s !== e) return `${s} – ${e}`;
    return s || e || "";
  })();
  const eventVenue = settings?.venue || "";

  return (
    <div className="page-pad" data-testid="visitor-success-page">
      <TopBar back />

      <TitleSponsorBand />

      <div className="max-w-xl mx-auto px-6 pt-6 pb-12">
        <div className="text-center">
          <div className="eyebrow" style={{ color: "#b2873d" }}>Confirmed</div>
          <h1 className="font-serif-display text-3xl sm:text-4xl mt-2 leading-tight">Your pass is ready.</h1>
          <p className="mt-2 text-sm" style={{ color: "#3b3b46" }}>
            Carry this QR to the venue for instant check-in.
          </p>
        </div>

        {/* PASS CARD — luxe ticket */}
        <div className="mt-8 mx-auto" style={{ maxWidth: 380 }} data-testid="visitor-pass-card">
          <div
            className="rounded-2xl overflow-hidden relative"
            style={{
              background: "linear-gradient(180deg, #ffffff 0%, #faf7ee 100%)",
              border: "1px solid rgba(178,135,61,0.45)",
              boxShadow: "0 24px 60px -28px rgba(27,25,75,0.45), 0 2px 0 rgba(255,255,255,0.6) inset",
            }}
          >
            {/* top gold bar */}
            <div style={{ height: 6, background: "linear-gradient(90deg,#b2873d,#e7c87a,#b2873d)" }} />

            <div className="px-5 pt-5 pb-4 text-center">
              <div className="eyebrow" style={{ color: "#b2873d", fontSize: 10 }}>Visitor Pass</div>
              <div className="font-serif-display text-xl mt-1" style={{ color: "#1f1f27" }}>
                Rama Bazaar <span style={{ color: "#b2873d" }}>1.0</span>
              </div>
              {info?.full_name && (
                <div className="mt-3 font-serif-display text-2xl" style={{ color: "#1b194b" }}>
                  {info.full_name}
                </div>
              )}
              {info?.mobile && (
                <div className="mt-0.5 text-xs tracking-luxe uppercase" style={{ color: "#7a7868" }}>
                  +91 {info.mobile}
                </div>
              )}
              {info?.is_lvb_member && info?.lvb_chapter && (
                <div className="mt-3 inline-block px-3 py-1 rounded-full text-[11px] uppercase tracking-luxe"
                     style={{ background: "rgba(178,135,61,0.10)", color: "#b2873d", border: "1px solid rgba(178,135,61,0.35)" }}>
                  LVB · {info.lvb_chapter} Chapter
                </div>
              )}
            </div>

            {/* perforation */}
            <div className="relative" style={{ height: 18 }}>
              <div className="absolute inset-x-5 top-1/2" style={{ height: 1, background: "repeating-linear-gradient(90deg, rgba(178,135,61,0.45) 0 6px, transparent 6px 12px)" }} />
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full" style={{ background: "#f8f7f4", border: "1px solid rgba(178,135,61,0.35)" }} />
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full" style={{ background: "#f8f7f4", border: "1px solid rgba(178,135,61,0.35)" }} />
            </div>

            {/* QR */}
            <div className="px-5 pb-5 flex flex-col items-center">
              <div className="rounded-lg p-3" style={{ background: "#fbf8f0", border: "1px solid rgba(178,135,61,0.25)" }}>
                <img
                  data-testid="visitor-qr-img"
                  src={qrPreviewUrl}
                  alt="Your QR pass"
                  className="w-56 h-56 sm:w-60 sm:h-60 object-contain"
                />
              </div>
              <div className="mt-3 text-[10px] uppercase tracking-luxe" style={{ color: "#7a7868" }}>
                Scan at venue · {qrId.slice(0, 6).toUpperCase()}
              </div>
              {(eventDate || eventVenue) && (
                <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: "#3b3b46" }}>
                  {eventDate && (
                    <span className="inline-flex items-center gap-1.5"><Calendar size={12} style={{ color: "#b2873d" }} />{eventDate}</span>
                  )}
                  {eventVenue && (
                    <span className="inline-flex items-center gap-1.5"><MapPin size={12} style={{ color: "#b2873d" }} />{eventVenue}</span>
                  )}
                </div>
              )}

              {/* Tech Partner credit inside the pass */}
              <div className="mt-5 pt-4 w-full flex flex-col items-center"
                   style={{ borderTop: "1px solid rgba(178,135,61,0.20)" }}>
                <div className="text-[9px] uppercase tracking-luxe" style={{ color: "#7a7868" }}>
                  Technology Partner
                </div>
                <img src="/partners/rxt.png" alt="Rapid Express Technologies"
                     className="mt-1.5 h-7 w-auto opacity-90" loading="lazy"/>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 grid grid-cols-1 gap-3 max-w-sm mx-auto">
          <button data-testid="visitor-download" onClick={download} className="btn-gold">
            <Download size={14}/> Download QR
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button data-testid="visitor-share" onClick={share} className="btn-outline-gold">
              <Share2 size={14}/> Share
            </button>
            <button data-testid="visitor-wa" onClick={sendWa} disabled={sending} className="btn-outline-gold">
              <MessageCircle size={14}/> {sending ? "Sending…" : "WhatsApp"}
            </button>
          </div>
        </div>

        <Link to="/" className="mt-8 block text-center eyebrow" style={{ color: "#7a7868" }}>
          Back to home →
        </Link>
      </div>
    </div>
  );
}
