import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import "@/App.css";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "sonner";
import BottomNav from "@/components/BottomNav";

import Landing from "@/pages/Landing";
import VisitorRegister from "@/pages/VisitorRegister";
import VisitorSuccess from "@/pages/VisitorSuccess";
import VisitorQR from "@/pages/VisitorQR";
import ExhibitorRegister from "@/pages/ExhibitorRegister";
import ExhibitorLogin from "@/pages/ExhibitorLogin";
import ExhibitorDashboard from "@/pages/ExhibitorDashboard";
import Roster from "@/pages/Roster";
import Attendance from "@/pages/Attendance";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import DigitalCard from "@/pages/DigitalCard";
import SiteFooter from "@/components/SiteFooter";

function ProtectedExhibitor({ children }) {
  const { ready, role } = useAuth();
  if (!ready) return null;
  if (role !== "exhibitor") return <Navigate to="/exhibitor/login" replace />;
  return children;
}

function ProtectedAdmin({ children }) {
  const { ready, role } = useAuth();
  if (!ready) return null;
  if (role !== "admin") return <Navigate to="/admin/login" replace />;
  return children;
}

function Shell() {
  const { pathname } = useLocation();
  const hideNav = pathname.startsWith("/admin") || pathname.startsWith("/attendance") || pathname.startsWith("/c/");
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<VisitorRegister />} />
        <Route path="/visitor/success/:qrId" element={<VisitorSuccess />} />
        <Route path="/my-qr" element={<VisitorQR />} />
        <Route path="/exhibitor/register" element={<ExhibitorRegister />} />
        <Route path="/exhibitor/login" element={<ExhibitorLogin />} />
        <Route path="/exhibitor/dashboard" element={<ProtectedExhibitor><ExhibitorDashboard /></ProtectedExhibitor>} />
        <Route path="/roster" element={<Roster />} />
        <Route path="/attendance" element={<ProtectedAdmin><Attendance /></ProtectedAdmin>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={<ProtectedAdmin><AdminDashboard /></ProtectedAdmin>} />
        <Route path="/c/:slug" element={<DigitalCard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideNav && <SiteFooter inset />}
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: "#1f1f27", color: "#f8f7f4", border: "1px solid #b2873d", borderRadius: "12px", fontFamily: "Inter, sans-serif", fontSize: "13px", letterSpacing: "0.04em" }
          }}
        />
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  );
}
