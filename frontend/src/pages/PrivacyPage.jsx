import { useRef } from "react";
import { Database, EyeOff, LockKeyhole, Shield } from "lucide-react";
import useRevealMotion from "@/hooks/useRevealMotion";

const DARK = "#323232";

const principles = [
  {
    title: "Limited purpose",
    description: "Uploaded images are used to support model inference and the result experience inside this app.",
    icon: Database,
  },
  {
    title: "Minimal exposure",
    description: "The app avoids unnecessary sharing and keeps the workflow focused on what is needed for analysis.",
    icon: EyeOff,
  },
  {
    title: "Protected access",
    description: "API keys and provider credentials should stay in environment variables, not hardcoded into the UI.",
    icon: LockKeyhole,
  },
  {
    title: "Human review matters",
    description: "Even with strong technical safeguards, clinical interpretation should remain a human-led step.",
    icon: Shield,
  },
];

export default function PrivacyPage() {
  const pageRef = useRef(null);
  useRevealMotion(pageRef);

  return (
    <main
      ref={pageRef}
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(circle at top, rgba(255,255,255,0.32), transparent 34%), linear-gradient(180deg, #F1E8E0 0%, #DDD0C8 100%)",
      }}
    >
      <section className="mx-auto max-w-7xl px-6 py-14 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.06fr_0.94fr]">
          <div
            data-reveal
            className="rounded-[2rem] border px-7 py-9 shadow-[0_24px_70px_rgba(50,50,50,0.08)] md:px-10"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.86), rgba(246,238,231,0.8))",
              borderColor: "rgba(50,50,50,0.10)",
            }}
          >
            <p className="text-sm uppercase tracking-[0.24em]" style={{ color: "rgba(50,50,50,0.56)" }}>
              Privacy & trust
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl" style={{ color: DARK }}>
              A clearer explanation of what happens to data in Early ALsist.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8" style={{ color: "rgba(50,50,50,0.78)" }}>
              This page explains the intent behind data handling in straightforward language so people understand what is processed, where third-party services appear, and what the main limitations still are.
            </p>
          </div>

          <div
            data-reveal
            data-parallax
            className="rounded-[2rem] border p-7"
            style={{
              background: "linear-gradient(180deg, rgba(50,50,50,0.96), rgba(68,68,68,0.9))",
              borderColor: "rgba(255,255,255,0.08)",
              color: "#F7F1EC",
              boxShadow: "0 22px 54px rgba(50,50,50,0.16)",
            }}
          >
            <p className="text-sm uppercase tracking-[0.24em] text-white/58">Quick summary</p>
            <div className="mt-5 space-y-4 text-sm leading-7 text-white/78">
              <p>MRI uploads are processed for inference.</p>
              <p>Storage behavior depends on how the backend is deployed and configured.</p>
              <p>Gemini is only used for chat-style text generation, not for image classification.</p>
              <p>Results should never replace medical consultation.</p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {principles.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              data-reveal
              className="rounded-[1.75rem] border p-6 shadow-[0_18px_44px_rgba(50,50,50,0.06)]"
              style={{
                backgroundColor: "rgba(255,255,255,0.72)",
                borderColor: "rgba(50,50,50,0.10)",
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "rgba(50,50,50,0.08)", color: DARK }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold" style={{ color: DARK }}>
                {title}
              </h2>
              <p className="mt-3 leading-7" style={{ color: "rgba(50,50,50,0.76)" }}>
                {description}
              </p>
            </article>
          ))}
        </div>

        <div
          data-reveal
          className="mt-10 rounded-[1.75rem] border p-6"
          style={{
            backgroundColor: "rgba(247,241,236,0.72)",
            borderColor: "rgba(50,50,50,0.10)",
          }}
        >
          <p className="text-sm uppercase tracking-[0.24em]" style={{ color: "rgba(50,50,50,0.56)" }}>
            Contact
          </p>
          <p className="mt-3 leading-8" style={{ color: "rgba(50,50,50,0.78)" }}>
            For support or questions about setup, you can use the contact form inside the app. For real medical concerns, please speak with a qualified professional rather than relying on app output alone.
          </p>
        </div>
      </section>
    </main>
  );
}
