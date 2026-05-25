import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import api, { formatError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";

export default function ExhibitorRegister() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1); // 1=verify, 2=details
  const [mobile, setMobile] = useState("");
  const [pass, setPass] = useState("");
  const [info, setInfo] = useState({
    member_name: "", business_name: "", category: "", whatsapp: "", email: "",
    description: "", products_services: "", instagram: "", facebook: "", linkedin: "", website: "",
    address: "", maps_link: "", logo_url: "", banner_url: "", profile_photo_url: ""
  });
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState(null);

  const checkEligible = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/exhibitors/check-eligibility", { mobile });
      setSlots(data.slots_remaining);
      setStep(2);
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || "";
      if (status === 409 || /already registered/i.test(detail)) {
        toast("This number is already registered — please sign in.");
        nav("/exhibitor/login", { state: { mobile } });
        return;
      }
      toast.error(formatError(detail) || "Not eligible");
    } finally { setLoading(false); }
  };

  const uploadFile = async (file, field) => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setInfo((s) => ({ ...s, [field]: data.url }));
      toast.success(`${field.replace("_", " ")} uploaded`);
    } catch { toast.error("Upload failed"); }
  };

  const submitAll = async (e) => {
    e.preventDefault();
    if (pass.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      const payload = { mobile, password: pass, ...info };
      const { data } = await api.post("/exhibitors/register", payload);
      login(data.token, data.role, data.user);
      toast.success("Welcome — your profile is submitted for admin approval");
      nav("/exhibitor/dashboard");
    } catch (err) {
      toast.error(formatError(err.response?.data?.detail) || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="page-pad" data-testid="exhibitor-register">
      <TopBar back />
      <div className="max-w-xl mx-auto px-6 pt-8 pb-16">
        <div className="eyebrow">Exhibitor Registration</div>
        <h1 className="font-serif-display text-4xl mt-3">Reserve your stall at Rama Bazaar 1.0.</h1>
        <p className="mt-3 text-sm" style={{ color: "#3b3b46" }}>Open to verified LVB Rama members on a first-come, first-served basis.</p>

        {step === 1 && (
          <form onSubmit={checkEligible} className="mt-10 space-y-5">
            <div>
              <label className="label-luxe">LVB Rama Mobile Number</label>
              <input data-testid="exhibitor-mobile" className="input-luxe" placeholder="9876543210" value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="numeric" required/>
            </div>
            <button data-testid="exhibitor-verify" disabled={loading} className="btn-gold w-full">{loading ? "Verifying…" : "Verify Member Number"}</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submitAll} className="mt-8 space-y-5">
            {slots !== null && (
              <div className="text-xs uppercase tracking-luxe" style={{ color: "#b2873d" }}>✓ Eligible · {slots} slot{slots === 1 ? "" : "s"} remaining</div>
            )}

            <Field label="Set Password" value={pass} onChange={setPass} type="password" testid="exhibitor-pass" />
            <Field label="Member Name" value={info.member_name} onChange={(v) => setInfo({...info, member_name: v})} required testid="ex-member-name" />
            <Field label="Business Name" value={info.business_name} onChange={(v) => setInfo({...info, business_name: v})} required testid="ex-business-name" />
            <Field label="Category" value={info.category} onChange={(v) => setInfo({...info, category: v})} required testid="ex-category" />
            <Field label="WhatsApp Number" value={info.whatsapp} onChange={(v) => setInfo({...info, whatsapp: v})} testid="ex-whatsapp"/>
            <Field label="Email" value={info.email} onChange={(v) => setInfo({...info, email: v})} type="email" testid="ex-email"/>
            <FieldArea label="Business Description" value={info.description} onChange={(v) => setInfo({...info, description: v})} testid="ex-desc"/>
            <FieldArea label="Products / Services" value={info.products_services} onChange={(v) => setInfo({...info, products_services: v})} testid="ex-ps"/>

            <FileField label="Logo" testid="ex-logo" value={info.logo_url} onPick={(f) => uploadFile(f, "logo_url")} />
            <FileField label="Profile Photo" testid="ex-photo" value={info.profile_photo_url} onPick={(f) => uploadFile(f, "profile_photo_url")} />

            <Field label="Instagram" value={info.instagram} onChange={(v) => setInfo({...info, instagram: v})} testid="ex-ig"/>
            <Field label="Facebook" value={info.facebook} onChange={(v) => setInfo({...info, facebook: v})} testid="ex-fb"/>
            <Field label="LinkedIn" value={info.linkedin} onChange={(v) => setInfo({...info, linkedin: v})} testid="ex-in"/>
            <Field label="Website" value={info.website} onChange={(v) => setInfo({...info, website: v})} testid="ex-web"/>
            <Field label="Address" value={info.address} onChange={(v) => setInfo({...info, address: v})} testid="ex-addr"/>
            <Field label="Google Maps Link" value={info.maps_link} onChange={(v) => setInfo({...info, maps_link: v})} testid="ex-maps"/>

            <button data-testid="exhibitor-submit" disabled={loading} className="btn-gold w-full">{loading ? "Submitting…" : "Submit Registration"}</button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, testid }) {
  return (
    <div>
      <label className="label-luxe">{label}{required && <span style={{ color: "#b2873d" }}> ·</span>}</label>
      <input data-testid={testid} className="input-luxe" value={value} type={type} required={required} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FieldArea({ label, value, onChange, testid }) {
  return (
    <div>
      <label className="label-luxe">{label}</label>
      <textarea data-testid={testid} rows={4} className="input-luxe resize-none" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FileField({ label, onPick, value, testid }) {
  return (
    <div>
      <label className="label-luxe">{label}</label>
      <input data-testid={testid} type="file" accept="image/*" className="block text-sm" onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
      {value && <div className="mt-2 text-xs" style={{ color: "#7a7868" }}>Uploaded ✓</div>}
    </div>
  );
}
