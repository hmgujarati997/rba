import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, UserPlus, BookOpen, QrCode, User } from "lucide-react";

const items = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/register", icon: UserPlus, label: "Visit" },
  { to: "/roster", icon: BookOpen, label: "Roster" },
  { to: "/my-qr", icon: QrCode, label: "My QR" },
  { to: "/exhibitor/login", icon: User, label: "Stall" },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#f8f7f4]/90 backdrop-blur-md border-t"
      style={{ borderColor: "rgba(178,135,61,0.18)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="max-w-xl mx-auto grid grid-cols-5">
        {items.map((it) => {
          const active = pathname === it.to || (it.to !== "/" && pathname.startsWith(it.to));
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                data-testid={`bnav-${it.label.toLowerCase().replace(/\s/g, "-")}`}
                className="flex flex-col items-center justify-center gap-1 py-2.5 transition-colors"
                style={{ color: active ? "#b2873d" : "#1f1f27" }}
              >
                <Icon size={18} strokeWidth={1.5} />
                <span style={{ fontSize: 10, letterSpacing: "0.22em" }} className="uppercase">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
