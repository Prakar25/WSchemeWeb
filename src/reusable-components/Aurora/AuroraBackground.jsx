import Aurora from "./Aurora";

/**
 * Full-screen animated Aurora background.
 * Theme colors: #d85a30 (bright orange), #ffb766 (grandpa orange), #c2edda (grey blue green), #68d388 (live green)
 */
export default function AuroraBackground() {
  return (
    <div className="aurora-wrapper" aria-hidden="true">
      <Aurora
        colorStops={["#d85a30", "#ffb766", "#68d388"]}
        blend={0.5}
        amplitude={1.0}
        speed={1}
      />
      {/* Light overlay for readability – keeps the animation visible but bright */}
      <div
        className="absolute inset-0 bg-white/80 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
