/**
 * Flight Drama Image Generator v4
 * Exact match to Josh's Canva template specs:
 * 
 * HEADLINE: Anton font, 80pt (scales with canvas)
 * SUBTITLE: Montserrat Bold, 44pt, yellow (#f5c518)
 * BADGE: Flight Drama logo image (black square, FLIGHT white / DRAMA yellow)
 * LAYOUT: Two photos stacked — top photo (clean) + bottom photo (dark overlay + text)
 * UNDERLINE: Solid white line below headline
 */

import { appendFileSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchTwoPhotos, buildKeywordQuery as buildSearchQuery } from './flight-drama-photo-fetcher.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, 'image-generator.log');

const SCREENSHOT_API = 'http://localhost:4000';
const SCREENSHOT_SECRET = '4eb712205fdbb3e62ae82f71d10f896d0f7a73d00c4db1c6fc7551f9d9bc9259';

// Flight Drama logo — loaded from local file as base64 data URI
function getLogoDataUri() {
  try {
    const logoPath = path.join(__dirname, 'fd-logo.png');
    const logoData = readFileSync(logoPath);
    return `data:image/png;base64,${logoData.toString('base64')}`;
  } catch {
    // Fallback to public URL if local file not found
    return 'https://flightdrama.com/logo192.png';
  }
}
const LOGO_URL = getLogoDataUri();

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + '\n'); } catch {}
}

function esc(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '\u2019')
    .replace(/\u201c/g, '"')
    .replace(/\u201d/g, '"');
}

/**
 * Build the article image HTML — exact Canva template replica
 * 
 * The Canva template has TWO photos:
 * - Top photo: clean, no overlay, takes up ~42% of height
 * - Bottom photo: same image OR different, with dark overlay, takes up ~58%
 *   Contains: logo badge, headline (Anton 80pt), underline, subtitle (Montserrat 44pt)
 */
function buildArticleHTML(topUrl, bottomUrl, headline, subtitle, isBreaking, width, height, topAttribution, bottomAttribution) {
  const s = width / 1080; // scale factor
  
  // Canva template proportions
  const topH = Math.round(height * 0.42);
  const bottomH = height - topH;
  const pad = Math.round(32 * s);
  
  // Anton font size — scales from 80pt at 1080px
  // Canva canvas is ~500px wide at 1080 template size, Anton 80pt
  const headlineLen = headline.length;
  let fontSize;
  if (headlineLen <= 25) fontSize = Math.round(100 * s);
  else if (headlineLen <= 35) fontSize = Math.round(88 * s);
  else if (headlineLen <= 50) fontSize = Math.round(76 * s);
  else if (headlineLen <= 65) fontSize = Math.round(66 * s);
  else fontSize = Math.round(56 * s);
  
  // Montserrat subtitle — 44pt in Canva
  const subFontSize = Math.round(34 * s);
  
  // Logo size
  const logoSize = Math.round(72 * s);
  
  // Underline
  const underlineH = Math.round(3 * s);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@700&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: ${width}px;
  height: ${height}px;
  overflow: hidden;
  background: #000;
}
.canvas {
  width: ${width}px;
  height: ${height}px;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* TOP PHOTO — clean, no overlay */
.top-photo {
  width: 100%;
  height: ${topH}px;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
}
.top-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
  display: block;
}
/* Hide any Wikimedia/Pexels attribution text that may appear on images */
.top-photo img, .bottom-bg img {
  font-size: 0 !important;
  color: transparent !important;
}
/* Subtle brand-coloured fade at the bottom of the top photo — using real div */
.top-fade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${Math.round(topH * 0.40)}px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(245, 197, 24, 0.03) 35%,
    rgba(245, 197, 24, 0.08) 60%,
    rgba(15, 10, 3, 0.60) 80%,
    rgba(8, 5, 1, 0.88) 100%
  );
  pointer-events: none;
  z-index: 1;
}

/* BOTTOM SECTION — photo with dark overlay + text */
.bottom-section {
  width: 100%;
  height: ${bottomH}px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}
/* Bottom background photo */
.bottom-bg {
  position: absolute;
  inset: 0;
}
.bottom-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 60%;
  display: block;
}
/* Dark overlay on bottom section — with subtle yellow brand glow at top join */
.bottom-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(245, 197, 24, 0.08) 0%,
    rgba(0,0,0,0.50) 12%,
    rgba(0,0,0,0.72) 30%,
    rgba(0,0,0,0.88) 60%,
    rgba(0,0,0,0.96) 100%
  );
}

/* Text content */
.text-content {
  position: absolute;
  inset: 0;
  padding: ${pad}px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: ${Math.round(10 * s)}px;
}

${isBreaking ? `.breaking {
  display: inline-block;
  background: #dc2626;
  color: #fff;
  font-family: 'Anton', 'Arial Black', sans-serif;
  font-size: ${Math.round(16 * s)}px;
  letter-spacing: 0.1em;
  padding: ${Math.round(4 * s)}px ${Math.round(10 * s)}px;
  margin-bottom: ${Math.round(4 * s)}px;
  text-transform: uppercase;
}` : ''}

/* Logo badge */
.logo {
  width: ${logoSize}px;
  height: ${logoSize}px;
  object-fit: contain;
  display: block;
}

/* Headline — Anton font, matches Canva 80pt */
.headline {
  font-family: 'Anton', 'Arial Black', Impact, sans-serif;
  font-size: ${fontSize}px;
  font-weight: 400; /* Anton is already ultra-bold */
  color: #ffffff;
  text-transform: uppercase;
  line-height: 0.95;
  letter-spacing: 0.01em;
  word-break: break-word;
  hyphens: auto;
}

/* Solid white underline below headline */
.underline {
  width: 100%;
  height: ${underlineH}px;
  background: rgba(255,255,255,0.85);
  margin-top: ${Math.round(6 * s)}px;
  flex-shrink: 0;
}

/* Subtitle — Montserrat Bold, matches Canva 44pt */
.subtitle {
  font-family: 'Montserrat', 'Arial', sans-serif;
  font-weight: 700;
  font-size: ${subFontSize}px;
  color: #f5c518;
  line-height: 1.25;
  margin-top: ${Math.round(4 * s)}px;
}

/* Photo attribution credit pill */
.attribution {
  position: absolute;
  bottom: ${Math.round(8 * s)}px;
  right: ${Math.round(10 * s)}px;
  background: rgba(0,0,0,0.55);
  color: rgba(255,255,255,0.75);
  font-family: 'Montserrat', Arial, sans-serif;
  font-size: ${Math.round(11 * s)}px;
  font-weight: 500;
  padding: ${Math.round(3 * s)}px ${Math.round(7 * s)}px;
  border-radius: ${Math.round(3 * s)}px;
  letter-spacing: 0.03em;
  z-index: 5;
  pointer-events: none;
  text-transform: uppercase;
}

/* White border frame — visible around entire image */
.frame {
  position: absolute;
  inset: ${Math.round(8 * s)}px;
  border: ${Math.round(3 * s)}px solid rgba(255,255,255,0.85);
  pointer-events: none;
  z-index: 10;
  box-sizing: border-box;
}
</style>
</head>
<body>
<div class="canvas">
  <!-- Top photo — clean, different image -->
  <div class="top-photo">
    <img src="${topUrl}" crossorigin="anonymous" />
    <div class="top-fade"></div>
    ${topAttribution ? `<div class="attribution">${topAttribution}</div>` : ''}
  </div>
  
  <!-- Bottom section — different photo + overlay + text -->
  <div class="bottom-section">
    <div class="bottom-bg">
      <img src="${bottomUrl}" crossorigin="anonymous" />
    </div>
    <div class="bottom-overlay"></div>
    
    <div class="text-content">
      ${isBreaking ? '<div class="breaking">⚡ BREAKING</div>' : ''}
      
      <!-- Flight Drama logo badge -->
      <img src="${LOGO_URL}" class="logo" crossorigin="anonymous" />
      
      <!-- Headline -->
      <div class="headline">${esc(headline)}</div>
      
      <!-- Underline -->
      <div class="underline"></div>
      
      ${subtitle ? `<div class="subtitle">${esc(subtitle)}</div>` : ''}
    </div>
  </div>
  
  <!-- Border frame -->
  <div class="frame"></div>
</div>
</body>
</html>`;
}

/**
 * Build the video thumbnail HTML
 */
function buildVideoHTML(bgUrl, headline, subtitle, date, width, height) {
  const dateStr = date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const s = width / 800;
  const pad = Math.round(36 * s);
  const hFontSize = headline.length > 50 ? Math.round(34 * s) : Math.round(40 * s);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@400;700&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: ${width}px; height: ${height}px; overflow: hidden; background: #f5f5f5; }
.wrap {
  width: ${width}px; height: ${height}px;
  background: #f5f5f5;
  display: flex; flex-direction: column;
  padding: ${pad}px; gap: ${Math.round(18 * s)}px;
}
.header { display: flex; align-items: center; gap: ${Math.round(14 * s)}px; }
.logo-img { width: ${Math.round(68 * s)}px; height: ${Math.round(68 * s)}px; object-fit: contain; flex-shrink: 0; }
.handle-block { display: flex; flex-direction: column; gap: 2px; }
.handle { color: #555; font-size: ${Math.round(15 * s)}px; font-family: Montserrat, Arial, sans-serif; }
.username { color: #000; font-size: ${Math.round(17 * s)}px; font-weight: 700; font-family: Montserrat, Arial, sans-serif; display: flex; align-items: center; gap: 4px; }
.verified { color: #1d9bf0; }
.headline { font-family: Montserrat, Arial, sans-serif; font-weight: 700; font-size: ${hFontSize}px; color: #111; line-height: 1.2; text-align: center; }
.date { font-size: ${Math.round(14 * s)}px; color: #666; font-family: Montserrat, Arial, sans-serif; }
.photo-wrap { flex: 1; position: relative; overflow: hidden; border-radius: ${Math.round(6 * s)}px; min-height: 0; }
.photo-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
.play-btn { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: ${Math.round(68 * s)}px; height: ${Math.round(68 * s)}px; background: rgba(0,0,0,0.55); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.play-tri { width: 0; height: 0; border-top: ${Math.round(15 * s)}px solid transparent; border-bottom: ${Math.round(15 * s)}px solid transparent; border-left: ${Math.round(26 * s)}px solid #fff; margin-left: ${Math.round(4 * s)}px; }
.caption { font-size: ${Math.round(13 * s)}px; color: #333; font-family: Montserrat, Arial, sans-serif; }
.caption strong { font-weight: 700; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <img src="${LOGO_URL}" class="logo-img" crossorigin="anonymous" />
    <div class="handle-block">
      <span class="handle">@flightdrama</span>
      <span class="username">FLIGHTDRAMA <span class="verified">✓</span></span>
    </div>
  </div>
  <div class="headline">${esc(headline)}</div>
  <div class="date">${dateStr}</div>
  <div class="photo-wrap">
    <img src="${bgUrl}" crossorigin="anonymous" />
    <div class="play-btn"><div class="play-tri"></div></div>
  </div>
  ${subtitle ? `<div class="caption"><strong>Unrelated video footage</strong> / ${esc(subtitle)}</div>` : ''}
</div>
</body>
</html>`;
}

async function renderHTML(html, width, height) {
  const response = await fetch(`${SCREENSHOT_API}/screenshot/html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-secret': SCREENSHOT_SECRET },
    body: JSON.stringify({ html, width, height, fullPage: false }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Screenshot service error ${response.status}: ${err.slice(0, 200)}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function generateArticleImage(options) {
  const { backgroundImageUrl, headline, subtitle = '', isBreaking = false, format = 'square', backgroundImageUrl2, category = 'Commercial Aviation', apiKeys = {} } = options;
  const width = format === 'wide' ? 1200 : 1080;
  const height = format === 'wide' ? 630 : 1080;
  log(`Generating article ${format}: "${headline.slice(0, 50)}"`);
  
  let topUrl = backgroundImageUrl;
  let bottomUrl = backgroundImageUrl2 || backgroundImageUrl;
  let topAttribution = null;
  let bottomAttribution = null;
  
  // If no URLs provided, fetch two different photos automatically
  if (!backgroundImageUrl) {
    const photos = await fetchTwoPhotos(headline, category, apiKeys);
    topUrl = photos.topPhoto;
    bottomUrl = photos.bottomPhoto;
    topAttribution = photos.topAttribution;
    bottomAttribution = photos.bottomAttribution;
    log(`  Top photo: ${topUrl?.slice(0, 60)} (${topAttribution || 'no attribution'})`);
    log(`  Bottom photo: ${bottomUrl?.slice(0, 60)} (${bottomAttribution || 'no attribution'})`);
  }
  
  const html = buildArticleHTML(topUrl, bottomUrl, headline, subtitle, isBreaking, width, height, topAttribution, bottomAttribution);
  return await renderHTML(html, width, height);
}

export async function generateVideoThumbnail(options) {
  const { backgroundImageUrl, headline, subtitle = '', date } = options;
  log(`Generating video thumbnail: "${headline.slice(0, 50)}"`);
  const html = buildVideoHTML(backgroundImageUrl, headline, subtitle, date, 800, 1000);
  return await renderHTML(html, 800, 1000);
}

export async function generateAllFormats(options) {
  const [square, wide, video] = await Promise.all([
    generateArticleImage({ ...options, format: 'square' }),
    generateArticleImage({ ...options, format: 'wide' }),
    generateVideoThumbnail(options),
  ]);
  return { square, wide, video };
}

// ─── CLI Test ─────────────────────────────────────────────────────────────────
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { writeFileSync } = await import('fs');
  // Load env for API keys
  const env = {};
  try {
    readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(line => {
      const [k, ...v] = line.split('=');
      if (k && v.length) env[k.trim()] = v.join('=').trim();
    });
  } catch {}
  const apiKeys = { pexels: env.PEXELS_API_KEY, pixabay: env.PIXABAY_API_KEY };

  log('Testing Flight Drama image generator v4 (multi-source photos)...');

  const tests = [
    {
      headline: "'There Was No Queue, Just A Scrummage'",
      subtitle: "Qantas' Project Sunrise jet is designed to stay airborne for up to 22 hours",
      category: 'Commercial Aviation',
      isBreaking: false,
    },
    {
      headline: "Glasgow Airport Closed After An Emergency Landing Incident",
      subtitle: "Glasgow Airport experienced a full closure after an emergency landing by a light aircraft",
      category: 'Aviation Incidents',
      isBreaking: true,
    },
    {
      headline: "Ryanair Pilots Vote To Strike Over Pay Dispute",
      subtitle: "Ryanair pilots across Europe vote to strike, threatening summer travel",
      category: 'Pilot & Crew',
      isBreaking: false,
    },
  ];

  for (let i = 0; i < tests.length; i++) {
    const sq = await generateArticleImage({ ...tests[i], format: 'square', apiKeys });
    writeFileSync(`/tmp/v4-test${i+1}.png`, sq);
    log(`✅ Test ${i+1}: /tmp/v4-test${i+1}.png (${sq.length} bytes)`);
  }
  log('All done!');
}
