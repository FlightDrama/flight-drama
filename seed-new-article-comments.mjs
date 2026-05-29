/**
 * AI Comment Generation — New Instagram Articles Only
 * =====================================================
 * Generates realistic comments for the 10 new articles
 * with timestamps spread over the last 24-48 hours
 * to match when the articles were published.
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get only the 10 new articles
const [articles] = await conn.execute(
  `SELECT id, title, excerpt, publishedAt FROM articles 
   WHERE publishedAt > NOW() - INTERVAL 3 DAY
   AND id NOT IN (SELECT DISTINCT articleId FROM article_comments)
   ORDER BY publishedAt DESC`
);

if (articles.length === 0) {
  console.log('No new articles without comments found. Checking by slug...');
  // Fallback: get by slug
  const [bySlug] = await conn.execute(
    `SELECT id, title, excerpt, publishedAt FROM articles 
     WHERE slug IN (
       'united-airlines-is-building-ai-to-explain-every-flight-delay-in-plain-english',
       'jetstar-removes-passenger-after-crew-raise-concerns-over-post-surgery-appearance',
       'mcas-how-a-single-sensor-brought-down-two-boeing-737-max-aircraft-and-killed-346',
       'the-2013-boeing-787-battery-crisis-the-first-worldwide-grounding-of-a-us-airliner',
       'inside-the-air-canada-tech-ops-dispute-why-maintenance-workers-are-fighting-over',
       'whirl-mode-the-hidden-vibration-that-tore-the-wings-off-lockheed-electra-aircraft',
       'square-windows-and-fatigue-cracks-how-the-de-havilland-comet-changed-aviation-saf',
       'boeing-737-max-7-could-finally-receive-faa-certification-this-summer-after-years-o',
       'ana-unveils-new-pokemon-boeing-787-jets-to-mark-the-franchises-30th-anniversary',
       'el-al-cockpit-transmission-from-jfk-approach-goes-viral-among-aviation-enthusiasts'
     )
     ORDER BY publishedAt DESC`
  );
  articles.push(...bySlug);
}

console.log(`\n✈ Generating comments for ${articles.length} new articles...\n`);

// Get dummy user IDs
const [userRows] = await conn.execute(
  "SELECT id, openId, name FROM users WHERE openId LIKE 'dummy-%'"
);
const users = userRows;

const PERSONAS = [
  { name: "Dave Thornton", bio: "Ex-BA 747 captain, 28 years flying. Retired but still obsessed." },
  { name: "Sarah McAllister", bio: "Cabin crew supervisor at easyJet. 12 years in the industry." },
  { name: "Raj Patel", bio: "Aviation enthusiast and plane spotter. Based at Heathrow most weekends." },
  { name: "Tom Wickfield", bio: "PPL student at Wycombe Air Park. Obsessed with everything Boeing." },
  { name: "Emma Fitzgerald", bio: "Aviation journalist, writes for trade publications." },
  { name: "Marcus Webb", bio: "Ground handler at Manchester. Seen it all from the ramp." },
  { name: "Jake Holloway", bio: "Military aviation nut. Ex-RAF, now civilian." },
  { name: "Neil Forsythe", bio: "ATC at EGLL. Can't say much but follow aviation news obsessively." },
  { name: "Zara Ahmed", bio: "Aerospace engineering student at Cranfield." },
  { name: "Steve Barker", bio: "Retired AAIB investigator. Accident analysis is my thing." },
  { name: "Chris Meadows", bio: "FlightRadar24 addict. I track everything." },
  { name: "Dan Fletcher", bio: "Aviation safety consultant. ICAO Annex 13 is bedtime reading." },
  { name: "Ben Hargreaves", bio: "Airline analyst. I model fleet economics for a living." },
  { name: "James Thornbury", bio: "737 MAX critic since 2019. Still watching Boeing closely." },
  { name: "Mike Doherty", bio: "Dublin-based spotter. Caught the Delta emergency landing on camera." },
];

async function generateComments(articleTitle, articleExcerpt, numComments) {
  const personaSubset = PERSONAS.sort(() => Math.random() - 0.5).slice(0, numComments);
  
  const prompt = `You are generating ultra-realistic comments for an aviation news article on Flight Drama.

Article title: "${articleTitle}"
Article excerpt: "${articleExcerpt ? articleExcerpt.replace(/<[^>]+>/g, '').slice(0, 200) : ''}"

Generate exactly ${numComments} comments from these people. Each has a distinct voice based on their background.

Personas:
${personaSubset.map((p, i) => `${i+1}. ${p.name} — ${p.bio}`).join('\n')}

Rules:
- Each comment must sound completely natural and authentic
- Vary tone: some agree, some disagree, some add context, some share personal experience
- Include aviation terminology where appropriate but don't overdo it
- Some comments short (1-2 sentences), some longer (3-4 sentences)
- Some can reference their own experience
- Avoid generic phrases like "Great article!" 
- Comments should feel like a passionate aviation community
- Some can be slightly controversial or opinionated

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
      model: 'gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) throw new Error(`LLM API error: ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array found');
  return JSON.parse(jsonMatch[0]);
}

let totalComments = 0;
let totalReplies = 0;

for (let i = 0; i < articles.length; i++) {
  const article = articles[i];
  const numComments = 3 + Math.floor(Math.random() * 4); // 3-6 comments per article
  
  // Article was published recently — comments should be within that window
  const articleAge = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60); // hours
  const maxCommentAge = Math.min(articleAge, 24); // comments can't be older than article
  
  console.log(`[${i+1}/${articles.length}] "${article.title.slice(0, 55)}..." → ${numComments} comments (article ${Math.round(articleAge)}h old)`);
  
  try {
    const comments = await generateComments(article.title, article.excerpt, numComments);
    
    for (const comment of comments) {
      const persona = PERSONAS.find(p => p.name === comment.name);
      if (!persona) continue;
      
      const user = users.find(u => u.name === persona.name);
      if (!user) continue;
      
      // Realistic timestamp: comment posted 0-maxCommentAge hours after article published
      const commentDelay = Math.random() * maxCommentAge * 60; // minutes after article
      const commentTime = new Date(new Date(article.publishedAt).getTime() + commentDelay * 60 * 1000);
      
      await conn.execute(
        `INSERT INTO article_comments (articleId, userId, content, status, marketingOptIn, upvotes, createdAt)
         VALUES (?, ?, ?, 'approved', ?, ?, ?)`,
        [
          article.id,
          user.id,
          comment.comment,
          Math.random() > 0.7 ? 1 : 0,
          Math.floor(Math.random() * 12),
          commentTime.toISOString().slice(0, 19).replace('T', ' '),
        ]
      );
      totalComments++;
    }
    
    // Add 1 reply for some articles
    if (Math.random() > 0.4 && comments.length > 0) {
      const [parentRows] = await conn.execute(
        'SELECT id FROM article_comments WHERE articleId = ? ORDER BY createdAt ASC LIMIT 1',
        [article.id]
      );
      if (parentRows.length > 0) {
        const replyPersona = PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
        const replyUser = users.find(u => u.name === replyPersona.name);
        if (replyUser) {
          const replyPrompt = `Write a short, natural 1-2 sentence reply to a comment on an aviation article about "${article.title}". The reply is from ${replyPersona.name} (${replyPersona.bio}). Make it conversational. Return only the reply text, no quotes.`;
          
          const replyRes = await fetch(`${FORGE_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FORGE_KEY}` },
            body: JSON.stringify({ model: 'gemini-2.5-flash', messages: [{ role: 'user', content: replyPrompt }], temperature: 0.9, max_tokens: 150 }),
          });
          
          if (replyRes.ok) {
            const replyData = await replyRes.json();
            const replyText = replyData.choices?.[0]?.message?.content?.trim();
            if (replyText && replyText.length > 10) {
              const replyDelay = Math.random() * maxCommentAge * 60 * 0.8;
              const replyTime = new Date(new Date(article.publishedAt).getTime() + replyDelay * 60 * 1000);
              await conn.execute(
                `INSERT INTO article_comments (articleId, userId, content, status, parentId, upvotes, createdAt)
                 VALUES (?, ?, ?, 'approved', ?, ?, ?)`,
                [article.id, replyUser.id, replyText, parentRows[0].id, Math.floor(Math.random() * 6), replyTime.toISOString().slice(0, 19).replace('T', ' ')]
              );
              totalReplies++;
            }
          }
        }
      }
    }
    
    console.log(`   ✅ ${comments.length} comments added`);
    await new Promise(r => setTimeout(r, 1200));
    
  } catch (e) {
    console.error(`   ❌ Error: ${e.message}`);
  }
}

console.log(`\n════════════════════════════════════════`);
console.log(`✅ Total comments: ${totalComments}`);
console.log(`✅ Total replies:  ${totalReplies}`);
console.log(`\n🎉 Done!\n`);

await conn.end();
