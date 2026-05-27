/**
 * Flight Drama — AI Comment Generation Script
 * ============================================
 * Uses the Manus Forge LLM API to generate ultra-realistic comments
 * for all 23 articles from a pool of believable aviation community personas.
 * 
 * Each article gets 4-8 comments + 1-3 threaded replies.
 * Comments are inserted as 'approved' (no moderation needed).
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!FORGE_URL || !FORGE_KEY) {
  console.error("Missing BUILT_IN_FORGE_API_URL or BUILT_IN_FORGE_API_KEY");
  process.exit(1);
}

// ─── Persona pool ─────────────────────────────────────────────────────────────
// 30 believable aviation community members with distinct voices
const PERSONAS = [
  { name: "Dave Thornton", openId: "dummy-dave-thornton", bio: "Ex-BA 747 captain, 28 years flying. Retired but still obsessed with aviation." },
  { name: "Sarah McAllister", openId: "dummy-sarah-mcallister", bio: "Cabin crew supervisor at easyJet. 12 years in the industry." },
  { name: "Raj Patel", openId: "dummy-raj-patel", bio: "Aviation enthusiast and plane spotter. Based at Heathrow most weekends." },
  { name: "Tom Wickfield", openId: "dummy-tom-wickfield", bio: "PPL student at Wycombe Air Park. Obsessed with everything Boeing." },
  { name: "Emma Fitzgerald", openId: "dummy-emma-fitzgerald", bio: "Aviation journalist, writes for a few trade publications." },
  { name: "Marcus Webb", openId: "dummy-marcus-webb", bio: "Ground handler at Manchester. Seen it all from the ramp." },
  { name: "Priya Sharma", openId: "dummy-priya-sharma", bio: "Frequent flyer, 200k miles a year for work. Knows every lounge." },
  { name: "Jake Holloway", openId: "dummy-jake-holloway", bio: "Military aviation nut. Ex-RAF, now civilian. Still miss the Tornado." },
  { name: "Claire Donovan", openId: "dummy-claire-donovan", bio: "Travel blogger, flies 50+ times a year. Always in economy." },
  { name: "Neil Forsythe", openId: "dummy-neil-forsythe", bio: "ATC at EGLL. Can't say much but follow aviation news obsessively." },
  { name: "Liam O'Brien", openId: "dummy-liam-obrien", bio: "Irish aviation fan. Ryanair defender when they deserve it, critic when they don't." },
  { name: "Zara Ahmed", openId: "dummy-zara-ahmed", bio: "Aerospace engineering student at Cranfield. Loves the technical side." },
  { name: "Steve Barker", openId: "dummy-steve-barker", bio: "Retired AAIB investigator. Accident analysis is my thing." },
  { name: "Fiona Campbell", openId: "dummy-fiona-campbell", bio: "Pilot wife. My husband flies 777s. I worry every time he leaves." },
  { name: "Chris Meadows", openId: "dummy-chris-meadows", bio: "FlightRadar24 addict. I track everything. Ask me anything about live flights." },
  { name: "Hannah Blake", openId: "dummy-hannah-blake", bio: "First class reviewer. I review premium cabins so you don't have to." },
  { name: "Andy Sutherland", openId: "dummy-andy-sutherland", bio: "Cargo pilot, 737F. The unsung heroes of aviation." },
  { name: "Mia Kowalski", openId: "dummy-mia-kowalski", bio: "Polish aviation fan living in London. Love spotting at Heathrow." },
  { name: "Dan Fletcher", openId: "dummy-dan-fletcher", bio: "Aviation safety consultant. ICAO Annex 13 is bedtime reading." },
  { name: "Olivia Marsh", openId: "dummy-olivia-marsh", bio: "Flight attendant trainer. I teach the safety demos everyone ignores." },
  { name: "Ben Hargreaves", openId: "dummy-ben-hargreaves", bio: "Airline analyst. I model fleet economics for a living." },
  { name: "Tanya Morrison", openId: "dummy-tanya-morrison", bio: "Airport operations manager. The chaos behind the scenes is real." },
  { name: "Phil Rawlings", openId: "dummy-phil-rawlings", bio: "Scale model builder. Every aircraft in my collection has a story." },
  { name: "Aisha Okonkwo", openId: "dummy-aisha-okonkwo", bio: "Nigerian aviation enthusiast. Following African aviation growth closely." },
  { name: "Rob Sinclair", openId: "dummy-rob-sinclair", bio: "Avgeek since age 5. My first word was probably Boeing." },
  { name: "Kate Williamson", openId: "dummy-kate-williamson", bio: "Travel nurse, flies constantly. Have strong opinions about seat comfort." },
  { name: "James Thornbury", openId: "dummy-james-thornbury", bio: "737 MAX critic since 2019. Still watching Boeing closely." },
  { name: "Sophie Laurent", openId: "dummy-sophie-laurent", bio: "French expat in London. Air France loyalist but open minded." },
  { name: "Mike Doherty", openId: "dummy-mike-doherty", bio: "Dublin-based spotter. Caught the Delta emergency landing on camera." },
  { name: "Natalie Cross", openId: "dummy-natalie-cross", bio: "Aviation podcaster. If you want the real story, ask the crew." },
];

// ─── LLM call ─────────────────────────────────────────────────────────────────
async function generateComments(articleTitle, articleExcerpt, numComments) {
  const personaSubset = PERSONAS.sort(() => Math.random() - 0.5).slice(0, numComments);
  
  const prompt = `You are generating ultra-realistic comments for an aviation news article on a site called Flight Drama.

Article title: "${articleTitle}"
Article excerpt: "${articleExcerpt}"

Generate exactly ${numComments} comments from these specific people. Each person has a distinct voice and perspective based on their background.

Personas:
${personaSubset.map((p, i) => `${i+1}. ${p.name} — ${p.bio}`).join('\n')}

Rules:
- Each comment must sound completely natural, like a real person wrote it
- Vary the tone: some agree with the article, some disagree, some add context, some share personal experience
- Include aviation-specific terminology where appropriate but don't overdo it
- Some comments can be short (1-2 sentences), some longer (3-5 sentences)
- Include occasional typos or informal language to feel authentic
- Some people can reference their own experience (e.g. "I was on a similar flight once...")
- Avoid generic phrases like "Great article!" or "Very informative"
- Comments should feel like they're from a passionate aviation community
- Some can be slightly controversial or opinionated to spark discussion

Return ONLY a JSON array with this exact format, no other text:
[
  {"name": "Person Name", "comment": "Their comment text here"},
  ...
]`;

  const res = await fetch(`${FORGE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_KEY}`,
    },
    body: JSON.stringify({
      model: 'gemini-2.5-pro',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 3000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM API error: ${res.status} ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  
  // Extract JSON from the response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array found in LLM response');
  
  return JSON.parse(jsonMatch[0]);
}

// ─── Main ──────────────────────────────────────────────────────────────────────
const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get all articles
const [articles] = await conn.execute(
  "SELECT id, title, excerpt FROM articles ORDER BY id ASC"
);

console.log(`\n✈ Generating AI comments for ${articles.length} articles...\n`);

// Create dummy user accounts
console.log("👤 Creating dummy user accounts...");
for (const persona of PERSONAS) {
  await conn.execute(
    `INSERT IGNORE INTO users (openId, name, email, loginMethod, role, createdAt, updatedAt, lastSignedIn)
     VALUES (?, ?, ?, 'manus', 'user', NOW() - INTERVAL FLOOR(RAND() * 120) DAY, NOW(), NOW() - INTERVAL FLOOR(RAND() * 30) DAY)`,
    [persona.openId, persona.name, `${persona.openId.replace('dummy-', '')}@flightdrama.community`]
  );
}
console.log(`✅ ${PERSONAS.length} dummy accounts ready\n`);

// Get user IDs
const [userRows] = await conn.execute(
  `SELECT id, openId FROM users WHERE openId LIKE 'dummy-%'`
);
const userMap = new Map(userRows.map(u => [u.openId, u.id]));

let totalComments = 0;
let totalReplies = 0;

for (let i = 0; i < articles.length; i++) {
  const article = articles[i];
  const numComments = 4 + Math.floor(Math.random() * 5); // 4-8 comments per article
  
  console.log(`[${i+1}/${articles.length}] "${article.title.slice(0, 60)}..." → ${numComments} comments`);
  
  try {
    const comments = await generateComments(
      article.title,
      article.excerpt?.replace(/<[^>]+>/g, '').slice(0, 300) || '',
      numComments
    );
    
    const insertedIds = [];
    
    for (const comment of comments) {
      // Find matching persona
      const persona = PERSONAS.find(p => p.name === comment.name);
      if (!persona) continue;
      
      const userId = userMap.get(persona.openId);
      if (!userId) continue;
      
      // Random date within the last 4 months
      const daysAgo = Math.floor(Math.random() * 120);
      const hoursAgo = Math.floor(Math.random() * 24);
      
      const [result] = await conn.execute(
        `INSERT INTO article_comments (articleId, userId, content, status, marketingOptIn, upvotes, createdAt)
         VALUES (?, ?, ?, 'approved', ?, ?, NOW() - INTERVAL ? DAY - INTERVAL ? HOUR)`,
        [
          article.id,
          userId,
          comment.comment,
          Math.random() > 0.7 ? 1 : 0, // 30% opted in
          Math.floor(Math.random() * 15), // 0-14 upvotes
          daysAgo,
          hoursAgo,
        ]
      );
      
      insertedIds.push(result.insertId);
      totalComments++;
    }
    
    // Add 1-2 replies to random comments
    const numReplies = 1 + Math.floor(Math.random() * 2);
    for (let r = 0; r < numReplies && insertedIds.length > 0; r++) {
      const parentId = insertedIds[Math.floor(Math.random() * insertedIds.length)];
      const replyPersona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
      const replyUserId = userMap.get(replyPersona.openId);
      if (!replyUserId) continue;
      
      // Generate a short reply
      const replyPrompt = `Write a short, natural 1-2 sentence reply to a comment on an aviation article about "${article.title}". The reply is from ${replyPersona.name} (${replyPersona.bio}). Make it sound authentic and conversational. Return only the reply text, no quotes.`;
      
      const replyRes = await fetch(`${FORGE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FORGE_KEY}` },
        body: JSON.stringify({
          model: 'gemini-2.5-flash',
          messages: [{ role: 'user', content: replyPrompt }],
          temperature: 0.9,
          max_tokens: 200,
        }),
      });
      
      if (replyRes.ok) {
        const replyData = await replyRes.json();
        const replyText = replyData.choices?.[0]?.message?.content?.trim();
        if (replyText && replyText.length > 10) {
          const daysAgo = Math.floor(Math.random() * 60);
          await conn.execute(
            `INSERT INTO article_comments (articleId, userId, content, status, parentId, upvotes, createdAt)
             VALUES (?, ?, ?, 'approved', ?, ?, NOW() - INTERVAL ? DAY)`,
            [article.id, replyUserId, replyText, parentId, Math.floor(Math.random() * 8), daysAgo]
          );
          totalReplies++;
        }
      }
    }
    
    // Also add commenters to news_commenters
    for (const persona of PERSONAS.slice(0, numComments)) {
      const userId = userMap.get(persona.openId);
      if (!userId) continue;
      await conn.execute(
        `INSERT INTO news_commenters (userId, email, name, marketingOptIn, firstCommentAt, commentCount, lastCommentAt)
         VALUES (?, ?, ?, ?, NOW() - INTERVAL FLOOR(RAND() * 120) DAY, 1, NOW())
         ON DUPLICATE KEY UPDATE commentCount = commentCount + 1, lastCommentAt = NOW()`,
        [userId, `${persona.openId.replace('dummy-', '')}@flightdrama.community`, persona.name, Math.random() > 0.7 ? 1 : 0]
      );
    }
    
    console.log(`   ✅ ${comments.length} comments + ${numReplies} replies`);
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1500));
    
  } catch (e) {
    console.error(`   ❌ Error: ${e.message}`);
  }
}

console.log(`\n════════════════════════════════════════`);
console.log(`✅ Total comments generated: ${totalComments}`);
console.log(`✅ Total replies generated:  ${totalReplies}`);
console.log(`\n🎉 Done! All comments are approved and visible immediately.\n`);

await conn.end();
