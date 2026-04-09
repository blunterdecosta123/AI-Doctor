import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function useRevealMotion(scopeRef, options = {}) {
  const {
    selector = "[data-reveal]",
    parallaxSelector = "[data-parallax]",
    start = "top 82%",
    y = 36,
    stagger = 0.12,
  } = options;

  useEffect(() => {
    if (!scopeRef.current) return undefined;

    const ctx = gsap.context(() => {
      const revealItems = gsap.utils.toArray(selector);
      if (revealItems.length > 0) {
        gsap.fromTo(
          revealItems,
          { autoAlpha: 0, y },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.85,
            stagger,
            ease: "power3.out",
            scrollTrigger: {
              trigger: scopeRef.current,
              start,
            },
          }
        );
      }

      const parallaxItems = gsap.utils.toArray(parallaxSelector);
      parallaxItems.forEach((item) => {
        gsap.fromTo(
          item,
          { yPercent: 0 },
          {
            yPercent: -8,
            ease: "none",
            scrollTrigger: {
              trigger: item,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
            },
          }
        );
      });
    }, scopeRef);

    return () => ctx.revert();
  }, [parallaxSelector, scopeRef, selector, stagger, start, y]);
}
