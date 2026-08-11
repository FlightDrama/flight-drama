/**
 * Flight Drama Ultimate Photo Fetcher v3
 * 
 * 8 Image Sources (tried in order per attempt):
 *   1. Pexels API           — high quality editorial (key required)
 *   2. Wikimedia Commons    — official press/aircraft photos, no key, attribution required
 *   3. Pixabay API          — large volume, commercial use (key required)
 *   4. Unsplash Source      — premium editorial, no key needed
 *   5. Flickr Public API    — massive aviation spotter community, no key for basic search
 *   6. Imgur Search         — community aviation photos, attribution from title
 *   7. NASA Image Library   — free, no key, good for aviation/aerospace
 *   8. Safe fallback pool   — 20 varied aviation photos, random selection
 * 
 * AI-Powered Query Generation:
 *   - Claude Opus 4.8 generates 3 specific search queries per headline
 *   - Fallback: keyword-based smart query builder
 * 
 * Attribution:
 *   - Wikimedia: photographer name + licence (CC BY-SA etc.)
 *   - Pexels: photographer name
 *   - Pixabay: photographer username
 *   - Flickr: photographer name + licence
 *   - Imgur: title/description
 *   - NASA: always public domain
 *   - Unsplash: photographer name
 */

import { appendFileSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const env = {};
try {
  readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim();
  });
} catch {}

const FORGE_API_URL = env.BUILT_IN_FORGE_API_URL || 'https://api.manus.im/forge/v1';
const FORGE_API_KEY = 'DISABLED_OLD_OM_KEY';
const PEXELS_API_KEY = env.PEXELS_API_KEY;
const PIXABAY_API_KEY = env.PIXABAY_API_KEY;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { appendFileSync(path.join(__dirname, 'photo-fetcher.log'), line + '\n'); } catch {}
}

// ─── Safe Fallback Pool (20 varied aviation photos, no wrong airlines) ─────────
const FALLBACK_PHOTOS = [
  { url: 'https://images.pexels.com/photos/46148/aircraft-jet-landing-cloud-46148.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
  { url: 'https://images.pexels.com/photos/358220/pexels-photo-358220.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
  { url: 'https://images.pexels.com/photos/912050/pexels-photo-912050.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
  { url: 'https://images.pexels.com/photos/2026324/pexels-photo-2026324.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
  { url: 'https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
  { url: 'https://images.pexels.com/photos/1309644/pexels-photo-1309644.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
  { url: 'https://images.pexels.com/photos/2898199/pexels-photo-2898199.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
  { url: 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
  { url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
  { url: 'https://images.pexels.com/photos/4481259/pexels-photo-4481259.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
  { url: 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
  { url: 'https://images.pexels.com/photos/1436139/pexels-photo-1436139.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
  { url: 'https://images.pexels.com/photos/3764984/pexels-photo-3764984.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
  { url: 'https://images.pexels.com/photos/2876511/pexels-photo-2876511.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
  { url: 'https://images.pexels.com/photos/723240/pexels-photo-723240.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
  { url: 'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
  { url: 'https://images.pexels.com/photos/3769138/pexels-photo-3769138.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
  { url: 'https://images.pexels.com/photos/2599537/pexels-photo-2599537.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
  { url: 'https://images.pexels.com/photos/3806753/pexels-photo-3806753.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
  { url: 'https://images.pexels.com/photos/2159549/pexels-photo-2159549.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null },
];

// ─── AI-Powered Query Generation ─────────────────────────────────────────────

/**
 * Use Claude Opus to generate 3 specific search queries for the headline
 * Returns array of query strings, most specific first
 */
export async function generateSearchQueries(headline, excerpt = '') {
  if (!FORGE_API_KEY) return [buildKeywordQuery(headline, '', excerpt)];
  const context = excerpt ? `Headline: "${headline}"\nSynopsis: "${excerpt.slice(0, 200)}"` : `Headline: "${headline}"`;
  try {
    const res = await fetch(`${FORGE_API_URL}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${FORGE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Generate 3 image search queries for this aviation news article:\n${context}\n\nIMPORTANT: If a specific airline is mentioned (e.g. Ryanair, easyJet, United Airlines), the FIRST query MUST be for that specific airline's aircraft.\n\nRules:\n- Query 1: Most specific (aircraft type + airline + situation if mentioned)\n- Query 2: Medium specific (aircraft type + situation)\n- Query 3: General aviation fallback\n\nExamples for "Ikarus C42 crashed into trees after engine failure":\n- "Ikarus C42 microlight aircraft"\n- "small plane crash trees engine failure"\n- "light aircraft emergency landing"\n\nRespond ONLY with JSON array: ["query1","query2","query3"]`
        }]
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [buildKeywordQuery(headline)];
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const match = content.match(/\[[\s\S]*?\]/);
    if (match) {
      const queries = JSON.parse(match[0]);
      if (Array.isArray(queries) && queries.length > 0) {
        log(`  AI queries: ${queries.join(' | ')}`);
        return queries;
      }
    }
  } catch (e) {
    log(`  AI query generation failed: ${e.message}`);
  }
  return [buildKeywordQuery(headline)];
}

/**
 * Keyword-based fallback query builder
 */
export function buildKeywordQuery(headline, category = '', excerpt = '') {
  // Use combined text (title + excerpt) to detect the primary subject
  const lower = `${headline} ${excerpt}`.toLowerCase();

  // Airports
  const airports = [
    ['heathrow', 'heathrow airport london'], ['gatwick', 'gatwick airport london'],
    ['stansted', 'stansted airport london'], ['manchester airport', 'manchester airport uk'],
    ['glasgow airport', 'glasgow airport scotland'], ['edinburgh airport', 'edinburgh airport scotland'],
    ['birmingham airport', 'birmingham airport uk'], ['dublin airport', 'dublin airport ireland'],
    ['schiphol', 'amsterdam schiphol airport'], ['charles de gaulle', 'paris charles de gaulle airport'],
    ['frankfurt airport', 'frankfurt airport germany'], ['dubai airport', 'dubai international airport'],
    ['jfk', 'jfk airport new york'], ['lax', 'los angeles airport'],
    ['o\'hare', 'chicago o\'hare airport'], ['changi', 'singapore changi airport'],
    ['hong kong airport', 'hong kong international airport'], ['sydney airport', 'sydney airport australia'],
    ['doha airport', 'doha hamad international airport'], ['istanbul airport', 'istanbul airport turkey'],
    ['narita', 'tokyo narita airport'], ['incheon', 'seoul incheon airport'],
    ['miami airport', 'miami international airport'], ['denver airport', 'denver international airport'],
    ['dallas airport', 'dallas fort worth airport'], ['atlanta airport', 'atlanta hartsfield airport'],
    ['wycombe', 'wycombe air park small aircraft'], ['wycombe air park', 'wycombe air park airfield'],
  ];
  for (const [kw, q] of airports) { if (lower.includes(kw)) return q; }

  // Airlines
  const airlines = [
    ['ryanair', 'ryanair boeing 737 aircraft'], ['easyjet', 'easyjet airbus aircraft'],
    ['british airways', 'british airways aircraft'], ['united airlines', 'united airlines aircraft'],
    ['delta airlines', 'delta airlines aircraft'], ['delta air lines', 'delta airlines aircraft'],
    ['emirates', 'emirates aircraft'], ['lufthansa', 'lufthansa aircraft'],
    ['qatar airways', 'qatar airways aircraft'], ['air france', 'air france aircraft'],
    ['southwest airlines', 'southwest airlines aircraft'], ['wizz air', 'wizz air aircraft'],
    ['jetblue', 'jetblue aircraft'], ['spirit airlines', 'spirit airlines aircraft'],
    ['frontier airlines', 'frontier airlines aircraft'], ['alaska airlines', 'alaska airlines aircraft'],
    ['qantas', 'qantas aircraft'], ['singapore airlines', 'singapore airlines aircraft'],
    ['turkish airlines', 'turkish airlines aircraft'], ['american airlines', 'american airlines aircraft'],
    ['virgin atlantic', 'virgin atlantic aircraft'], ['klm', 'klm aircraft'],
    ['iberia', 'iberia aircraft'], ['finnair', 'finnair aircraft'],
    ['air india', 'air india aircraft'], ['etihad', 'etihad airways aircraft'],
    ['air canada', 'air canada aircraft'], ['air astana', 'air astana aircraft'],
    ['arik air', 'arik air aircraft nigeria'], ['philippine airlines', 'philippine airlines aircraft'],
    ['flydubai', 'flydubai aircraft'], ['indigo', 'indigo airlines aircraft'],
    ['norwegian', 'norwegian air aircraft'], ['transavia', 'transavia aircraft'],
  ];
  for (const [kw, q] of airlines) { if (lower.includes(kw)) return q; }

  // Specific aircraft types
  const aircraft = [
    ['ikarus c42', 'ikarus c42 microlight aircraft'], ['c42', 'ikarus c42 microlight'],
    ['cessna 172', 'cessna 172 small aircraft'], ['cessna', 'cessna small aircraft general aviation'],
    ['piper', 'piper aircraft general aviation'], ['cirrus', 'cirrus aircraft sr22'],
    ['boeing 737 max', 'boeing 737 max aircraft'], ['boeing 737', 'boeing 737 aircraft'],
    ['boeing 777', 'boeing 777 aircraft'], ['boeing 787', 'boeing 787 dreamliner'],
    ['boeing 747', 'boeing 747 jumbo jet'], ['boeing 767', 'boeing 767 aircraft'],
    ['airbus a320', 'airbus a320 aircraft'], ['airbus a321', 'airbus a321 aircraft'],
    ['airbus a380', 'airbus a380 aircraft'], ['airbus a350', 'airbus a350 aircraft'],
    ['airbus a330', 'airbus a330 aircraft'], ['concorde', 'concorde supersonic aircraft'],
    ['f-35', 'f-35 fighter jet'], ['f-16', 'f-16 fighter jet'],
    ['f-15', 'f-15 fighter jet'], ['eurofighter', 'eurofighter typhoon'],
    ['hot air balloon', 'hot air balloon flight'], ['balloon', 'hot air balloon'],
    ['helicopter', 'helicopter aircraft'], ['drone', 'military drone aircraft'],
  ];
  for (const [kw, q] of aircraft) { if (lower.includes(kw)) return q; }

  // Situations
  if (lower.includes('river') || lower.includes('lake') || lower.includes('water landing')) return 'aircraft water emergency river';
  if (lower.includes('freezing') || lower.includes('frozen') || lower.includes('ice')) return 'aircraft snow ice winter runway';
  if (lower.includes('highway') || lower.includes('motorway') || lower.includes('road')) return 'small aircraft emergency highway road';
  if (lower.includes('field') || lower.includes('farm') || lower.includes('crop')) return 'small aircraft emergency field grass';
  if (lower.includes('forest') || lower.includes('trees') || lower.includes('woods')) return 'aircraft trees forest emergency';
  if (lower.includes('fire') || lower.includes('smoke') || lower.includes('burning')) return 'aircraft fire smoke emergency';
  if (lower.includes('engine failure') || lower.includes('engine fire') || lower.includes('engine out')) return 'aircraft engine failure smoke';
  if (lower.includes('gear') || lower.includes('wheels') || lower.includes('belly')) return 'aircraft belly landing gear runway';
  if (lower.includes('emergency landing') || lower.includes('crash')) return 'aircraft emergency landing runway';
  if (lower.includes('squawk 7700') || lower.includes('mayday')) return 'aircraft emergency airport';
  if (lower.includes('cockpit') || lower.includes('pilot')) return 'airplane cockpit pilot';
  if (lower.includes('turbulence')) return 'airplane turbulence storm clouds';
  if (lower.includes('airport')) return 'international airport terminal aircraft';
  if (lower.includes('military') || lower.includes('air force')) return 'military aircraft fighter jet';
  if (lower.includes('cargo') || lower.includes('freight')) return 'cargo aircraft freight';
  if (lower.includes('strike') || lower.includes('union')) return 'airline workers airport';
  if (lower.includes('salary') || lower.includes('pay') || lower.includes('wage')) return 'pilot aircraft cockpit';
  if (lower.includes('beach') || lower.includes('ocean city') || lower.includes('coast')) return 'aircraft beach landing';

  // Category fallback
  const categoryMap = {
    'Aviation Incidents': 'aircraft emergency airport runway',
    'Military Aviation': 'military aircraft fighter jet',
    'Pilot & Crew': 'pilot cockpit airplane',
    'Aircraft Tech': 'aircraft engine technology',
    'Commercial Aviation': 'commercial aircraft airline sky',
  };
  return categoryMap[category] || 'commercial aircraft sky';
}

// ─── Source 1: Pexels API ─────────────────────────────────────────────────────
async function fetchFromPexels(query, offset = 0) {
  if (!PEXELS_API_KEY) return null;
  try {
    const page = Math.floor(offset / 10) + 1;
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=${page}&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.photos?.length) return null;
    const pick = data.photos[Math.floor(Math.random() * Math.min(8, data.photos.length))];
    return {
      url: pick.src?.large2x || pick.src?.large || pick.src?.original,
      attribution: pick.photographer ? `Photo by ${pick.photographer} on Pexels` : null,
      attributionUrl: pick.url || null,
      requiresAttribution: false, // Pexels free tier doesn't legally require it but it's good practice
      source: 'Pexels',
    };
  } catch { return null; }
}

// ─── Source 2: Wikimedia Commons ─────────────────────────────────────────────
async function fetchFromWikimedia(query, offset = 0) {
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' aircraft')}&srnamespace=6&srlimit=10&sroffset=${offset}&format=json&origin=*`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results = data.query?.search || [];
    
    for (const r of results) {
      if (!r.title.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)) continue;
      
      // Get image info including licence and author
      const imgRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(r.title)}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!imgRes.ok) continue;
      const imgData = await imgRes.json();
      const pages = Object.values(imgData.query?.pages || {});
      const page = pages[0];
      const info = page?.imageinfo?.[0];
      if (!info?.url) continue;
      
      // Skip SVG files
      if (info.url.endsWith('.svg') || info.url.endsWith('.SVG')) continue;
      
      // Extract attribution metadata
      const meta = info.extmetadata || {};
      const artist = meta.Artist?.value?.replace(/<[^>]+>/g, '').trim() || null;
      const licence = meta.LicenseShortName?.value || meta.License?.value || null;
      const licenceUrl = meta.LicenseUrl?.value || null;
      
      // Build attribution string
      let attribution = null;
      let requiresAttribution = false;
      if (artist || licence) {
        requiresAttribution = !!(licence && (licence.includes('CC') || licence.includes('GFDL')));
        attribution = [
          artist ? `Photo: ${artist}` : null,
          licence ? `Licence: ${licence}` : null,
          'via Wikimedia Commons',
        ].filter(Boolean).join(' | ');
      }
      
      return {
        url: info.url,
        attribution,
        attributionUrl: licenceUrl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(r.title)}`,
        requiresAttribution,
        source: 'Wikimedia Commons',
      };
    }
  } catch { return null; }
  return null;
}

// ─── Source 3: Pixabay API ────────────────────────────────────────────────────
async function fetchFromPixabay(query, offset = 0) {
  if (!PIXABAY_API_KEY) return null;
  try {
    const page = Math.floor(offset / 10) + 1;
    const res = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=15&page=${page}&safesearch=true`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.hits?.length) return null;
    const pick = data.hits[Math.floor(Math.random() * Math.min(8, data.hits.length))];
    return {
      url: pick.largeImageURL || pick.webformatURL,
      attribution: pick.user ? `Photo by ${pick.user} on Pixabay` : null,
      attributionUrl: pick.pageURL || null,
      requiresAttribution: false, // Pixabay licence is free for commercial use
      source: 'Pixabay',
    };
  } catch { return null; }
}

// ─── Source 4: Unsplash Source (no key needed) ───────────────────────────────
async function fetchFromUnsplash(query) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://source.unsplash.com/1280x720/?${encodedQuery}`;
    // Unsplash Source redirects to actual image — follow redirect
    const res = await fetch(url, { 
      redirect: 'follow',
      signal: AbortSignal.timeout(10000) 
    });
    if (!res.ok || !res.url || res.url.includes('source.unsplash.com')) return null;
    // Extract photographer from URL if possible
    return {
      url: res.url,
      attribution: 'Photo via Unsplash',
      attributionUrl: `https://unsplash.com/s/photos/${encodedQuery}`,
      requiresAttribution: false,
      source: 'Unsplash',
    };
  } catch { return null; }
}

// ─── Source 5: Flickr Public API (no key needed for basic search) ────────────
async function fetchFromFlickr(query) {
  try {
    // Use Flickr's public API endpoint (no key needed for basic search)
    const res = await fetch(
      `https://api.flickr.com/services/feeds/photos_public.gne?tags=${encodeURIComponent(query)}&format=json&nojsoncallback=1`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const text = await res.text();
    const data = JSON.parse(text);
    const items = data.items || [];
    if (!items.length) return null;
    
    // Filter to only aviation-related items
    const pick = items[Math.floor(Math.random() * Math.min(5, items.length))];
    // Get larger image URL (replace _m with _b for large)
    const imgUrl = pick.media?.m?.replace('_m.jpg', '_b.jpg') || pick.media?.m;
    if (!imgUrl) return null;
    
    return {
      url: imgUrl,
      attribution: pick.author ? `Photo by ${pick.author.replace(/.*\((.*)\).*/, '$1')} on Flickr` : 'Photo via Flickr',
      attributionUrl: pick.link || null,
      requiresAttribution: true, // Flickr photos may have CC licences requiring attribution
      source: 'Flickr',
    };
  } catch { return null; }
}

// ─── Source 6: Imgur Search ───────────────────────────────────────────────────
async function fetchFromImgur(query) {
  try {
    // Imgur's public gallery search (no key needed for basic search)
    const res = await fetch(
      `https://api.imgur.com/3/gallery/search/top?q=${encodeURIComponent(query + ' aviation')}`,
      { 
        headers: { Authorization: 'Client-ID 546c25a59c58ad7' }, // Imgur public client ID
        signal: AbortSignal.timeout(8000) 
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const items = (data.data || []).filter(item => item.images?.[0]?.type?.startsWith('image/'));
    if (!items.length) return null;
    
    const pick = items[Math.floor(Math.random() * Math.min(5, items.length))];
    const img = pick.images?.[0];
    if (!img?.link) return null;
    
    return {
      url: img.link,
      attribution: pick.account_url ? `Image by ${pick.account_url} on Imgur` : 'Image via Imgur',
      attributionUrl: `https://imgur.com/${pick.id}`,
      requiresAttribution: false,
      source: 'Imgur',
    };
  } catch { return null; }
}

// ─── Source 7: NASA Image Library ────────────────────────────────────────────
async function fetchFromNASA(query) {
  try {
    // NASA images are public domain — great for aerospace/aviation
    const res = await fetch(
      `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image&page_size=10`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const items = data.collection?.items || [];
    if (!items.length) return null;
    
    const pick = items[Math.floor(Math.random() * Math.min(5, items.length))];
    const links = pick.links || [];
    const imgLink = links.find(l => l.rel === 'preview')?.href;
    if (!imgLink) return null;
    
    // Get full resolution URL
    const fullResUrl = imgLink.replace('~thumb', '~orig').replace('~medium', '~orig');
    
    return {
      url: fullResUrl,
      attribution: `Photo: NASA (Public Domain)`,
      attributionUrl: pick.data?.[0]?.nasa_id ? `https://images.nasa.gov/details-${pick.data[0].nasa_id}` : null,
      requiresAttribution: false, // NASA images are public domain
      source: 'NASA',
    };
  } catch { return null; }
}

// ─── Main Photo Fetch Function ────────────────────────────────────────────────

/**
 * Fetch a photo using all available sources
 * Returns { url, attribution, attributionUrl, requiresAttribution, source }
 * 
 * @param {string} query - Search query (use buildKeywordQuery or generateSearchQueries)
 * @param {object} keys - { pexels, pixabay } (loaded from env by default)
 * @param {number} offset - Offset for variety across attempts
 */
export async function fetchPhoto(query, keys = {}, offset = 0) {
  // Note: Flickr and Imgur removed — too unreliable for aviation-specific content
  const sources = [
    { name: 'Pexels', fn: () => fetchFromPexels(query, offset) },
    { name: 'Wikimedia', fn: () => fetchFromWikimedia(query, offset) },
    { name: 'Pixabay', fn: () => fetchFromPixabay(query, offset) },
    { name: 'Unsplash', fn: () => fetchFromUnsplash(query) },
    { name: 'NASA', fn: () => fetchFromNASA(query) },
  ];

  for (const source of sources) {
    try {
      const result = await source.fn();
      if (result?.url) {
        log(`  [${source.name}] Found: ${result.url.slice(0, 70)}`);
        return result;
      }
    } catch (e) {
      log(`  [${source.name}] Error: ${e.message.slice(0, 50)}`);
    }
  }

  // Random fallback
  const idx = Math.floor(Math.random() * FALLBACK_PHOTOS.length);
  log(`  [Fallback] Using pool photo ${idx}`);
  return FALLBACK_PHOTOS[idx];
}

/**
 * Fetch a photo with AI-generated queries — tries multiple queries across all sources
 * This is the recommended function for the autopilot
 */
export async function fetchPhotoWithAIQueries(headline, category = '', offset = 0) {
  // Generate AI queries first
  const queries = await generateSearchQueries(headline);
  // Add keyword fallback as last resort
  queries.push(buildKeywordQuery(headline, category));
  
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    log(`  Trying query ${i+1}/${queries.length}: "${query}"`);
    
    // Note: Flickr and Imgur removed — too unreliable for aviation-specific content
    const sources = [
      { name: 'Pexels', fn: () => fetchFromPexels(query, offset) },
      { name: 'Wikimedia', fn: () => fetchFromWikimedia(query, offset) },
      { name: 'Pixabay', fn: () => fetchFromPixabay(query, offset) },
      { name: 'Unsplash', fn: () => fetchFromUnsplash(query) },
      { name: 'NASA', fn: () => fetchFromNASA(query) },
    ];

    for (const source of sources) {
      try {
        const result = await source.fn();
        if (result?.url) {
          log(`  [${source.name}] Found for query "${query.slice(0, 40)}": ${result.url.slice(0, 60)}`);
          return { ...result, usedQuery: query };
        }
      } catch {}
    }
  }

  // Random fallback
  const idx = Math.floor(Math.random() * FALLBACK_PHOTOS.length);
  return { ...FALLBACK_PHOTOS[idx], usedQuery: 'fallback' };
}

/**
 * Exported for QA module backward compatibility
 */
export async function fetchFromWikimediaByQuery(query) {
  const result = await fetchFromWikimedia(query);
  return result?.url || null;
}

/**
 * Fetch TWO different photos for the branded template (social media use)
 */
export async function fetchTwoPhotos(headline, category, keys = {}) {
  const queries = await generateSearchQueries(headline);
  const mainQuery = queries[0] || buildKeywordQuery(headline, category);
  const altQuery = queries[1] || (mainQuery + ' airport');

  const topPhoto = await fetchPhoto(mainQuery, keys, 0);
  let bottomPhoto = await fetchPhoto(altQuery, keys, 5);
  
  // Ensure they're different
  if (bottomPhoto?.url === topPhoto?.url) {
    bottomPhoto = await fetchPhoto(mainQuery + ' runway', keys, 10);
  }
  if (!bottomPhoto?.url || bottomPhoto.url === topPhoto?.url) {
    const idx = (Math.floor(Math.random() * FALLBACK_PHOTOS.length));
    bottomPhoto = FALLBACK_PHOTOS[idx];
  }

  return {
    topPhoto: topPhoto?.url || FALLBACK_PHOTOS[0].url,
    bottomPhoto: bottomPhoto?.url || FALLBACK_PHOTOS[1].url,
    topAttribution: topPhoto?.attribution || null,
    bottomAttribution: bottomPhoto?.attribution || null,
    topRequiresAttribution: topPhoto?.requiresAttribution || false,
    bottomRequiresAttribution: bottomPhoto?.requiresAttribution || false,
  };
}
