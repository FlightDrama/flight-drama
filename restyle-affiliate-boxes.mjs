/**
 * Restyle affiliate boxes to look like native content cards
 * with icons, descriptions, and clear CTA buttons.
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// New native card style for each affiliate type
const NEW_BLOCKS = {
  flights: `<div class="affiliate-card" style="background:#111111;border:1px solid #2a2a2a;margin:28px 0;overflow:hidden;font-family:inherit;">
  <div style="background:#1a1a1a;padding:10px 18px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #2a2a2a;">
    <span style="font-size:20px;">✈</span>
    <span style="font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#888;">Sponsored · Find Flights</span>
  </div>
  <div style="padding:18px;display:flex;align-items:center;gap:16px;">
    <div style="width:48px;height:48px;background:#F5C518;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;">✈</div>
    <div style="flex:1;">
      <p style="font-size:15px;font-weight:800;color:#ffffff;margin:0 0 4px;">Find the Cheapest Flights</p>
      <p style="font-size:13px;color:#9ca3af;margin:0;">Compare millions of flights on Skyscanner. Set price alerts and find the best time to fly.</p>
    </div>
    <a href="https://www.skyscanner.net/?utm_source=flightdrama&utm_medium=affiliate" target="_blank" rel="noopener sponsored" style="flex-shrink:0;background:#F5C518;color:#000000;font-size:13px;font-weight:800;padding:10px 18px;text-decoration:none;white-space:nowrap;">Search Flights →</a>
  </div>
</div>`,

  flightradar: `<div class="affiliate-card" style="background:#111111;border:1px solid #2a2a2a;margin:28px 0;overflow:hidden;font-family:inherit;">
  <div style="background:#1a1a1a;padding:10px 18px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #2a2a2a;">
    <span style="font-size:20px;">📡</span>
    <span style="font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#888;">Sponsored · Flight Tracking</span>
  </div>
  <div style="padding:18px;display:flex;align-items:center;gap:16px;">
    <div style="width:48px;height:48px;background:#F5C518;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;">📡</div>
    <div style="flex:1;">
      <p style="font-size:15px;font-weight:800;color:#ffffff;margin:0 0 4px;">Track Any Flight in Real Time</p>
      <p style="font-size:13px;color:#9ca3af;margin:0;">FlightRadar24 Premium — full flight history, alerts, 3D view, and no ads. Used by aviation professionals worldwide.</p>
    </div>
    <a href="https://www.flightradar24.com/premium?ref=flightdrama" target="_blank" rel="noopener sponsored" style="flex-shrink:0;background:#F5C518;color:#000000;font-size:13px;font-weight:800;padding:10px 18px;text-decoration:none;white-space:nowrap;">Try Premium →</a>
  </div>
</div>`,

  prioritypass: `<div class="affiliate-card" style="background:#111111;border:1px solid #2a2a2a;margin:28px 0;overflow:hidden;font-family:inherit;">
  <div style="background:#1a1a1a;padding:10px 18px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #2a2a2a;">
    <span style="font-size:20px;">🛋️</span>
    <span style="font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#888;">Sponsored · Airport Lounges</span>
  </div>
  <div style="padding:18px;display:flex;align-items:center;gap:16px;">
    <div style="width:48px;height:48px;background:#F5C518;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;">🛋️</div>
    <div style="flex:1;">
      <p style="font-size:15px;font-weight:800;color:#ffffff;margin:0 0 4px;">Access 1,400+ Airport Lounges</p>
      <p style="font-size:13px;color:#9ca3af;margin:0;">Priority Pass — escape the terminal chaos. Free Wi-Fi, food, drinks, and showers at airports worldwide. From £99/year.</p>
    </div>
    <a href="https://www.prioritypass.com/?utm_source=flightdrama&utm_medium=affiliate" target="_blank" rel="noopener sponsored" style="flex-shrink:0;background:#F5C518;color:#000000;font-size:13px;font-weight:800;padding:10px 18px;text-decoration:none;white-space:nowrap;">Get Priority Pass →</a>
  </div>
</div>`,

  books: `<div class="affiliate-card" style="background:#111111;border:1px solid #2a2a2a;margin:28px 0;overflow:hidden;font-family:inherit;">
  <div style="background:#1a1a1a;padding:10px 18px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #2a2a2a;">
    <span style="font-size:20px;">📚</span>
    <span style="font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#888;">Sponsored · Aviation Books</span>
  </div>
  <div style="padding:18px;display:flex;align-items:center;gap:16px;">
    <div style="width:48px;height:48px;background:#F5C518;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;">📚</div>
    <div style="flex:1;">
      <p style="font-size:15px;font-weight:800;color:#ffffff;margin:0 0 4px;">Aviation Books on Amazon</p>
      <p style="font-size:13px;color:#9ca3af;margin:0;">From aircraft engineering deep dives to airline disaster investigations — find the best aviation reads with free delivery.</p>
    </div>
    <a href="https://www.amazon.co.uk/s?k=aviation+books&tag=flightdrama-21" target="_blank" rel="noopener sponsored" style="flex-shrink:0;background:#F5C518;color:#000000;font-size:13px;font-weight:800;padding:10px 18px;text-decoration:none;white-space:nowrap;">Browse Books →</a>
  </div>
</div>`,

  training: `<div class="affiliate-card" style="background:#111111;border:1px solid #2a2a2a;margin:28px 0;overflow:hidden;font-family:inherit;">
  <div style="background:#1a1a1a;padding:10px 18px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #2a2a2a;">
    <span style="font-size:20px;">🎓</span>
    <span style="font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#888;">Sponsored · Pilot Training</span>
  </div>
  <div style="padding:18px;display:flex;align-items:center;gap:16px;">
    <div style="width:48px;height:48px;background:#F5C518;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;">🎓</div>
    <div style="flex:1;">
      <p style="font-size:15px;font-weight:800;color:#ffffff;margin:0 0 4px;">Pilot Training Books & Study Materials</p>
      <p style="font-size:13px;color:#9ca3af;margin:0;">PPL ground school to ATPL theory — find the study materials you need to progress your flying career on Amazon.</p>
    </div>
    <a href="https://www.amazon.co.uk/s?k=pilot+training+books&tag=flightdrama-21" target="_blank" rel="noopener sponsored" style="flex-shrink:0;background:#F5C518;color:#000000;font-size:13px;font-weight:800;padding:10px 18px;text-decoration:none;white-space:nowrap;">Shop Training →</a>
  </div>
</div>`,
};

// Old block patterns to find and replace
const OLD_PATTERNS = {
  flights: /(<div class="affiliate-box"[^>]*>[\s\S]*?Find the Best Fares[\s\S]*?<\/div>)/g,
  flightradar: /(<div class="affiliate-box"[^>]*>[\s\S]*?Track This Flight[\s\S]*?<\/div>)/g,
  prioritypass: /(<div class="affiliate-box"[^>]*>[\s\S]*?Airport Lounges[\s\S]*?<\/div>)/g,
  books: /(<div class="affiliate-box"[^>]*>[\s\S]*?Aviation Books[\s\S]*?<\/div>)/g,
  training: /(<div class="affiliate-box"[^>]*>[\s\S]*?Pilot Training Resources[\s\S]*?<\/div>)/g,
};

const [articles] = await conn.execute(
  "SELECT id, slug, content FROM articles WHERE content LIKE '%affiliate-box%' ORDER BY id ASC"
);

console.log(`\n✈ Restyling affiliate boxes in ${articles.length} articles...\n`);

let updated = 0;

for (const article of articles) {
  let content = article.content;
  let changed = false;

  // Replace each old affiliate-box with the new native card style
  for (const [key, pattern] of Object.entries(OLD_PATTERNS)) {
    const newBlock = NEW_BLOCKS[key];
    if (!newBlock) continue;
    const before = content;
    content = content.replace(pattern, newBlock);
    if (content !== before) changed = true;
  }

  if (changed) {
    await conn.execute("UPDATE articles SET content = ? WHERE id = ?", [content, article.id]);
    console.log(`  [OK] ${article.slug}`);
    updated++;
  } else {
    console.log(`  [SKIP] ${article.slug} — no matching patterns found`);
  }
}

console.log(`\n════════════════════════════════════════`);
console.log(`✅ Restyled: ${updated} articles`);
console.log(`\n🎉 Done!\n`);

await conn.end();
