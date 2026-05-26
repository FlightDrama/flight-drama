/**
 * AdSlot — Renders an ad placement slot.
 *
 * HOW TO ACTIVATE GOOGLE ADSENSE:
 * 1. Sign up at https://adsense.google.com
 * 2. Get your publisher ID (ca-pub-XXXXXXXXXXXXXXXX)
 * 3. Add VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX to Settings → Secrets
 * 4. Add VITE_ADSENSE_SLOT_BANNER=XXXXXXXXXX (homepage banner slot ID)
 * 5. Add VITE_ADSENSE_SLOT_SIDEBAR=XXXXXXXXXX (sidebar slot ID)
 * 6. Add VITE_ADSENSE_SLOT_ARTICLE=XXXXXXXXXX (article mid-content slot ID)
 * 7. The slots will automatically switch from placeholder to live ads
 *
 * Slot types:
 * - "banner"  → 728×90 leaderboard (homepage top/bottom)
 * - "sidebar" → 300×250 medium rectangle (article/homepage sidebar)
 * - "article" → 336×280 large rectangle (mid-article)
 */

type AdSlotProps = {
  slot: "banner" | "sidebar" | "article";
  className?: string;
};

const SLOT_SIZES: Record<string, { width: number; height: number; label: string }> = {
  banner:  { width: 728, height: 90,  label: "Leaderboard 728×90" },
  sidebar: { width: 300, height: 250, label: "Medium Rectangle 300×250" },
  article: { width: 336, height: 280, label: "Large Rectangle 336×280" },
};

export default function AdSlot({ slot, className = "" }: AdSlotProps) {
  const client = import.meta.env.VITE_ADSENSE_CLIENT;
  const slotIds: Record<string, string | undefined> = {
    banner:  import.meta.env.VITE_ADSENSE_SLOT_BANNER,
    sidebar: import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR,
    article: import.meta.env.VITE_ADSENSE_SLOT_ARTICLE,
  };
  const slotId = slotIds[slot];
  const size = SLOT_SIZES[slot];

  // Live AdSense — activated once VITE_ADSENSE_CLIENT is set
  if (client && slotId) {
    return (
      <div className={`ad-slot ad-slot-${slot} overflow-hidden ${className}`}>
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: size.width, height: size.height }}
          data-ad-client={client}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <script>{`(adsbygoogle = window.adsbygoogle || []).push({});`}</script>
      </div>
    );
  }

  // Placeholder — shown until AdSense is configured
  // Only visible in development or when VITE_SHOW_AD_PLACEHOLDERS=true
  const showPlaceholder = import.meta.env.DEV || import.meta.env.VITE_SHOW_AD_PLACEHOLDERS === "true";
  if (!showPlaceholder) return null;

  return (
    <div
      className={`ad-slot-placeholder flex items-center justify-center bg-[oklch(0.13_0_0)] border border-dashed border-[oklch(0.25_0_0)] ${className}`}
      style={{ width: "100%", maxWidth: size.width, height: size.height }}
    >
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.35_0_0)] mb-1">Ad Slot</p>
        <p className="text-[10px] text-[oklch(0.28_0_0)]">{size.label}</p>
        <p className="text-[9px] text-[oklch(0.25_0_0)] mt-1">Sign up for AdSense to activate</p>
      </div>
    </div>
  );
}
