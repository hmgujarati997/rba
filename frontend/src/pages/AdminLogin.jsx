import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import api, { formatError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.token, data.role, data.user);
      toast.success("Signed in");
      nav("/admin");
    } catch (err) { toast.error(formatError(err.response?.data?.detail) || "Login failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-pad" data-testid="admin-login">
      <TopBar back />
      <div className="max-w-xl mx-auto px-6 pt-12 pb-16">
        <div className="eyebrow">Administration</div>
        <h1 className="font-serif-display text-4xl mt-3">Admin sign in.</h1>
        <form onSubmit={submit} className="mt-10 space-y-5">
          <div>
            <label className="label-luxe">Email</label>
            <input data-testid="admin-email" className="input-luxe" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required/>
          </div>
          <div>
            <label className="label-luxe">Password</label>
            <input data-testid="admin-password" className="input-luxe" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required/>
          </div>
          <button data-testid="admin-submit" disabled={loading} className="btn-gold w-full">{loading ? "Signing in…" : "Sign In"}</button>
        </form>
      </div>
    </div>
  );
}
