// frontend/src/components/AlzheimerScroller.jsx
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function AlzheimerScroller() {
  const containerRef = useRef(null);

  const blocks = [
    {
      id: "what",
      heading: "What is Alzheimer’s?",
      text: `Alzheimer’s disease is a progressive neurodegenerative disorder that affects memory and thinking. Early detection can enable planning and clinical follow-up.`,
      image: "/images/alzheimer/alz_01_what.jpeg",
      imageAlt: "Brain scan illustration showing early changes",
    },
    {
      id: "how",
      heading: "How does it develop?",
      text: `The disease is associated with amyloid plaques and tau tangles, synaptic failure, and neuronal loss.`,
      image: "/images/alzheimer/alz_02_how.jpeg",
      imageAlt: "Illustration of amyloid and tau in brain",
    },
    {
      id: "when",
      heading: "When are signs noticeable?",
      text: `Many changes begin years before symptoms; Mild Cognitive Impairment (MCI) can be an early sign.`,
      image: "/images/alzheimer/alz_03_when.jpeg",
      imageAlt: "Timeline showing preclinical to symptomatic stages",
    },
    {
      id: "prevent",
      heading: "How to reduce risk / prevention",
      text: `Healthy lifestyle choices reduce risk: exercise, vascular control, sleep, social & cognitive engagement.`,
      image: "/images/alzheimer/alz_04_prevent.jpeg",
      imageAlt: "Healthy lifestyle montage: walking, vegetables, socializing",
    },
    {
      id: "nextsteps",
      heading: "What to do if you’re concerned",
      text: `Discuss symptoms with a clinician, consider structured testing, and plan next steps early.`,
      image: "/images/alzheimer/alz_05_actions.jpeg",
      imageAlt: "Patient and clinician discussing results",
    },
  ];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Default highlight mode (we removed UI controls)
    container.setAttribute("data-highlight", "background");

    const reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Use gsap.context to scope everything to this container
    const ctx = gsap.context(() => {
      // Shared start/end and scrub so all highlights behave consistently
      const start = "top 80%";
      const end = "top 40%";
      const scrubVal = 0.9; // consistent speed for all highlights; increase for slower fill

      // Create a tween + scrollTrigger per highlight that animates the CSS variable --fill
      const highlightEls = Array.from(container.querySelectorAll(".text-highlight"));

      const createdTweens = [];

      highlightEls.forEach((el) => {
        // initialize CSS var so CSS background-size uses it
        el.style.setProperty("--fill", "0%");

        if (reduceMotion) {
          // reduced motion: fully filled immediately
          el.style.setProperty("--fill", "100%");
          el.style.color = getComputedStyle(container).getPropertyValue("--color-text-highlight") || "#000";
          return;
        }

        // Animate the CSS variable --fill from 0% -> 100% based on scroll progress (scrub)
        const tw = gsap.to(el, {
          // gsap supports animating custom properties (CSS vars) with string values
          duration: 1,
          ease: "none",
          // target CSS var; GSAP will update style for us
          "--fill": "100%",
          // Keep color transition in sync so text color also shifts gradually
          color: getComputedStyle(container).getPropertyValue("--color-text-highlight") || "#000",
          scrollTrigger: {
            trigger: el,
            start,
            end,
            scrub: scrubVal,
            // we don't kill other triggers globally; this is scoped
          },
        });

        createdTweens.push(tw);
      });

      // Images: subtle in on enter (kept unchanged but still scoped)
      const images = Array.from(container.querySelectorAll(".scroller-image"));
      images.forEach((img) => {
        if (reduceMotion) {
          gsap.set(img, { opacity: 1, y: 0, scale: 1 });
          return;
        }
        gsap.fromTo(
          img,
          { opacity: 0, y: 30, scale: 1.02 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
              trigger: img,
              start: "top 85%",
              toggleActions: "play reverse play reverse",
            },
          }
        );
      });

      // refresh positions after setup
      ScrollTrigger.refresh();

      // Cleanup: kill only tweens we created
      return () => {
        createdTweens.forEach((t) => {
          try { t.kill(); } catch (e) {}
        });
      };
    }, container);

    return () => ctx.revert();
  }, [blocks]);

  return (
    <section ref={containerRef} className="alz-scroller max-w-5xl mx-auto px-6 py-14">
      <div className="space-y-12">
        {blocks.map((b, idx) => (
          <article key={b.id} className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-4">{b.heading}</h3>
              <p className="text-lg leading-relaxed">
                {/* Wrap only the phrases you want emphasized with .text-highlight */}
                {idx === 0 ? (
                  <>
                    <span className="text-highlight">Alzheimer’s disease</span> is a progressive
                    neurodegenerative disorder that affects memory and thinking.{" "}
                    <span className="text-highlight">Early detection</span> can enable planning and
                    clinical follow-up.
                  </>
                ) : idx === 1 ? (
                  <>
                    The disease is linked to <span className="text-highlight">amyloid plaques</span>{" "}
                    and <span className="text-highlight">tau tangles</span>.
                  </>
                ) : idx === 2 ? (
                  <>
                    Symptoms can appear years before diagnosis;{" "}
                    <span className="text-highlight">Mild Cognitive Impairment (MCI)</span> may be
                    present.
                  </>
                ) : idx === 3 ? (
                  <>
                    Risk reduction includes <span className="text-highlight">exercise</span>,{" "}
                    <span className="text-highlight">blood pressure control</span>, good sleep, and engagement.
                  </>
                ) : (
                  <>
                    If you have concerns, speak with a clinician and consider structured testing.{" "}
                    <span className="text-highlight">Early planning</span> helps.
                  </>
                )}
              </p>
            </div>

            <div className="flex justify-center">
              <img
                src={b.image}
                alt={b.imageAlt}
                className="scroller-image w-[360px] h-[360px] md:w-[420px] md:h-[420px] object-cover rounded-lg"
                draggable={false}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
