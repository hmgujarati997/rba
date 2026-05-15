import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import api, { BACKEND_URL } from "../lib/api";

function absUrl(u) { if (!u) return ""; return u.startsWith("http") ? u : `${BACKEND_URL}${u}`; }

export default function PopupBanner() {
  const [ad, setAd] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const shown = sessionStorage.getItem("rama_popup_shown");
    if (shown) return;
    api.get("/roster/sponsors").then((r) => {
      const popups = r.data?.popup || [];
      if (popups.length) {
        setAd(popups[0]);
        setTimeout(() => setOpen(true), 600);
        api.post(`/sponsor-ads/${popups[0].id}/impression`).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const close = () => {
    sessionStorage.setItem("rama_popup_shown", "1");
    setOpen(false);
  };

  if (!open || !ad) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fadeIn" style={{ background: "rgba(31,31,39,0.55)" }} onClick={close}>
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden card-luxe animate-fadeUp" onClick={(e) => e.stopPropagation()} data-testid="popup-banner">
        <div className="flex items-center justify-between px-5 pt-4">
          <span className="eyebrow">Title Sponsor</span>
          <button data-testid="popup-close" onClick={close} className="w-8 h-8 rounded-full flex items-center justify-center border" style={{ borderColor: "#d8bc84" }} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <a href={ad.link || "#"} target={ad.link ? "_blank" : undefined} rel="noreferrer" onClick={() => api.post(`/sponsor-ads/${ad.id}/click`).catch(()=>{})}>
          <div className="aspect-[4/5] bg-[#efeae0] mt-3 overflow-hidden">
            {ad.media_type === "video" ? (
              <video src={absUrl(ad.media_url)} className="w-full h-full object-cover" autoPlay muted loop playsInline />
            ) : (
              <img src={absUrl(ad.media_url)} alt={ad.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="px-5 py-4 text-center">
            <div className="font-serif-display text-2xl" style={{ color: "#1f1f27" }}>{ad.name}</div>
            {ad.link && <div className="mt-2 eyebrow" style={{ color: "#b2873d" }}>Tap to explore →</div>}
          </div>
        </a>
      </div>
    </div>
  );
}
