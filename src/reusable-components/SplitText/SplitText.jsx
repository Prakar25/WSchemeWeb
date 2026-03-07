import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * SplitText - Animated text split into chars/words. Uses manual split (no premium GSAP SplitText).
 * @see https://reactbits.dev/text-animations/split-text
 */
const SplitText = ({
  text,
  className = "",
  delay = 50,
  duration = 1.25,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "center",
  tag = "p",
  onLetterAnimationComplete,
}) => {
  const containerRef = useRef(null);
  const charsRef = useRef([]);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    animationCompletedRef.current = false;
  }, [text]);

  useEffect(() => {
    if (document.fonts?.status === "loaded") {
      setFontsLoaded(true);
    } else {
      document.fonts?.ready?.then(() => setFontsLoaded(true)).catch(() => setFontsLoaded(true));
    }
  }, []);

  useGSAP(
    () => {
      if (!containerRef.current || !text || !fontsLoaded) return;
      const targets = charsRef.current.filter(Boolean);
      if (!targets.length) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: `top ${(1 - threshold) * 100}%`,
          once: true,
          fastScrollEnd: true,
        },
        onComplete: () => {
          animationCompletedRef.current = true;
          onCompleteRef.current?.();
        },
      });

      tl.fromTo(
        targets,
        { ...from },
        {
          ...to,
          duration,
          ease,
          stagger: delay / 1000,
          overwrite: "auto",
        }
      );

      return () => {
        ScrollTrigger.getAll().forEach((st) => {
          if (st.trigger === containerRef.current) st.kill();
        });
      };
    },
    {
      dependencies: [text, delay, duration, ease, splitType, fontsLoaded, JSON.stringify(from), JSON.stringify(to), threshold, rootMargin],
      scope: containerRef,
    }
  );

  const getItems = () => {
    charsRef.current = [];
    if (splitType === "chars") {
      return text.split("").map((char, i) =>
        char === " " ? (
          <span key={`${i}-${text}`} style={{ display: "inline-block", width: "0.25em" }} aria-hidden="true" />
        ) : (
          <span
            key={`${i}-${text}`}
            ref={(el) => { charsRef.current[i] = el; }}
            style={{ display: "inline-block", whiteSpace: "pre" }}
            aria-hidden="true"
          >
            {char}
          </span>
        )
      );
    }
    if (splitType === "words") {
      return text.split(/(\s+)/).map((word, i) => (
        <span
          key={`${i}-${text}`}
          ref={(el) => { charsRef.current[i] = el; }}
          style={{ display: "inline-block", marginRight: "0.25em" }}
          aria-hidden="true"
        >
          {word}
        </span>
      ));
    }
    return text;
  };

  const Tag = tag || "p";
  return (
    <Tag
      ref={containerRef}
      className={className}
      style={{ textAlign, overflow: "hidden", display: "inline-block" }}
    >
      {getItems()}
    </Tag>
  );
};

export default SplitText;
