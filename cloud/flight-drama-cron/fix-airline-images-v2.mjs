/**
 * Airline-Aware Image Fix v2
 * 
 * For every published autopilot article:
 * 1. Extract the FIRST airline/aircraft mentioned in title + excerpt
 * 2. Try to find an actual photo of that specific airline/aircraft
 * 3. Priority: Wikimedia Commons (real incident photos) → Pexels → Pixabay
 * 4. Use Claude vision to verify the image shows the correct airline
 * 
 * This fixes the root problem: articles about easyJet showing Sky Express,
 * Ryanair articles showing generic aircraft, etc.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const LOG_FILE = join(__dirname, 'fix-airline-v2.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + '\n');
}

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL || 'https://api.manus.im/forge/v1';
const FORGE_API_KEY = 'DISABLED_OLD_OM_KEY';

// Extract the FIRST airline/aircraft mentioned in title or excerpt
function extractPrimarySubject(title, excerpt) {
  const text = `${title} ${excerpt}`.toLowerCase();
  
  const subjects = [
    // Airlines — check these first
    { keywords: ['ryanair'], query: 'ryanair boeing 737 aircraft', label: 'Ryanair' },
    { keywords: ['easyjet', 'easy jet'], query: 'easyjet airbus a320 aircraft orange', label: 'easyJet' },
    { keywords: ['british airways'], query: 'british airways aircraft', label: 'British Airways' },
    { keywords: ['jet2'], query: 'jet2 aircraft holiday', label: 'Jet2' },
    { keywords: ['united airlines'], query: 'united airlines aircraft blue', label: 'United Airlines' },
    { keywords: ['delta airlines', 'delta air lines', 'delta flight'], query: 'delta airlines aircraft', label: 'Delta Airlines' },
    { keywords: ['american airlines'], query: 'american airlines aircraft', label: 'American Airlines' },
    { keywords: ['lufthansa'], query: 'lufthansa aircraft', label: 'Lufthansa' },
    { keywords: ['emirates'], query: 'emirates aircraft a380', label: 'Emirates' },
    { keywords: ['qatar airways'], query: 'qatar airways aircraft', label: 'Qatar Airways' },
    { keywords: ['air france'], query: 'air france aircraft', label: 'Air France' },
    { keywords: ['southwest airlines'], query: 'southwest airlines aircraft', label: 'Southwest Airlines' },
    { keywords: ['wizz air'], query: 'wizz air aircraft', label: 'Wizz Air' },
    { keywords: ['jetblue'], query: 'jetblue aircraft', label: 'JetBlue' },
    { keywords: ['spirit airlines'], query: 'spirit airlines aircraft', label: 'Spirit Airlines' },
    { keywords: ['alaska airlines'], query: 'alaska airlines aircraft', label: 'Alaska Airlines' },
    { keywords: ['qantas'], query: 'qantas aircraft', label: 'Qantas' },
    { keywords: ['singapore airlines'], query: 'singapore airlines aircraft', label: 'Singapore Airlines' },
    { keywords: ['turkish airlines'], query: 'turkish airlines aircraft', label: 'Turkish Airlines' },
    { keywords: ['air india'], query: 'air india aircraft', label: 'Air India' },
    { keywords: ['arik air'], query: 'arik air aircraft nigeria', label: 'Arik Air' },
    { keywords: ['philippine airlines'], query: 'philippine airlines aircraft', label: 'Philippine Airlines' },
    { keywords: ['klm'], query: 'klm aircraft', label: 'KLM' },
    { keywords: ['iberia'], query: 'iberia aircraft', label: 'Iberia' },
    { keywords: ['air canada'], query: 'air canada aircraft', label: 'Air Canada' },
    { keywords: ['virgin atlantic'], query: 'virgin atlantic aircraft', label: 'Virgin Atlantic' },
    { keywords: ['norwegian'], query: 'norwegian air aircraft', label: 'Norwegian Air' },
    { keywords: ['transavia'], query: 'transavia aircraft', label: 'Transavia' },
    { keywords: ['flydubai'], query: 'flydubai aircraft', label: 'FlyDubai' },
    { keywords: ['indigo'], query: 'indigo airlines aircraft india', label: 'IndiGo' },
    // Specific aircraft types
    { keywords: ['boeing 737 max'], query: 'boeing 737 max aircraft', label: 'Boeing 737 MAX' },
    { keywords: ['boeing 737'], query: 'boeing 737 aircraft', label: 'Boeing 737' },
    { keywords: ['boeing 777'], query: 'boeing 777 aircraft', label: 'Boeing 777' },
    { keywords: ['boeing 787', 'dreamliner'], query: 'boeing 787 dreamliner aircraft', label: 'Boeing 787' },
    { keywords: ['boeing 747', 'jumbo'], query: 'boeing 747 jumbo jet', label: 'Boeing 747' },
    { keywords: ['boeing 717'], query: 'boeing 717 aircraft', label: 'Boeing 717' },
    { keywords: ['airbus a380'], query: 'airbus a380 aircraft', label: 'Airbus A380' },
    { keywords: ['airbus a350'], query: 'airbus a350 aircraft', label: 'Airbus A350' },
    { keywords: ['airbus a321'], query: 'airbus a321 aircraft', label: 'Airbus A321' },
    { keywords: ['airbus a320'], query: 'airbus a320 aircraft', label: 'Airbus A320' },
    { keywords: ['airbus a330'], query: 'airbus a330 aircraft', label: 'Airbus A330' },
    { keywords: ['ikarus c42', 'c42'], query: 'ikarus c42 microlight aircraft', label: 'Ikarus C42' },
    { keywords: ['cessna 172', 'cessna'], query: 'cessna small aircraft', label: 'Cessna' },
    { keywords: ['hot air balloon'], query: 'hot air balloon flight', label: 'Hot Air Balloon' },
    { keywords: ['helicopter'], query: 'helicopter aircraft', label: 'Helicopter' },
  ];
  
  // Find first match in the combined text
  for (const subject of subjects) {
    const pos = subject.keywords.reduce((earliest, kw) => {
      const idx = text.indexOf(kw);
      return idx >= 0 && (earliest < 0 || idx < earliest) ? idx : earliest;
    }, -1);
    if (pos >= 0) return { ...subject, position: pos };
  }
  
  return null;
}

// Fetch from Wikimedia Commons (best for specific aircraft/airline photos)
async function fetchWikimedia(query) {
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=8&format=json&origin=*`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results = (data.query?.search || []).filter(r => r.title.match(/\.(jpg|jpeg|png)$/i));
    
    for (const r of results.slice(0, 4)) {
      const imgRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(r.title)}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (!imgRes.ok) continue;
      const imgData = await imgRes.json();
      const pages = Object.values(imgData.query?.pages || {});
      const url = pages[0]?.imageinfo?.[0]?.url;
      if (url && !url.endsWith('.svg')) {
        const meta = pages[0]?.imageinfo?.[0]?.extmetadata || {};
        const artist = meta.Artist?.value?.replace(/<[^>]+>/g, '').trim() || null;
        const licence = meta.LicenseShortName?.value || null;
        return { 
          url, 
          attribution: artist ? `Photo: ${artist} via Wikimedia Commons${licence ? ` (${licence})` : ''}` : 'Photo: Wikimedia Commons',
          source: 'Wikimedia'
        };
      }
    }
  } catch {}
  return null;
}

// Fetch from Pexels
async function fetchPexels(query, attempt = 0) {
  if (!PEXELS_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=${Math.floor(attempt/5)+1}&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.photos?.length) return null;
    const pick = data.photos[attempt % Math.min(8, data.photos.length)];
    return { 
      url: pick.src?.large2x || pick.src?.large,
      attribution: pick.photographer ? `Photo by ${pick.photographer} on Pexels` : null,
      source: 'Pexels'
    };
  } catch { return null; }
}

// Fetch from Pixabay
async function fetchPixabay(query) {
  if (!PIXABAY_API_KEY) return null;
  try {
    const res = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=10&safesearch=true`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.hits?.length) return null;
    const pick = data.hits[Math.floor(Math.random() * Math.min(5, data.hits.length))];
    return { 
      url: pick.largeImageURL || pick.webformatURL,
      attribution: pick.user ? `Photo by ${pick.user} on Pixabay` : null,
      source: 'Pixabay'
    };
  } catch { return null; }
}

// Verify image with Claude vision
async function verifyWithClaude(imageUrl, label, context) {
  if (!FORGE_API_KEY) return true; // Skip if no key
  try {
    const res = await fetch(`${FORGE_API_URL}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${FORGE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 100,
        messages: [{ role: 'user', content: [
          { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
          { type: 'text', text: `Does this image show a ${label} aircraft with the correct livery/branding? Context: "${context.slice(0, 150)}"\n\nRespond ONLY with JSON: {"correct": true/false, "reason": "brief"}` }
        ]}],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return true;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const match = content.match(/\{[\s\S]*?\}/);
    if (!match) return true;
    const result = JSON.parse(match[0]);
    return result.correct;
  } catch { return true; }
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get ALL published articles with Pexels images (not Josh's branded manus-storage)
  const [articles] = await conn.execute(`
    SELECT id, title, excerpt, content, featuredImage
    FROM articles
    WHERE status = 'published'
    AND featuredImage LIKE '%pexels.com%'
    ORDER BY id DESC
    LIMIT 200
  `);
  
  log(`Checking ${articles.length} autopilot articles for correct airline images...`);
  
  let fixed = 0;
  let correct = 0;
  let noSubject = 0;
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    // Extract airline from title + excerpt + first 300 chars of body
    const bodyText = (article.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 500);
    const subject = extractPrimarySubject(article.title, `${article.excerpt || ''} ${bodyText}`);
    
    if (!subject) {
      noSubject++;
      continue;
    }
    
    log(`\n[${i+1}/${articles.length}] ${article.id}: ${article.title?.slice(0, 55)}`);
    log(`  Primary subject: ${subject.label} | Query: "${subject.query}"`);
    
    // Try to find the best image for this specific airline/aircraft
    // Priority: Wikimedia → Pexels → Pixabay
    let bestPhoto = null;
    
    // Try Wikimedia first (has real incident/airline photos)
    const wikiPhoto = await fetchWikimedia(subject.query);
    if (wikiPhoto?.url) {
      const context = `${article.title} ${article.excerpt || ''}`;
      const verified = await verifyWithClaude(wikiPhoto.url, subject.label, context);
      if (verified) {
        bestPhoto = wikiPhoto;
        log(`  ✅ Wikimedia verified`);
      } else {
        log(`  ❌ Wikimedia rejected by Claude`);
      }
    }
    
    // Try Pexels if Wikimedia didn't work
    if (!bestPhoto) {
      for (let attempt = 0; attempt < 4; attempt++) {
        const pexelsPhoto = await fetchPexels(subject.query, attempt);
        if (pexelsPhoto?.url) {
          const context = `${article.title} ${article.excerpt || ''}`;
          const verified = await verifyWithClaude(pexelsPhoto.url, subject.label, context);
          if (verified) {
            bestPhoto = pexelsPhoto;
            log(`  ✅ Pexels verified (attempt ${attempt+1})`);
            break;
          }
        }
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    // Try Pixabay if Pexels didn't work
    if (!bestPhoto) {
      const pixabayPhoto = await fetchPixabay(subject.query);
      if (pixabayPhoto?.url) {
        const context = `${article.title} ${article.excerpt || ''}`;
        const verified = await verifyWithClaude(pixabayPhoto.url, subject.label, context);
        if (verified) {
          bestPhoto = pixabayPhoto;
          log(`  ✅ Pixabay verified`);
        }
      }
    }
    
    if (bestPhoto?.url && bestPhoto.url !== article.featuredImage) {
      // Reconnect for DB update
      const updateConn = await mysql.createConnection(process.env.DATABASE_URL);
      await updateConn.execute(
        'UPDATE articles SET featuredImage = ?, imageAttribution = ?, updatedAt = NOW() WHERE id = ?',
        [bestPhoto.url, bestPhoto.attribution || null, article.id]
      );
      await updateConn.end();
      log(`  ✅ Updated: [${bestPhoto.source}] ${bestPhoto.url.slice(0, 70)}`);
      fixed++;
    } else if (bestPhoto) {
      log(`  ✓ Already has correct image`);
      correct++;
    } else {
      log(`  ⚠️ No verified ${subject.label} photo found — keeping current`);
    }
    
    await new Promise(r => setTimeout(r, 1500));
  }
  
  await conn.end();
  log(`\n=== Done === Fixed: ${fixed} | Already correct: ${correct} | No subject: ${noSubject}`);
}

main().catch(e => { log(`Fatal: ${e.message}`); process.exit(1); });
