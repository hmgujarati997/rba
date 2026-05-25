import React, { useEffect, useMemo, useState } from "react";
import TopBar from "../components/TopBar";
import { CardSkeleton } from "../components/Skeleton";
import ExhibitorCard from "../components/ExhibitorCard";
import SponsorAdCard from "../components/SponsorAdCard";
import api from "../lib/api";
import { Search } from "lucide-react";

export default function Roster() {
  const [loading, setLoading] = useState(true);
  const [exhibitors, setExhibitors] = useState([]);
  const [ads, setAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/roster", { params: { category: cat, q: q || undefined } });
      setExhibitors(data.exhibitors || []);
      setAds(data.inline_ads || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { api.get("/roster/categories").then((r) => setCategories(r.data || [])); }, []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [cat]);

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [q]);

  // Build interleaved list with sponsor ads
  const items = useMemo(() => {
    const out = [];
    const totalEx = exhibitors.length;
    const totalAds = ads.length;
    if (totalAds === 0 || totalEx === 0) return exhibitors.map((e) => ({ type: "ex", data: e }));
    const interval = Math.max(1, Math.floor(totalEx / (totalAds + 1)));
    let adIdx = 0;
    let sinceLastAd = 0;
    for (let i = 0; i < totalEx; i++) {
      out.push({ type: "ex", data: exhibitors[i] });
      sinceLastAd++;
      const isLast = i === totalEx - 1;
      if (!isLast && adIdx < totalAds && sinceLastAd >= interval) {
        out.push({ type: "ad", data: ads[adIdx] });
        adIdx++;
        sinceLastAd = 0;
      }
    }
    return out;
  }, [exhibitors, ads]);

  return (
    <div className="page-pad" data-testid="roster-page">
      <TopBar back title="Roster" />
      <div className="max-w-xl mx-auto px-5 pt-6">
        <div className="eyebrow">Digital Roster</div>
        <h1 className="font-serif-display text-4xl mt-2">{exhibitors.length} exhibitors. One curated room.</h1>

        <div className="mt-6 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#7a7868" }} />
          <input
            data-testid="roster-search"
            className="input-luxe"
            style={{ paddingLeft: 44 }}
            placeholder="Search business, owner or product"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
          {["all", ...categories].map((c) => (
            <button key={c} data-testid={`cat-${c}`} onClick={() => setCat(c)} className="shrink-0 px-4 py-2 rounded-full border text-xs uppercase tracking-luxe transition-colors" style={{ borderColor: cat === c ? "#b2873d" : "#d8bc84", color: cat === c ? "#f8f7f4" : "#1f1f27", background: cat === c ? "#1f1f27" : "transparent" }}>
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-2.5 pb-10">
          {loading && Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          {!loading && items.length === 0 && (
            <div className="text-center py-20" style={{ color: "#7a7868" }}>
              <div className="eyebrow">No matches</div>
              <p className="mt-2 font-serif-display text-2xl">The roster is empty for this filter.</p>
            </div>
          )}
          {!loading && items.map((it, idx) => it.type === "ex" ? (
            <ExhibitorCard key={`e-${it.data.id}`} exhibitor={it.data} />
          ) : (
            <SponsorAdCard key={`a-${it.data.id}-${idx}`} ad={it.data} />
          ))}
        </div>
      </div>
    </div>
  );
}
