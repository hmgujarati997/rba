import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { ScanLine } from "lucide-react";

export default function GateLogin() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post("/gate/login", { code: code.trim() });
      login(data.token, "gate", data.user);
      toast.success("Welcome to the gate");
      nav("/gate", { replace: true });
    } catch (err) {
      toast.error(formatError(err.response?.data?.detail) || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#f5efe1" }} data-testid="gate-login">
      <div className="max-w-sm w-full">
        <div className="text-center">
          <div className="inline-flex items-center justify-center" style={{
            width: 72, height: 72, borderRadius: 999,
            background: "#fbf8f0", border: "1px solid #d8bc84", color: "#b2873d",
          }}>
            <ScanLine size={28} />
          </div>
          <div className="eyebrow mt-5">Rama Bazaar 1.0</div>
          <h1 className="font-serif-display text-3xl mt-2" style={{ color: "#1B194B" }}>Gate Scanner</h1>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "#7a7868" }}>
            Enter the gate code shared by the admin to start checking in visitors.
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-3">
          <div>
            <label className="eyebrow block mb-1" style={{ fontSize: 10 }}>Gate Code</label>
            <input
              autoFocus
              type="password"
              className="input-luxe"
              placeholder="••••••••"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              data-testid="gate-code-input"
              required
            />
          </div>
          <button type="submit" className="btn-gold w-full" disabled={busy} data-testid="gate-login-submit">
            {busy ? "Verifying…" : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs" style={{ color: "#7a7868" }}>
          Stays signed in for 30 days. Tap logout from the scanner page anytime.
        </div>
      </div>
    </div>
  );
}
