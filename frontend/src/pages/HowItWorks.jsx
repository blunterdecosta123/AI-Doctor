import { useRef } from "react";
import { BrainCircuit, FileImage, MessagesSquare, ShieldCheck } from "lucide-react";
import useRevealMotion from "@/hooks/useRevealMotion";

const BEIGE = "#DDD0C8";
const DARK = "#323232";

const steps = [
  {
    id: "01",
    title: "Upload an MRI scan",
    description:
      "The experience starts with a simple image upload so the scan can be prepared for the model.",
    icon: FileImage,
  },
  {
    id: "02",
    title: "Prepare the image",
    description:
      "The backend resizes the MRI, converts it to grayscale, and reshapes it into the format the model expects.",
    icon: ShieldCheck,
  },
  {
    id: "03",
    title: "Run the model",
    description:
      "The tuned CNN produces a predicted class and confidence score for the uploaded image.",
    icon: BrainCircuit,
  },
  {
    id: "04",
    title: "Offer guidance",
    description:
      "The app presents the result clearly and can provide supportive follow-up guidance in simple language.",
    icon: MessagesSquare,
  },
];

export default function HowItWorks() {
  const pageRef = useRef(null);
  useRevealMotion(pageRef);

  return (
    <main
      ref={pageRef}
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(circle at top, rgba(255,255,255,0.34), transparent 32%), linear-gradient(180deg, #EFE5DC 0%, #DDD0C8 100%)",
      }}
    >
      <section className="mx-auto max-w-7xl px-6 py-14 md:py-16">
        <div
          data-reveal
          className="rounded-[2rem] border px-7 py-10 shadow-[0_24px_70px_rgba(50,50,50,0.08)] md:px-10"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.86), rgba(246,238,231,0.78))",
            borderColor: "rgba(50,50,50,0.10)",
          }}
        >
          <p
            className="text-sm font-medium uppercase tracking-[0.24em]"
            style={{ color: "rgba(50,50,50,0.58)" }}
          >
            System walkthrough
          </p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
            <div>
              <h1 className="text-4xl font-extrabold leading-tight md:text-5xl" style={{ color: DARK }}>
                A calmer, clearer look at how Early ALsist works.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8" style={{ color: "rgba(50,50,50,0.78)" }}>
                The system turns an uploaded MRI into a model-ready input, runs inference locally in the backend, and then presents the result in language that is easier to understand.
              </p>
            </div>

            <div
              data-parallax
              className="rounded-[1.75rem] border p-6"
              style={{
                background: "linear-gradient(180deg, rgba(50,50,50,0.96), rgba(70,70,70,0.9))",
                borderColor: "rgba(255,255,255,0.08)",
                color: "#F7F1EC",
                boxShadow: "0 22px 54px rgba(50,50,50,0.16)",
              }}
            >
              <p className="text-sm uppercase tracking-[0.24em] text-white/58">At a glance</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  ["Input", "MRI JPG or PNG"],
                  ["Model", "Tuned CNN classifier"],
                  ["Output", "Class + confidence"],
                  ["Guidance", "Plain-language support"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/55">{label}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {steps.map(({ id, title, description, icon: Icon }) => (
            <article
              key={id}
              data-reveal
              className="rounded-[1.75rem] border p-6 shadow-[0_18px_44px_rgba(50,50,50,0.06)]"
              style={{
                backgroundColor: "rgba(255,255,255,0.74)",
                borderColor: "rgba(50,50,50,0.10)",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: "rgba(50,50,50,0.08)", color: DARK }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em]" style={{ color: "rgba(50,50,50,0.5)" }}>
                    Step {id}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold" style={{ color: DARK }}>
                    {title}
                  </h2>
                  <p className="mt-3 leading-7" style={{ color: "rgba(50,50,50,0.76)" }}>
                    {description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div
          data-reveal
          className="mt-10 rounded-[1.75rem] border px-6 py-6"
          style={{
            backgroundColor: "rgba(247,241,236,0.68)",
            borderColor: "rgba(50,50,50,0.10)",
          }}
        >
          <p className="text-sm uppercase tracking-[0.24em]" style={{ color: "rgba(50,50,50,0.56)" }}>
            Important note
          </p>
          <p className="mt-3 max-w-4xl leading-8" style={{ color: "rgba(50,50,50,0.76)" }}>
            This is a research-style support tool. The output can help frame a conversation, but it is not a diagnosis and should always be interpreted with clinical review.
          </p>
        </div>
      </section>
    </main>
  );
}
