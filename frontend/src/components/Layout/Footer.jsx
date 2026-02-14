// Footer.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      className="w-full mt-16"
      style={{
        backgroundColor: "#DDD0C8",
        borderTop: "1px solid rgba(50,50,50,0.15)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
        
        <div style={{ color: "rgba(50,50,50,0.7)" }}>
          © {new Date().getFullYear()}{" "}
          <span className="font-medium" style={{ color: "#323232" }}>
            Early ALsist
          </span>{" "}
          — Your Memory Companion
        </div>

        <div className="flex gap-6">
          <Link
            to="/privacy"
            style={{ color: "#323232" }}
            className="hover:underline"
          >
            Privacy
          </Link>

          <a
            href="https://github.com/blunterdecosta123/AI-Doctor"
            target="_blank"
            rel="noreferrer"
            style={{ color: "#323232" }}
            className="hover:underline"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
