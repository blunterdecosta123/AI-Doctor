// App.jsx — router + layout wrapper
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import DetectPage from "./pages/DetectPage";
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";

const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const MemoryGamePage = lazy(() => import("./pages/MemoryGamePage"));

function PageFallback() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center px-6"
      style={{
        background:
          "linear-gradient(180deg, rgba(241,232,224,0.88), rgba(221,208,200,0.94))",
        color: "#323232",
      }}
    >
      <div className="rounded-full border px-4 py-2 text-sm font-medium" style={{ borderColor: "rgba(50,50,50,0.12)" }}>
        Loading page...
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-grow">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/detect" element={<DetectPage />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/memory-game" element={<MemoryGamePage />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
