/**
 * Seed 3 new articles from Instagram posts (June 1, 2026)
 * - Air Canada vs Seats.aero legal battle
 * - Southwest Airlines Customer of Size incident
 * - United Airlines Bluetooth BOMB teenager
 */

import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;

async function generateArticle(igPost, title, category) {
  const res = await fetch(`${FORGE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FORGE_KEY}` },
    body: JSON.stringify({
      model: 'gemini-2.5-pro',
      messages: [
        { role: 'system', content: `You are a professional aviation journalist writing for Flight Drama, a UK aviation news website similar to LADbible but for aviation enthusiasts. Write in British English. Your articles must be factual, engaging, and fully compliant with Google AdSense policies (no graphic content, balanced reporting, proper sourcing). Do not use clickbait or sensationalist language. Return ONLY valid HTML for the article body (no <html>, <head>, <body> tags). Use <h2> for subheadings, <p> for paragraphs, <blockquote> for key quotes, <ul><li> for lists. Minimum 500 words.` },
        { role: 'user', content: `Write a full news article based on this Instagram post. Keep all specific facts, flight numbers, dates, names, and quotes exactly as stated. Expand with aviation context and analysis.\n\nINSTAGRAM POST:\n${igPost}\n\nARTICLE TITLE: ${title}` }
      ],
      max_tokens: 3000
    })
  });
  const data = await res.json();
  return data.choices[0].message.content.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim();
}

async function generateExcerpt(title, content) {
  const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
  const res = await fetch(`${FORGE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FORGE_KEY}` },
    body: JSON.stringify({
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'user', content: `Write a 2-sentence excerpt (max 160 chars) for this aviation article. Return only the excerpt text, nothing else.\n\nTitle: ${title}\nContent: ${text}` }
      ],
      max_tokens: 100
    })
  });
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

// Get category IDs
const [categories] = await conn.execute('SELECT id, slug FROM categories');
const catMap = {};
for (const c of categories) catMap[c.slug] = c.id;

// Get author ID for Josh
const [authors] = await conn.execute("SELECT id FROM authors WHERE name LIKE '%Josh%' LIMIT 1");
const authorId = authors[0]?.id || 1;

const articles = [
  {
    title: "Air Canada vs Seats.aero: The Legal Battle That Could Change How You Search for Award Flights",
    igPost: `A legal battle between Air Canada and award-search platform Seats.aero is turning into something much bigger than a dispute over website scraping. Air Canada claims Seats.aero used automated tools to harvest Aeroplan reward seat data, placing strain on its systems and violating its terms of use. Seats.aero is fighting back with a much more explosive accusation: that Air Canada is trying to block competition and stop passengers from easily finding available reward flights. The company argues that reward seat availability is already publicly visible and claims the airline is using lawsuits to protect its control over how customers search for points redemptions. The case could have major implications for frequent flyers. At stake is whether airlines can restrict third-party tools that help travelers find hard-to-locate award seats across loyalty programs. What started as a dispute over bots is now becoming a fight over who controls access to airline reward data.`,
    slug: "air-canada-seats-aero-legal-battle-award-flights",
    category: "commercial-aviation",
    tags: ["Air Canada", "Aeroplan", "Award Flights", "Legal", "Seats.aero", "Frequent Flyer"],
    publishedAt: "2026-06-01 10:00:00"
  },
  {
    title: "Southwest Airlines Passenger Says She Was Publicly Humiliated Over Customer of Size Policy — With 30 Empty Seats on the Plane",
    igPost: `A longtime Southwest Airlines customer says she was publicly embarrassed at Miami Airport after being told she would need to pay for a second seat before boarding her flight. The passenger, who says she has flown Southwest for more than a decade, was stopped by a gate agent and told she would be required to purchase the adjacent seat under the airline's updated Customer of Size policy. The problem? The flight reportedly had around 30 empty seats. After challenging the decision, another Southwest employee reviewed the booking and confirmed there was plenty of available space. The passenger was ultimately allowed to board without paying for an extra seat. "We're not cattle," she later said while describing the experience. The incident comes as Southwest faces growing scrutiny over changes to its seating policies, with some passengers questioning how the airline's new rules will be applied in practice.`,
    slug: "southwest-airlines-customer-of-size-miami-airport-incident",
    category: "commercial-aviation",
    tags: ["Southwest Airlines", "Customer of Size", "Passenger Rights", "Miami Airport", "Seating Policy"],
    publishedAt: "2026-06-01 12:00:00"
  },
  {
    title: "United Airlines Flight Turns Back Over Atlantic After Teen Renames Bluetooth Device 'BOMB'",
    igPost: `A United Airlines flight to Spain was forced to turn around over the Atlantic after a teenager allegedly renamed his Bluetooth device "BOMB." United Flight UA236 departed Newark for Palma de Mallorca on May 30, 2026, and was already more than an hour into the journey when flight attendants began making urgent announcements ordering passengers to switch off Bluetooth devices. According to passengers onboard, crew members warned that an unresolved security threat could force the aircraft to return to New York. When the source of the alert could not immediately be identified, the Boeing 767-400ER turned around mid-flight and declared an emergency. After landing back at Newark, passengers were escorted off the aircraft while police and federal agents carried out security checks. According to reports, investigators later traced the incident to a 16-year-old passenger who had allegedly changed the name of his Bluetooth device to "BOMB." One passenger summed up the mood onboard: "This little joke ruined it for everyone."`,
    slug: "united-airlines-ua236-bluetooth-bomb-teenager-newark-palma",
    category: "aviation-incidents",
    tags: ["United Airlines", "Boeing 767", "Security", "Newark", "Palma de Mallorca", "Incident"],
    publishedAt: "2026-06-01 14:00:00"
  }
];

for (const article of articles) {
  console.log(`\nGenerating: ${article.title}`);
  
  try {
    const content = await generateArticle(article.igPost, article.title, article.category);
    const excerpt = await generateExcerpt(article.title, content);
    const categoryId = catMap[article.category] || catMap['commercial-aviation'];
    const tagsJson = JSON.stringify(article.tags);
    
    await conn.execute(
      `INSERT INTO articles (title, slug, excerpt, content, categoryId, authorId, tags, views, isFeatured, isBreaking, isPro, publishedAt, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, ?, 'published', NOW(), NOW())
       ON DUPLICATE KEY UPDATE updatedAt = NOW()`,
      [article.title, article.slug, excerpt, content, categoryId, authorId, tagsJson, article.publishedAt]
    );
    
    console.log(`✅ Published: ${article.slug}`);
  } catch (err) {
    console.error(`❌ Failed: ${err.message}`);
  }
}

await conn.end();
console.log('\n✈ All done!');
