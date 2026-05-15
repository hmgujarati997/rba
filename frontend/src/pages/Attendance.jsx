import React, { useEffect, useRef, useState } from "react";
import TopBar from "../components/TopBar";
import api, { formatError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";

export default function Attendance() {
  const { role } = useAuth();
  const [last, setLast] = useState(null);
  const [manual, setManual] = useState("");
  const [stats, setStats] = useState({ total: 0, present: 0, pending: 0 });
  const scannerRef = useRef(null);
  const html5Ref = useRef(null);

  const loadStats = () => api.get("/attendance/stats").then((r) => setStats(r.data)).catch(() => {});

  useEffect(() => { loadStats(); }, []);

  useEffect(() => {
    if (role !== "admin") return;
    let mounted = true;
    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!mounted) return;
      const id = "qr-reader-region";
      const el = document.getElementById(id);
      if (!el) return;
      const scanner = new Html5Qrcode(id, /* verbose */ false);
      html5Ref.current = scanner;
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: { width: 220, height: 220 } },
          async (text) => {
            try {
              const r = await api.post("/attendance/scan", { qr_id: text });
              setLast({ ...r.data, ts: Date.now() });
              loadStats();
            } catch (err) { toast.error(formatError(err.response?.data?.detail) || "Scan failed"); }
          },
          () => {}
        );
      } catch (e) {
        toast.error("Camera permission denied or not available");
      }
    })();
    return () => {
      mounted = false;
      try { html5Ref.current?.stop().then(() => html5Ref.current?.clear()); } catch {}
    };
  }, [role]);

  const manualMark = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post("/attendance/manual", { mobile: manual });
      setLast({ ...r.data, ts: Date.now() });
      setManual("");
      loadStats();
    } catch (err) { toast.error(formatError(err.response?.data?.detail) || "Not found"); }
  };

  if (role !== "admin") return (
    <div className="page-pad"><TopBar back/><div className="max-w-xl mx-auto p-6 text-center">
      <div className="eyebrow">Restricted</div>
      <p className="mt-3 font-serif-display text-2xl">Attendance is for event staff only.</p>
    </div></div>
  );

  return (
    <div className="page-pad" data-testid="attendance-page">
      <TopBar back title="Attendance" />
      <div className="max-w-xl mx-auto px-6 pt-6 pb-16">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Total" value={stats.total}/>
          <Stat label="Present" value={stats.present} accent/>
          <Stat label="Pending" value={stats.pending}/>
        </div>

        <div className="mt-8 card-luxe overflow-hidden">
          <div className="px-5 pt-4 eyebrow">QR Scanner</div>
          <div id="qr-reader-region" ref={scannerRef} className="w-full aspect-square bg-[#efeae0]" />
        </div>

        <form onSubmit={manualMark} className="mt-8">
          <div className="eyebrow mb-2">Manual Entry</div>
          <div className="flex gap-2">
            <input data-testid="att-manual-mobile" className="input-luxe" placeholder="Mobile" value={manual} onChange={(e) => setManual(e.target.value)} inputMode="numeric" required/>
            <button data-testid="att-manual-submit" className="btn-gold">Mark</button>
          </div>
        </form>

        {last && (
          <div className="mt-8 card-luxe p-5" data-testid="att-last">
            <div className="eyebrow" style={{ color: last.already ? "#9a6b14" : "#1f7a4d" }}>{last.already ? "Already Present" : "Just Checked In"}</div>
            <div className="font-serif-display text-2xl mt-1">{last.visitor?.full_name}</div>
            <div className="text-sm" style={{ color: "#7a7868" }}>{last.visitor?.mobile} · {last.visitor?.city || ""}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="card-luxe p-4 text-center">
      <div className="eyebrow">{label}</div>
      <div className="font-serif-display text-3xl mt-1" style={{ color: accent ? "#b2873d" : "#1f1f27" }}>{value}</div>
    </div>
  );
}
