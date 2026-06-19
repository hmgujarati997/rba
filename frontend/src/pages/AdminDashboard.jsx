import React, { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import api, { formatError, API, BACKEND_URL } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { LogOut, Download } from "lucide-react";

function absUrl(u) { if (!u) return ""; return u.startsWith("http") ? u : `${BACKEND_URL}${u}`; }

const TABS = [
  ["overview", "Overview"],
  ["visitors", "Visitors"],
  ["exhibitors", "Exhibitors"],
  ["committee", "Committee"],
  ["members", "Members"],
  ["sponsors", "Sponsors"],
  ["broadcast", "Broadcast"],
  ["settings", "Settings"],
  ["attendance", "Attendance"],
];

export default function AdminDashboard() {
  const { role, logout } = useAuth();
  const nav = useNavigate();
  if (role !== "admin") return <Navigate to="/admin/login" />;

  return (
    <div className="page-pad min-h-screen" data-testid="admin-dashboard">
      <TopBar back title="Admin" right={<button data-testid="admin-logout" onClick={() => { logout(); nav("/"); }} className="text-xs uppercase tracking-luxe inline-flex items-center gap-2"><LogOut size={14}/> Logout</button>} />
      <div className="max-w-6xl mx-auto px-5 pt-6">
        <nav className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {TABS.map(([k, l]) => (
            <NavLink key={k} to={`/admin/${k}`} data-testid={`admin-tab-${k}`} className={({ isActive }) => `px-4 py-2 rounded-full border text-xs uppercase tracking-luxe whitespace-nowrap ${isActive ? "bg-[#1f1f27] text-[#f8f7f4] border-[#1f1f27]" : "text-[#1f1f27]"}`} style={{ borderColor: "#d8bc84" }}>
              {l}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="overview" element={<Overview />} />
            <Route path="visitors" element={<Visitors />} />
            <Route path="exhibitors" element={<Exhibitors />} />
            <Route path="committee" element={<Committee />} />
            <Route path="members" element={<Members />} />
            <Route path="sponsors" element={<Sponsors />} />
            <Route path="broadcast" element={<Broadcast />} />
            <Route path="settings" element={<Settings />} />
            <Route path="attendance" element={<AttendanceRedirect />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function AttendanceRedirect() { return <Navigate to="/attendance" replace />; }

function Overview() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/admin/stats").then((r) => setS(r.data)).catch(() => {}); }, []);
  if (!s) return <div>Loading…</div>;
  const cards = [
    { l: "Total Visitors", v: s.total_visitors },
    { l: "Checked-in", v: s.present_visitors, accent: true },
    { l: "Pending Check-in", v: s.pending_visitors },
    { l: "Exhibitors", v: s.total_exhibitors },
    { l: "Approved", v: s.approved_exhibitors },
    { l: "Paid", v: s.paid_exhibitors, accent: true },
    { l: "Unpaid", v: s.unpaid_exhibitors },
    { l: "Slots Remaining", v: s.remaining_slots },
    { l: "Ad Impressions", v: s.sponsor_impressions },
    { l: "Ad Clicks", v: s.sponsor_clicks },
  ];
  return (
    <div>
      <div className="eyebrow">Overview</div>
      <h2 className="font-serif-display text-3xl mt-2">Event at a glance</h2>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.l} className="card-luxe p-5">
            <div className="eyebrow">{c.l}</div>
            <div className="font-serif-display text-4xl mt-2" style={{ color: c.accent ? "#b2873d" : "#1f1f27" }}>{c.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Visitors() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const load = () => api.get("/admin/visitors").then((r) => setItems(r.data || []));
  useEffect(() => { load(); }, []);
  const filtered = items.filter((v) => !q || [v.full_name, v.mobile, v.business_name, v.city, v.industry].some((x) => (x || "").toLowerCase().includes(q.toLowerCase())));
  const exportCSV = () => {
    const token = localStorage.getItem("rama_token");
    fetch(`${API}/admin/visitors/export.csv`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob()).then((b) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "visitors.csv"; a.click(); });
  };
  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-serif-display text-3xl">Visitors</h2>
        <div className="flex gap-2">
          <input data-testid="visitors-search" className="input-luxe" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button data-testid="visitors-export" onClick={exportCSV} className="btn-outline-gold">Export CSV</button>
        </div>
      </div>
      <div className="mt-6 card-luxe overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left" style={{ background: "#f3eddf" }}>
              <tr>
                {["Name", "Mobile", "Business", "City", "Industry", "Attended", "Created"].map((h) => <th key={h} className="px-3 py-2 eyebrow">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-t" style={{ borderColor: "rgba(178,135,61,0.18)" }}>
                  <td className="px-3 py-2">{v.full_name}</td>
                  <td className="px-3 py-2">{v.mobile}</td>
                  <td className="px-3 py-2">{v.business_name}</td>
                  <td className="px-3 py-2">{v.city}</td>
                  <td className="px-3 py-2">{v.industry}</td>
                  <td className="px-3 py-2" style={{ color: v.attended ? "#1f7a4d" : "#9a6b14" }}>{v.attended ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 text-xs" style={{ color: "#7a7868" }}>{v.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8" style={{ color: "#7a7868" }}>No visitors yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Exhibitors() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all"); // all | unpaid | paid | pending | approved
  const load = () => api.get("/admin/exhibitors").then((r) => setItems(r.data || []));
  useEffect(() => { load(); }, []);
  const toggle = async (id, field, value) => {
    await api.put(`/admin/exhibitors/${id}`, { [field]: value });
    load();
  };
  const togglePaid = async (e) => {
    const next = !e.paid;
    await api.put(`/admin/exhibitors/${e.id}`, { paid: next, paid_at: next ? new Date().toISOString() : null });
    load();
  };
  const del = async (id) => { if (!window.confirm("Delete this exhibitor?")) return; await api.delete(`/admin/exhibitors/${id}`); load(); };
  const reset = async (id) => {
    const np = window.prompt("New password (min 6 chars):"); if (!np) return;
    try { await api.post(`/admin/exhibitors/${id}/reset-password`, { new_password: np }); toast.success("Password reset"); }
    catch (e) { toast.error(formatError(e.response?.data?.detail)); }
  };

  const filtered = items.filter((e) => {
    if (filter === "paid") return !!e.paid;
    if (filter === "unpaid") return !e.paid;
    if (filter === "pending") return !e.approved;
    if (filter === "approved") return !!e.approved;
    return true;
  });
  const counts = {
    all: items.length,
    unpaid: items.filter((e) => !e.paid).length,
    paid: items.filter((e) => !!e.paid).length,
    pending: items.filter((e) => !e.approved).length,
    approved: items.filter((e) => !!e.approved).length,
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-serif-display text-3xl">Exhibitors</h2>
        <div className="flex gap-2 flex-wrap items-center">
          <a
            href={`${API}/admin/exhibitors/export.zip`}
            data-testid="exhibitor-bundle-download"
            onClick={(e) => {
              e.preventDefault();
              toast.info("Preparing bundle…");
              api.get("/admin/exhibitors/export.zip", {
                params: { base: window.location.origin },
                responseType: "blob",
              })
                .then((r) => {
                  const u = URL.createObjectURL(r.data);
                  const a = document.createElement("a");
                  a.href = u;
                  a.download = "rama-bazaar-exhibitors.zip";
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 200);
                  toast.success("Bundle downloaded");
                })
                .catch((err) => toast.error(formatError(err.response?.data?.detail) || "Download failed"));
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs uppercase tracking-luxe"
            style={{ background: "#1B194B", color: "#fbf6e8", border: "1px solid #1B194B" }}
          >
            <Download size={12} /> Download bundle (.zip)
          </a>
          <a
            href={`${API}/admin/exhibitors/badges.zip`}
            data-testid="exhibitor-badges-download"
            onClick={(e) => {
              e.preventDefault();
              toast.info("Rendering badges…");
              api.get("/admin/exhibitors/badges.zip", { responseType: "blob" })
                .then((r) => {
                  const u = URL.createObjectURL(r.data);
                  const a = document.createElement("a");
                  a.href = u;
                  a.download = "rama-bazaar-exhibitor-badges.zip";
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 200);
                  toast.success("Badges downloaded");
                })
                .catch((err) => toast.error(formatError(err.response?.data?.detail) || "Download failed"));
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs uppercase tracking-luxe"
            style={{ background: "#b2873d", color: "#fbf6e8", border: "1px solid #b2873d" }}
          >
            <Download size={12} /> Download badges (.zip)
          </a>
          {[
            ["all", "All"],
            ["unpaid", "Unpaid"],
            ["paid", "Paid"],
            ["pending", "Pending Approval"],
            ["approved", "Approved"],
          ].map(([k, l]) => (
            <button
              key={k}
              data-testid={`exhibitor-filter-${k}`}
              onClick={() => setFilter(k)}
              className="px-3 py-1.5 rounded-full border text-xs uppercase tracking-luxe transition-colors"
              style={{
                borderColor: "#d8bc84",
                background: filter === k ? "#1f1f27" : "transparent",
                color: filter === k ? "#f8f7f4" : "#1f1f27",
              }}
            >
              {l} · {counts[k]}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {filtered.map((e) => (
          <div key={e.id} className="card-luxe p-5 relative" data-testid={`adm-ex-${e.id}`}>
            {/* Payment badge — top-right */}
            <span
              className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs uppercase tracking-luxe font-medium"
              style={
                e.paid
                  ? { background: "#1f7a4d", color: "#f8f7f4", letterSpacing: "0.18em" }
                  : { background: "#fbe7c2", color: "#7a5318", border: "1px solid #d8bc84", letterSpacing: "0.18em" }
              }
              data-testid={`adm-paid-badge-${e.id}`}
            >
              {e.paid ? "Paid" : "Unpaid"}
            </span>

            <div className="flex items-center gap-3 pr-20">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[#efeae0] border" style={{ borderColor: "#d8bc84" }}>
                {e.logo_url ? <img src={absUrl(e.logo_url)} alt="" className="w-full h-full object-cover" /> : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-serif-display text-xl truncate">{e.business_name}</div>
                <div className="text-xs" style={{ color: "#7a7868" }}>{e.member_name} · {e.mobile}</div>
                <div className="text-xs mt-1">{e.category}</div>
                {e.paid && e.paid_at && (
                  <div className="text-xs mt-0.5" style={{ color: "#1f7a4d" }}>Paid on {String(e.paid_at).slice(0, 10)}</div>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-luxe">
              <button onClick={() => togglePaid(e)} data-testid={`adm-toggle-paid-${e.id}`} className="px-3 py-1.5 rounded-full border" style={{ borderColor: e.paid ? "#1f7a4d" : "#d8bc84", background: e.paid ? "#1f7a4d" : "transparent", color: e.paid ? "#f8f7f4" : "#1f1f27" }}>
                {e.paid ? "Mark Unpaid" : "Mark Paid"}
              </button>
              <button onClick={() => toggle(e.id, "approved", !e.approved)} className="px-3 py-1.5 rounded-full border" style={{ borderColor: "#d8bc84", background: e.approved ? "#1f1f27" : "transparent", color: e.approved ? "#f8f7f4" : "#1f1f27" }}>{e.approved ? "Approved" : "Approve"}</button>
              <button onClick={() => toggle(e.id, "featured", !e.featured)} className="px-3 py-1.5 rounded-full border" style={{ borderColor: "#d8bc84", background: e.featured ? "#b2873d" : "transparent", color: e.featured ? "#f8f7f4" : "#1f1f27" }}>{e.featured ? "Featured" : "Feature"}</button>
              <button onClick={() => toggle(e.id, "hidden", !e.hidden)} className="px-3 py-1.5 rounded-full border" style={{ borderColor: "#d8bc84" }}>{e.hidden ? "Unhide" : "Hide"}</button>
              <button onClick={() => reset(e.id)} className="px-3 py-1.5 rounded-full border" style={{ borderColor: "#d8bc84" }}>Reset Pw</button>
              <button onClick={() => del(e.id)} className="px-3 py-1.5 rounded-full border" style={{ borderColor: "#d8bc84", color: "#a3361e" }}>Delete</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-sm" style={{ color: "#7a7868" }}>No exhibitors match this filter.</div>}
      </div>
    </div>
  );
}

function Members() {
  const [items, setItems] = useState([]);
  const [m, setM] = useState(""); const [note, setNote] = useState("");
  const load = () => api.get("/admin/members").then((r) => setItems(r.data || []));
  useEffect(() => { load(); }, []);
  const add = async (e) => { e.preventDefault(); try { await api.post("/admin/members", { mobile: m, note }); setM(""); setNote(""); load(); } catch (err) { toast.error(formatError(err.response?.data?.detail)); } };
  const upload = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const fd = new FormData(); fd.append("file", f);
    try { const { data } = await api.post("/admin/members/bulk", fd, { headers: { "Content-Type": "multipart/form-data" } }); toast.success(`Added ${data.added}, skipped ${data.skipped}`); load(); }
    catch (err) { toast.error(formatError(err.response?.data?.detail)); }
  };
  const del = async (id) => { await api.delete(`/admin/members/${id}`); load(); };
  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-serif-display text-3xl">Allowed Member Numbers</h2>
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border"
          style={{ borderColor: "#d8bc84", background: "#fbf8f0" }}
          data-testid="members-total"
        >
          <span className="eyebrow" style={{ color: "#7a7868", fontSize: 10 }}>Total</span>
          <span className="font-serif-display text-2xl leading-none" style={{ color: "#b2873d" }}>{items.length}</span>
        </div>
      </div>
      <form onSubmit={add} className="mt-6 card-luxe p-5 grid sm:grid-cols-3 gap-3">
        <input data-testid="mem-mobile" className="input-luxe" placeholder="Mobile (10 digits)" value={m} onChange={(e) => setM(e.target.value)} inputMode="numeric" required/>
        <input className="input-luxe" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button data-testid="mem-add" className="btn-gold">Add Member</button>
      </form>
      <div className="mt-4 card-luxe p-5">
        <div className="eyebrow mb-2">Bulk Upload (CSV: mobile, note)</div>
        <input data-testid="mem-bulk" type="file" accept=".csv,text/csv" onChange={upload} />
      </div>
      <div className="mt-6 card-luxe overflow-hidden">
        <table className="w-full text-sm">
          <thead style={{ background: "#f3eddf" }}><tr><th className="px-3 py-2 text-left eyebrow">Mobile</th><th className="px-3 py-2 text-left eyebrow">Note</th><th className="px-3 py-2 text-left eyebrow">Added</th><th className="px-3 py-2"></th></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t" style={{ borderColor: "rgba(178,135,61,0.18)" }}>
                <td className="px-3 py-2">{it.mobile}</td>
                <td className="px-3 py-2">{it.note}</td>
                <td className="px-3 py-2 text-xs" style={{ color: "#7a7868" }}>{it.created_at?.slice(0, 10)}</td>
                <td className="px-3 py-2 text-right"><button onClick={() => del(it.id)} className="text-xs uppercase tracking-luxe" style={{ color: "#a3361e" }}>Remove</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="text-center py-8" style={{ color: "#7a7868" }}>No allowed numbers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Sponsors() {
  const empty = { name: "", placement: "inline", media_type: "image", media_url: "", link: "", active: true, order: 0 };
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const load = () => api.get("/admin/sponsor-ads").then((r) => setItems(r.data || []));
  useEffect(() => { load(); }, []);
  const upload = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const fd = new FormData(); fd.append("file", f);
    const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    setForm((s) => ({ ...s, media_url: data.url }));
  };
  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/admin/sponsor-ads/${editing}`, form);
      else await api.post("/admin/sponsor-ads", form);
      setForm(empty); setEditing(null); load();
      toast.success("Saved");
    } catch (err) { toast.error(formatError(err.response?.data?.detail)); }
  };
  const edit = (it) => { setForm({ name: it.name, placement: it.placement, media_type: it.media_type, media_url: it.media_url, link: it.link || "", active: it.active, order: it.order }); setEditing(it.id); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const del = async (id) => { if (!window.confirm("Delete this ad?")) return; await api.delete(`/admin/sponsor-ads/${id}`); load(); };
  return (
    <div>
      <h2 className="font-serif-display text-3xl">Sponsor Ads</h2>
      <form onSubmit={save} className="mt-6 card-luxe p-5 grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 eyebrow">{editing ? "Edit Sponsor" : "Add Sponsor"}</div>
        <div><label className="label-luxe">Sponsor Name</label><input data-testid="ad-name" className="input-luxe" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required/></div>
        <div><label className="label-luxe">Placement</label>
          <select className="input-luxe" value={form.placement} onChange={(e) => setForm({...form, placement: e.target.value})}>
            <option value="inline">Inline (Roster)</option>
            <option value="popup">Popup (Powered by)</option>
            <option value="footer">Footer</option>
            <option value="featured">Featured Section</option>
          </select>
        </div>
        <div><label className="label-luxe">Media Type</label>
          <select className="input-luxe" value={form.media_type} onChange={(e) => setForm({...form, media_type: e.target.value})}>
            <option value="image">Image</option><option value="video">Video</option>
          </select>
        </div>
        <div><label className="label-luxe">Order</label><input type="number" className="input-luxe" value={form.order} onChange={(e) => setForm({...form, order: parseInt(e.target.value || 0)})}/></div>
        <div className="sm:col-span-2">
          <label className="label-luxe">Media Upload</label>
          <input type="file" accept="image/*,video/*" onChange={upload} />
          {form.media_url && <div className="mt-2 text-xs" style={{ color: "#7a7868" }}>{form.media_url}</div>}
        </div>
        <div className="sm:col-span-2"><label className="label-luxe">Link URL</label><input className="input-luxe" value={form.link} onChange={(e) => setForm({...form, link: e.target.value})}/></div>
        <div className="sm:col-span-2 flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({...form, active: e.target.checked})}/> Active</label>
          <button data-testid="ad-save" className="btn-gold ml-auto">{editing ? "Update" : "Add"}</button>
          {editing && <button type="button" onClick={() => { setForm(empty); setEditing(null); }} className="btn-outline-gold">Cancel</button>}
        </div>
      </form>

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {items.map((it) => (
          <div key={it.id} className="card-luxe overflow-hidden">
            <div className="aspect-[16/9] bg-[#efeae0]">
              {it.media_type === "video" ? <video src={absUrl(it.media_url)} muted className="w-full h-full object-cover"/> : <img src={absUrl(it.media_url)} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between"><div className="font-serif-display text-xl">{it.name}</div><span className="eyebrow" style={{ color: it.active ? "#1f7a4d" : "#9a6b14" }}>{it.active ? "Active" : "Inactive"}</span></div>
              <div className="text-xs mt-1" style={{ color: "#7a7868" }}>{it.placement} · imp {it.impressions || 0} · clk {it.clicks || 0}</div>
              <div className="mt-3 flex gap-2 text-xs uppercase tracking-luxe">
                <button onClick={() => edit(it)} className="px-3 py-1.5 rounded-full border" style={{ borderColor: "#d8bc84" }}>Edit</button>
                <button onClick={() => del(it.id)} className="px-3 py-1.5 rounded-full border" style={{ borderColor: "#d8bc84", color: "#a3361e" }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Broadcast() {
  const [s, setS] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [templateLanguage, setTemplateLanguage] = useState("");
  const [audience, setAudience] = useState("visitors_all");
  const [audienceCount, setAudienceCount] = useState(null);
  const [imageMode, setImageMode] = useState("personalised_pass");
  const [sharedImageUrl, setSharedImageUrl] = useState("");
  const [fields, setFields] = useState(["", "", "", "", ""]);
  const [testMobiles, setTestMobiles] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState(null);
  const [templates, setTemplates] = useState(null);

  useEffect(() => {
    api.get("/admin/settings").then((r) => {
      setS(r.data);
      setTemplateName(r.data.bizchat_template_visitor || "");
      setTemplateLanguage(r.data.bizchat_template_language || "en");
    });
  }, []);

  useEffect(() => {
    setAudienceCount(null);
    if (!audience) return;
    api.get(`/admin/bizchat/audience-count?audience=${audience}`)
      .then((r) => setAudienceCount(r.data.count))
      .catch(() => setAudienceCount(null));
  }, [audience]);

  if (!s) return <div>Loading…</div>;

  const setField = (i, v) => setFields(fields.map((f, idx) => (idx === i ? v : f)));

  const fetchTemplates = async () => {
    try {
      const { data } = await api.get("/admin/bizchat/templates");
      setTemplates(data.data);
      toast.success("Templates fetched");
    } catch (err) { toast.error(formatError(err.response?.data?.detail)); }
  };

  const buildPayload = () => {
    const testList = testMobiles
      .split(/[\s,]+/)
      .map((m) => m.replace(/\D/g, ""))
      .filter((m) => m.length === 10);
    return {
      template_name: templateName,
      template_language: templateLanguage,
      audience,
      image_mode: imageMode,
      shared_image_url: sharedImageUrl,
      field_1: fields[0], field_2: fields[1], field_3: fields[2],
      field_4: fields[3], field_5: fields[4],
      test_mobiles: testList,
    };
  };

  const previewSend = async () => {
    if (!templateName.trim()) { toast.error("Template name is required"); return; }
    setBusy(true);
    try {
      const { data } = await api.post("/admin/bizchat/broadcast", { ...buildPayload(), dry_run: true });
      setResult({ preview: true, ...data });
      setConfirm(true);
    } catch (err) { toast.error(formatError(err.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  const doSend = async () => {
    setBusy(true);
    setConfirm(false);
    try {
      const { data } = await api.post("/admin/bizchat/broadcast", buildPayload());
      setResult(data);
      if (data.sent > 0) toast.success(`Sent to ${data.sent} / ${data.total}`);
      if (data.failed > 0) toast.error(`${data.failed} failed`);
    } catch (err) { toast.error(formatError(err.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  const fieldHint = "Use {name}, {business_name}, {city}, {industry}, {mobile} to personalise";

  return (
    <div data-testid="broadcast-panel">
      <h2 className="font-serif-display text-3xl">Broadcast WhatsApp</h2>
      <p className="text-sm mt-1" style={{ color: "#7a7868" }}>
        Send a Meta-approved template to all visitors / exhibitors with the personalised event pass attached.
      </p>

      <div className="mt-6 card-luxe p-5 grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 eyebrow" style={{ color: "#b2873d" }}>1 · Template</div>
        <div>
          <label className="label-luxe">Meta Template Name</label>
          <input
            className="input-luxe"
            data-testid="bc-template-name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g. event_pass_update"
          />
        </div>
        <div>
          <label className="label-luxe">Template Language Code</label>
          <input
            className="input-luxe"
            data-testid="bc-template-language"
            value={templateLanguage}
            onChange={(e) => setTemplateLanguage(e.target.value)}
            placeholder="e.g. en, en_US, en_GB"
          />
          <p className="text-xs mt-1" style={{ color: "#7a7868" }}>Must match the language code your template is approved under in BWA Manager.</p>
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button type="button" onClick={fetchTemplates} className="btn-outline-gold">List Templates</button>
        </div>
        {templates && (
          <div className="sm:col-span-2 card-luxe p-3 max-h-48 overflow-auto text-xs" style={{ background: "#fbf8f0" }}>
            <pre className="whitespace-pre-wrap" style={{ color: "#3b3b46" }}>{JSON.stringify(templates, null, 2)}</pre>
          </div>
        )}

        <div className="sm:col-span-2 eyebrow mt-2" style={{ color: "#b2873d" }}>2 · Audience</div>
        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            ["visitors_all", "All Visitors"],
            ["visitors_present", "Visitors · Checked-in"],
            ["visitors_pending", "Visitors · Pending"],
            ["exhibitors_all", "All Exhibitors"],
            ["exhibitors_approved", "Exhibitors · Approved"],
            ["exhibitors_paid", "Exhibitors · Paid"],
          ].map(([k, l]) => (
            <label key={k}
              className={`px-3 py-2 rounded border cursor-pointer text-sm ${audience === k ? "bg-[#1f1f27] text-[#f8f7f4] border-[#1f1f27]" : ""}`}
              style={audience === k ? {} : { borderColor: "#d8bc84", color: "#1f1f27" }}
            >
              <input type="radio" className="hidden" checked={audience === k} onChange={() => setAudience(k)} data-testid={`bc-aud-${k}`} />
              {l}
            </label>
          ))}
        </div>
        <div className="sm:col-span-2 text-xs" style={{ color: "#7a7868" }}>
          Recipients in this audience: <strong style={{ color: "#b2873d" }}>{audienceCount ?? "…"}</strong>
        </div>

        <div className="sm:col-span-2 eyebrow mt-2" style={{ color: "#b2873d" }}>3 · Header Image (event pass)</div>
        <div className="sm:col-span-2 flex flex-col gap-2 text-sm">
          <label className="inline-flex items-start gap-2 cursor-pointer">
            <input type="radio" checked={imageMode === "personalised_pass"} onChange={() => setImageMode("personalised_pass")} data-testid="bc-img-personal"/>
            <span><strong>Personalised event pass</strong> · each visitor receives their own branded QR poster (recommended for visitor audiences)</span>
          </label>
          <label className="inline-flex items-start gap-2 cursor-pointer">
            <input type="radio" checked={imageMode === "shared_url"} onChange={() => setImageMode("shared_url")} data-testid="bc-img-shared"/>
            <span><strong>Shared image URL</strong> · same image for everyone</span>
          </label>
          {imageMode === "shared_url" && (
            <input
              className="input-luxe"
              placeholder="https://…/event-pass.png"
              value={sharedImageUrl}
              onChange={(e) => setSharedImageUrl(e.target.value)}
              data-testid="bc-shared-url"
            />
          )}
          <label className="inline-flex items-start gap-2 cursor-pointer">
            <input type="radio" checked={imageMode === "none"} onChange={() => setImageMode("none")} data-testid="bc-img-none"/>
            <span><strong>No image</strong> · text-only template</span>
          </label>
        </div>

        <div className="sm:col-span-2 eyebrow mt-2" style={{ color: "#b2873d" }}>4 · Body Variables · {fieldHint}</div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={i === 4 ? "sm:col-span-2" : ""}>
            <label className="label-luxe">{`{{${i + 1}}}`}</label>
            <input
              className="input-luxe"
              data-testid={`bc-field-${i + 1}`}
              value={fields[i]}
              onChange={(e) => setField(i, e.target.value)}
              placeholder={i === 0 ? "{name}" : ""}
            />
          </div>
        ))}

        <div className="sm:col-span-2 eyebrow mt-2" style={{ color: "#b2873d" }}>5 · Safety · Test Numbers (optional)</div>
        <div className="sm:col-span-2">
          <input
            className="input-luxe"
            placeholder="Comma-separated 10-digit mobiles to limit the send (leave empty to send to full audience)"
            value={testMobiles}
            onChange={(e) => setTestMobiles(e.target.value)}
            data-testid="bc-test-mobiles"
          />
          <p className="text-xs mt-1" style={{ color: "#7a7868" }}>If filled, the broadcast goes only to those numbers — perfect for a dress rehearsal.</p>
        </div>

        <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
          <button onClick={previewSend} disabled={busy} className="btn-outline-gold" data-testid="bc-preview">
            {busy ? "Working…" : "Preview & Send"}
          </button>
        </div>
      </div>

      {confirm && result?.preview && (
        <div className="mt-6 card-luxe p-5" data-testid="bc-confirm">
          <h3 className="font-serif-display text-2xl">Ready to send?</h3>
          <p className="text-sm mt-1" style={{ color: "#3b3b46" }}>
            Template <strong>{templateName}</strong> will be sent to <strong style={{ color: "#b2873d" }}>{result.total}</strong> recipient{result.total === 1 ? "" : "s"}.
          </p>
          {result.sample?.length > 0 && (
            <div className="mt-3 text-xs" style={{ color: "#7a7868" }}>
              Sample: {result.sample.map((r) => `${r.name || "—"} (${r.mobile})`).slice(0, 5).join(", ")}{result.total > 5 ? ` … +${result.total - 5} more` : ""}
            </div>
          )}
          <div className="flex justify-end gap-3 mt-4">
            <button className="btn-outline-gold" onClick={() => setConfirm(false)} data-testid="bc-cancel">Cancel</button>
            <button className="btn-gold" onClick={doSend} disabled={busy || result.total === 0} data-testid="bc-confirm-send">
              {busy ? "Sending…" : `Send to ${result.total}`}
            </button>
          </div>
        </div>
      )}

      {result && !result.preview && (
        <div className="mt-6 card-luxe p-5" data-testid="bc-result">
          <h3 className="font-serif-display text-2xl">Broadcast complete</h3>
          <div className="grid grid-cols-3 gap-3 mt-3 text-center">
            <div className="card-luxe p-3"><div className="eyebrow" style={{ color: "#7a7868" }}>Total</div><div className="text-2xl font-serif-display">{result.total}</div></div>
            <div className="card-luxe p-3"><div className="eyebrow" style={{ color: "#b2873d" }}>Sent</div><div className="text-2xl font-serif-display" style={{ color: "#b2873d" }}>{result.sent}</div></div>
            <div className="card-luxe p-3"><div className="eyebrow" style={{ color: "#a23030" }}>Failed</div><div className="text-2xl font-serif-display" style={{ color: "#a23030" }}>{result.failed}</div></div>
          </div>
          {result.samples?.length > 0 && (
            <details className="mt-4 text-xs" open>
              <summary style={{ color: "#b2873d" }} className="cursor-pointer">BizChat raw responses (first {result.samples.length})</summary>
              <pre className="whitespace-pre-wrap mt-2 max-h-72 overflow-auto" style={{ color: "#3b3b46", background: "#fbf8f0", padding: 12, borderRadius: 8 }}>
{JSON.stringify(result.samples, null, 2)}
              </pre>
            </details>
          )}
          {result.errors?.length > 0 && (
            <details className="mt-4 text-xs">
              <summary style={{ color: "#a23030" }} className="cursor-pointer">Failed sends — {result.errors.length}</summary>
              <pre className="whitespace-pre-wrap mt-2 max-h-72 overflow-auto" style={{ color: "#3b3b46", background: "#fbf8f0", padding: 12, borderRadius: 8 }}>
{JSON.stringify(result.errors, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function Settings() {
  const [s, setS] = useState(null);
  const [templates, setTemplates] = useState(null);
  const [tmplLoading, setTmplLoading] = useState(false);
  const [testMobile, setTestMobile] = useState("");
  const [testName, setTestName] = useState("");
  useEffect(() => { api.get("/admin/settings").then((r) => setS(r.data)); }, []);
  if (!s) return <div>Loading…</div>;
  const save = async () => {
    try { const { data } = await api.put("/admin/settings", s); setS(data); toast.success("Settings saved"); }
    catch (err) { toast.error(formatError(err.response?.data?.detail)); }
  };
  const fetchTemplates = async () => {
    setTmplLoading(true);
    try {
      const { data } = await api.get("/admin/bizchat/templates");
      setTemplates(data.data);
      toast.success("Templates fetched");
    } catch (err) { toast.error(formatError(err.response?.data?.detail)); }
    finally { setTmplLoading(false); }
  };
  const testSend = async () => {
    try { const { data } = await api.post("/admin/bizchat/test-send", { mobile: testMobile, name: testName, template: s.bizchat_template_visitor });
      if (data.result?.skipped) toast(`Skipped: ${data.result.reason}`); else toast.success("Test sent — check WhatsApp");
    } catch (err) { toast.error(formatError(err.response?.data?.detail)); }
  };
  const F = (k, label) => (
    <div><label className="label-luxe">{label}</label><input data-testid={`set-${k}`} className="input-luxe" value={s[k] || ""} onChange={(e) => setS({...s, [k]: e.target.value})}/></div>
  );
  return (
    <div>
      <h2 className="font-serif-display text-3xl">Event Settings</h2>
      <div className="mt-6 card-luxe p-5 grid sm:grid-cols-2 gap-4">
        {F("event_name", "Event Name")}
        {F("venue", "Venue")}
        {F("venue_address", "Venue Address")}
        {F("maps_link", "Maps Link")}
        {F("start_date", "Start Date")}
        {F("end_date", "End Date")}
        <div><label className="label-luxe">Exhibitor Limit</label><input type="number" className="input-luxe" value={s.exhibitor_limit || 0} onChange={(e) => setS({...s, exhibitor_limit: parseInt(e.target.value || 0)})}/></div>
        <div className="flex items-center gap-4 pt-7">
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!s.visitor_registration_open} onChange={(e) => setS({...s, visitor_registration_open: e.target.checked})}/> Visitor Registration Open</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!s.exhibitor_registration_open} onChange={(e) => setS({...s, exhibitor_registration_open: e.target.checked})}/> Exhibitor Registration Open</label>
        </div>

        <div className="sm:col-span-2 eyebrow mt-4" style={{ color: "#b2873d" }}>Gate Scanner Access</div>
        <div className="sm:col-span-2">
          <label className="label-luxe">Gate Code</label>
          <input
            type="text"
            className="input-luxe"
            placeholder="e.g. RB2026-GATE"
            value={s.gate_code || ""}
            onChange={(e) => setS({...s, gate_code: e.target.value})}
            data-testid="gate-code-field"
          />
          <p className="text-xs mt-1" style={{ color: "#7a7868" }}>
            Share this code with door staff so they can sign in at <span style={{ color: "#1B194B" }}>/gate/login</span> to scan visitor QR codes. They get scanner-only access — no admin powers.
          </p>
        </div>

        <div className="sm:col-span-2 eyebrow mt-4" style={{ color: "#b2873d" }}>BizChat WhatsApp API · Meta-approved templates</div>
        {F("bizchat_vendor_uid", "Vendor UID")}
        {F("bizchat_token", "API Token")}
        {F("bizchat_from_phone_id", "From Phone Number ID (optional)")}
        {F("bizchat_template_language", "Template Language Code (e.g. en, en_us)")}
        {F("bizchat_template_visitor", "Visitor Template Name (Meta-approved)")}
        {F("bizchat_template_exhibitor", "Exhibitor Template Name (Meta-approved)")}

        <div className="sm:col-span-2 flex flex-wrap gap-3 pt-1">
          <button type="button" onClick={fetchTemplates} disabled={tmplLoading} className="btn-outline-gold">{tmplLoading ? "Fetching…" : "Fetch Template List"}</button>
          <div className="flex items-center gap-2 ml-auto">
            <input className="input-luxe" placeholder="Test mobile" value={testMobile} onChange={(e) => setTestMobile(e.target.value)} style={{ width: 160 }}/>
            <input className="input-luxe" placeholder="Test name" value={testName} onChange={(e) => setTestName(e.target.value)} style={{ width: 160 }}/>
            <button type="button" onClick={testSend} className="btn-outline-gold">Test Send</button>
          </div>
        </div>

        {templates && (
          <div className="sm:col-span-2 card-luxe p-4 max-h-72 overflow-auto text-xs" style={{ background: "#fbf8f0" }}>
            <pre className="whitespace-pre-wrap" style={{ color: "#3b3b46" }}>{JSON.stringify(templates, null, 2)}</pre>
          </div>
        )}

        <div className="sm:col-span-2 flex justify-end pt-2"><button data-testid="set-save" onClick={save} className="btn-gold">Save Settings</button></div>
      </div>
    </div>
  );
}

function Committee() {
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const GROUPS = [
    ["rama_bazaar", "Rama Bazaar Committee"],
    ["management", "Management Committee"],
    ["supported_by", "Supported By"],
  ];

  const load = () => api.get("/admin/committee").then((r) => setItems(r.data || []));
  useEffect(() => { load(); }, []);

  const upload = async (file) => {
    const fd = new FormData(); fd.append("file", file);
    const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    return data.url;
  };

  const updateField = async (id, patch) => {
    try {
      setBusyId(id);
      await api.put(`/admin/committee/${id}`, patch);
      await load();
      toast.success("Updated");
    } catch (err) { toast.error(formatError(err.response?.data?.detail) || "Update failed"); }
    finally { setBusyId(null); }
  };

  const onPhoto = async (id, e) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { setBusyId(id); const url = await upload(f); await updateField(id, { photo_url: url }); }
    catch { toast.error("Upload failed"); setBusyId(null); }
  };

  const onLogo = async (id, e) => {
    const f = e.target.files?.[0]; if (!f) return;
    try { setBusyId(id); const url = await upload(f); await updateField(id, { logo_url: url }); }
    catch { toast.error("Upload failed"); setBusyId(null); }
  };

  const onRoleBlur = (m, value) => {
    if (value !== m.role) updateField(m.id, { role: value });
  };

  const onNameBlur = (m, value) => {
    if (value !== m.name && value.trim()) updateField(m.id, { name: value.trim() });
  };

  const toggleHide = (m) => updateField(m.id, { hidden: !m.hidden });

  const del = async (id) => {
    if (!window.confirm("Delete this committee member?")) return;
    await api.delete(`/admin/committee/${id}`);
    load();
  };

  const addBlank = async (group) => {
    try {
      await api.post("/admin/committee", { group, name: "New Member", role: "", order: 99 });
      toast.success("Added");
      load();
    } catch (err) { toast.error(formatError(err.response?.data?.detail) || "Could not add"); }
  };

  return (
    <div data-testid="admin-committee">
      <div className="eyebrow">Committee</div>
      <h2 className="font-serif-display text-3xl mt-2">Committee Members</h2>
      <p className="mt-2 text-sm" style={{ color: "#7a7868" }}>
        Upload member photos and company logos. Edits save instantly on field blur.
      </p>

      {GROUPS.map(([gKey, gLabel]) => {
        const group = items.filter((i) => i.group === gKey);
        return (
          <div key={gKey} className="mt-10">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-display text-xl">{gLabel} <span className="text-xs ml-2" style={{ color: "#7a7868" }}>({group.length})</span></h3>
              <button onClick={() => addBlank(gKey)} className="btn-outline-gold" data-testid={`committee-add-${gKey}`}>+ Add Member</button>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              {group.map((m) => (
                <div key={m.id} className="card-luxe p-4" data-testid={`committee-row-${m.id}`}>
                  <div className="flex gap-4">
                    {/* Photo */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 bg-[#efeae0]"
                           style={{ borderColor: "#d8bc84" }}>
                        {m.photo_url ? (
                          <img src={absUrl(m.photo_url)} alt={m.name} className="w-full h-full object-cover"/>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "#7a7868" }}>
                            No photo
                          </div>
                        )}
                      </div>
                      <label className="text-xs underline cursor-pointer" style={{ color: "#b2873d" }}>
                        {busyId === m.id ? "…" : "Photo"}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(m.id, e)} data-testid={`committee-photo-${m.id}`}/>
                      </label>
                    </div>

                    {/* Fields */}
                    <div className="flex-1 min-w-0">
                      <label className="label-luxe">Name</label>
                      <input className="input-luxe" defaultValue={m.name}
                             onBlur={(e) => onNameBlur(m, e.target.value)}
                             data-testid={`committee-name-${m.id}`}/>
                      <label className="label-luxe mt-2">Role</label>
                      <input className="input-luxe" defaultValue={m.role}
                             onBlur={(e) => onRoleBlur(m, e.target.value)}
                             data-testid={`committee-role-${m.id}`}/>
                      <label className="label-luxe mt-2">Order</label>
                      <input type="number" className="input-luxe" defaultValue={m.order}
                             onBlur={(e) => {
                               const n = parseInt(e.target.value || "0", 10);
                               if (n !== m.order) updateField(m.id, { order: n });
                             }}/>
                    </div>
                  </div>

                  {/* Company Logo */}
                  <div className="mt-4 pt-4 border-t flex items-center gap-3" style={{ borderColor: "rgba(178,135,61,0.2)" }}>
                    <div className="w-16 h-12 flex items-center justify-center bg-[#fbf8f0] border rounded"
                         style={{ borderColor: "rgba(178,135,61,0.3)" }}>
                      {m.logo_url ? (
                        <img src={absUrl(m.logo_url)} alt="Logo" className="max-w-full max-h-full object-contain"/>
                      ) : (
                        <span className="text-[10px]" style={{ color: "#7a7868" }}>No logo</span>
                      )}
                    </div>
                    <label className="text-xs underline cursor-pointer" style={{ color: "#b2873d" }}>
                      Upload company logo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(m.id, e)} data-testid={`committee-logo-${m.id}`}/>
                    </label>
                    <div className="ml-auto flex items-center gap-2">
                      <button onClick={() => toggleHide(m)} className="text-xs uppercase tracking-luxe" style={{ color: m.hidden ? "#b2873d" : "#7a7868" }}>
                        {m.hidden ? "Hidden" : "Visible"}
                      </button>
                      <button onClick={() => del(m.id)} className="text-xs underline" style={{ color: "#b2873d" }} data-testid={`committee-delete-${m.id}`}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

