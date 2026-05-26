/**
 * Flight Drama — Affiliate Link Injection Script
 * Adds relevant Amazon, Priority Pass, and FlightRadar24 affiliate links
 * naturally within the content of all 23 existing articles.
 *
 * Affiliate links used (replace with real affiliate IDs when registered):
 * - Amazon Associates: https://amzn.to/... (placeholder tag: flightdrama-21)
 * - Priority Pass: https://www.prioritypass.com/?utm_source=flightdrama
 * - FlightRadar24: https://www.flightradar24.com/premium?ref=flightdrama
 * - Skyscanner: https://www.skyscanner.net/?utm_source=flightdrama
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ─── Affiliate link definitions ───────────────────────────────────────────────
const AFFILIATE_BLOCKS = {
  // Added to articles about aviation headsets, gear, books
  headset: `<div class="affiliate-box" style="background:#1a1a1a;border:1px solid #333;padding:16px;margin:24px 0;border-left:4px solid #F5C518;">
  <p style="font-size:12px;color:#888;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">✈ Recommended Gear</p>
  <p style="margin:0 0 8px;color:#e5e5e5;font-size:14px;"><strong>Aviation Headsets on Amazon</strong> — Compare the Bose A20, David Clark H10-13.4, and Lightspeed Zulu 3. Free delivery on eligible orders.</p>
  <a href="https://www.amazon.co.uk/s?k=aviation+headset&tag=flightdrama-21" target="_blank" rel="noopener sponsored" style="color:#F5C518;font-weight:700;font-size:13px;">Shop Aviation Headsets on Amazon →</a>
</div>`,

  // Added to articles about flight tracking, incidents, live data
  flightradar: `<div class="affiliate-box" style="background:#1a1a1a;border:1px solid #333;padding:16px;margin:24px 0;border-left:4px solid #F5C518;">
  <p style="font-size:12px;color:#888;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">✈ Track This Flight</p>
  <p style="margin:0 0 8px;color:#e5e5e5;font-size:14px;"><strong>FlightRadar24 Premium</strong> — Track any aircraft in real time with full history, alerts, and 3D view. Used by aviation professionals worldwide.</p>
  <a href="https://www.flightradar24.com/premium?ref=flightdrama" target="_blank" rel="noopener sponsored" style="color:#F5C518;font-weight:700;font-size:13px;">Try FlightRadar24 Premium →</a>
</div>`,

  // Added to articles about airports, lounges, travel
  prioritypass: `<div class="affiliate-box" style="background:#1a1a1a;border:1px solid #333;padding:16px;margin:24px 0;border-left:4px solid #F5C518;">
  <p style="font-size:12px;color:#888;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">✈ Airport Lounges</p>
  <p style="margin:0 0 8px;color:#e5e5e5;font-size:14px;"><strong>Priority Pass</strong> — Access 1,400+ airport lounges worldwide. Avoid the chaos of the terminal and travel in comfort from £99/year.</p>
  <a href="https://www.prioritypass.com/?utm_source=flightdrama&utm_medium=affiliate" target="_blank" rel="noopener sponsored" style="color:#F5C518;font-weight:700;font-size:13px;">Get Priority Pass →</a>
</div>`,

  // Added to articles about flight training, PPL, CPL
  training: `<div class="affiliate-box" style="background:#1a1a1a;border:1px solid #333;padding:16px;margin:24px 0;border-left:4px solid #F5C518;">
  <p style="font-size:12px;color:#888;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">✈ Pilot Training Resources</p>
  <p style="margin:0 0 8px;color:#e5e5e5;font-size:14px;"><strong>Aviation Books & Study Materials on Amazon</strong> — From PPL ground school to ATPL theory, find the resources you need to progress your flying career.</p>
  <a href="https://www.amazon.co.uk/s?k=pilot+training+books&tag=flightdrama-21" target="_blank" rel="noopener sponsored" style="color:#F5C518;font-weight:700;font-size:13px;">Shop Pilot Training Books →</a>
</div>`,

  // Added to articles about airlines, routes, travel
  flights: `<div class="affiliate-box" style="background:#1a1a1a;border:1px solid #333;padding:16px;margin:24px 0;border-left:4px solid #F5C518;">
  <p style="font-size:12px;color:#888;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">✈ Find the Best Fares</p>
  <p style="margin:0 0 8px;color:#e5e5e5;font-size:14px;"><strong>Skyscanner</strong> — Compare millions of flights from hundreds of airlines. Find the cheapest time to fly and set up price alerts.</p>
  <a href="https://www.skyscanner.net/?utm_source=flightdrama&utm_medium=affiliate" target="_blank" rel="noopener sponsored" style="color:#F5C518;font-weight:700;font-size:13px;">Search Flights on Skyscanner →</a>
</div>`,

  // Added to articles about aircraft tech, engineering
  books: `<div class="affiliate-box" style="background:#1a1a1a;border:1px solid #333;padding:16px;margin:24px 0;border-left:4px solid #F5C518;">
  <p style="font-size:12px;color:#888;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">✈ Aviation Books</p>
  <p style="margin:0 0 8px;color:#e5e5e5;font-size:14px;"><strong>Aviation & Aircraft Books on Amazon</strong> — Deep dives into aircraft engineering, airline history, and aviation disasters. Perfect for enthusiasts.</p>
  <a href="https://www.amazon.co.uk/s?k=aviation+books&tag=flightdrama-21" target="_blank" rel="noopener sponsored" style="color:#F5C518;font-weight:700;font-size:13px;">Browse Aviation Books →</a>
</div>`,
};

// ─── Article → affiliate mapping ──────────────────────────────────────────────
// Maps article slug keywords to which affiliate blocks to inject
const ARTICLE_AFFILIATES = [
  // Commercial aviation / routes / airlines
  { slugContains: ["cargo-planes", "freight"], blocks: ["flights", "flightradar"] },
  { slugContains: ["boeing-757", "replacement"], blocks: ["books", "flightradar"] },
  { slugContains: ["flight-attendant-pay"], blocks: ["flights", "prioritypass"] },
  { slugContains: ["american-airlines-pilots"], blocks: ["flights", "flightradar"] },
  { slugContains: ["british-airways-business-class"], blocks: ["prioritypass", "flights"] },
  { slugContains: ["airlines-ban-batteries"], blocks: ["flights", "flightradar"] },
  { slugContains: ["tap-revives", "portugal-route"], blocks: ["flights", "prioritypass"] },
  { slugContains: ["first-class-ticket"], blocks: ["prioritypass", "flights"] },
  { slugContains: ["iberia", "madrid", "dallas"], blocks: ["flights", "prioritypass"] },
  { slugContains: ["american-adds", "mexico"], blocks: ["flights", "flightradar"] },
  { slugContains: ["porter", "toronto", "moncton"], blocks: ["flights", "flightradar"] },

  // Incidents / emergencies
  { slugContains: ["dc-10", "boston", "harbor"], blocks: ["books", "flightradar"] },
  { slugContains: ["wizz-air", "intercepted"], blocks: ["flightradar", "flights"] },
  { slugContains: ["easyjet", "emergency"], blocks: ["flightradar", "flights"] },
  { slugContains: ["british-airways-777", "crew-fall-ill"], blocks: ["flightradar", "prioritypass"] },
  { slugContains: ["air-france", "beirut", "emergency"], blocks: ["flightradar", "flights"] },
  { slugContains: ["qatar-airways", "medical-diversion"], blocks: ["flightradar", "prioritypass"] },
  { slugContains: ["sas-flight", "taxiway"], blocks: ["flightradar", "books"] },
  { slugContains: ["air-india", "dreamliner", "heathrow"], blocks: ["flightradar", "flights"] },
  { slugContains: ["fedex", "cargo", "nose"], blocks: ["flightradar", "books"] },
  { slugContains: ["airbus-a350", "wheel-loss", "ba274"], blocks: ["flightradar", "books"] },
  { slugContains: ["delta-flight", "dublin"], blocks: ["flightradar", "flights"] },

  // Aircraft tech
  { slugContains: ["a340", "fuel"], blocks: ["books", "flightradar"] },
];

// ─── Inject affiliate links ───────────────────────────────────────────────────
const [articles] = await conn.execute(
  "SELECT id, title, slug, content FROM articles ORDER BY id ASC"
);

console.log(`\n✈ Injecting affiliate links into ${articles.length} articles...\n`);

let updated = 0;
let skipped = 0;

for (const article of articles) {
  // Find matching affiliate config
  const match = ARTICLE_AFFILIATES.find(cfg =>
    cfg.slugContains.some(keyword => article.slug.includes(keyword))
  );

  if (!match) {
    console.log(`  [SKIP] No affiliate match: ${article.slug}`);
    skipped++;
    continue;
  }

  // Skip if already has affiliate boxes
  if (article.content.includes('affiliate-box')) {
    console.log(`  [SKIP] Already has affiliates: ${article.slug}`);
    skipped++;
    continue;
  }

  // Build the affiliate HTML to inject
  const affiliateHtml = match.blocks
    .map(blockKey => AFFILIATE_BLOCKS[blockKey])
    .filter(Boolean)
    .join('\n');

  // Inject after the first ~500 chars of content (after first paragraph)
  const insertPos = findInsertPosition(article.content);
  const newContent = article.content.slice(0, insertPos) + '\n' + affiliateHtml + '\n' + article.content.slice(insertPos);

  await conn.execute(
    "UPDATE articles SET content = ? WHERE id = ?",
    [newContent, article.id]
  );

  console.log(`  [OK] ${article.slug} → ${match.blocks.join(', ')}`);
  updated++;
}

function findInsertPosition(content) {
  // Find the end of the first </p> tag after 200 chars
  const firstP = content.indexOf('</p>', 200);
  if (firstP > 0) return firstP + 4;
  // Fallback: after 500 chars
  return Math.min(500, content.length);
}

console.log(`\n════════════════════════════════════════`);
console.log(`✅ Updated: ${updated} articles`);
console.log(`⏭️  Skipped: ${skipped} articles`);
console.log(`\n🎉 Done!\n`);

await conn.end();
