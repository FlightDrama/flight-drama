/**
 * Flight Drama Reputation System
 * 24 flight-themed ranks covering the full aviation career spectrum:
 * - Ground/Maintenance crew (4 ranks)
 * - Cabin crew (4 ranks)
 * - Air Traffic Control (4 ranks)
 * - Flight crew / Pilots (8 ranks)
 * - Management/Operations (4 ranks)
 */

export interface Rank {
  id: number;
  name: string;
  icon: string;
  minScore: number;
  maxScore: number;
  description: string;
  colour: string;
  stripes: number;
  category: 'ground' | 'cabin' | 'atc' | 'flight' | 'management';
}

export const RANKS: Rank[] = [
  // ── Ground / Maintenance ──────────────────────────────────────────────────
  {
    id: 1,
    name: "Ramp Agent",
    icon: "🔧",
    minScore: 0,
    maxScore: 24,
    description: "Just arrived on the apron. Marshalling aircraft and loading bags.",
    colour: "#6b7280",
    stripes: 0,
    category: 'ground',
  },
  {
    id: 2,
    name: "Aircraft Technician",
    icon: "⚙️",
    minScore: 25,
    maxScore: 99,
    description: "Licensed to turn wrenches. Keeping the fleet airworthy.",
    colour: "#6b7280",
    stripes: 0,
    category: 'ground',
  },
  {
    id: 3,
    name: "Engine Engineer",
    icon: "🛠️",
    minScore: 100,
    maxScore: 249,
    description: "Turbofan specialist. You know every stage of a CFM56.",
    colour: "#6b7280",
    stripes: 1,
    category: 'ground',
  },
  {
    id: 4,
    name: "Licensed Aircraft Engineer",
    icon: "📋",
    minScore: 250,
    maxScore: 499,
    description: "CAA/EASA Part-66 licence holder. Signing off airworthiness.",
    colour: "#3b82f6",
    stripes: 1,
    category: 'ground',
  },

  // ── Cabin Crew ────────────────────────────────────────────────────────────
  {
    id: 5,
    name: "Cabin Crew Trainee",
    icon: "🎀",
    minScore: 500,
    maxScore: 999,
    description: "In training. Learning safety procedures and service standards.",
    colour: "#ec4899",
    stripes: 0,
    category: 'cabin',
  },
  {
    id: 6,
    name: "Flight Attendant",
    icon: "💺",
    minScore: 1000,
    maxScore: 1999,
    description: "Qualified cabin crew. Safety first, service always.",
    colour: "#ec4899",
    stripes: 1,
    category: 'cabin',
  },
  {
    id: 7,
    name: "Senior Flight Attendant",
    icon: "🌸",
    minScore: 2000,
    maxScore: 3499,
    description: "Experienced crew member. Mentoring new joiners.",
    colour: "#a855f7",
    stripes: 2,
    category: 'cabin',
  },
  {
    id: 8,
    name: "Cabin Service Director",
    icon: "👑",
    minScore: 3500,
    maxScore: 5999,
    description: "Leading the cabin. Responsible for the entire crew and service.",
    colour: "#a855f7",
    stripes: 3,
    category: 'cabin',
  },

  // ── Air Traffic Control ───────────────────────────────────────────────────
  {
    id: 9,
    name: "ATC Trainee",
    icon: "📡",
    minScore: 6000,
    maxScore: 9999,
    description: "In training at the tower. Learning phraseology and procedures.",
    colour: "#10b981",
    stripes: 0,
    category: 'atc',
  },
  {
    id: 10,
    name: "Ground Controller",
    icon: "🗼",
    minScore: 10000,
    maxScore: 14999,
    description: "Controlling aircraft on the ground. Taxiways and apron movements.",
    colour: "#10b981",
    stripes: 1,
    category: 'atc',
  },
  {
    id: 11,
    name: "Approach Controller",
    icon: "🎯",
    minScore: 15000,
    maxScore: 24999,
    description: "Vectoring aircraft onto final approach. Precision and calm under pressure.",
    colour: "#10b981",
    stripes: 2,
    category: 'atc',
  },
  {
    id: 12,
    name: "Area Controller",
    icon: "🛰️",
    minScore: 25000,
    maxScore: 39999,
    description: "En-route control. Managing high-altitude traffic across sectors.",
    colour: "#059669",
    stripes: 3,
    category: 'atc',
  },

  // ── Flight Crew (Pilots) ──────────────────────────────────────────────────
  {
    id: 13,
    name: "Student Pilot",
    icon: "🎓",
    minScore: 40000,
    maxScore: 59999,
    description: "Learning to fly. Hours in the circuit, building confidence.",
    colour: "#3b82f6",
    stripes: 0,
    category: 'flight',
  },
  {
    id: 14,
    name: "Private Pilot",
    icon: "🛩️",
    minScore: 60000,
    maxScore: 89999,
    description: "PPL holder. Cleared for solo flight.",
    colour: "#3b82f6",
    stripes: 1,
    category: 'flight',
  },
  {
    id: 15,
    name: "Commercial Pilot",
    icon: "✈️",
    minScore: 90000,
    maxScore: 129999,
    description: "CPL in hand. Getting paid to fly.",
    colour: "#8b5cf6",
    stripes: 2,
    category: 'flight',
  },
  {
    id: 16,
    name: "First Officer",
    icon: "🪙",
    minScore: 130000,
    maxScore: 179999,
    description: "Right-hand seat on the line. Building hours toward command.",
    colour: "#8b5cf6",
    stripes: 2,
    category: 'flight',
  },
  {
    id: 17,
    name: "Senior First Officer",
    icon: "⭐",
    minScore: 180000,
    maxScore: 249999,
    description: "Experienced right-seater. Command course on the horizon.",
    colour: "#f59e0b",
    stripes: 3,
    category: 'flight',
  },
  {
    id: 18,
    name: "Captain",
    icon: "🎖️",
    minScore: 250000,
    maxScore: 349999,
    description: "Left seat. The final authority on every flight.",
    colour: "#f59e0b",
    stripes: 4,
    category: 'flight',
  },
  {
    id: 19,
    name: "Senior Captain",
    icon: "🏅",
    minScore: 350000,
    maxScore: 499999,
    description: "Thousands of hours. A mentor to new crews.",
    colour: "#f59e0b",
    stripes: 4,
    category: 'flight',
  },
  {
    id: 20,
    name: "Check Captain",
    icon: "🔍",
    minScore: 500000,
    maxScore: 699999,
    description: "Examiner. Assesses others for command and type ratings.",
    colour: "#ef4444",
    stripes: 4,
    category: 'flight',
  },

  // ── Management / Operations ───────────────────────────────────────────────
  {
    id: 21,
    name: "Fleet Captain",
    icon: "🛡️",
    minScore: 700000,
    maxScore: 999999,
    description: "Head of type. Defines standards for the entire fleet.",
    colour: "#ef4444",
    stripes: 4,
    category: 'management',
  },
  {
    id: 22,
    name: "Chief Pilot",
    icon: "🦅",
    minScore: 1000000,
    maxScore: 1499999,
    description: "Responsible for all flight operations and crew standards.",
    colour: "#dc2626",
    stripes: 4,
    category: 'management',
  },
  {
    id: 23,
    name: "Aviation Legend",
    icon: "🏆",
    minScore: 1500000,
    maxScore: 2499999,
    description: "A name known across the industry. Your record speaks for itself.",
    colour: "#d97706",
    stripes: 4,
    category: 'management',
  },
  {
    id: 24,
    name: "Hall of Fame",
    icon: "🌠",
    minScore: 2500000,
    maxScore: Infinity,
    description: "The highest honour in aviation. Your name is in the logbooks forever.",
    colour: "#f59e0b",
    stripes: 4,
    category: 'management',
  },
];

/**
 * Point values for each action type
 */
export const REPUTATION_POINTS: Record<string, number> = {
  // Article interactions
  article_reaction:        2,
  article_comment:         5,
  article_comment_reply:   3,
  article_comment_upvote:  1,
  article_share:           4,
  article_save:            1,

  // Forum interactions
  forum_post:             10,
  forum_reply:             5,
  forum_upvote_given:      1,
  forum_upvote_received:   2,

  // Newsletter
  newsletter_signup:       5,

  // Profile
  profile_complete:       10,
  profile_avatar:          5,

  // Milestones (one-time bonuses)
  first_comment:          10,
  first_forum_post:       15,
  first_share:             5,
  tenth_comment:          20,
  fiftieth_comment:       50,
};

/**
 * Get the rank for a given reputation score
 */
export function getRankForScore(score: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (score >= RANKS[i].minScore) {
      return RANKS[i];
    }
  }
  return RANKS[0];
}

/**
 * Get progress to next rank (0-100)
 */
export function getRankProgress(score: number): {
  current: Rank;
  next: Rank | null;
  progress: number;
  pointsToNext: number;
} {
  const current = getRankForScore(score);
  const currentIndex = RANKS.findIndex(r => r.id === current.id);
  const next = currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;

  if (!next) {
    return { current, next: null, progress: 100, pointsToNext: 0 };
  }

  const rangeSize = next.minScore - current.minScore;
  const progressInRange = score - current.minScore;
  const progress = Math.min(100, Math.round((progressInRange / rangeSize) * 100));
  const pointsToNext = next.minScore - score;

  return { current, next, progress, pointsToNext };
}

/**
 * Format reputation score for display
 */
export function formatScore(score: number): string {
  if (score >= 1000000) return `${(score / 1000000).toFixed(1)}M`;
  if (score >= 1000) return `${(score / 1000).toFixed(1)}K`;
  return score.toString();
}
