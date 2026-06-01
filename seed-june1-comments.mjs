/**
 * Generate AI comments for the 3 new June 1 articles
 * Uses the same aviation personas as previous comment seeding
 */

import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;

// Aviation community personas (same as previous seeding)
const personas = [
  { name: "Dave Thornton", username: "CaptDave_BA747", bio: "Retired BA 747 captain, 35 years flying. Now a flight instructor. Strong opinions on safety culture." },
  { name: "Sarah McAllister", username: "EasyJet_Crew_Sarah", bio: "easyJet cabin crew, 8 years. Knows the realities of low-cost aviation from the inside." },
  { name: "Neil Forsythe", username: "RetiredATC_EGLL", bio: "Retired ATC at Heathrow. Precise, technical, occasionally dry humour." },
  { name: "Tom Wickfield", username: "PPL_Student_Tom", bio: "PPL student, passionate about aviation. Asks good questions, learning fast." },
  { name: "Andy Sutherland", username: "CargoKing_Andy", bio: "Cargo pilot, 15 years. Flies 747 freighters. Practical, no-nonsense perspective." },
  { name: "Mia Kowalski", username: "AvGeek_Mia", bio: "Aviation enthusiast and photographer. Spends weekends at airports. Knows every aircraft type." },
  { name: "Chris Meadows", username: "FR24_Addict_Chris", bio: "FlightRadar24 obsessive. Tracks every interesting flight. First to spot unusual diversions." },
  { name: "James O'Brien", username: "737Captain_UK", bio: "Boeing 737 captain for a UK charter airline. 12 years experience. Straight-talking." },
  { name: "Priya Sharma", username: "AviationLaw_Priya", bio: "Aviation lawyer specialising in passenger rights and airline regulations." },
  { name: "Mike Dawson", username: "PlaneSpotter_MCR", bio: "Manchester Airport plane spotter, 20 years. Knows every livery and tail number." },
  { name: "Lucy Chen", username: "FrequentFlyer_Lucy", bio: "Business traveller, 200+ flights per year. Collects miles obsessively. Knows every airline's quirks." },
  { name: "Rob Patterson", username: "Squawk7700", bio: "Aviation safety researcher. Follows every incident report. References AAIB and NTSB findings." },
];

async function generateComments(articleId, articleTitle, articleContent, numComments = 4) {
  const textContent = articleContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1500);
  const selectedPersonas = personas.sort(() => Math.random() - 0.5).slice(0, numComments);
  
  const comments = [];
  for (const persona of selectedPersonas) {
    try {
      const res = await fetch(`${FORGE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FORGE_KEY}` },
        body: JSON.stringify({
          model: 'gemini-2.5-flash',
          messages: [
            { role: 'system', content: `You are ${persona.name} (${persona.username}). Background: ${persona.bio}. Write a single realistic comment on an aviation news article. Be authentic to your persona. 1-3 sentences. No hashtags. No emojis. Sound like a real person commenting on a news website, not a bot.` },
            { role: 'user', content: `Comment on this article:\n\nTitle: ${articleTitle}\n\nContent excerpt: ${textContent}` }
          ],
          max_tokens: 150
        })
      });
      const data = await res.json();
      const commentText = data.choices[0].message.content.trim();
      comments.push({ persona, text: commentText });
    } catch (err) {
      console.error(`Failed comment for ${persona.username}: ${err.message}`);
    }
  }
  return comments;
}

// Get the 3 new articles
const [articles] = await conn.execute(
  `SELECT id, title, content FROM articles WHERE slug IN (
    'air-canada-seats-aero-legal-battle-award-flights',
    'southwest-airlines-customer-of-size-miami-airport-incident',
    'united-airlines-ua236-bluetooth-bomb-teenager-newark-palma'
  )`
);

// Get user IDs for personas (or create dummy users)
const [existingUsers] = await conn.execute('SELECT id, name FROM users WHERE role = "user" LIMIT 50');
const userMap = {};
for (const u of existingUsers) userMap[u.name] = u.id;

for (const article of articles) {
  console.log(`\nGenerating comments for: ${article.title.slice(0, 60)}...`);
  
  const comments = await generateComments(article.id, article.title, article.content, 4);
  
  for (const { persona, text } of comments) {
    // Find or use a dummy user ID
    const userId = userMap[persona.name] || existingUsers[Math.floor(Math.random() * existingUsers.length)]?.id || 1;
    
    // Random timestamp within the last 24 hours
    const hoursAgo = Math.floor(Math.random() * 20) + 1;
    const commentTime = new Date(Date.now() - hoursAgo * 3600000);
    
    try {
      await conn.execute(
        `INSERT INTO article_comments (articleId, userId, content, status, createdAt, updatedAt)
         VALUES (?, ?, ?, 'approved', ?, ?)`,
        [article.id, userId, text, commentTime, commentTime]
      );
      console.log(`  ✅ ${persona.username}: ${text.slice(0, 60)}...`);
    } catch (err) {
      console.error(`  ❌ Failed to insert: ${err.message}`);
    }
  }
}

await conn.end();
console.log('\n✈ Comments generated!');
