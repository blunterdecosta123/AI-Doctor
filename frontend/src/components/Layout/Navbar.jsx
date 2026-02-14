// Navbar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const loc = useLocation();

  const nav = [
    { to: "/", label: "Home" },
    { to: "/detect", label: "Detect" },
    { to: "/how-it-works", label: "How it works" },
    { to: "/privacy", label: "Privacy" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <header
      className="w-full sticky top-0 z-50 backdrop-blur"
      style={{
        backgroundColor: "rgba(243,238,233,0.92)", // LIGHT BEIGE
        borderBottom: "1px solid rgba(50,50,50,0.12)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        
        {/* Logo */}
        <div
          className="font-semibold tracking-wide text-lg"
          style={{ color: "#323232" }}
        >
          Early <span className="font-bold">ALsist</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-2 items-center">
          {nav.map((n) => {
            const active = loc.pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className="px-3 py-1.5 rounded-md text-sm transition-colors"
                style={{
                  color: "#323232",
                  fontWeight: active ? 600 : 400,
                  backgroundColor: active
                    ? "rgba(50,50,50,0.14)"
                    : "transparent",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(50,50,50,0.08)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    active ? "rgba(50,50,50,0.14)" : "transparent")
                }
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile CTA */}
        <div className="md:hidden">
          <Link
            to="/detect"
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{
              backgroundColor: "#323232",
              color: "#F3EEE9",
            }}
          >
            Detect
          </Link>
        </div>
      </div>
    </header>
  );
}
