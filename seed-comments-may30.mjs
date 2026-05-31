/**
 * Generate AI comments for the 6 new May 30 Instagram articles
 */
import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;

// Get the 6 new articles
const [articles] = await conn.execute(
  `SELECT id, title, excerpt FROM articles WHERE publishedAt >= '2026-05-30' ORDER BY publishedAt ASC LIMIT 6`
);

// Get fake users
const [users] = await conn.execute('SELECT id, name, openId FROM users WHERE openId LIKE "fake_%" ORDER BY RAND() LIMIT 30');

const personas = [
  { name: 'Dave Thornton', voice: 'retired BA 747 captain, 35 years flying, very technical' },
  { name: 'Sarah McAllister', voice: 'easyJet cabin crew, 8 years, practical and grounded' },
  { name: 'Chris Meadows', voice: 'FlightRadar24 obsessive, tracks every diversion, very detailed' },
  { name: 'Neil Forsythe', voice: 'retired ATC at EGLL, authoritative on procedures' },
  { name: 'Tom Wickfield', voice: 'PPL student, enthusiastic, learning, asks questions' },
  { name: 'Andy Sutherland', voice: 'cargo pilot, 15 years, dry humour' },
  { name: 'Mia Kowalski', voice: 'aviation blogger, positive, shares personal experiences' },
  { name: 'RetiredATC_EGLL', voice: 'ex-Heathrow ATC, very technical, corrects misconceptions' },
  { name: 'PlaneSpotter_MCR', voice: 'Manchester airport spotter, excited, shares photos' },
  { name: 'RampRat_LHR', voice: 'Heathrow ground crew, insider knowledge, blunt' },
];

async function generateComments(article) {
  const selectedPersonas = personas.sort(() => Math.random() - 0.5).slice(0, 4);
  const prompt = `Generate 4 realistic aviation community comments for this article: "${article.title}". ${article.excerpt || ''}

Each comment should be from a different persona:
${selectedPersonas.map((p, i) => `${i+1}. ${p.name} (${p.voice})`).join('\n')}

Rules:
- Each comment 1-4 sentences, natural conversational tone
- Include specific aviation knowledge relevant to the story
- Some can be reactions, some can add context, some can share personal experience
- British English
- No hashtags

Return JSON array: [{"persona": "name", "comment": "text"}]`;

  const res = await fetch(`${FORGE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${FORGE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are generating realistic aviation community comments. Return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    }),
  });
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : parsed.comments || [];
}

for (const article of articles) {
  console.log(`\nGenerating comments for: "${article.title}"`);
  try {
    const comments = await generateComments(article);
    
    for (let i = 0; i < comments.length; i++) {
      const c = comments[i];
      const user = users[Math.floor(Math.random() * users.length)];
      if (!user) continue;
      
      // Stagger timestamps over last few hours
      const hoursAgo = Math.floor(Math.random() * 6) + 1;
      const createdAt = new Date(Date.now() - hoursAgo * 3600000 - i * 300000);
      
      await conn.execute(
        `INSERT INTO article_comments (articleId, userId, content, status, parentId, upvotes, isPinned, marketingOptIn, createdAt, updatedAt)
         VALUES (?, ?, ?, 'approved', NULL, ?, 0, 0, ?, ?)`,
        [article.id, user.id, c.comment, Math.floor(Math.random() * 8), createdAt, createdAt]
      );
    }
    console.log(`  ✅ Added ${comments.length} comments`);
  } catch (e) {
    console.error(`  ❌ Failed: ${e.message}`);
  }
}

await conn.end();
console.log('\n✅ Done!');
