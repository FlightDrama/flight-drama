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
  // Ground / Maintenance
  { title: "Ramp Agent",              icon: "🔧", stripes: 0, minPosts: 0,    colour: "text-[oklch(0.55_0_0)]",    description: "Just arrived on the apron" },
  { title: "Aircraft Technician",     icon: "⚙️", stripes: 0, minPosts: 1,    colour: "text-[oklch(0.60_0_0)]",    description: "Keeping the fleet airworthy" },
  { title: "Engine Engineer",         icon: "🛠️", stripes: 1, minPosts: 5,    colour: "text-[oklch(0.60_0_0)]",    description: "Turbofan specialist" },
  { title: "Licensed Aircraft Eng.",  icon: "📋", stripes: 1, minPosts: 10,   colour: "text-sky-400",               description: "Part-66 licence holder" },
  // Cabin Crew
  { title: "Cabin Crew Trainee",      icon: "🎀", stripes: 0, minPosts: 15,   colour: "text-pink-400",              description: "In training" },
  { title: "Flight Attendant",        icon: "💺", stripes: 1, minPosts: 25,   colour: "text-pink-400",              description: "Safety first, service always" },
  { title: "Senior Flight Attendant", icon: "🌸", stripes: 2, minPosts: 40,   colour: "text-purple-400",            description: "Mentoring new joiners" },
  { title: "Cabin Service Director",  icon: "👑", stripes: 3, minPosts: 60,   colour: "text-purple-400",            description: "Leading the cabin" },
  // Air Traffic Control
  { title: "ATC Trainee",             icon: "📡", stripes: 0, minPosts: 80,   colour: "text-emerald-400",           description: "Learning phraseology" },
  { title: "Ground Controller",       icon: "🗳️", stripes: 1, minPosts: 110,  colour: "text-emerald-400",           description: "Taxiways and apron" },
  { title: "Approach Controller",     icon: "🎯", stripes: 2, minPosts: 150,  colour: "text-green-400",             description: "Vectoring onto final" },
  { title: "Area Controller",         icon: "🛰️", stripes: 3, minPosts: 200,  colour: "text-green-400",             description: "En-route sector control" },
  // Flight Crew
  { title: "Student Pilot",           icon: "🎓", stripes: 0, minPosts: 250,  colour: "text-blue-400",              description: "Learning to fly" },
  { title: "Private Pilot",           icon: "🛩️", stripes: 1, minPosts: 325,  colour: "text-blue-400",              description: "PPL holder" },
  { title: "Commercial Pilot",        icon: "✈️", stripes: 2, minPosts: 425,  colour: "text-indigo-400",            description: "CPL qualified" },
  { title: "First Officer",           icon: "🪙", stripes: 2, minPosts: 550,  colour: "text-indigo-400",            description: "Right seat crew" },
  { title: "Senior First Officer",    icon: "⭐", stripes: 3, minPosts: 700,  colour: "text-[oklch(0.85_0.18_95)]", description: "Experienced FO" },
  { title: "Captain",                 icon: "🎖️", stripes: 4, minPosts: 900,  colour: "text-[oklch(0.85_0.18_95)]", description: "Left seat command" },
  { title: "Senior Captain",          icon: "🏅", stripes: 4, minPosts: 1200, colour: "text-[oklch(0.85_0.18_95)]", description: "Thousands of hours" },
  { title: "Check Captain",           icon: "🔍", stripes: 4, minPosts: 1600, colour: "text-orange-400",            description: "Examiner" },
  // Management
  { title: "Fleet Captain",           icon: "🛡️", stripes: 4, minPosts: 2000, colour: "text-red-400",               description: "Head of type" },
  { title: "Chief Pilot",             icon: "🦅", stripes: 4, minPosts: 2500, colour: "text-red-400",               description: "Head of operations" },
  { title: "Aviation Legend",         icon: "🏆", stripes: 4, minPosts: 3200, colour: "text-[oklch(0.85_0.18_95)]", description: "Community icon" },
  { title: "Hall of Fame",            icon: "🌠", stripes: 4, minPosts: 4000, colour: "text-[oklch(0.85_0.18_95)]", description: "Your name in the logbooks" },
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
