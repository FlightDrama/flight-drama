/**
 * Backfill branded images for all draft articles
 * Uses the full QA pipeline: 5-pass Claude Opus check + 3 retry attempts
 */
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateArticleImage } from './flight-drama-image-generator.mjs';
import { fetchTwoPhotos } from './flight-drama-photo-fetcher.mjs';
import { generateWithQA } from './flight-drama-image-qa.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env
const env = {};
readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const apiKeys = { pexels: env.PEXELS_API_KEY, pixabay: env.PIXABAY_API_KEY };

async function uploadImage(pngBuffer, slug) {
  const formData = new FormData();
  const blob = new Blob([pngBuffer], { type: 'image/png' });
  formData.append('image', blob, `${slug}.png`);
  formData.append('slug', slug);
  
  const response = await fetch('https://flightdrama.com/api/autopilot/upload-image', {
    method: 'POST',
    headers: { 'x-cron-secret': 'fd-cron-2026' },
    body: formData,
    signal: AbortSignal.timeout(30000),
  });
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Upload failed ${response.status}: ${err.slice(0, 100)}`);
  }
  const data = await response.json();
  return data.url;
}

async function main() {
  const conn = await mysql.createConnection(env.DATABASE_URL);
  
  // Get ALL draft articles (regenerate everything with QA)
  const [articles] = await conn.execute(
    `SELECT a.id, a.title, a.slug, a.excerpt, c.name as categoryName 
     FROM articles a 
     LEFT JOIN categories c ON a.categoryId = c.id
     WHERE a.status = 'draft' 
     ORDER BY a.id DESC`
  );
  
  console.log(`Found ${articles.length} draft articles to regenerate with QA`);
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    try {
      console.log(`\n[${i+1}/${articles.length}] "${article.title.slice(0, 55)}"`);
      const category = article.categoryName || 'Commercial Aviation';
      
      // Use full QA pipeline with 10 attempts (3-way attack)
      const { buffer: pngBuffer, qaResult, attempt } = await generateWithQA(
        // Generate function
        async (topUrl, bottomUrl) => {
          return await generateArticleImage({
            backgroundImageUrl: topUrl,
            backgroundImageUrl2: bottomUrl,
            headline: article.title,
            subtitle: article.excerpt || '',
            isBreaking: false,
            format: 'square',
            category,
            apiKeys,
          });
        },
        // Photo fetch function (called fresh each attempt)
        async (attemptNum) => {
          return await fetchTwoPhotos(article.title, category, apiKeys);
        },
        article.title,
        category,
        10 // max 10 QA attempts (3-way attack)
      );
      
      console.log(`  QA: ${qaResult?.score}/10, ${qaResult?.passCount}/5 passes, attempt ${attempt}`);
      
      // Upload to storage
      const imageUrl = await uploadImage(pngBuffer, article.slug);
      
      // Update the article
      await conn.execute(
        'UPDATE articles SET featuredImage = ? WHERE id = ?',
        [imageUrl, article.id]
      );
      
      console.log(`  ✅ Saved: ${imageUrl.slice(0, 60)}`);
      
      // Small delay between articles
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
    }
  }
  
  await conn.end();
  console.log('\nQA Backfill complete!');
}

main().catch(console.error);
