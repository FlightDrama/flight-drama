/**
 * Proper Full-System Image Backfill with 10-Pass QA
 * 
 * Uses selectPhotoWithQA which does:
 * 1. Claude Opus 4.8 generates specific search queries
 * 2. Tries all 5 sources: Pexels → Wikimedia → Pixabay → Unsplash → NASA
 * 3. Runs 10-pass QA: Claude (vision) + Forge (vision) + Perplexity + Mistral
 * 4. Retries up to 8 times with AI-suggested queries on failure
 * 5. AI image generation as final fallback
 * 6. Stores attribution in DB
 * 
 * Targets all autopilot articles (IDs 90000+) that are published.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const LOG_FILE = join(__dirname, 'backfill-proper-qa.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + '\n');
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get the 10 most recent published articles (what shows in hero and sidebar)
  const [articles] = await conn.execute(`
    SELECT id, title, featuredImage
    FROM articles
    WHERE status = 'published'
    AND featuredImage LIKE '%pexels.com%'
    ORDER BY publishedAt DESC
    LIMIT 10
  `);
  
  log(`Processing ${articles.length} published autopilot articles with full QA system`);
  
  // Import the full QA system
  const { selectPhotoWithQA } = await import('./flight-drama-image-qa.mjs');
  
  let updated = 0;
  let failed = 0;
  
  // Close the initial connection — we'll reconnect per article to avoid timeout
  await conn.end();
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    log(`\n[${i+1}/${articles.length}] ${article.id}: ${article.title?.slice(0, 60)}`);
    
    try {
      // Run the full system: AI queries + 5 sources + 10-pass QA
      const apiKeys = { 
        pexels: process.env.PEXELS_API_KEY, 
        pixabay: process.env.PIXABAY_API_KEY 
      };
      
      const result = await selectPhotoWithQA(article.title, 'Aviation Incidents', apiKeys, 8);
      
      if (result?.url && result.url !== article.featuredImage) {
        // Reconnect for each DB update
        const updateConn = await mysql.createConnection(process.env.DATABASE_URL);
        await updateConn.execute(
          `UPDATE articles SET 
            featuredImage = ?,
            imageAttribution = ?,
            imageAttributionUrl = ?,
            imageRequiresAttribution = ?,
            imageQaScore = ?,
            imageQaPasses = ?,
            updatedAt = NOW()
           WHERE id = ?`,
          [
            result.url,
            result.attribution || null,
            result.attributionUrl || null,
            result.requiresAttribution ? 1 : 0,
            result.qa?.score || null,
            result.qa?.passCount || null,
            article.id
          ]
        );
        await updateConn.end();
        log(`  ✅ [${result.source || 'unknown'}] QA: ${result.qa?.passCount || 0}/${result.qa?.totalPasses || 0} passes, score ${result.qa?.score || 0}/10`);
        log(`  URL: ${result.url.slice(0, 70)}`);
        if (result.attribution) log(`  Attribution: ${result.attribution}`);
        updated++;
      } else {
        log(`  ⚠️ No better photo found or same photo returned`);
        failed++;
      }
      
      // Delay between articles to avoid rate limiting
      await new Promise(r => setTimeout(r, 2000));
      
    } catch (e) {
      log(`  ❌ Error: ${e.message}`);
      failed++;
    }
  }
  log(`\n=== Done === Updated: ${updated} | Failed/Skipped: ${failed} | Total: ${articles.length}`);
}

main().catch(e => { log(`Fatal: ${e.message}`); process.exit(1); });
