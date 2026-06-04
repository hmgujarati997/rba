import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Check, X } from "lucide-react";
import TopBar from "../components/TopBar";
import api, { formatError, BACKEND_URL } from "../lib/api";
import { toast } from "sonner";

const FIELDS = [
  ["full_name", "Full Name", "John Doe", true],
  ["mobile", "Mobile Number (10 digits)", "9876543210", true],
  ["business_name", "Business Name", "Your Business", false],
  ["industry", "Industry / Category", "Retail, F&B, Tech…", false],
  ["city", "City", "Mumbai", false],
  ["referred_by", "Referred By", "Member Name", false],
  ["email", "Email (optional)", "you@example.com", false],
];

function absUrl(u) { if (!u) return ""; return u.startsWith("http") ? u : `${BACKEND_URL}${u}`; }

export default function VisitorRegister() {
  const nav = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    ...Object.fromEntries(FIELDS.map(([k]) => [k, ""])),
    is_lvb_member: false,
    lvb_chapter: "",
    photo_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.mobile) return toast.error("Name and mobile are required");
    if (form.is_lvb_member && !form.lvb_chapter.trim()) {
      return toast.error("Please enter your LVB chapter name");
    }
    setLoading(true);
    try {
      const { data } = await api.post("/visitors/register", form);
      if (data.already_registered) toast("Welcome back — opening your QR.");
      else toast.success("Registration confirmed");
      nav(`/visitor/success/${data.visitor.qr_id}`);
    } catch (err) {
      toast.error(formatError(err.response?.data?.detail) || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const onPhoto = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) return toast.error("Photo must be under 8 MB");
    try {
      setUploading(true);
      const fd = new FormData(); fd.append("file", f);
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((s) => ({ ...s, photo_url: data.url }));
      toast.success("Photo added");
    } catch (err) {
      toast.error(formatError(err.response?.data?.detail) || "Upload failed");
    } finally { setUploading(false); }
  };

  const removePhoto = () => setForm((s) => ({ ...s, photo_url: "" }));

  return (
    <div className="page-pad" data-testid="visitor-register-page">
      <TopBar back />
      <div className="max-w-xl mx-auto px-6 pt-8 pb-16">
        <div className="eyebrow">Visitor Registration</div>
        <h1 className="font-serif-display text-4xl mt-3">Reserve your seat at Rama Bazaar 1.0.</h1>
        <p className="mt-3 text-sm" style={{ color: "#3b3b46" }}>Complete the short form. Your personal QR will be ready in seconds.</p>

        <form onSubmit={submit} className="mt-10 space-y-5">
          {FIELDS.map(([k, label, ph, req]) => (
            <div key={k}>
              <label className="label-luxe">{label}{req && <span style={{ color: "#b2873d" }}> ·</span>}</label>
              <input
                data-testid={`visitor-${k}`}
                className="input-luxe"
                placeholder={ph}
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                required={req}
                inputMode={k === "mobile" ? "numeric" : k === "email" ? "email" : "text"}
              />
            </div>
          ))}

          {/* LVB Member toggle */}
          <div className="card-luxe p-4" data-testid="visitor-lvb-block">
            <label className="label-luxe">Are you an LVB Member?</label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button type="button"
                onClick={() => setForm((s) => ({ ...s, is_lvb_member: true }))}
                data-testid="visitor-lvb-yes"
                className={`px-4 py-3 rounded-full text-sm uppercase tracking-luxe transition-all ${
                  form.is_lvb_member
                    ? "text-white shadow-gold"
                    : "border"
                }`}
                style={form.is_lvb_member
                  ? { background: "#1b194b", letterSpacing: "0.12em" }
                  : { borderColor: "#d8bc84", color: "#3b3b46", letterSpacing: "0.12em" }}
              >
                Yes, I am
              </button>
              <button type="button"
                onClick={() => setForm((s) => ({ ...s, is_lvb_member: false, lvb_chapter: "" }))}
                data-testid="visitor-lvb-no"
                className={`px-4 py-3 rounded-full text-sm uppercase tracking-luxe transition-all ${
                  !form.is_lvb_member
                    ? "text-white shadow-gold"
                    : "border"
                }`}
                style={!form.is_lvb_member
                  ? { background: "#1b194b", letterSpacing: "0.12em" }
                  : { borderColor: "#d8bc84", color: "#3b3b46", letterSpacing: "0.12em" }}
              >
                Not a member
              </button>
            </div>

            {form.is_lvb_member && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-300">
                <label className="label-luxe">LVB Chapter Name<span style={{ color: "#b2873d" }}> ·</span></label>
                <input
                  data-testid="visitor-lvb-chapter"
                  className="input-luxe"
                  placeholder="e.g. Surat, Mumbai, Ahmedabad…"
                  value={form.lvb_chapter}
                  onChange={(e) => setForm({ ...form, lvb_chapter: e.target.value })}
                  required
                />
              </div>
            )}
          </div>

          {/* Photo upload — for personalised social post */}
          <div className="card-luxe p-4" data-testid="visitor-photo-block">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <label className="label-luxe">Your Photo (optional)</label>
                <p className="text-xs mt-1" style={{ color: "#7a7868" }}>
                  Add a portrait so we can create a personalised post for you to share — you'll receive it on WhatsApp.
                </p>
              </div>
              {form.photo_url ? (
                <div className="relative shrink-0">
                  <img
                    src={absUrl(form.photo_url)}
                    alt="Your photo"
                    className="w-20 h-20 rounded-full object-cover border-2"
                    style={{ borderColor: "#d8bc84" }}
                  />
                  <button type="button" onClick={removePhoto}
                    data-testid="visitor-photo-remove"
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow border"
                    style={{ borderColor: "#d8bc84", color: "#1b194b" }}
                    aria-label="Remove photo">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="shrink-0 w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center"
                     style={{ borderColor: "#d8bc84", color: "#b2873d", background: "#fbf8f0" }}>
                  <Camera size={22} />
                </div>
              )}
            </div>

            <button type="button" onClick={() => fileRef.current?.click()}
              disabled={uploading}
              data-testid="visitor-photo-upload"
              className="btn-outline-gold w-full mt-3">
              {uploading ? "Uploading…" : form.photo_url ? (<><Check size={14} /> Change Photo</>) : (<><Camera size={14} /> Upload Photo</>)}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto}/>
          </div>

          <button data-testid="visitor-submit" type="submit" disabled={loading} className="btn-gold w-full">
            {loading ? "Confirming…" : "Confirm Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}
