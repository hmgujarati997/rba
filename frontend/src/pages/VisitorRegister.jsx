import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import api, { formatError } from "../lib/api";
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

export default function VisitorRegister() {
  const nav = useNavigate();
  const [form, setForm] = useState(Object.fromEntries(FIELDS.map(([k]) => [k, ""])));
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.mobile) return toast.error("Name and mobile are required");
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
          <button data-testid="visitor-submit" type="submit" disabled={loading} className="btn-gold w-full">
            {loading ? "Confirming…" : "Confirm Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}
