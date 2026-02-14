// frontend/src/pages/HomePage.jsx
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import AlzheimerScroller from "@/components/AlzheimerScroller";

gsap.registerPlugin(ScrollTrigger);

// Colors
const BEIGE = "#DDD0C8";
const DARK = "#323232";

const steps = [
  { title: "Upload Medical Data", description: "Upload anonymized MRI slices (axial view) or related medical reports securely to begin analysis.", image: "/images/step1.jpeg" },
  { title: "AI Analysis", description: "Our TunedCNN model preprocesses and evaluates scans to highlight patterns associated with early neurodegenerative change.", image: "/images/step2.jpeg" },
  { title: "Explainable Result", description: "Receive a concise classification and an explainability note that highlights the model's reasoning and confidence.", image: "/images/step3.jpeg" },
  { title: "Actionable Precautions", description: "The assistant provides plain-language precautions and recommended next steps — always recommend clinical confirmation.", image: "/images/step4.jpeg" }
];

export default function HomePage() {
  const navigate = useNavigate();

  const sectionRef = useRef(null);
  const pinRef = useRef(null);
  const textRef = useRef(null);

  // two image refs for crossfading
  const imgARef = useRef(null);
  const imgBRef = useRef(null);
  const activeImg = useRef("A"); // which image is currently visible ("A" or "B")
  const prevIndexRef = useRef(0);

  const [index, setIndex] = useState(0);
  const [spacerHeight, setSpacerHeight] = useState(0);

  // computeSpacer: compute ScrollTrigger pinned scroll length (no manual spacer element needed)
  function computeSpacer() {
    const vh = Math.max(window.innerHeight || 800, 600);
    const pinEl = pinRef.current;
    const pinH = pinEl ? Math.ceil(pinEl.getBoundingClientRect().height) : 0;
    // one viewport per additional step minus pinned height; clamp to sensible minimum
    const desired = Math.max(((steps.length - 1) * vh) - pinH, Math.round(vh * 0.35), 0);
    setSpacerHeight(desired);
  }

  // initial image setup
  useEffect(() => {
    // set A to initial index image, B to next (hidden)
    if (imgARef.current) {
      imgARef.current.src = steps[0].image;
      imgARef.current.alt = steps[0].title;
      imgARef.current.style.opacity = "1";
    }
    if (imgBRef.current) {
      const nextIdx = (0 + 1) % steps.length;
      imgBRef.current.src = steps[nextIdx].image;
      imgBRef.current.alt = steps[nextIdx].title;
      imgBRef.current.style.opacity = "0";
    }
  }, []);

  useEffect(() => {
    computeSpacer();

    const onResize = () => {
      computeSpacer();
      if (ScrollTrigger) ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);

    // observe pin size changes (keeps spacer accurate)
    let ro;
    if (pinRef.current && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        computeSpacer();
        if (ScrollTrigger) ScrollTrigger.refresh();
      });
      ro.observe(pinRef.current);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      if (ro) ro.disconnect();
    };
  }, []);

  // pinned scroller (note: scrub set to a numeric value to smooth / slow transitions)
  useEffect(() => {
    if (!pinRef.current || spacerHeight === 0) return;

    // kill old triggers (helps during dev/hot reload)
    // NOTE: this is OK here because this component created the pinned trigger; keep scoped revert below
    ScrollTrigger.getAll().forEach((t) => {
      // kill only triggers attached to this sectionRef if possible (safe approach)
      if (t.trigger && sectionRef.current && sectionRef.current.contains(t.trigger)) t.kill();
    });

    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: `+=${spacerHeight}`,
        pin: pinRef.current,
        pinSpacing: true,
        scrub: 1.2, // <--- numeric scrub slows/smooths scroll-driven animation (0.5-1.2 are good ranges)
        anticipatePin: 1,
        onUpdate: (self) => {
          // drive step index using progress; clamp to last step
          const i = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
          setIndex((prev) => (prev !== i ? i : prev));
        },
      });

      // subtle initial in for text area (not images — handled separately)
      gsap.fromTo(textRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" });

      return () => st.kill();
    }, sectionRef);

    return () => ctx.revert();
  }, [spacerHeight]);

  // text + image crossfade on index change
  useEffect(() => {
    if (!textRef.current) return;

    // animate text entrance on index change
    const tlText = gsap.timeline();
    tlText.fromTo(textRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" });

    // crossfade images
    const prev = prevIndexRef.current;
    if (prev === index) {
      // first render or no change
      prevIndexRef.current = index;
      return () => tlText.kill();
    }

    const showA = activeImg.current === "A";
    const incoming = showA ? imgBRef.current : imgARef.current;
    const outgoing = showA ? imgARef.current : imgBRef.current;

    if (!incoming || !outgoing) {
      prevIndexRef.current = index;
      return () => tlText.kill();
    }

    // set incoming image src & alt
    incoming.src = steps[index].image;
    incoming.alt = steps[index].title;

    // helper to run the crossfade once incoming is ready
    let tlImgCleanup = null;
    const doCrossfade = () => {
      const tl = gsap.timeline();
      // ensure incoming is above outgoing during transition
      gsap.set(incoming, { zIndex: 2 });
      gsap.set(outgoing, { zIndex: 1 });

      tl.fromTo(incoming, { opacity: 0, scale: 1.02 }, { opacity: 1, scale: 1, duration: 0.6, ease: "power3.out" }, 0);
      tl.to(outgoing, { opacity: 0, scale: 0.98, duration: 0.55, ease: "power3.out" }, 0);
      // after animation, ensure outgoing is hidden
      tl.call(() => {
        outgoing.style.opacity = "0";
      }, null, ">");
      tlImgCleanup = () => tl.kill();
    };

    if (incoming.complete) {
      doCrossfade();
      // flip active pointer
      activeImg.current = showA ? "B" : "A";
      prevIndexRef.current = index;
    } else {
      // wait for image load then crossfade
      const onLoad = () => {
        doCrossfade();
        activeImg.current = showA ? "B" : "A";
        prevIndexRef.current = index;
        incoming.removeEventListener("load", onLoad);
      };
      incoming.addEventListener("load", onLoad);
      // if incoming fails to load, still flip index to avoid freeze
      const onError = () => {
        // fallback: immediately swap (no animation)
        incoming.style.opacity = "1";
        outgoing.style.opacity = "0";
        activeImg.current = showA ? "B" : "A";
        prevIndexRef.current = index;
        incoming.removeEventListener("error", onError);
        incoming.removeEventListener("load", onLoad);
      };
      incoming.addEventListener("error", onError);

      // cleanup for load/error listeners
      return () => {
        incoming.removeEventListener("load", onLoad);
        incoming.removeEventListener("error", onError);
        if (tlImgCleanup) tlImgCleanup();
        tlText.kill();
      };
    }

    return () => {
      if (tlImgCleanup) tlImgCleanup();
      tlText.kill();
    };
  }, [index]);

  const progressPct = steps.length > 1 ? Math.round((index / (steps.length - 1)) * 100) : 0;

  return (
    <main className="flex flex-col">
      {/* HERO */}
      <section
        className="min-h-[72vh] flex items-center justify-center"
        style={{ backgroundColor: BEIGE, color: DARK }}
      >
        <div className="text-center max-w-4xl px-6">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight" style={{ color: DARK }}>
            AI-Powered Alzheimer’s Early Detection
          </h1>
          <p className="mt-4 text-lg" style={{ color: DARK, opacity: 0.85 }}>
            A research-oriented proof-of-concept that analyzes MRI scans to surface early patterns — designed for screening & research, not a clinical diagnosis.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/detect")}
              // primary dark-grey button
              className="shadow"
              style={{ backgroundColor: DARK, color: "#fff", borderColor: DARK }}
            >
              Start Detection
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/how-it-works")}
              style={{ color: DARK, borderColor: DARK }}
            >
              How it Works
            </Button>
          </div>
        </div>
      </section>

      {/* SCROLL STORY */}
      <section ref={sectionRef} aria-label="Pipeline scroller">
        {/* PINNED FULL-WIDTH SECTION */}
        <div
          ref={pinRef}
          className="min-h-screen flex items-center"
          style={{ backgroundColor: "#DDD0C8" }} // beige
        >
          <div className="max-w-6xl mx-auto w-full px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* TEXT */}
            <div ref={textRef}>
              <h2
                className="text-3xl md:text-4xl font-semibold leading-tight"
                style={{ color: "#323232" }}
              >
                {steps[index].title}
              </h2>

              <p
                className="mt-4 text-lg max-w-lg"
                style={{ color: "#323232", opacity: 0.85 }}
              >
                {steps[index].description}
              </p>

              <div className="mt-6 flex gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate("/detect")}
                  style={{ backgroundColor: "#323232", color: "#fff" }}
                >
                  Try Detection
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/how-it-works")}
                  style={{ borderColor: "#323232", color: "#323232" }}
                >
                  Learn More
                </Button>
              </div>
            </div>

            {/* IMAGE (double-buffered for crossfade) */}
            <div className="flex justify-center">
              <div className="relative w-[380px] h-[380px] md:w-[460px] md:h-[460px]">
                <img
                  ref={imgARef}
                  src={steps[0].image}
                  alt={steps[0].title}
                  className="absolute inset-0 w-full h-full object-cover rounded-xl"
                  style={{
                    boxShadow: "0 18px 40px rgba(50,50,50,0.15)",
                    opacity: 1,
                    transition: "opacity 350ms ease",
                  }}
                  draggable={false}
                />
                <img
                  ref={imgBRef}
                  src={steps[1 % steps.length].image}
                  alt={steps[1 % steps.length].title}
                  className="absolute inset-0 w-full h-full object-cover rounded-xl"
                  style={{
                    boxShadow: "0 18px 40px rgba(50,50,50,0.15)",
                    opacity: 0,
                    transition: "opacity 350ms ease",
                  }}
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section style={{ backgroundColor: BEIGE }} className="py-12">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg" style={{ background: "white", border: `1px solid rgba(50,50,50,0.06)`, boxShadow: "0 6px 20px rgba(50,50,50,0.03)" }}>
            <h3 className="text-lg font-semibold" style={{ color: DARK }}>Early Screening</h3>
            <p className="mt-2" style={{ color: DARK, opacity: 0.8 }}>Quick, automated assessments that can flag scans for further clinical review.</p>
          </div>

          <div className="p-6 rounded-lg" style={{ background: "white", border: `1px solid rgba(50,50,50,0.06)`, boxShadow: "0 6px 20px rgba(50,50,50,0.03)" }}>
            <h3 className="text-lg font-semibold" style={{ color: DARK }}>Explainability</h3>
            <p className="mt-2" style={{ color: DARK, opacity: 0.8 }}>Human-friendly explanations and confidence scores accompany results.</p>
          </div>

          <div className="p-6 rounded-lg" style={{ background: "white", border: `1px solid rgba(50,50,50,0.06)`, boxShadow: "0 6px 20px rgba(50,50,50,0.03)" }}>
            <h3 className="text-lg font-semibold" style={{ color: DARK }}>Privacy-first</h3>
            <p className="mt-2" style={{ color: DARK, opacity: 0.8 }}>Images are processed respecting privacy settings; refer to the Privacy page for details.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <AlzheimerScroller />
    </main>
  );
}
