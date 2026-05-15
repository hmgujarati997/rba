import React, { useEffect, useRef } from "react";
import api, { BACKEND_URL } from "../lib/api";

function absUrl(u) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return `${BACKEND_URL}${u}`;
}

export default function SponsorAdCard({ ad, inline = true }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ad?.id) return;
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          api.post(`/sponsor-ads/${ad.id}/impression`).catch(() => {});
          ob.disconnect();
        }
      });
    }, { threshold: 0.4 });
    ob.observe(el);
    return () => ob.disconnect();
  }, [ad?.id]);

  if (!ad) return null;
  const click = () => api.post(`/sponsor-ads/${ad.id}/click`).catch(() => {});
  const isVideo = ad.media_type === "video";
  return (
    <a
      ref={ref}
      data-testid={`sponsor-ad-${ad.id}`}
      href={ad.link || "#"}
      target={ad.link ? "_blank" : undefined}
      rel="noreferrer"
      onClick={click}
      className="block card-luxe overflow-hidden animate-fadeUp"
    >
      <div className="flex items-center justify-between px-5 pt-4">
        <span className="eyebrow">Sponsored</span>
        <span className="text-xs" style={{ color: "#7a7868", letterSpacing: "0.18em" }}>{ad.name}</span>
      </div>
      <div className={`mt-3 ${inline ? "aspect-[16/9]" : "aspect-[3/1]"} bg-[#efeae0] overflow-hidden`}>
        {isVideo ? (
          <video src={absUrl(ad.media_url)} className="w-full h-full object-cover" muted loop playsInline preload="metadata" controls={false} onMouseOver={(e) => e.currentTarget.play().catch(()=>{})} onMouseOut={(e) => e.currentTarget.pause()} />
        ) : (
          <img loading="lazy" src={absUrl(ad.media_url)} alt={ad.name} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="px-5 py-3 flex items-center justify-end">
        <span className="text-xs uppercase tracking-luxe" style={{ color: "#b2873d" }}>Visit →</span>
      </div>
    </a>
  );
}
