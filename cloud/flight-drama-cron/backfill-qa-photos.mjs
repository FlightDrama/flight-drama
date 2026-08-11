/**
 * Flight Drama QA Backfill
 * Runs the 10-pass image QA on all autopilot-generated articles
 * Replaces any photos that fail with better ones
 */

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { appendFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const LOG_FILE = join(__dirname, 'backfill-qa-photos.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + '\n');
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Get all autopilot articles with their current featured images
  const [articles] = await conn.execute(`
    SELECT a.id, a.title, a.featuredImage, a.status,
           c.name AS categoryName, au.slug AS authorSlug
    FROM articles a
    LEFT JOIN categories c ON a.categoryId = c.id
    LEFT JOIN authors au ON a.authorId = au.id
    WHERE au.slug IN ('autopilot', 'marcus-webb', 'flight-drama-autopilot')
       OR (a.status = 'draft' AND a.featuredImage IS NOT NULL)
    ORDER BY a.id DESC
    LIMIT 200
  `);

  log(`Found ${articles.length} autopilot articles to QA check`);

  const { selectPhotoWithQA, runPhotoQA } = await import('./flight-drama-image-qa.mjs');
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
  const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
  const apiKeys = { pexels: PEXELS_API_KEY, pixabay: PIXABAY_API_KEY };

  let passed = 0;
  let replaced = 0;
  let failed = 0;
  let skipped = 0;

  for (const article of articles) {
    if (!article.featuredImage) {
      log(`  SKIP [${article.id}]: No featured image`);
      skipped++;
      continue;
    }

    log(`\nChecking [${article.id}] ${article.title?.slice(0, 60)}`);
    log(`  Current: ${article.featuredImage.slice(0, 70)}`);

    try {
      const category = article.categoryName || 'Commercial Aviation';

      // Run QA on the current image
      const qa = await runPhotoQA(article.featuredImage, article.title);

      if (qa.approved) {
        log(`  ✅ PASSED (${qa.passCount}/${qa.totalPasses} judges, score ${qa.score}/10) — keeping`);
        passed++;
      } else {
        log(`  ❌ FAILED (${qa.passCount}/${qa.totalPasses} judges, score ${qa.score}/10) — finding replacement`);
        if (qa.suggestedQuery) log(`  Suggested: "${qa.suggestedQuery}"`);

        // Find a replacement using the full QA pipeline
        const newPhoto = await selectPhotoWithQA(
          qa.suggestedQuery || article.title,
          category,
          apiKeys,
          5
        );

        if (newPhoto?.url && newPhoto.url !== article.featuredImage) {
          await conn.execute(
            'UPDATE articles SET featuredImage = ?, updatedAt = NOW() WHERE id = ?',
            [newPhoto.url, article.id]
          );
          log(`  ✅ REPLACED: ${newPhoto.url.slice(0, 70)}`);
          replaced++;
        } else {
          log(`  ⚠️ Could not find better replacement — keeping original`);
          failed++;
        }
      }

      // Delay between articles to avoid rate limiting
      await new Promise(r => setTimeout(r, 3000));

    } catch (e) {
      log(`  ❌ Error: ${e.message}`);
      failed++;
    }
  }

  await conn.end();
  log(`\n=== QA Backfill Complete ===`);
  log(`Passed: ${passed} | Replaced: ${replaced} | Failed: ${failed} | Skipped: ${skipped}`);
}

main().catch(e => {
  log(`Fatal: ${e.message}`);
  process.exit(1);
});
