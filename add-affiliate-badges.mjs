/**
 * Add bestseller/recommended badges to affiliate cards in articles.
 * FlightRadar24 gets "Most Popular", Priority Pass gets "Best Value",
 * Amazon gets "Bestseller", Skyscanner gets "Recommended".
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const BADGE_REPLACEMENTS = [
  {
    find: `<span style="font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#888;">Sponsored · Flight Tracking</span>`,
    replace: `<span style="font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#888;">Sponsored · Flight Tracking</span><span style="background:#F5C518;color:#000;font-size:9px;font-weight:900;padding:2px 7px;letter-spacing:2px;text-transform:uppercase;margin-left:8px;">MOST POPULAR</span>`,
  },
  {
    find: `<span style="font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#888;">Sponsored · Airport Lounges</span>`,
    replace: `<span style="font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#888;">Sponsored · Airport Lounges</span><span style="background:#F5C518;color:#000;font-size:9px;font-weight:900;padding:2px 7px;letter-spacing:2px;text-transform:uppercase;margin-left:8px;">BEST VALUE</span>`,
  },
  {
    find: `<span style="font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#888;">Sponsored · Aviation Books</span>`,
    replace: `<span style="font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#888;">Sponsored · Aviation Books</span><span style="background:#F5C518;color:#000;font-size:9px;font-weight:900;padding:2px 7px;letter-spacing:2px;text-transform:uppercase;margin-left:8px;">BESTSELLER</span>`,
  },
  {
    find: `<span style="font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#888;">Sponsored · Find Flights</span>`,
    replace: `<span style="font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#888;">Sponsored · Find Flights</span><span style="background:#F5C518;color:#000;font-size:9px;font-weight:900;padding:2px 7px;letter-spacing:2px;text-transform:uppercase;margin-left:8px;">RECOMMENDED</span>`,
  },
  {
    find: `<span style="font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#888;">Sponsored · Pilot Training</span>`,
    replace: `<span style="font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#888;">Sponsored · Pilot Training</span><span style="background:#F5C518;color:#000;font-size:9px;font-weight:900;padding:2px 7px;letter-spacing:2px;text-transform:uppercase;margin-left:8px;">TOP RATED</span>`,
  },
];

const [articles] = await conn.execute(
  "SELECT id, slug, content FROM articles WHERE content LIKE '%affiliate-card%' ORDER BY id ASC"
);

console.log(`\n✈ Adding badges to ${articles.length} articles...\n`);
let updated = 0;

for (const article of articles) {
  let content = article.content;
  let changed = false;
  for (const { find, replace } of BADGE_REPLACEMENTS) {
    if (content.includes(find) && !content.includes(replace)) {
      content = content.replace(find, replace);
      changed = true;
    }
  }
  if (changed) {
    await conn.execute("UPDATE articles SET content = ? WHERE id = ?", [content, article.id]);
    console.log(`  [OK] ${article.slug}`);
    updated++;
  }
}

console.log(`\n✅ Badges added to ${updated} articles\n`);
await conn.end();
