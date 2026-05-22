/**
 * RunwayDivider — a flight-themed section separator that looks like a runway centreline
 */
export default function RunwayDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      {/* Left runway dashes */}
      <div className="flex items-center gap-1 flex-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-0.5 flex-1 bg-[oklch(0.25_0_0)]"
            style={{ opacity: 1 - i * 0.1 }}
          />
        ))}
      </div>

      {/* Centre label or plane icon */}
      {label ? (
        <span className="shrink-0 text-xs font-black uppercase tracking-widest text-[oklch(0.85_0.18_95)] px-2">
          ✈ {label}
        </span>
      ) : (
        <span className="shrink-0 text-[oklch(0.35_0_0)] text-sm">✈</span>
      )}

      {/* Right runway dashes */}
      <div className="flex items-center gap-1 flex-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-0.5 flex-1 bg-[oklch(0.25_0_0)]"
            style={{ opacity: i * 0.1 + 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}
