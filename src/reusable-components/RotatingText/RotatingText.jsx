/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function RotatingText({
  texts = [],
  mainClassName = "",
  staggerFrom = "last",
  initial = { y: "100%" },
  animate = { y: 0 },
  exit = { y: "-120%" },
  staggerDuration = 0.025,
  splitLevelClassName = "overflow-hidden",
  transition = { type: "spring", damping: 30, stiffness: 400 },
  rotationInterval = 2000,
}) {
  const [index, setIndex] = useState(0);
  const currentText = texts[index] ?? texts[0] ?? "";

  useEffect(() => {
    if (texts.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % texts.length);
    }, rotationInterval);
    return () => clearInterval(id);
  }, [texts.length, rotationInterval]);

  const chars = currentText.split("");
  const stagger = (i) =>
    staggerFrom === "last" ? (chars.length - 1 - i) * staggerDuration : i * staggerDuration;

  return (
    <span className={`inline-flex items-center ${mainClassName}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentText}
          className={`inline-flex flex-wrap justify-center ${splitLevelClassName}`}
        >
          {chars.map((char, i) => (
            <motion.span
              key={`${currentText}-${i}-${char}`}
              className="inline-block"
              initial={initial}
              animate={animate}
              exit={exit}
              transition={{
                ...transition,
                delay: stagger(i),
              }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
