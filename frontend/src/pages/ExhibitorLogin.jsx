import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import TopBar from "../components/TopBar";
import api, { formatError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";

export default function ExhibitorLogin() {
  const location = useLocation();
  const [mobile, setMobile] = useState(location.state?.mobile || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { mobile, password });
      login(data.token, data.role, data.user);
      toast.success("Signed in");
      nav("/exhibitor/dashboard");
    } catch (err) {
      toast.error(formatError(err.response?.data?.detail) || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="page-pad" data-testid="exhibitor-login">
      <TopBar back />
      <div className="max-w-xl mx-auto px-6 pt-8 pb-16">
        <div className="eyebrow">Exhibitor</div>
        <h1 className="font-serif-display text-4xl mt-3">Sign in to your stall.</h1>
        {location.state?.mobile && (
          <p className="mt-3 text-sm" style={{ color: "#3b3b46" }}>
            This mobile number is already registered. Please enter your password to continue.
          </p>
        )}
        <form onSubmit={submit} className="mt-10 space-y-5">
          <div>
            <label className="label-luxe">Mobile</label>
            <input data-testid="ex-login-mobile" className="input-luxe" value={mobile} onChange={(e)=>setMobile(e.target.value)} inputMode="numeric" required/>
          </div>
          <div>
            <label className="label-luxe">Password</label>
            <input data-testid="ex-login-password" type="password" className="input-luxe" value={password} onChange={(e)=>setPassword(e.target.value)} required autoFocus={!!location.state?.mobile}/>
          </div>
          <button data-testid="ex-login-submit" disabled={loading} className="btn-gold w-full">{loading ? "Signing in…" : "Sign In"}</button>
        </form>
        <div className="mt-8 text-sm" style={{ color: "#7a7868" }}>
          New here? <Link to="/exhibitor/register" className="underline underline-offset-4 decoration-[#d8bc84]" style={{ color: "#b2873d" }}>Register as exhibitor →</Link>
        </div>
      </div>
    </div>
  );
}
