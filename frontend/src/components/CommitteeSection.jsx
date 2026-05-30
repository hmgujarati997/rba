import React, { useEffect, useState } from "react";
import api, { BACKEND_URL } from "../lib/api";

function absUrl(u) { if (!u) return ""; return u.startsWith("http") ? u : `${BACKEND_URL}${u}`; }

function initials(name) {
  return (name || "").split(/\s+/).filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("");
}

function MemberCard({ m, size = "md" }) {
  // size: "lg" (chair / supported), "md" (management grid)
  const photoSize = size === "lg" ? "w-28 h-28" : "w-20 h-20";
  const nameCls = size === "lg" ? "font-serif-display text-xl sm:text-2xl" : "font-serif-display text-base";
  return (
    <div
      data-testid={`committee-card-${m.id}`}
      className="card-luxe p-5 flex flex-col items-center text-center transition-all hover:shadow-gold"
    >
      <div
        className={`${photoSize} rounded-full overflow-hidden border-2 bg-[#efeae0]`}
        style={{ borderColor: "#d8bc84", boxShadow: "0 6px 16px -8px rgba(27,25,75,0.35)" }}
      >
        {m.photo_url ? (
          <img
            src={absUrl(m.photo_url)}
            alt={m.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-serif-display"
               style={{ color: "#b2873d", fontSize: size === "lg" ? 32 : 22 }}>
            {initials(m.name)}
          </div>
        )}
      </div>
      <div className={`mt-4 leading-tight ${nameCls}`} style={{ color: "#1f1f27" }}>{m.name}</div>
      {m.role && (
        <div className="mt-1.5 text-xs sm:text-sm" style={{ color: "#7a7868", letterSpacing: "0.04em" }}>
          {m.role}
        </div>
      )}
      {m.logo_url && (
        <div className="mt-3 pt-3 border-t w-full flex items-center justify-center"
             style={{ borderColor: "rgba(178,135,61,0.20)" }}>
          <img
            src={absUrl(m.logo_url)}
            alt={`${m.name} company logo`}
            className="object-contain"
            style={{ maxHeight: size === "lg" ? 36 : 28, maxWidth: "85%" }}
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}

function GroupLabel({ children }) {
  return (
    <div className="flex items-center gap-3 justify-center mt-12 first:mt-0 mb-6">
      <span style={{ height: 1, width: 28, background: "#b2873d" }} />
      <span className="eyebrow" style={{ color: "#b2873d", fontSize: 10 }}>{children}</span>
      <span style={{ height: 1, width: 28, background: "#b2873d" }} />
    </div>
  );
}

export default function CommitteeSection() {
  const [data, setData] = useState({ rama_bazaar: [], management: [], supported_by: [] });

  useEffect(() => {
    api.get("/committee").then((r) => setData(r.data || {})).catch(() => {});
  }, []);

  const total = (data.rama_bazaar?.length || 0) + (data.management?.length || 0) + (data.supported_by?.length || 0);
  if (!total) return null;

  return (
    <section className="max-w-xl mx-auto px-6 py-16" data-testid="committee-section">
      <div className="eyebrow text-center">The Team</div>
      <h2 className="font-serif-display text-3xl sm:text-4xl mt-3 text-center">
        The committee behind <span style={{ color: "#b2873d" }}>Rama Bazaar 1.0</span>.
      </h2>
      <p className="mt-4 text-sm sm:text-base leading-relaxed text-center" style={{ color: "#3b3b46" }}>
        A small, devoted group of LVB Rama members who have built this experience for the community.
      </p>

      {data.rama_bazaar?.length > 0 && (
        <>
          <GroupLabel>Rama Bazaar Committee</GroupLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.rama_bazaar.map((m) => <MemberCard key={m.id} m={m} size="lg" />)}
          </div>
        </>
      )}

      {data.management?.length > 0 && (
        <>
          <GroupLabel>Management Committee</GroupLabel>
          <div className="grid grid-cols-2 gap-3">
            {data.management.map((m) => <MemberCard key={m.id} m={m} />)}
          </div>
        </>
      )}

      {data.supported_by?.length > 0 && (
        <>
          <GroupLabel>Supported By</GroupLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.supported_by.map((m) => <MemberCard key={m.id} m={m} size="lg" />)}
          </div>
        </>
      )}
    </section>
  );
}
