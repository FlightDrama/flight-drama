/**
 * Seed realistic reputation scores for the 30 dummy forum accounts
 * Spread across all 20 ranks to make the leaderboard look active
 */
import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get all dummy users (non-admin, non-real users)
const [users] = await conn.execute(
  `SELECT id, name FROM users WHERE role = 'user' AND openId NOT LIKE 'Jvqbhi3%' ORDER BY id`
);

console.log(`Found ${users.length} dummy users to seed`);

// Assign realistic scores spread across all 20 ranks
// Score thresholds: 0, 25, 100, 250, 500, 1000, 2000, 3500, 6000, 10000, 15000, 25000, 40000, 60000, 90000, 130000, 180000, 250000, 350000, 500000
const scoreRanges = [
  [0, 24],        // Ramp Agent
  [25, 99],       // Aircraft Technician
  [100, 249],     // Engine Engineer
  [250, 499],     // Licensed Aircraft Engineer
  [500, 999],     // Cabin Crew Trainee
  [1000, 1999],   // Flight Attendant
  [2000, 3499],   // Senior Flight Attendant
  [3500, 5999],   // Cabin Service Director
  [6000, 9999],   // Student Pilot
  [10000, 14999], // Private Pilot
  [15000, 24999], // Commercial Pilot
  [25000, 39999], // First Officer
  [40000, 59999], // Senior First Officer
  [60000, 89999], // Captain
  [90000, 129999],// Senior Captain
  [130000, 179999],// Check Captain
  [180000, 249999],// Fleet Captain
  [250000, 349999],// Chief Pilot
  [350000, 499999],// Aviation Legend
  [500000, 750000],// Hall of Fame
];

// Rank names for display
const rankNames = [
  'Ramp Agent', 'Aircraft Technician', 'Engine Engineer', 'Licensed Aircraft Engineer',
  'Cabin Crew Trainee', 'Flight Attendant', 'Senior Flight Attendant', 'Cabin Service Director',
  'Student Pilot', 'Private Pilot', 'Commercial Pilot', 'First Officer',
  'Senior First Officer', 'Captain', 'Senior Captain', 'Check Captain',
  'Fleet Captain', 'Chief Pilot', 'Aviation Legend', 'Hall of Fame'
];

// Distribute users across ranks — more users in lower ranks (realistic bell curve)
// Weight: lower ranks get more users
const weights = [3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0];
const totalWeight = weights.reduce((a, b) => a + b, 0);

// Assign ranks to users
let userIndex = 0;
for (let rankIndex = 0; rankIndex < scoreRanges.length && userIndex < users.length; rankIndex++) {
  const count = Math.round((weights[rankIndex] / totalWeight) * users.length);
  const [minScore, maxScore] = scoreRanges[rankIndex];
  
  for (let i = 0; i < count && userIndex < users.length; i++) {
    const user = users[userIndex];
    // Random score within the rank range
    const score = Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;
    const rankName = rankNames[rankIndex];
    
    await conn.execute(
      'UPDATE users SET reputationScore = ?, reputationRank = ? WHERE id = ?',
      [score, rankName, user.id]
    );
    
    console.log(`✅ ${user.name.padEnd(30)} → ${rankName} (${score.toLocaleString()} pts)`);
    userIndex++;
  }
}

// Any remaining users get Ramp Agent
while (userIndex < users.length) {
  const user = users[userIndex];
  const score = Math.floor(Math.random() * 24);
  await conn.execute(
    'UPDATE users SET reputationScore = ?, reputationRank = ? WHERE id = ?',
    [score, 'Ramp Agent', user.id]
  );
  console.log(`✅ ${user.name.padEnd(30)} → Ramp Agent (${score} pts)`);
  userIndex++;
}

await conn.end();
console.log(`\n✈ Done! Seeded reputation scores for ${users.length} users.`);
