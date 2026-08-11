/**
 * Full-System Image Backfill
 * 
 * Uses the complete photo fetcher (all 5 sources: Pexels, Wikimedia, Pixabay, Unsplash, NASA)
 * with AI-generated queries to find the best image for each article.
 * 
 * Targets autopilot articles (IDs 90000+) that have generic Pexels fallback images.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const LOG_FILE = join(__dirname, 'backfill-full-system.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + '\n');
}

// Generic fallback Pexels IDs to replace
const GENERIC_IDS = [
  '46148', '358220', '912050', '2026324', '1169754', '1309644', '723240',
  '1004409', '3769138', '2599537', '2898199', '1450353', '3155666', '4481259',
  '3807517', '1436139', '3764984', '2876511', '3806753', '2159549',
  // Backfill IDs that may also be generic
  '36180744', '23848586', '29169094', '33277348', '24713244', '34558328',
  '20317605', '30773889', '32605659', '20847296',
];

function isGenericOrNeedsUpdate(url) {
  if (!url) return true;
  // Only replace Pexels URLs (not manus-storage which are Josh's branded images)
  if (!url.includes('pexels.com')) return false;
  return GENERIC_IDS.some(id => url.includes(id));
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get autopilot articles with Pexels images (not Josh's branded manus-storage images)
  const [articles] = await conn.execute(`
    SELECT id, title, featuredImage, status
    FROM articles
    WHERE featuredImage LIKE '%pexels.com%'
    AND status IN ('published', 'draft')
    ORDER BY id DESC
    LIMIT 300
  `);
  
  log(`Found ${articles.length} articles with Pexels images`);
  
  // Import the full photo fetcher
  const { fetchPhotoWithAIQueries } = await import('./flight-drama-photo-fetcher.mjs');
  
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    
    // Only process articles that need updating
    if (!isGenericOrNeedsUpdate(article.featuredImage)) {
      skipped++;
      continue;
    }
    
    log(`\n[${i+1}/${articles.length}] ${article.id}: ${article.title?.slice(0, 60)}`);
    log(`  Current: ${article.featuredImage?.slice(0, 70)}`);
    
    try {
      // Use the full 5-source system with AI queries
      const photo = await fetchPhotoWithAIQueries(article.title, '', i % 8);
      
      if (photo?.url && photo.url !== article.featuredImage) {
        await conn.execute(
          'UPDATE articles SET featuredImage = ?, updatedAt = NOW() WHERE id = ?',
          [photo.url, article.id]
        );
        log(`  ✅ [${photo.source}] ${photo.url.slice(0, 70)}`);
        if (photo.attribution) log(`  Attribution: ${photo.attribution}`);
        updated++;
      } else {
        log(`  ⚠️ Same or no photo returned`);
        failed++;
      }
      
      // Delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 2000));
      
    } catch (e) {
      log(`  ❌ Error: ${e.message}`);
      failed++;
    }
  }
  
  await conn.end();
  log(`\n=== Done === Updated: ${updated} | Skipped: ${skipped} | Failed: ${failed}`);
}

main().catch(e => { log(`Fatal: ${e.message}`); process.exit(1); });
