import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    title: "Upload Medical Data",
    description:
      "Upload X-rays, MRI scans, or medical reports securely to start diagnosis.",
    image: "/images/step1.jpeg",
  },
  {
    title: "AI Analysis",
    description:
      "Our AI model analyzes the data using deep learning algorithms.",
    image: "/images/step2.jpeg",
  },
  {
    title: "Diagnosis Report",
    description:
      "Get an accurate, fast, and explainable diagnosis with confidence score.",
    image: "/images/step3.jpeg",
  },
];

export default function ScrollProgressGallery() {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const progressRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: `+=${steps.length * 1000}`,
        scrub: true,
        pin: true,
        onUpdate: (self) => {
          const index = Math.min(
            steps.length - 1,
            Math.floor(self.progress * steps.length)
          );

          if (index !== activeIndex) {
            setActiveIndex(index);

            // Fade image on change
            gsap.fromTo(
              imageRef.current,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
            );
          }

          if (progressRef.current) {
            progressRef.current.style.width = `${self.progress * 100}%`;
          }
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [activeIndex]);

  return (
    <section ref={sectionRef} className="relative h-screen bg-white">
      <div className="mx-auto max-w-6xl h-full px-6 flex items-center gap-16">

        {/* LEFT CONTENT */}
        <div className="w-1/2">
          <div className="h-2 bg-slate-200 rounded mb-6 overflow-hidden">
            <div
              ref={progressRef}
              className="h-full bg-blue-600 w-0"
            />
          </div>

          <h2 className="text-3xl font-bold mb-4">
            {steps[activeIndex].title}
          </h2>

          <p className="text-slate-600 text-lg max-w-md">
            {steps[activeIndex].description}
          </p>

          <p className="mt-6 text-sm text-slate-400">
            Step {activeIndex + 1} of {steps.length}
          </p>
        </div>

        {/* RIGHT IMAGE */}
        <div className="w-1/2 flex justify-center">
          <img
            ref={imageRef}
            src={steps[activeIndex].image}
            alt={steps[activeIndex].title}
            className="w-[420px] h-[420px] object-cover rounded-2xl shadow-xl"
            draggable={false}
          />
        </div>

      </div>
    </section>
  );
}
