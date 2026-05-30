import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import TopBar from "../components/TopBar";
import api, { API } from "../lib/api";
import { Download, Share2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function VisitorSuccess() {
  const { qrId } = useParams();
  const [sending, setSending] = useState(false);
  const qrUrl = `${API}/visitors/qr/${qrId}.png`;

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
      // User cancelled share or Web Share unsupported — non-fatal
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

  return (
    <div className="page-pad" data-testid="visitor-success-page">
      <TopBar back />
      <div className="max-w-xl mx-auto px-6 pt-8 pb-16 text-center">
        <div className="eyebrow">Confirmed</div>
        <h1 className="font-serif-display text-4xl mt-3">Your pass is ready.</h1>
        <p className="mt-3 text-sm" style={{ color: "#3b3b46" }}>Carry this QR to the venue for instant check-in.</p>

        <div className="mt-8 card-luxe p-6 inline-block mx-auto">
          <img data-testid="visitor-qr-img" src={qrUrl} alt="QR" className="w-64 h-64 object-contain" />
          <div className="mt-2 eyebrow" style={{ color: "#b2873d" }}>RAMA BAZAAR 1.0 · PASS</div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 max-w-sm mx-auto">
          <button data-testid="visitor-download" onClick={download} className="btn-gold"><Download size={14}/> Download QR</button>
          <button data-testid="visitor-share" onClick={share} className="btn-outline-gold"><Share2 size={14}/> Share</button>
          <button data-testid="visitor-wa" onClick={sendWa} disabled={sending} className="btn-outline-gold"><MessageCircle size={14}/> {sending ? "Sending…" : "Send via WhatsApp"}</button>
        </div>

        <Link to="/" className="mt-10 inline-block eyebrow" style={{ color: "#7a7868" }}>Back to home →</Link>
      </div>
    </div>
  );
}
