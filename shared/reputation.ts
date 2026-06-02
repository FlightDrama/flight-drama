/**
 * Flight Drama Reputation System
 * 15 flight-themed ranks inspired by real aviation career progression
 * Reddit-style scoring across all user interactions
 */

export interface Rank {
  id: number;
  name: string;
  icon: string;         // emoji
  minScore: number;
  maxScore: number;
  description: string;
  colour: string;       // tailwind/hex colour
  stripes: number;      // epaulette stripes (0-4)
}

export const RANKS: Rank[] = [
  {
    id: 1,
    name: "Ground Crew",
    icon: "🔧",
    minScore: 0,
    maxScore: 24,
    description: "Just arrived on the apron. Welcome to the team.",
    colour: "#6b7280",
    stripes: 0,
  },
  {
    id: 2,
    name: "Student Pilot",
    icon: "🎓",
    minScore: 25,
    maxScore: 99,
    description: "Learning the ropes in the circuit.",
    colour: "#6b7280",
    stripes: 0,
  },
  {
    id: 3,
    name: "Private Pilot",
    icon: "🛩️",
    minScore: 100,
    maxScore: 249,
    description: "PPL in hand. Cleared for solo flight.",
    colour: "#3b82f6",
    stripes: 1,
  },
  {
    id: 4,
    name: "Instrument Rated",
    icon: "🎯",
    minScore: 250,
    maxScore: 499,
    description: "Flying in the clouds. IFR certified.",
    colour: "#3b82f6",
    stripes: 1,
  },
  {
    id: 5,
    name: "Commercial Pilot",
    icon: "✈️",
    minScore: 500,
    maxScore: 999,
    description: "CPL holder. Getting paid to fly.",
    colour: "#8b5cf6",
    stripes: 2,
  },
  {
    id: 6,
    name: "First Officer",
    icon: "🪙",
    minScore: 1000,
    maxScore: 1999,
    description: "Right-hand seat. Building hours on the line.",
    colour: "#8b5cf6",
    stripes: 2,
  },
  {
    id: 7,
    name: "Senior First Officer",
    icon: "⭐",
    minScore: 2000,
    maxScore: 3499,
    description: "Experienced right-seater. Command course approaching.",
    colour: "#f59e0b",
    stripes: 3,
  },
  {
    id: 8,
    name: "Captain",
    icon: "🎖️",
    minScore: 3500,
    maxScore: 5999,
    description: "Left seat. The final authority.",
    colour: "#f59e0b",
    stripes: 4,
  },
  {
    id: 9,
    name: "Senior Captain",
    icon: "🏅",
    minScore: 6000,
    maxScore: 9999,
    description: "Thousands of hours. Mentor to new crews.",
    colour: "#f59e0b",
    stripes: 4,
  },
  {
    id: 10,
    name: "Check Captain",
    icon: "🔍",
    minScore: 10000,
    maxScore: 14999,
    description: "Examiner. Assesses others for command.",
    colour: "#ef4444",
    stripes: 4,
  },
  {
    id: 11,
    name: "Fleet Captain",
    icon: "🛡️",
    minScore: 15000,
    maxScore: 24999,
    description: "Head of type. Defines standards for the fleet.",
    colour: "#ef4444",
    stripes: 4,
  },
  {
    id: 12,
    name: "Chief Pilot",
    icon: "🦅",
    minScore: 25000,
    maxScore: 39999,
    description: "Responsible for all flight operations.",
    colour: "#dc2626",
    stripes: 4,
  },
  {
    id: 13,
    name: "Director of Flight Ops",
    icon: "🌟",
    minScore: 40000,
    maxScore: 59999,
    description: "The top of the operational pyramid.",
    colour: "#dc2626",
    stripes: 4,
  },
  {
    id: 14,
    name: "Aviation Legend",
    icon: "🏆",
    minScore: 60000,
    maxScore: 99999,
    description: "A name known across the industry.",
    colour: "#d97706",
    stripes: 4,
  },
  {
    id: 15,
    name: "Hall of Fame",
    icon: "🌠",
    minScore: 100000,
    maxScore: Infinity,
    description: "The highest honour. Your name is in the logbooks forever.",
    colour: "#f59e0b",
    stripes: 4,
  },
];

/**
 * Point values for each action type
 */
export const REPUTATION_POINTS: Record<string, number> = {
  // Article interactions
  article_reaction:        2,   // reacting to an article (✈ love it, 🔥 hot take, etc.)
  article_comment:         5,   // posting a comment on an article
  article_comment_reply:   3,   // replying to a comment on an article
  article_comment_upvote:  1,   // upvoting someone else's comment
  article_share:           4,   // sharing an article (any platform)
  article_save:            1,   // saving an article to Departure Lounge

  // Forum interactions
  forum_post:             10,   // creating a new forum thread
  forum_reply:             5,   // replying in a forum thread
  forum_upvote_given:      1,   // upvoting a forum post
  forum_upvote_received:   2,   // having your forum post upvoted

  // Newsletter
  newsletter_signup:       5,   // subscribing to the newsletter

  // Profile
  profile_complete:       10,   // completing profile (avatar + bio)
  profile_avatar:          5,   // uploading a profile photo

  // Milestones (one-time bonuses)
  first_comment:          10,   // first ever comment
  first_forum_post:       15,   // first ever forum post
  first_share:             5,   // first ever share
  tenth_comment:          20,   // 10th comment milestone
  fiftieth_comment:       50,   // 50th comment milestone
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
