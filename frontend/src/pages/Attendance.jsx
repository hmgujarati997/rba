import React, { useEffect, useRef, useState } from "react";
import TopBar from "../components/TopBar";
import api, { formatError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, Upload, RefreshCw } from "lucide-react";

export default function Attendance() {
  const { role, logout } = useAuth();
  const nav = useNavigate();
  const [last, setLast] = useState(null);
  const [manual, setManual] = useState("");
  const [stats, setStats] = useState({ total: 0, present: 0, pending: 0 });
  const [camErr, setCamErr] = useState("");
  const [cameras, setCameras] = useState([]);
  const [activeCam, setActiveCam] = useState(null);
  const scannerRef = useRef(null);
  const html5Ref = useRef(null);
  const isStaff = role === "admin" || role === "gate";

  const loadStats = () => api.get("/attendance/stats").then((r) => setStats(r.data)).catch(() => {});

  useEffect(() => { if (isStaff) loadStats(); }, [isStaff]);

  const handleScan = async (text) => {
    if (!text) return;
    try {
      const r = await api.post("/attendance/scan", { qr_id: text });
      setLast({ ...r.data, ts: Date.now() });
      loadStats();
    } catch (err) {
      toast.error(formatError(err.response?.data?.detail) || "Scan failed");
    }
  };

  const startScanner = async (camId = null) => {
    setCamErr("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      // teardown any previous instance
      try { await html5Ref.current?.stop(); } catch { /* ignore */ }
      try { html5Ref.current?.clear(); } catch { /* ignore */ }

      const id = "qr-reader-region";
      const el = document.getElementById(id);
      if (!el) return;
      const scanner = new Html5Qrcode(id, /* verbose */ false);
      html5Ref.current = scanner;

      // Discover and remember cameras so the user can switch
      let pickedCam = camId;
      try {
        const list = await Html5Qrcode.getCameras();
        setCameras(list || []);
        if (!pickedCam && list && list.length) {
          // prefer a back-facing camera if available
          const back = list.find((c) => /back|rear|environment/i.test(c.label || ""));
          pickedCam = (back || list[list.length - 1]).id;
        }
      } catch { /* fallback handled below */ }

      const cameraSpec = pickedCam ? pickedCam : { facingMode: "environment" };
      // Dynamic qrbox — scales to 70% of the smaller side of the camera frame, capped at 480px
      const qrbox = (viewW, viewH) => {
        const minSide = Math.min(viewW, viewH);
        const size = Math.max(220, Math.min(480, Math.floor(minSide * 0.7)));
        return { width: size, height: size };
      };
      await scanner.start(
        cameraSpec,
        { fps: 12, qrbox, aspectRatio: 1.0 },
        handleScan,
        () => {}
      );
      setActiveCam(pickedCam || null);
    } catch (e) {
      const msg = e?.message || String(e);
      setCamErr(msg);
      toast.error("Camera could not start — see scanner panel for details");
    }
  };

  useEffect(() => {
    if (!isStaff) return;
    startScanner();
    return () => {
      try { html5Ref.current?.stop().then(() => html5Ref.current?.clear()); } catch (err) { console.debug("Scanner teardown:", err); }
    };
  }, [isStaff]);

  const manualMark = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post("/attendance/manual", { mobile: manual });
      setLast({ ...r.data, ts: Date.now() });
      setManual("");
      loadStats();
    } catch (err) { toast.error(formatError(err.response?.data?.detail) || "Not found"); }
  };

  const onUploadFile = async (file) => {
    if (!file) return;
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const tmpId = "qr-file-temp";
      // ensure temp element exists
      let tmp = document.getElementById(tmpId);
      if (!tmp) {
        tmp = document.createElement("div");
        tmp.id = tmpId;
        tmp.style.display = "none";
        document.body.appendChild(tmp);
      }
      const inst = new Html5Qrcode(tmpId, /* verbose */ false);
      const text = await inst.scanFile(file, /* showImage */ false);
      await inst.clear();
      handleScan(text);
    } catch (err) {
      toast.error("Could not read QR from image. Try a clearer photo.");
      console.debug(err);
    }
  };

  const onGateLogout = () => {
    logout();
    nav("/gate/login", { replace: true });
  };

  if (!isStaff) return (
    <div className="page-pad"><TopBar back/><div className="max-w-xl mx-auto p-6 text-center">
      <div className="eyebrow">Restricted</div>
      <p className="mt-3 font-serif-display text-2xl">Attendance is for event staff only.</p>
    </div></div>
  );

  return (
    <div className="page-pad" data-testid="attendance-page">
      {role === "admin" ? (
        <TopBar back title="Attendance" />
      ) : (
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(178,135,61,0.2)" }}>
          <div>
            <div className="eyebrow" style={{ fontSize: 10 }}>Gate Scanner</div>
            <div className="font-serif-display text-xl" style={{ color: "#1B194B" }}>Rama Bazaar 1.0</div>
          </div>
          <button onClick={onGateLogout} data-testid="gate-logout-btn" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-luxe" style={{ color: "#9a4444" }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      )}
      <div className="max-w-xl mx-auto px-6 pt-6 pb-16">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Total" value={stats.total}/>
          <Stat label="Present" value={stats.present} accent/>
          <Stat label="Pending" value={stats.pending}/>
        </div>

        <div className="mt-8 card-luxe overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4">
            <div className="eyebrow">QR Scanner</div>
            <div className="flex items-center gap-2">
              {cameras.length > 1 && (
                <select
                  value={activeCam || ""}
                  onChange={(e) => startScanner(e.target.value)}
                  data-testid="cam-picker"
                  className="text-xs"
                  style={{ background: "#fbf8f0", border: "1px solid #d8bc84", color: "#1B194B", padding: "4px 8px", borderRadius: 999, maxWidth: 180 }}
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>{c.label || `Camera ${c.id.slice(0, 6)}`}</option>
                  ))}
                </select>
              )}
              <button
                onClick={() => startScanner(activeCam)}
                data-testid="cam-restart-btn"
                aria-label="Restart camera"
                className="inline-flex items-center gap-1 text-xs uppercase tracking-luxe"
                style={{ color: "#b2873d", border: "1px solid #d8bc84", padding: "4px 10px", borderRadius: 999 }}
              >
                <RefreshCw size={12} /> Restart
              </button>
            </div>
          </div>
          <div id="qr-reader-region" ref={scannerRef} className="w-full aspect-square bg-[#efeae0]" />
          {camErr && (
            <div className="px-5 py-3 text-xs" style={{ color: "#9a4444", background: "#fff5f3", borderTop: "1px solid #f1d8d0" }} data-testid="cam-error">
              Camera error: {camErr}. Use the &ldquo;Upload QR image&rdquo; option below or enter mobile manually.
            </div>
          )}
          <div className="px-5 py-3" style={{ background: "#fbf8f0", borderTop: "1px solid rgba(178,135,61,0.25)" }}>
            <p className="text-xs leading-relaxed" style={{ color: "#7a7868" }}>
              Hold the visitor pass steady, fill the highlighted box on screen. If your laptop camera can&rsquo;t read tiny QRs, upload a photo instead:
            </p>
            <label className="mt-2 btn-outline-gold inline-flex items-center gap-2 cursor-pointer text-xs">
              <Upload size={14}/> Upload QR image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                data-testid="qr-upload-input"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadFile(f); e.target.value = ""; }}
              />
            </label>
          </div>
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
