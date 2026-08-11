/**
 * Backfill clean aviation photos for autopilot-generated articles
 * Replaces branded template images (manus-storage URLs) with clean Pexels/Wikimedia photos
 * Only touches autopilot-generated articles (status = 'draft' OR authorId matches autopilot/marcus-webb)
 * Never touches Josh's manually created articles
 */

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const LOG_FILE = join(__dirname, 'backfill-clean-photos.log');
import { appendFileSync } from 'fs';

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + '\n');
}

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

// Build a smart Pexels search query from headline
function buildQuery(headline, category) {
  const lower = headline.toLowerCase();
  const airlines = ['ryanair', 'easyjet', 'british airways', 'delta', 'united airlines', 'emirates', 'lufthansa', 'qatar airways', 'air france', 'southwest', 'wizz air', 'jetblue', 'spirit', 'frontier', 'alaska airlines', 'qantas', 'singapore airlines', 'turkish airlines', 'american airlines', 'air india'];
  for (const airline of airlines) {
    if (lower.includes(airline)) return `${airline} aircraft`;
  }
  if (lower.includes('a321xlr') || lower.includes('a321')) return 'airbus a321 aircraft';
  if (lower.includes('a380')) return 'airbus a380 aircraft';
  if (lower.includes('a350')) return 'airbus a350 aircraft';
  if (lower.includes('737 max') || lower.includes('737max')) return 'boeing 737 max aircraft';
  if (lower.includes('787') || lower.includes('dreamliner')) return 'boeing 787 dreamliner';
  if (lower.includes('777')) return 'boeing 777 aircraft';
  if (lower.includes('747')) return 'boeing 747 aircraft';
  if (lower.includes('emergency landing') || lower.includes('crash') || lower.includes('squawk 7700')) return 'aircraft emergency landing runway';
  if (lower.includes('cockpit') || lower.includes('pilot')) return 'airplane cockpit pilot';
  if (lower.includes('airport')) return 'international airport terminal';
  if (lower.includes('turbulence')) return 'airplane turbulence storm';
  if (lower.includes('passenger')) return 'airplane passengers cabin';
  const categoryQueries = {
    'Aviation Incidents': 'aircraft emergency airport runway',
    'Military Aviation': 'military aircraft fighter jet',
    'Pilot & Crew': 'pilot cockpit airplane',
    'Aircraft Tech': 'aircraft engine technology',
    'Commercial Aviation': 'commercial aircraft airline sky',
  };
  return categoryQueries[category] || 'commercial aircraft sky';
}

async function fetchCleanPhoto(headline, category) {
  // Try Pexels first
  if (PEXELS_API_KEY) {
    try {
      const query = buildQuery(headline, category);
      log(`  Pexels: "${query}"`);
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
        { headers: { Authorization: PEXELS_API_KEY }, signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.photos?.length > 0) {
          const pick = data.photos[Math.floor(Math.random() * Math.min(5, data.photos.length))];
          return pick.src.large2x || pick.src.large || pick.src.original;
        }
      }
    } catch (e) {
      log(`  Pexels failed: ${e.message}`);
    }
  }
  
  // Try Wikimedia Commons
  try {
    const query = buildQuery(headline, category);
    log(`  Wikimedia: "${query}"`);
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=10&format=json&origin=*`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data = await res.json();
      const results = data.query?.search || [];
      for (const r of results) {
        const title = r.title;
        if (!title.match(/\.(jpg|jpeg|png)$/i)) continue;
        const imgRes = await fetch(
          `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json&origin=*`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          const pages = Object.values(imgData.query?.pages || {});
          const url = pages[0]?.imageinfo?.[0]?.url;
          if (url) return url;
        }
      }
    }
  } catch (e) {
    log(`  Wikimedia failed: ${e.message}`);
  }
  
  // Fallback
  return 'https://images.pexels.com/photos/46148/aircraft-jet-landing-cloud-46148.jpeg?auto=compress&cs=tinysrgb&w=1080';
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get all autopilot-generated articles (those with manus-storage featured images OR draft status)
  // We identify autopilot articles by their author slug (autopilot or marcus-webb)
  const [articles] = await conn.execute(`
    SELECT a.id, a.title, a.featuredImage, a.status,
           c.name AS categoryName, au.slug AS authorSlug
    FROM articles a
    LEFT JOIN categories c ON a.categoryId = c.id
    LEFT JOIN authors au ON a.authorId = au.id
    WHERE au.slug IN ('autopilot', 'marcus-webb', 'flight-drama-autopilot')
       OR (a.status = 'draft' AND a.featuredImage LIKE '%manus-storage%')
    ORDER BY a.id DESC
    LIMIT 200
  `);
  
  log(`Found ${articles.length} autopilot articles to update`);
  
  let updated = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const article of articles) {
    try {
      // Skip if it already has a clean Pexels/Wikimedia URL (not a manus-storage template)
      const isTemplate = article.featuredImage && (
        article.featuredImage.includes('manus-storage') ||
        article.featuredImage.includes('autopilot-images')
      );
      
      if (!isTemplate && article.featuredImage) {
        // Already has a clean photo URL
        log(`  SKIP ${article.id}: Already has clean photo`);
        skipped++;
        continue;
      }
      
      log(`Processing [${article.id}] ${article.title?.slice(0, 60)}`);
      
      const category = article.categoryName || 'Commercial Aviation';
      const photoUrl = await fetchCleanPhoto(article.title, category);
      
      if (!photoUrl) {
        log(`  FAIL ${article.id}: No photo found`);
        failed++;
        continue;
      }
      
      await conn.execute(
        'UPDATE articles SET featuredImage = ?, updatedAt = NOW() WHERE id = ?',
        [photoUrl, article.id]
      );
      
      log(`  ✅ Updated ${article.id}: ${photoUrl.slice(0, 60)}`);
      updated++;
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 1500));
      
    } catch (e) {
      log(`  ❌ Error on ${article.id}: ${e.message}`);
      failed++;
    }
  }
  
  await conn.end();
  log(`\nDone. Updated: ${updated} | Skipped: ${skipped} | Failed: ${failed}`);
}

main().catch(e => {
  log(`Fatal error: ${e.message}`);
  process.exit(1);
});
