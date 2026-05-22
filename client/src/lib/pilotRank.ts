/**
 * Flight Drama — Pilot Rank System
 * Forum members earn pilot ranks based on their post count.
 * Ranks mirror real aviation career progression.
 */

export type PilotRank = {
  title: string;
  icon: string;       // emoji
  stripes: number;    // number of gold stripes (0-4)
  minPosts: number;
  colour: string;     // tailwind text colour class
  description: string;
};

export const PILOT_RANKS: PilotRank[] = [
  {
    title: "Student Pilot",
    icon: "🎓",
    stripes: 0,
    minPosts: 0,
    colour: "text-[oklch(0.55_0_0)]",
    description: "Just started the journey",
  },
  {
    title: "Trainee Pilot",
    icon: "✈️",
    stripes: 1,
    minPosts: 5,
    colour: "text-[oklch(0.65_0_0)]",
    description: "Building hours",
  },
  {
    title: "Private Pilot",
    icon: "🛩️",
    stripes: 1,
    minPosts: 15,
    colour: "text-sky-400",
    description: "PPL holder",
  },
  {
    title: "Commercial Pilot",
    icon: "🛫",
    stripes: 2,
    minPosts: 30,
    colour: "text-blue-400",
    description: "CPL qualified",
  },
  {
    title: "First Officer",
    icon: "🛬",
    stripes: 3,
    minPosts: 60,
    colour: "text-indigo-400",
    description: "Right seat crew",
  },
  {
    title: "Senior First Officer",
    icon: "🌐",
    stripes: 3,
    minPosts: 100,
    colour: "text-purple-400",
    description: "Experienced FO",
  },
  {
    title: "Captain",
    icon: "👨‍✈️",
    stripes: 4,
    minPosts: 200,
    colour: "text-[oklch(0.85_0.18_95)]",
    description: "Left seat command",
  },
  {
    title: "Chief Pilot",
    icon: "⭐",
    stripes: 4,
    minPosts: 500,
    colour: "text-[oklch(0.85_0.18_95)]",
    description: "Fleet authority",
  },
  {
    title: "Aviation Legend",
    icon: "🏆",
    stripes: 4,
    minPosts: 1000,
    colour: "text-[oklch(0.85_0.18_95)]",
    description: "Community icon",
  },
];

export function getPilotRank(postCount: number): PilotRank {
  // Find the highest rank the user qualifies for
  let rank = PILOT_RANKS[0];
  for (const r of PILOT_RANKS) {
    if (postCount >= r.minPosts) rank = r;
  }
  return rank;
}

/** Render gold stripe bars (like epaulettes) */
export function getStripeDisplay(stripes: number): string {
  return "▬".repeat(stripes);
}
