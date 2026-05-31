/**
 * Seed script: 6 new Instagram articles from May 30, 2026
 * Uses the Manus LLM to rewrite each story as a full AdSense-compliant article
 */
import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get category IDs
const [cats] = await conn.execute('SELECT id, slug FROM categories');
const catMap = {};
for (const c of cats) catMap[c.slug] = c.id;

// Get default author
const [authors] = await conn.execute('SELECT id FROM authors LIMIT 1');
const authorId = authors[0]?.id;

const FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;

async function generateArticle(story) {
  const prompt = `You are a senior aviation journalist for Flight Drama, a major aviation news website with millions of followers. 

Write a high-quality, SEO-optimised aviation news article based on the following story. Rewrite it in your own words — keep all specific facts, flight numbers, aircraft types, dates, and quotes, but expand the story with context, analysis, and background information.

STORY:
${story.content}

Requirements:
- Write in British English
- 600-900 words
- Use proper HTML: <h2> for 2-3 subheadings, <p> for paragraphs, <blockquote> for key quotes
- Do NOT include a main <h1> title
- Do NOT use markdown, only HTML tags
- Be factual, balanced, and informative
- No graphic violence or disturbing content
- End with a strong concluding paragraph

Return ONLY a JSON object with these exact fields:
{
  "title": "Compelling headline (max 80 chars)",
  "excerpt": "1-2 sentence summary (max 160 chars)",
  "content": "Full HTML article",
  "metaTitle": "SEO title (max 60 chars)",
  "metaDescription": "SEO description (max 160 chars)",
  "suggestedTags": ["tag1", "tag2", "tag3"]
}`;

  const res = await fetch(`${FORGE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${FORGE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemini-2.5-pro',
      messages: [
        { role: 'system', content: 'You are a professional aviation journalist. Always respond with valid JSON only, no markdown code blocks.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    }),
  });
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('No content from LLM: ' + JSON.stringify(data));
  return JSON.parse(raw);
}

function toSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

const stories = [
  {
    content: `A United Airlines flight to Spain was forced to turn around over the Atlantic after a teenager allegedly renamed his Bluetooth device "BOMB." United Flight UA236 departed Newark for Palma de Mallorca on May 30, 2026, and was already more than an hour into the journey when flight attendants began making urgent announcements ordering passengers to switch off Bluetooth devices. According to passengers onboard, crew members warned that an unresolved security threat could force the aircraft to return to New York. When the source of the alert could not immediately be identified, the Boeing 767-400ER turned around mid-flight and declared an emergency. After landing back at Newark, passengers were escorted off the aircraft while police and federal agents carried out security checks. According to reports, investigators later traced the incident to a 16-year-old passenger who had allegedly changed the name of his Bluetooth device to "BOMB." One passenger summed up the mood onboard: "This little joke ruined it for everyone."`,
    category: 'aviation-incidents',
    publishedAt: '2026-05-30 10:00:00',
    featuredImage: null,
  },
  {
    content: `A Virgin Atlantic flight to Jamaica was forced to turn around over the North Atlantic after one of its engines failed thousands of miles from its destination. Virgin Atlantic Flight VS165 departed London Heathrow on May 30, 2026, bound for Montego Bay with 246 passengers and 13 crew onboard. Nearly three hours into the flight, while crossing the Atlantic at 34,000 feet, the crew reported a problem with the aircraft's right-hand Rolls-Royce Trent 7000 engine. The pilots followed emergency procedures and shut the engine down, turning the Airbus A330-900neo into a single-engine aircraft over open ocean. The jet descended to 20,000 feet and diverted to Shannon Airport in Ireland, where emergency crews, ambulances, firefighters, police, coastguard units and an RNLI lifeboat were placed on standby. Despite the dramatic situation, the aircraft landed safely at 9:24 PM and all 259 people onboard walked away unharmed.`,
    category: 'aviation-incidents',
    publishedAt: '2026-05-30 11:00:00',
    featuredImage: null,
  },
  {
    content: `EasyJet could be heading toward one of the biggest airline deals of the year after US investment giant Castlelake confirmed it is exploring a possible offer for the British low-cost carrier. The Minneapolis-based firm stressed that discussions are still at an early stage and that it has not yet approached EasyJet's board. However, the airline is currently valued at around £3 billion, meaning any deal would rank among the largest aviation transactions in Europe this year. Castlelake is no stranger to aviation. Since 2020, it has invested more than $5 billion across airlines, aircraft leasing and aviation finance, including helping rescue SAS during its restructuring. No formal bid has been made and EasyJet has declined to comment, but the announcement immediately sparked speculation about the future ownership of one of Europe's biggest budget airlines.`,
    category: 'commercial-aviation',
    publishedAt: '2026-05-30 12:00:00',
    featuredImage: null,
  },
  {
    content: `The Airbus A321XLR was supposed to transform Wizz Air. Instead, some are sitting parked in Poland. Wizz Air originally ordered 47 Airbus A321XLRs, one of the largest commitments to the aircraft anywhere in the world. The jet was designed to open new long-haul routes that traditional narrowbody aircraft could never reach. Then everything changed. After the collapse of Wizz Air Abu Dhabi, the airline slashed its order from 47 aircraft to just 11. It even tried to transfer upcoming deliveries to another operator before the 2026 summer season, but no buyer emerged. Today, three brand-new A321XLRs are parked in Poland. Two have had their engines removed and fitted to other aircraft as Wizz battles ongoing Pratt & Whitney engine shortages. The biggest surprise is that Wizz now says it has no plans to use the XLR for the kind of long-haul routes it was built for. Instead, the aircraft is flying destinations like Madrid, Barcelona, Malaga, and Istanbul. An aircraft designed to connect continents is now operating some of the same routes as a standard narrowbody.`,
    category: 'commercial-aviation',
    publishedAt: '2026-05-30 13:00:00',
    featuredImage: null,
  },
  {
    content: `Ryanair CEO Michael O'Leary has threatened to cancel the airline's remaining Boeing orders unless the manufacturer agrees to significant price reductions. In a sharply worded statement, O'Leary said Ryanair is "not prepared to pay Boeing's current prices" and warned that the airline could look elsewhere if negotiations do not produce results. Ryanair is one of Boeing's largest customers, with hundreds of 737 MAX aircraft on order. The airline has already taken delivery of a significant portion of its MAX 200 fleet, a high-density variant of the 737 MAX 8 designed specifically for Ryanair. O'Leary's comments come as Boeing continues to navigate a turbulent period marked by production slowdowns, regulatory scrutiny, and delivery delays. The threat adds pressure to Boeing at a time when the manufacturer is already under intense scrutiny from airlines, investors, and regulators worldwide.`,
    category: 'commercial-aviation',
    publishedAt: '2026-05-30 14:00:00',
    featuredImage: null,
  },
  {
    content: `A Turkish Airlines Boeing 777 was forced to divert to Baku, Azerbaijan, after a passenger suffered a serious medical emergency mid-flight. The aircraft was operating a long-haul route when the crew declared a medical emergency and requested priority landing at the nearest suitable airport. Emergency services were waiting on the ground as the aircraft landed. The incident is the latest in a series of in-flight medical diversions that have highlighted the challenges airlines face when passengers require urgent care thousands of miles from the nearest hospital. Turkish Airlines confirmed the diversion and said the passenger received medical attention on the ground. The airline said the flight continued to its destination after the diversion, with a significant delay.`,
    category: 'aviation-incidents',
    publishedAt: '2026-05-30 15:00:00',
    featuredImage: null,
  },
];

console.log(`Generating ${stories.length} articles...`);

for (const story of stories) {
  try {
    console.log(`\nGenerating: ${story.content.slice(0, 60)}...`);
    const generated = await generateArticle(story);
    
    const slug = toSlug(generated.title);
    const categoryId = catMap[story.category] || catMap['commercial-aviation'];
    
    // Check for duplicate slug
    const [existing] = await conn.execute('SELECT id FROM articles WHERE slug = ? LIMIT 1', [slug]);
    if (existing.length > 0) {
      console.log(`  ⚠️  Skipping duplicate slug: ${slug}`);
      continue;
    }
    
    await conn.execute(
      `INSERT INTO articles (title, slug, excerpt, content, featuredImage, categoryId, authorId, publishedAt, isBreaking, isFeatured, isPro, status, metaTitle, metaDescription, tags, views, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 'published', ?, ?, ?, 0, NOW(), NOW())`,
      [
        generated.title,
        slug,
        generated.excerpt,
        generated.content,
        story.featuredImage,
        categoryId,
        authorId,
        story.publishedAt,
        generated.metaTitle,
        generated.metaDescription,
        JSON.stringify(generated.suggestedTags),
      ]
    );
    
    console.log(`  ✅ Published: "${generated.title}"`);
  } catch (e) {
    console.error(`  ❌ Failed: ${e.message}`);
  }
}

await conn.end();
console.log('\n✅ Done!');
