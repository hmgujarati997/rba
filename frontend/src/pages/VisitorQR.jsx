import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import api, { formatError } from "../lib/api";
import { toast } from "sonner";

export default function VisitorQR() {
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/visitors/retrieve", { mobile });
      nav(`/visitor/success/${data.visitor.qr_id}`);
    } catch (err) {
      toast.error(formatError(err.response?.data?.detail) || "Not found");
    } finally { setLoading(false); }
  };

  return (
    <div className="page-pad" data-testid="visitor-qr-retrieve">
      <TopBar back />
      <div className="max-w-xl mx-auto px-6 pt-8 pb-16">
        <div className="eyebrow">Retrieve Pass</div>
        <h1 className="font-serif-display text-4xl mt-3">Show my QR code.</h1>
        <p className="mt-3 text-sm" style={{ color: "#3b3b46" }}>Enter the mobile number you registered with.</p>
        <form onSubmit={submit} className="mt-10 space-y-5">
          <div>
            <label className="label-luxe">Mobile Number</label>
            <input data-testid="retrieve-mobile" className="input-luxe" placeholder="9876543210" value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="numeric" required/>
          </div>
          <button data-testid="retrieve-submit" disabled={loading} className="btn-gold w-full">{loading ? "Looking up…" : "Show My QR"}</button>
        </form>
      </div>
    </div>
  );
}
