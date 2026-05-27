import React, { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import api, { formatError, BACKEND_URL, API } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { LogOut, Download, Share2, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

function absUrl(u) { if (!u) return ""; return u.startsWith("http") ? u : `${BACKEND_URL}${u}`; }

export default function ExhibitorDashboard() {
  const { user, logout, setAuth } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    api.get("/auth/me").then((r) => { setForm(r.data.user); setAuth({ ready: true, role: r.data.role, user: r.data.user }); }).catch(() => {});
  }, [setAuth]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadFile = async (file, field) => {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    update(field, data.url);
    toast.success("Uploaded");
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const payload = { ...form };
      delete payload.id; delete payload.mobile; delete payload.approved; delete payload.featured; delete payload.hidden; delete payload.created_at;
      await api.put("/exhibitors/me", payload);
      toast.success("Profile saved");
    } catch (err) { toast.error(formatError(err.response?.data?.detail) || "Save failed"); }
    finally { setSaving(false); }
  };

  if (!form) return <div className="page-pad"><TopBar back /><div className="max-w-xl mx-auto p-6">Loading…</div></div>;

  return (
    <div className="page-pad" data-testid="exhibitor-dashboard">
      <TopBar back right={<button data-testid="ex-logout" onClick={() => { logout(); }} className="text-xs uppercase tracking-luxe inline-flex items-center gap-2"><LogOut size={14}/> Logout</button>} />
      <div className="max-w-xl mx-auto px-6 pt-8 pb-16">
        <div className="eyebrow">Welcome{form.member_name ? `, ${form.member_name.split(" ")[0]}` : ""}</div>
        <h1 className="font-serif-display text-4xl mt-3">Your exhibitor stall</h1>
        <div className="mt-3 text-sm" style={{ color: form.approved ? "#1f7a4d" : "#9a6b14" }}>
          Status: {form.approved ? "Approved & live in the roster" : "Pending admin approval"}
        </div>

        <div className="mt-8 flex gap-3">
          <button data-testid="ex-preview" onClick={() => setPreview(!preview)} className="btn-outline-gold">{preview ? "Edit" : "Preview Card"}</button>
          <button data-testid="ex-save" onClick={save} disabled={saving} className="btn-gold">{saving ? "Saving…" : "Save Changes"}</button>
        </div>

        {preview ? (
          <PreviewCard ex={form} />
        ) : (
          <div className="mt-8 space-y-5">
            <Row k="member_name" v={form} u={update} label="Member Name" />
            <Row k="position" v={form} u={update} label="Position / Designation" />
            <Row k="business_name" v={form} u={update} label="Business Name" />
            <Row k="category" v={form} u={update} label="Category" />
            <Row k="whatsapp" v={form} u={update} label="WhatsApp" />
            <Row k="email" v={form} u={update} label="Email" />
            <Area k="description" v={form} u={update} label="Description" />
            <Area k="products_services" v={form} u={update} label="Products / Services" />
            <FilePick label="Logo" value={form.logo_url} onPick={(f) => uploadFile(f, "logo_url")} />
            <FilePick label="Profile Photo" value={form.profile_photo_url} onPick={(f) => uploadFile(f, "profile_photo_url")} />
            <Row k="instagram" v={form} u={update} label="Instagram" />
            <Row k="facebook" v={form} u={update} label="Facebook" />
            <Row k="linkedin" v={form} u={update} label="LinkedIn" />
            <Row k="website" v={form} u={update} label="Website" />
            <Row k="address" v={form} u={update} label="Address" />
            <Row k="maps_link" v={form} u={update} label="Google Maps Link" />
          </div>
        )}

        {/* SOCIAL POST GENERATOR */}
        <SocialPostCard form={form} save={save} />
      </div>
    </div>
  );
}

function SocialPostCard({ form, save }) {
  const [busy, setBusy] = useState(false);
  const [cacheKey, setCacheKey] = useState(0);
  const [previewUrl, setPreviewUrl] = useState("");
  const token = typeof window !== "undefined" ? localStorage.getItem("rama_token") : null;

  const refreshPreview = React.useCallback(async () => {
    try {
      setBusy(true);
      const res = await fetch(`${API}/exhibitors/me/social-post.png?ts=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob); });
    } catch (e) {
      toast.error("Could not build post — please retry");
    } finally { setBusy(false); }
  }, [token]);

  useEffect(() => { refreshPreview(); /* eslint-disable-next-line */ }, [cacheKey]);

  const onSaveAndRefresh = async () => { await save(); setCacheKey((k) => k + 1); };

  const download = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `rama-bazaar-${(form.member_name || "post").replace(/\s+/g, "-")}.png`;
    a.click();
  };

  const shareWA = async () => {
    if (!previewUrl) return;
    try {
      const blob = await (await fetch(previewUrl)).blob();
      const file = new File([blob], "rama-bazaar.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "I am participating in Rama Bazaar 1.0" });
        return;
      }
    } catch {}
    const text = encodeURIComponent("I am participating in Rama Bazaar 1.0 — join us!");
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="mt-10 card-luxe p-5" data-testid="social-post-card">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="eyebrow" style={{ color: "#b2873d" }}>Share Your Participation</div>
          <h3 className="font-serif-display text-2xl mt-1">Download your social post</h3>
          <p className="mt-1 text-xs" style={{ color: "#7a7868" }}>
            Auto-generated from your profile. Update your <b>Position</b>, <b>Photo</b> and details above, save, then refresh.
          </p>
        </div>
        <button onClick={onSaveAndRefresh} className="btn-outline-gold" disabled={busy} data-testid="social-refresh">
          {busy ? "Updating…" : "Save & Refresh"}
        </button>
      </div>

      <div className="mt-5 rounded-xl overflow-hidden border" style={{ borderColor: "rgba(178,135,61,0.30)", background: "#fbf8f0" }}>
        {previewUrl ? (
          <img src={previewUrl} alt="Your Rama Bazaar 1.0 social post" className="w-full h-auto" />
        ) : (
          <div className="aspect-square flex items-center justify-center text-sm" style={{ color: "#7a7868" }}>
            {busy ? "Building your post…" : "Preview will appear here"}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={download} disabled={!previewUrl} className="btn-gold" data-testid="social-download">
          <Download size={14} /> Download Post
        </button>
        <button onClick={shareWA} disabled={!previewUrl} className="btn-outline-gold" data-testid="social-share">
          <MessageCircle size={14} /> Share on WhatsApp
        </button>
      </div>
      <p className="mt-3 text-xs text-center" style={{ color: "#7a7868" }}>
        Tip — upload a portrait photo with your face centred for the cleanest result.
      </p>
    </div>
  );
}

function Row({ k, v, u, label }) {
  return (
    <div>
      <label className="label-luxe">{label}</label>
      <input data-testid={`dash-${k}`} className="input-luxe" value={v[k] || ""} onChange={(e) => u(k, e.target.value)}/>
    </div>
  );
}
function Area({ k, v, u, label }) {
  return (
    <div>
      <label className="label-luxe">{label}</label>
      <textarea data-testid={`dash-${k}`} rows={4} className="input-luxe resize-none" value={v[k] || ""} onChange={(e) => u(k, e.target.value)}/>
    </div>
  );
}
function FilePick({ label, value, onPick }) {
  return (
    <div>
      <label className="label-luxe">{label}</label>
      {value && <img src={absUrl(value)} alt="" className="mt-2 mb-2 max-h-32 object-contain rounded-lg border" style={{ borderColor: "#d8bc84" }}/>}
      <input type="file" accept="image/*" className="block text-sm" onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
    </div>
  );
}

function PreviewCard({ ex }) {
  return (
    <div className="mt-8">
      <div className="eyebrow mb-3">Live Preview</div>
      <div className="card-luxe overflow-hidden">
        <div
          className="flex items-center justify-center border-b"
          style={{ background: "#fbf8f0", borderColor: "rgba(178,135,61,0.18)", height: 150, padding: "20px 28px" }}
        >
          {ex.logo_url ? (
            <img src={absUrl(ex.logo_url)} alt={ex.business_name} style={{ maxHeight: "100%", maxWidth: "78%", objectFit: "contain" }} />
          ) : (
            <div className="font-serif-display" style={{ fontSize: 64, color: "#b2873d" }}>{(ex.business_name || "R")[0]}</div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-[#efeae0] border flex items-center justify-center" style={{ borderColor: "#d8bc84" }}>
              {ex.profile_photo_url ? <img src={absUrl(ex.profile_photo_url)} className="w-full h-full object-cover" alt=""/> : <span className="font-serif-display text-xl" style={{ color: "#b2873d" }}>{(ex.member_name || ex.business_name || "R")[0]}</span>}
            </div>
            <div>
              <div className="eyebrow">{ex.category}</div>
              <div className="font-serif-display text-2xl">{ex.business_name}</div>
              <div className="text-xs" style={{ color: "#7a7868" }}>{ex.member_name}</div>
            </div>
          </div>
          {ex.description && <p className="mt-4 text-sm leading-relaxed" style={{ color: "#3b3b46" }}>{ex.description}</p>}
        </div>
      </div>
    </div>
  );
}
