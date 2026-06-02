/**
 * Flight Drama — Pilot Rank System
 * Now powered by the full 15-rank reputation system.
 * Forum post count is still used for the forum badge,
 * but the reputation score drives the full rank system.
 */

export { RANKS, getRankForScore, getRankProgress, formatScore } from "../../../shared/reputation";

// Legacy post-count based rank for forum badges
export type PilotRank = {
  title: string;
  icon: string;
  stripes: number;
  minPosts: number;
  colour: string;
  description: string;
};

export const PILOT_RANKS: PilotRank[] = [
  { title: "Ground Crew",          icon: "🔧", stripes: 0, minPosts: 0,    colour: "text-[oklch(0.55_0_0)]",   description: "Just arrived on the apron" },
  { title: "Student Pilot",        icon: "🎓", stripes: 0, minPosts: 1,    colour: "text-[oklch(0.60_0_0)]",   description: "Learning the ropes" },
  { title: "Private Pilot",        icon: "🛩️", stripes: 1, minPosts: 5,    colour: "text-sky-400",              description: "PPL holder" },
  { title: "Instrument Rated",     icon: "🎯", stripes: 1, minPosts: 10,   colour: "text-sky-400",              description: "IFR certified" },
  { title: "Commercial Pilot",     icon: "✈️", stripes: 2, minPosts: 20,   colour: "text-blue-400",             description: "CPL qualified" },
  { title: "First Officer",        icon: "🪙", stripes: 2, minPosts: 40,   colour: "text-indigo-400",           description: "Right seat crew" },
  { title: "Senior First Officer", icon: "⭐", stripes: 3, minPosts: 75,   colour: "text-purple-400",           description: "Experienced FO" },
  { title: "Captain",              icon: "🎖️", stripes: 4, minPosts: 125,  colour: "text-[oklch(0.85_0.18_95)]", description: "Left seat command" },
  { title: "Senior Captain",       icon: "🏅", stripes: 4, minPosts: 200,  colour: "text-[oklch(0.85_0.18_95)]", description: "Thousands of hours" },
  { title: "Check Captain",        icon: "🔍", stripes: 4, minPosts: 350,  colour: "text-orange-400",           description: "Examiner" },
  { title: "Fleet Captain",        icon: "🛡️", stripes: 4, minPosts: 500,  colour: "text-red-400",              description: "Head of type" },
  { title: "Chief Pilot",          icon: "🦅", stripes: 4, minPosts: 750,  colour: "text-red-400",              description: "Head of operations" },
  { title: "Director of Ops",      icon: "🌟", stripes: 4, minPosts: 1000, colour: "text-red-500",              description: "Top of the pyramid" },
  { title: "Aviation Legend",      icon: "🏆", stripes: 4, minPosts: 1500, colour: "text-[oklch(0.85_0.18_95)]", description: "Community icon" },
  { title: "Hall of Fame",         icon: "🌠", stripes: 4, minPosts: 2500, colour: "text-[oklch(0.85_0.18_95)]", description: "Your name in the logbooks" },
];

export function getPilotRank(postCount: number): PilotRank {
  let rank = PILOT_RANKS[0];
  for (const r of PILOT_RANKS) {
    if (postCount >= r.minPosts) rank = r;
  }
  return rank;
}

export function getStripeDisplay(stripes: number): string {
  return "▬".repeat(stripes);
}
