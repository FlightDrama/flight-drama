/**
 * Flight Drama Autopilot — Automated Content Pipeline
 * Runs every 5 minutes on Info's Cloud Computer
 * 
 * Sources (Phase 1 — free, no API keys required):
 *   1. Google News RSS (aviation keywords)
 *   2. Aviation Safety Network RSS
 *   3. AAIB (UK Air Accidents Investigation Branch)
 *   4. Simple Flying RSS
 *   5. The Aviation Herald
 *   6. ch-aviation RSS
 *   7. FlightGlobal RSS
 * 
 * Pipeline:
 *   Fetch RSS → Score story → Generate headlines (Claude Opus) →
 *   Generate article (Claude Opus) → Generate image (Manus AI) →
 *   Publish to Flight Drama DB
 * 
 * Log: ~/flight-drama-cron/autopilot.log
 * State: ~/flight-drama-cron/autopilot-state.json
 */

import mysql from 'mysql2/promise';
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateArticleImage as renderTemplate } from './flight-drama-image-generator.mjs';
import { fetchTwoPhotos } from './flight-drama-photo-fetcher.mjs';
import { generateWithQA } from './flight-drama-image-qa.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, 'autopilot.log');
const STATE_FILE = path.join(__dirname, 'autopilot-state.json');

// ─── Load .env ────────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '.env');
const env = {};
try {
  readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim();
  });
} catch (e) {
  console.error('Could not read .env:', e.message);
  process.exit(1);
}

// NO FORGE/MANUS API — zero Manus credits. All AI via Anthropic Sonnet + Groq fallback.
const FORGE_API_URL = null;
const FORGE_API_KEY = null;
const GROQ_API_KEY = env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const DATABASE_URL = env.DATABASE_URL;
const INOREADER_APP_ID = env.INOREADER_APP_ID;
const INOREADER_APP_KEY = env.INOREADER_APP_KEY;
const INOREADER_AUTH_TOKEN = env.INOREADER_AUTH_TOKEN;
const PEXELS_API_KEY = env.PEXELS_API_KEY;
const MAX_ARTICLES_PER_RUN = 3; // Limit to 3 new articles per 5-minute run
const DAILY_ARTICLE_CAP = 30; // Max 30 articles per day (~$0.15/day at $0.005/article)

// ─── RSS Sources ──────────────────────────────────────────────────────────────
const RSS_SOURCES = [
  {
    name: 'Google News — Aviation Incidents',
    url: 'https://news.google.com/rss/search?q=aviation+incident+emergency+landing&hl=en-GB&gl=GB&ceid=GB:en',
    priority: 10,
  },
  {
    name: 'Google News — Airline News',
    url: 'https://news.google.com/rss/search?q=airline+news+Boeing+Airbus&hl=en-GB&gl=GB&ceid=GB:en',
    priority: 7,
  },
  {
    name: 'Google News — Flight Emergency',
    url: 'https://news.google.com/rss/search?q=%22emergency+landing%22+OR+%22squawk+7700%22+OR+%22flight+diverted%22&hl=en-GB&gl=GB&ceid=GB:en',
    priority: 10,
  },
  {
    name: 'Aviation Safety Network',
    url: 'https://aviation-safety.net/database/rss.php',
    priority: 9,
  },
  {
    name: 'Simple Flying',
    url: 'https://simpleflying.com/feed/',
    priority: 8,
  },
  {
    name: 'The Aviation Herald',
    url: 'http://avherald.com/rss.php',
    priority: 9,
  },
  {
    name: 'ch-aviation',
    url: 'https://www.ch-aviation.com/portal/news/rss',
    priority: 7,
  },
  {
    name: 'FlightGlobal',
    url: 'https://www.flightglobal.com/rss/news',
    priority: 7,
  },
  {
    name: 'AAIB Reports',
    url: 'https://www.gov.uk/aaib-reports.atom',
    priority: 8,
  },
  {
    name: 'Google News — Passenger Stories',
    url: 'https://news.google.com/rss/search?q=airline+passenger+complaint+OR+%22passenger+outrage%22+OR+%22flight+attendant%22&hl=en-GB&gl=GB&ceid=GB:en',
    priority: 6,
  },
];

// ─── Category Mapping ─────────────────────────────────────────────────────────
const CATEGORY_KEYWORDS = {
  'Aviation Incidents': ['incident', 'emergency', 'squawk', 'divert', 'mayday', 'crash', 'accident', 'grounded', 'investigation', 'aaib', 'ntsb', 'bea'],
  'Commercial Aviation': ['airline', 'passenger', 'route', 'fleet', 'order', 'delivery', 'terminal', 'airport', 'lounge', 'seat', 'cabin'],
  'Military Aviation': ['military', 'air force', 'fighter', 'f-35', 'f-16', 'nato', 'defence', 'defense', 'bomber', 'helicopter'],
  'Aircraft Tech': ['boeing', 'airbus', 'engine', 'aircraft', 'design', 'certification', 'faa', 'easa', 'max', 'a320', 'a350', '787'],
  'Pilot & Crew': ['pilot', 'captain', 'crew', 'flight attendant', 'salary', 'pay', 'strike', 'training', 'licence'],
};

// ─── Logging ──────────────────────────────────────────────────────────────────
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + '\n'); } catch {}
}

// ─── State Management ─────────────────────────────────────────────────────────
function loadState() {
  if (!existsSync(STATE_FILE)) return { seenUrls: [], lastRun: null };
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { seenUrls: [], lastRun: null };
  }
}

function saveState(state) {
  // Keep only last 2000 seen URLs to prevent unbounded growth
  if (state.seenUrls.length > 2000) {
    state.seenUrls = state.seenUrls.slice(-2000);
  }
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ─── RSS Fetcher ──────────────────────────────────────────────────────────────
async function fetchRSS(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'FlightDrama/1.0 (https://flightdrama.com; news aggregator)',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml);
  } catch (e) {
    log(`RSS fetch error for ${url}: ${e.message}`);
    return [];
  }
}

function parseRSS(xml) {
  const items = [];
  
  // Handle both RSS and Atom formats
  const isAtom = xml.includes('<feed');
  
  if (isAtom) {
    // Atom format
    const entryMatches = xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g);
    for (const match of entryMatches) {
      const entry = match[1];
      const title = extractTag(entry, 'title');
      const link = extractAttr(entry, 'link', 'href') || extractTag(entry, 'link');
      const published = extractTag(entry, 'published') || extractTag(entry, 'updated');
      const summary = extractTag(entry, 'summary') || extractTag(entry, 'content');
      if (title && link) {
        items.push({ title: cleanText(title), link, published, summary: cleanText(summary || '') });
      }
    }
  } else {
    // RSS format
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
    for (const match of itemMatches) {
      const item = match[1];
      const title = extractTag(item, 'title');
      const link = extractTag(item, 'link') || extractTag(item, 'guid');
      const pubDate = extractTag(item, 'pubDate');
      const description = extractTag(item, 'description');
      if (title && link) {
        items.push({ title: cleanText(title), link, published: pubDate, summary: cleanText(description || '') });
      }
    }
  }
  
  return items.slice(0, 20); // Max 20 items per feed
}

function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? (match[1] || match[2] || '').trim() : '';
}

function extractAttr(xml, tag, attr) {
  const match = xml.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i'));
  return match ? match[1] : '';
}

function cleanText(text) {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Story Scorer ─────────────────────────────────────────────────────────────
// Known aviation source names (from Inoreader subscriptions)
const AVIATION_SOURCES = [
  'the aviationist', 'simple flying', 'ch-aviation', 'airlive', 'aopa',
  'aviation geek club', 'aerotime', 'aviation news', 'aviation a2z',
  'avherald', 'aviation herald', 'aviation safety', 'flightglobal',
  'view from the wing', 'boarding area', 'aviation humor', 'aviationcircle',
  'flight emergency', 'aviationnews', 'airlineratings',
];

// Core aviation keywords — story MUST contain at least one
const AVIATION_REQUIRED = [
  'flight', 'airline', 'aircraft', 'airport', 'pilot', 'aviation', 'plane',
  'boeing', 'airbus', 'runway', 'takeoff', 'landing', 'crew', 'passenger',
  'ryanair', 'easyjet', 'delta', 'united', 'emirates', 'lufthansa', 'qatar',
  'british airways', 'southwest', 'air france', 'american airlines', 'wizz',
  'faa', 'easa', 'aaib', 'ntsb', 'squawk', 'cockpit', 'fuselage',
  '737', '747', '777', '787', 'a320', 'a321', 'a350', 'a380',
  'helicopter', 'turbulence', 'divert', 'emergency landing', 'air traffic',
  'spirit airlines', 'frontier airlines', 'alaska airlines', 'jetblue',
];

function scoreStory(item, sourcePriority) {
  const text = (item.title + ' ' + item.summary).toLowerCase();
  const sourceName = (item.sourceName || '').toLowerCase();
  
  // HARD BLOCK: War, conflict, crime, politics, sport (non-aviation)
  const HARD_BLOCK = [
    // War & conflict
    'drone strike', 'airstrike', 'air strike', 'missile strike', 'missile attack',
    'iranian drone', 'iranian missile', 'houthi', 'ukraine war', 'russia attack',
    'nato', 'war in', 'warzone', 'combat zone', 'military offensive',
    'killed in strike', 'killed in attack', 'bombing raid',
    // Crime (non-aviation)
    'stabbed', 'murdered', 'homicide', 'serial killer', 'shooting spree',
    'mass shooting', 'netflix documentary', 'true crime',
    // Politics (non-aviation)
    'running for congress', 'running for president', 'election campaign',
    'senate vote', 'house vote', 'trump admin cutting', 'student internet',
    'jfk\'s grandson', 'jfk grandson',
    // Sport (non-aviation)
    'manchester united', 'premier league', 'nfl', 'nba', 'world cup',
    'glazers selling', 'football club',
  ];
  if (HARD_BLOCK.some(kw => text.includes(kw))) return 0;

  // GATE: Must be aviation-related
  const isAviationSource = AVIATION_SOURCES.some(s => sourceName.includes(s));
  const hasAviationKeyword = AVIATION_REQUIRED.some(kw => text.includes(kw));
  if (!isAviationSource && !hasAviationKeyword) return 0;
  
  let score = sourcePriority * 3;
  if (isAviationSource) score += 10;
  
  // TIER 1: Incidents & emergencies — highest drama value (Josh: incidents > everything)
  const emergencyKeywords = ['squawk 7700', 'emergency landing', 'mayday', 'crash', 'fatal', 'fire on board', 'engine failure', 'hijack', 'bomb threat', 'emergency', 'diverted', 'grounded', 'evacuated', 'declared emergency', 'forced landing', 'belly landing', 'gear up', 'bird strike', 'depressurisation', 'smoke in cabin'];
  for (const kw of emergencyKeywords) { if (text.includes(kw)) score += 20; }
  
  // TIER 2: Passenger drama & outrage — high viral value (Josh: drama, chaos, relatable)
  const dramaKeywords = ['passenger', 'outrage', 'brawl', 'fight', 'removed', 'kicked off', 'banned', 'refused boarding', 'complaint', 'viral', 'shocking', 'chaos', 'meltdown', 'screaming', 'drunk', 'unruly', 'restrained', 'arrested on board', 'diverted after passenger', 'seat dispute', 'upgrade denied', 'bumped'];
  for (const kw of dramaKeywords) { if (text.includes(kw)) score += 15; }
  
  // TIER 3: Money, pay, business drama — strong engagement
  const moneyKeywords = ['billion', 'million', 'salary', 'pay', 'bonus', 'profit', 'loss', 'bankruptcy', 'collapse', 'fine', 'lawsuit', 'compensation', 'refund', 'delay', 'cancel', 'strike', 'investigation', 'record', 'first', 'last', 'shut down', 'ceases operations', 'goes bust'];
  for (const kw of moneyKeywords) { if (text.includes(kw)) score += 10; }
  
  // TIER 4: Airline comparisons & industry news — moderate value
  const industryKeywords = ['new route', 'order', 'delivery', 'fleet', 'expansion', 'merger', 'acquisition', 'ceo', 'chairman', 'regulation', 'ban', 'approval', 'certification', 'faa', 'easa', 'aaib', 'ntsb'];
  for (const kw of industryKeywords) { if (text.includes(kw)) score += 5; }
  
  // Major airlines — boost for brand recognition
  const majorAirlines = ['ryanair', 'easyjet', 'british airways', 'ba ', 'delta', 'united', 'american airlines', 'emirates', 'qatar', 'lufthansa', 'air france', 'southwest', 'wizz', 'spirit', 'frontier', 'alaska airlines', 'jetblue', 'air india', 'indigo', 'turkish airlines'];
  for (const airline of majorAirlines) { if (text.includes(airline)) score += 8; }
  
  // Aircraft types — aviation geeks love specific aircraft
  const aircraftTypes = ['737 max', '787', 'a380', 'a350', 'a320', 'concorde', 'f-35', 'a321', '777x', 'a321xlr', '747', 'a330', 'a220', 'e195', 'crj'];
  for (const ac of aircraftTypes) { if (text.includes(ac)) score += 5; }
  
  // Recency bonus + hard age cutoff
  if (item.published) {
    const ageHours = (Date.now() - new Date(item.published).getTime()) / 3600000;
    // Hard cutoff: reject stories older than 7 days entirely
    if (ageHours > 168) return 0; // 168h = 7 days
    if (ageHours < 2) score += 20;
    else if (ageHours < 6) score += 15;
    else if (ageHours < 12) score += 10;
    else if (ageHours < 24) score += 5;
    else if (ageHours < 48) score += 2;
    // 48h-168h: no bonus, but still eligible
  } else {
    // No publish date = unknown age, skip to be safe
    return 0;
  }
  
  return score;
}

// ─── Category Detector ────────────────────────────────────────────────────────
function detectCategory(title, summary) {
  const text = (title + ' ' + summary).toLowerCase();
  let bestCategory = 'Commercial Aviation';
  let bestScore = 0;
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }
  
  return bestCategory;
}

// ─── Slug Generator ───────────────────────────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

// ─── Claude API Call ──────────────────────────────────────────────────────────
async function callClaude(systemPrompt, userPrompt, maxTokens = 4096) {
  // Uses Anthropic API directly (no Manus Forge, no Manus credits)
  const anthropicKey = env.ANTHROPIC_API_KEY;
  if (anthropicKey && anthropicKey !== 'DISABLED') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', // Haiku: ~19x cheaper than Opus, ~$0.005/article
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: AbortSignal.timeout(120000),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${err.slice(0, 200)}`);
    }
    const data = await response.json();
    return data.content?.[0]?.text || '';
  }
  // Fallback to Groq if no Anthropic key
  if (!GROQ_API_KEY) throw new Error('No ANTHROPIC_API_KEY or GROQ_API_KEY available');
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: Math.min(maxTokens, 8000),
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err.slice(0, 200)}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ─── Step 1: Generate Headlines ───────────────────────────────────────────────
const HEADLINE_SYSTEM_PROMPT = `You are Soyunci, the headline editor for Flightdrama, a viral aviation media brand.

Your job is NOT to write normal aviation headlines. Your job is to turn aviation stories into high-performing social headlines that feel specific, factual, emotional, and impossible to ignore.

Flightdrama headlines win when they make normal people think one of these:
"Wait, what?"
"How is that allowed?"
"That's insane."
"I didn't know that."
"People are going to argue about this."
"I need to send this to someone."

Before writing, analyse the story using this framework:

1. Identify the strongest viral angle:
- passenger outrage, unfairness, safety failure, near-disaster, death/accountability,
  shocking money, pilot/crew pay, old aircraft still flying, aircraft that failed commercially,
  first/last/only/biggest/fastest/longest, hidden aviation truth, famous airline contradiction,
  airport/passenger rule change, weird passenger behaviour, Boeing vs Airbus conflict,
  military/aviation crossover, nostalgia/finality

2. Extract the strongest factual weapon:
Use exact numbers whenever possible: deaths, age of aircraft, money, speed, altitude, years,
number of passengers, aircraft type, route length, salary, percentage, date,
"first", "last", "only", "biggest", "fastest", "oldest"

3. Choose the best Flightdrama headline structure:
A) Contradiction: "American Made $54.6 Billion In Revenue And Barely $111 Million In Profit"
B) Hidden truth: "251 Deliveries Later, The A380 Still Couldn't Break Even"
C) Human unfairness: "United Sold Gayle King A Window Seat That Had No Window And She Filmed It"
D) Danger + consequence: "Aer Lingus A321XLR Hit The Runway At 3.3G, Now It's Grounded"
E) Old aircraft shock: "Built In 1991, The UPS Jet That Crashed Was Older Than Many Of Its Pilots"
F) Last/first/only: "The Last DC-8 In America Has Flown Its Final Flight"
G) Normal-person pain: "Heathrow Just Ended The Liquids And Laptop Rule For Millions Of Passengers"
H) Money argument: "Delta's Top Pilots Now Earn Nearly $465 An Hour"
I) Debate bait: "Should Airline Pilots Really Be Paid More Than Surgeons?"
J) Weird social sharing: "A Passenger Wouldn't Stop Farting, So Crew Handed Out Masks"

4. Avoid weak aviation-trade language. Never write:
"Airline launches new route" / "Airbus secures order" / "Carrier expands network"

5. Tone rules:
- Be factual, not fake. No vague hype. Make the fact itself shocking.
- Use normal title case. Keep headlines punchy but not too short.
- The headline should contain enough context to understand the story without clicking.

Output ONLY this exact format (no other text):
WINNER: [single best headline]`;

async function generateHeadline(storyText) {
  const response = await callClaude(
    HEADLINE_SYSTEM_PROMPT,
    `Now write the best headline for this story:\n\n${storyText.slice(0, 2000)}`,
    512
  );
  
  const winnerMatch = response.match(/WINNER:\s*(.+)/i);
  return winnerMatch ? winnerMatch[1].trim() : null;
}

// ─── Step 2: Generate Article ─────────────────────────────────────────────────
const ARTICLE_SYSTEM_PROMPT = `You are Soyunci, the lead writer and editor of Flightdrama.com.

Flight Drama is a viral aviation media brand. Think: The Sun meets The Aviationist. LADbible meets CNN Aviation. We are credible, accurate, and factual — but we find the drama, the outrage, the chaos, and the human angle in every story. We are relatable, funny when appropriate, and always on the side of the passenger.

Your writing should feel like the best writers from these sites:
- viewfromthewing.com (sharp, opinionated, insider knowledge)
- liveandletsfly.com (punchy, direct, passenger-focused)
- The Sun (dramatic, clickbait-y but always backed by facts)
- LADbible (relatable, funny, human)

You are a super-intelligent aviation geek who is also amazing at finding the viral angle and building a story around it.

── DUAL MODE ──

MODE 1 — DRAMA (use for: passenger chaos, airline complaints, money stories, comparisons, industry scandals, bizarre incidents):
- Find the outrage. Find the unfairness. Find the absurdity.
- Be relatable. Add humour where appropriate. Be likeable.
- Write like you're telling your mates about the most mental thing you just read.
- Use specific facts as weapons: exact numbers, exact quotes, exact dates.
- The reader should feel something: anger, disbelief, amusement, or vindication.

MODE 2 — STRAIGHT (use for: active emergencies, fatalities, serious accidents, AAIB/NTSB investigations):
- Report clearly, accurately, and without sensationalism.
- Respect the gravity of the situation.
- Be the most accurate, most detailed account available.
- Aviation geeks will fact-check everything. Be precise.

Choose the mode based on the story. Most stories are Mode 1. Emergencies and fatalities are Mode 2.

── RULES ──

Your job is to identify the most interesting, important, surprising, emotional, controversial, expensive, dangerous, historic, or consequential part of a story and build the article around that angle.

Every article must answer four questions:
* What happened?
* Why does it matter?
* What happens next?
* Why should the reader care?

Never write because something happened. Write because it matters.

The aircraft is often the setting, not the story. The real story is usually found in:
People / Consequences / Money / Danger / Accountability / Failure / Success / Scale / Records / Contradictions / Hidden truths / Passenger impact / Industry impact

Before writing, identify the strongest angle. Do not write the article until you understand what makes the story interesting.

Write naturally. Do not force a structure. Do not force a template. Different stories require different approaches. Let the story determine the structure.

The article should feel unmistakably human. It should never feel generated.

NEVER use em dashes. (This is the single biggest AI tell. Never do it.)
NEVER use repetitive sentence patterns.
NEVER use repetitive paragraph patterns.
NEVER use obvious AI phrases.

Avoid phrases such as: "In a significant development" / "It remains to be seen" / "Industry-leading" / "Strategic initiative" / "Commitment to excellence" / "Going forward" / "In today's rapidly evolving landscape" / "The move comes as" / "Meanwhile" / "Additionally" / "Furthermore"

Use simple, natural language. Write like a skilled journalist speaking to intelligent readers. Avoid corporate language. Avoid press release language. Avoid unnecessary jargon. Assume readers are intelligent but not aviation experts.

The opening must immediately establish the most important information. Readers should understand the story within the opening section. Do not waste time with generic introductions. Get to the point.

The article should create value beyond the source material. Add context, significance, consequences, comparisons, historical relevance, industry relevance, passenger relevance.

Accuracy is critical. Never invent facts. Never speculate without clearly identifying speculation. Use exact figures: dates, aircraft types, airports, airlines, passenger counts, costs, distances.

Subheadings should be useful and informative. Avoid generic ones like "Background" or "Overview". Prefer: "Why The FAA Is Concerned" / "How The Incident Unfolded" / "What Happens Next"

SEO: Where facts come from a specific source (airline statement, investigation report, official data), attribute them naturally in the text: "according to the AAIB report", "the airline confirmed", "data from FlightAware shows". This is what a credible aviation publication does.

Output ONLY valid JSON with this exact structure (no markdown, no other text):
{
  "excerpt": "1-2 sentence summary for the article listing",
  "content": "full article in HTML format with <p>, <h2>, <h3> tags, 600-900 words",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "metaTitle": "SEO title 50-60 characters",
  "metaDescription": "SEO description 150-160 characters"
}`;

// ─── Reporter Personalities ──────────────────────────────────────────────────
// Two distinct voices as requested by Josh

const TECHNICAL_REPORTER_PROMPT = `You are Marcus Webb, Flight Drama's technical correspondent.

You are a former commercial pilot turned journalist with 20 years in the cockpit. You understand aviation from the inside.

Your writing style:
- You explain technical details in plain English without dumbing them down
- You use precise aviation terminology but always explain it
- You focus on the mechanical, regulatory and procedural aspects of stories
- You love aircraft systems, investigation reports, AAIB/NTSB findings
- Your tone is authoritative but accessible — like a pilot explaining something to a curious passenger
- You quote regulations, technical manuals and investigation findings
- You are calm and analytical, not sensational

Your articles feel like they were written by someone who has actually sat in that cockpit.

NEVER use em dashes. Write like a skilled technical journalist.

Output ONLY valid JSON:
{
  "excerpt": "1-2 sentence summary",
  "content": "full article in HTML with <p>, <h2>, <h3> tags, 700-1000 words",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "metaTitle": "SEO title 50-60 characters",
  "metaDescription": "SEO description 150-160 characters"
}`;

const DRAMATIC_REPORTER_PROMPT = `You are Soyunci, the lead writer and editor of Flightdrama.com.

Your job is not to rewrite sources.

Your job is to identify the most interesting, important, surprising, emotional, controversial, expensive, dangerous, historic, or consequential part of a story and build the article around that angle.

You are writing for a modern aviation publication that sits between mainstream news and aviation journalism. Readers include aviation enthusiasts, airline passengers, pilots, industry professionals, and people who simply find the story interesting.

Every article must answer four questions:
* What happened?
* Why does it matter?
* What happens next?
* Why should the reader care?

Never write because something happened. Write because it matters.

The aircraft is often the setting, not the story. The real story is usually found in:
People / Consequences / Money / Danger / Accountability / Failure / Success / Scale / Records / Contradictions / Hidden truths / Passenger impact / Industry impact

Before writing, identify the strongest angle. Do not write the article until you understand what makes the story interesting.

Write naturally. Do not force a structure. Do not force a template. Different stories require different approaches. Let the story determine the structure.

The article should feel unmistakably human. It should never feel generated.

NEVER use em dashes.
NEVER use repetitive sentence patterns.
NEVER use repetitive paragraph patterns.
NEVER use obvious AI phrases.

Avoid phrases such as: "In a significant development" / "It remains to be seen" / "Industry-leading" / "Strategic initiative" / "Commitment to excellence" / "Going forward" / "In today's rapidly evolving landscape" / "The move comes as" / "Meanwhile" / "Additionally" / "Furthermore"

Use simple, natural language. Write like a skilled journalist speaking to intelligent readers. Avoid corporate language. Avoid press release language. Avoid unnecessary jargon. Assume readers are intelligent but not aviation experts.

The opening must immediately establish the most important information. Readers should understand the story within the opening section. Do not waste time with generic introductions. Get to the point.

The article should create value beyond the source material. Add context, significance, consequences, comparisons, historical relevance, industry relevance, passenger relevance.

Accuracy is critical. Never invent facts. Never speculate without clearly identifying speculation. Use exact figures: dates, aircraft types, airports, airlines, passenger counts, costs, distances.

Subheadings should be useful and informative. Avoid generic ones like "Background" or "Overview". Prefer: "Why The FAA Is Concerned" / "How The Incident Unfolded" / "What Happens Next"

Output ONLY valid JSON with this exact structure (no markdown, no other text):
{
  "excerpt": "1-2 sentence summary for the article listing",
  "content": "full article in HTML format with <p>, <h2>, <h3> tags, 600-900 words",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "metaTitle": "SEO title 50-60 characters",
  "metaDescription": "SEO description 150-160 characters"
}`;

// Select reporter based on category
function selectReporter(category) {
  const technicalCategories = ['Aircraft Tech', 'Military Aviation', 'Flight Training'];
  if (technicalCategories.includes(category)) {
    return { prompt: TECHNICAL_REPORTER_PROMPT, name: 'Marcus Webb', slug: 'marcus-webb' };
  }
  return { prompt: DRAMATIC_REPORTER_PROMPT, name: 'Flight Drama Autopilot', slug: 'autopilot' };
}

// Inject 2-3 inline images into article HTML content with proper attribution
async function injectInlineImages(content, headline, category, apiKeys) {
  try {
    const { fetchPhotoWithAIQueries } = await import('./flight-drama-photo-fetcher.mjs');
    
    // Split content at <h2> tags to find good injection points
    const parts = content.split(/(<h2[^>]*>)/i);
    if (parts.length < 3) return content; // Not enough sections
    
    // Fetch 2 different photos using AI-generated queries
    const photo1 = await fetchPhotoWithAIQueries(headline, category, 0);
    const photo2 = await fetchPhotoWithAIQueries(headline, category, 5);
    
    const photos = [photo1, photo2].filter(p => p?.url && p.url !== photo1?.url || photos.length === 0);
    // Ensure variety
    const uniquePhotos = [];
    const seenUrls = new Set();
    for (const p of [photo1, photo2]) {
      if (p?.url && !seenUrls.has(p.url)) {
        uniquePhotos.push(p);
        seenUrls.add(p.url);
      }
    }
    if (uniquePhotos.length === 0) return content;
    
    // Inject first image after the first <h2>
    let result = content;
    let injectedCount = 0;
    
    for (const photo of uniquePhotos) {
      if (injectedCount >= 2) break;
      
      // Build attribution caption
      let captionHtml = '';
      if (photo.attribution) {
        const linkOpen = photo.attributionUrl ? `<a href="${photo.attributionUrl}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">` : '';
        const linkClose = photo.attributionUrl ? '</a>' : '';
        captionHtml = `<figcaption style="font-size: 0.78em; color: #999; margin-top: 0.4em; text-align: right; font-style: italic;">${linkOpen}${photo.attribution}${linkClose}</figcaption>`;
      }
      
      const imgHtml = `<figure style="margin: 1.5em 0; text-align: center;">
  <img src="${photo.url}" alt="${headline}" style="max-width: 100%; height: auto; border-radius: 4px;" loading="lazy" />
  ${captionHtml}
</figure>`;
      
      // Find the (injectedCount+1)th <h2> tag and insert image after it
      const h2Regex = /<h2[^>]*>.*?<\/h2>/gi;
      let match;
      let count = 0;
      let insertPos = -1;
      while ((match = h2Regex.exec(result)) !== null) {
        count++;
        if (count === injectedCount + 1) {
          insertPos = match.index + match[0].length;
          break;
        }
      }
      
      if (insertPos > -1) {
        result = result.slice(0, insertPos) + imgHtml + result.slice(insertPos);
        injectedCount++;
      }
    }
    
    return result;
  } catch (e) {
    log(`  Inline image injection failed: ${e.message}`);
    return content;
  }
}

async function generateArticle(headline, storyText, category) {
  const reporter = selectReporter(category);
  const response = await callClaude(
    reporter.prompt,
    `HEADLINE: ${headline}\nCATEGORY: ${category}\n\nSTORY SOURCE:\n${storyText.slice(0, 3000)}`,
    4096
  );
  
  // Extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in article response');
  
  const articleData = JSON.parse(jsonMatch[0]);
  
  // Auto-fix common issues (em dashes, AI clichés) before QA
  try {
    const { autoFixArticle } = await import('./flight-drama-article-qa.mjs');
    if (articleData.content) articleData.content = autoFixArticle(articleData.content);
    if (articleData.excerpt) articleData.excerpt = autoFixArticle(articleData.excerpt);
  } catch {}

  // Run 10-pass article QA
  let qaApproved = false;
  let qaAttempts = 0;
  const maxQaAttempts = 3;
  
  while (!qaApproved && qaAttempts < maxQaAttempts) {
    qaAttempts++;
    try {
      const { runArticleQA } = await import('./flight-drama-article-qa.mjs');
      const qa = await runArticleQA(headline, articleData.content, articleData.excerpt);
      log(`  Article QA attempt ${qaAttempts}: score ${qa.score}/10, ${qa.passCount}/${qa.totalPasses} passed → ${qa.approved ? '✅' : '❌'}`);
      
      if (qa.approved) {
        qaApproved = true;
        articleData._qaScore = qa.score;
        articleData._qaPasses = qa.passCount;
      } else if (qaAttempts < maxQaAttempts && qa.rewriteSuggestion) {
        // Rewrite with specific feedback
        log(`  Rewriting with QA feedback: ${qa.rewriteSuggestion.slice(0, 100)}`);
        const rewriteResponse = await callClaude(
          reporter.prompt,
          `HEADLINE: ${headline}\nCATEGORY: ${category}\n\nSTORY SOURCE:\n${storyText.slice(0, 3000)}\n\nQA FEEDBACK (fix these issues in your rewrite):\n${qa.rewriteSuggestion}\n\nISSUES FOUND: ${qa.issues.join(', ')}`,
          4096
        );
        const rewriteMatch = rewriteResponse.match(/\{[\s\S]*\}/);
        if (rewriteMatch) {
          const rewriteData = JSON.parse(rewriteMatch[0]);
          const { autoFixArticle } = await import('./flight-drama-article-qa.mjs');
          if (rewriteData.content) articleData.content = autoFixArticle(rewriteData.content);
          if (rewriteData.excerpt) articleData.excerpt = autoFixArticle(rewriteData.excerpt);
          if (rewriteData.tags) articleData.tags = rewriteData.tags;
        }
      } else {
        // Accept even if QA failed after max attempts
        qaApproved = true;
      }
    } catch (e) {
      log(`  Article QA error: ${e.message} — skipping QA`);
      qaApproved = true; // Don't block on QA errors
    }
  }

  // Inject 2 inline images into the article body
  const apiKeys = { pexels: PEXELS_API_KEY, pixabay: env.PIXABAY_API_KEY };
  if (articleData.content) {
    articleData.content = await injectInlineImages(articleData.content, headline, category, apiKeys);
  }
  
  return articleData;
}

// ─── Image Generation ─────────────────────────────────────────────────────────
// Aviation photo search terms by category
const PHOTO_TERMS = {
  'Aviation Incidents': ['emergency aircraft', 'airport emergency', 'aircraft runway', 'plane landing'],
  'Military Aviation': ['military aircraft', 'fighter jet', 'air force', 'military plane'],
  'Pilot & Crew': ['pilot cockpit', 'airplane cockpit', 'flight crew', 'pilot aircraft'],
  'Aircraft Tech': ['aircraft engine', 'airplane technology', 'aviation engineering', 'aircraft wing'],
  'Commercial Aviation': ['commercial aircraft', 'airplane sky', 'airport terminal', 'airline plane'],
};

// Fallback aviation photos — 20 varied images for visual variety
// Categories: aircraft in flight, runway, cockpit, airport terminal, cabin, emergency, military, helicopter
const FALLBACK_PHOTOS = [
  // Aircraft in flight
  'https://images.pexels.com/photos/46148/aircraft-jet-landing-cloud-46148.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/358220/pexels-photo-358220.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/912050/pexels-photo-912050.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/2026324/pexels-photo-2026324.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg?auto=compress&cs=tinysrgb&w=1080',
  // Airport & runway
  'https://images.pexels.com/photos/1309644/pexels-photo-1309644.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/723240/pexels-photo-723240.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/3769138/pexels-photo-3769138.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/2599537/pexels-photo-2599537.jpeg?auto=compress&cs=tinysrgb&w=1080',
  // Cockpit & crew
  'https://images.pexels.com/photos/2898199/pexels-photo-2898199.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg?auto=compress&cs=tinysrgb&w=1080',
  // Cabin & passengers
  'https://images.pexels.com/photos/4481259/pexels-photo-4481259.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=1080',
  // Aircraft engine & tech
  'https://images.pexels.com/photos/3806753/pexels-photo-3806753.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/2159549/pexels-photo-2159549.jpeg?auto=compress&cs=tinysrgb&w=1080',
  // Night / dramatic
  'https://images.pexels.com/photos/1436139/pexels-photo-1436139.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/3764984/pexels-photo-3764984.jpeg?auto=compress&cs=tinysrgb&w=1080',
  // Helicopter
  'https://images.pexels.com/photos/2876511/pexels-photo-2876511.jpeg?auto=compress&cs=tinysrgb&w=1080',
];

// Build a smart Pexels search query from the headline and category
function buildPexelsQuery(headline, category) {
  // Extract key aviation entities from headline
  const lower = headline.toLowerCase();
  
  // Specific airline matches
  const airlines = ['ryanair', 'easyjet', 'british airways', 'delta', 'united airlines', 'emirates', 'lufthansa', 'qatar airways', 'air france', 'southwest', 'wizz air', 'jetblue', 'spirit', 'frontier', 'alaska airlines', 'qantas', 'singapore airlines', 'turkish airlines'];
  for (const airline of airlines) {
    if (lower.includes(airline)) return `${airline} aircraft`;
  }
  
  // Aircraft type matches
  if (lower.includes('a321xlr') || lower.includes('a321')) return 'airbus a321 aircraft';
  if (lower.includes('a380')) return 'airbus a380 aircraft';
  if (lower.includes('a350')) return 'airbus a350 aircraft';
  if (lower.includes('737 max') || lower.includes('737max')) return 'boeing 737 max aircraft';
  if (lower.includes('787') || lower.includes('dreamliner')) return 'boeing 787 dreamliner';
  if (lower.includes('777')) return 'boeing 777 aircraft';
  if (lower.includes('concorde')) return 'concorde aircraft';
  
  // Situation matches
  if (lower.includes('emergency landing') || lower.includes('crash') || lower.includes('squawk 7700')) return 'aircraft emergency landing runway';
  if (lower.includes('cockpit') || lower.includes('pilot')) return 'airplane cockpit pilot';
  if (lower.includes('airport')) return 'international airport terminal';
  if (lower.includes('turbulence')) return 'airplane turbulence storm';
  if (lower.includes('military') || lower.includes('fighter') || lower.includes('f-35')) return 'military fighter jet aircraft';
  if (lower.includes('drone')) return 'military drone aircraft';
  if (lower.includes('helicopter')) return 'helicopter aircraft';
  
  // Category fallback
  const categoryQueries = {
    'Aviation Incidents': 'aircraft emergency airport runway',
    'Military Aviation': 'military aircraft fighter jet',
    'Pilot & Crew': 'pilot cockpit airplane',
    'Aircraft Tech': 'aircraft engine technology',
    'Commercial Aviation': 'commercial aircraft airline sky',
  };
  return categoryQueries[category] || 'commercial aircraft sky';
}

// Fetch a relevant photo from Pexels API
async function fetchBackgroundPhoto(headline, category) {
  if (!PEXELS_API_KEY) {
    // No API key — use fallback pool
    const idx = Math.abs(headline.length + category.length) % FALLBACK_PHOTOS.length;
    return FALLBACK_PHOTOS[idx];
  }
  
  try {
    const query = buildPexelsQuery(headline, category);
    log(`  Pexels search: "${query}"`);
    
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
      {
        headers: { 'Authorization': PEXELS_API_KEY },
        signal: AbortSignal.timeout(8000),
      }
    );
    
    if (!response.ok) throw new Error(`Pexels API ${response.status}`);
    const data = await response.json();
    
    if (data.photos && data.photos.length > 0) {
      // Pick a random photo from the top results for variety
      const pick = data.photos[Math.floor(Math.random() * Math.min(5, data.photos.length))];
      const url = pick.src.large2x || pick.src.large || pick.src.original;
      log(`  Pexels photo: ${url.slice(0, 60)}`);
      return url;
    }
    
    throw new Error('No photos returned');
  } catch (e) {
    log(`  Pexels search failed: ${e.message} — using fallback`);
    // Use a random fallback to ensure variety across articles
    const idx = Math.floor(Math.random() * FALLBACK_PHOTOS.length);
    return FALLBACK_PHOTOS[idx];
  }
}

// Upload PNG buffer to Manus S3 via the Flight Drama server's storage proxy
async function uploadToManusStorage(pngBuffer, slug) {
  try {
    // Use the Flight Drama server's storage upload endpoint
    const SITE_URL = 'https://flightdrama.com';
    const CRON_SECRET = env.CRON_SECRET_KEY || 'fd-cron-2026';
    
    const formData = new FormData();
    const blob = new Blob([pngBuffer], { type: 'image/png' });
    formData.append('file', blob, `${slug}.png`);
    formData.append('slug', slug);
    
    const response = await fetch(`${SITE_URL}/api/autopilot/upload-image`, {
      method: 'POST',
      headers: { 'x-cron-secret': CRON_SECRET },
      body: formData,
      signal: AbortSignal.timeout(30000),
    });
    
    if (!response.ok) {
      const err = await response.text();
      log(`Storage upload error ${response.status}: ${err.slice(0, 100)}`);
      return null;
    }
    const data = await response.json();
    return data?.url || null;
  } catch (e) {
    log(`Storage upload failed: ${e.message}`);
    return null;
  }
}

async function generateBrandedImage(headline, excerpt, category, slug, isBreaking) {
  try {
    const apiKeys = { pexels: PEXELS_API_KEY, pixabay: env.PIXABAY_API_KEY };
    
    // Use QA pipeline — generates image, runs 5-pass Claude Opus check, retries if needed
    const { buffer: pngBuffer, qaResult, attempt } = await generateWithQA(
      // Generate function: takes topUrl + bottomUrl, returns PNG buffer
      async (topUrl, bottomUrl) => {
        return await renderTemplate({
          backgroundImageUrl: topUrl,
          backgroundImageUrl2: bottomUrl,
          headline,
          subtitle: excerpt || '',
          isBreaking: isBreaking || false,
          format: 'square',
          category,
          apiKeys,
        });
      },
      // Photo fetch function: called each attempt with offset for variety
      async (attempt) => {
        return await fetchTwoPhotos(headline, category, apiKeys);
      },
      headline,
      category,
      3 // max 3 attempts
    );
    
    log(`  QA: score ${qaResult?.score}/10, ${qaResult?.passCount}/5 passes, attempt ${attempt}`);
    
    // Upload to Manus storage
    const storageUrl = await uploadToManusStorage(pngBuffer, slug);
    if (storageUrl) {
      log(`  Uploaded: ${storageUrl.slice(0, 60)}`);
      return storageUrl;
    }
    
    log(`  Storage upload failed, using fallback photo`);
    return `https://images.pexels.com/photos/46148/aircraft-jet-landing-cloud-46148.jpeg?auto=compress&cs=tinysrgb&w=1080`;
  } catch (e) {
    log(`Branded image generation failed: ${e.message}`);
    return `https://images.pexels.com/photos/46148/aircraft-jet-landing-cloud-46148.jpeg?auto=compress&cs=tinysrgb&w=1080`;
  }
}

// ─── DB Publisher ─────────────────────────────────────────────────────────────
async function publishArticle(conn, article) {
  // Get category ID
  const [categories] = await conn.execute(
    'SELECT id FROM categories WHERE name = ? LIMIT 1',
    [article.category]
  );
  const categoryId = categories[0]?.id || 2; // Default to Commercial Aviation (id=2)

  // Get or create the reporter author (Marcus Webb for technical, Autopilot for dramatic)
  const authorSlug = article.reporterSlug || 'autopilot';
  const authorName = article.reporterName || 'Flight Drama Autopilot';
  const authorBio = authorSlug === 'marcus-webb'
    ? 'Former commercial pilot and aviation journalist. 20 years in the cockpit, now writing about what goes on up there.'
    : 'Automated aviation news powered by AI';
  
  const [authors] = await conn.execute(
    'SELECT id FROM authors WHERE slug = ? LIMIT 1',
    [authorSlug]
  );
  let authorId = authors[0]?.id;
  if (!authorId) {
    const [result] = await conn.execute(
      'INSERT INTO authors (name, slug, bio) VALUES (?, ?, ?)',
      [authorName, authorSlug, authorBio]
    );
    authorId = result.insertId;
  }

  // Insert article as DRAFT — requires review before publishing
  const [result] = await conn.execute(
    `INSERT INTO articles 
     (title, slug, excerpt, content, featuredImage, categoryId, authorId, tags, 
      isFeatured, isBreaking, isPro, articleQaScore, imageQaScore, articleQaPasses, imageQaPasses,
      imageAttribution, imageAttributionUrl, imageRequiresAttribution,
      status, publishedAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?, ?, ?, ?, ?, ?, ?, 'draft', NOW(), NOW(), NOW())`,
    [
      article.title,
      article.slug,
      article.excerpt,
      article.content,
      article.featuredImage || null,
      categoryId,
      authorId,
      JSON.stringify(article.tags || []),
      article.isBreaking ? 1 : 0,
      article.articleQaScore ?? null,
      article.imageQaScore ?? null,
      article.articleQaPasses ?? null,
      article.imageQaPasses ?? null,
      article.imageAttribution ?? null,
      article.imageAttributionUrl ?? null,
      article.imageRequiresAttribution ? 1 : 0,
    ]
  );

  return result.insertId;
}

// ─── Duplicate Checker ────────────────────────────────────────────────────────
async function isSlugInDB(conn, slug) {
  const [rows] = await conn.execute(
    'SELECT id FROM articles WHERE slug = ? LIMIT 1',
    [slug]
  );
  return rows.length > 0;
}

// ─── Inoreader Fetcher ───────────────────────────────────────────────────────
async function fetchInoreader(count = 50) {
  if (!INOREADER_AUTH_TOKEN || !INOREADER_APP_ID) return [];
  
  try {
    // Fetch unread items from Josh's reading list (all subscriptions)
    const res = await fetch(
      `https://www.inoreader.com/reader/api/0/stream/contents/user/-/state/com.google/reading-list?n=${count}&xt=user/-/state/com.google/read`,
      {
        headers: {
          'AppId': INOREADER_APP_ID,
          'AppKey': INOREADER_APP_KEY,
          'Authorization': `GoogleLogin auth=${INOREADER_AUTH_TOKEN}`,
        },
        signal: AbortSignal.timeout(15000),
      }
    );
    
    if (!res.ok) {
      log(`Inoreader API error: ${res.status}`);
      return [];
    }
    
    const data = await res.json();
    const items = data.items || [];
    
    // Convert Inoreader items to our standard format
    return items.map(item => ({
      title: cleanText(item.title || ''),
      link: item.canonical?.[0]?.href || item.alternate?.[0]?.href || '',
      published: item.published ? new Date(item.published * 1000).toISOString() : null,
      summary: cleanText(item.summary?.content || item.content?.content || ''),
      sourceName: item.origin?.title || 'Inoreader',
    })).filter(item => item.title && item.link);
  } catch (e) {
    log(`Inoreader fetch error: ${e.message}`);
    return [];
  }
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────
async function main() {
  log('=== Flight Drama Autopilot Starting ===');
  
  const state = loadState();
  const conn = await mysql.createConnection(DATABASE_URL);
  
  // Check daily article cap — count articles created today (drafts + published)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [todayCount] = await conn.execute(
    'SELECT COUNT(*) as cnt FROM articles WHERE status IN ("draft", "published") AND createdAt >= ?',
    [todayStart]
  );
  const articlesToday = Number(todayCount[0]?.cnt || 0);
  if (articlesToday >= DAILY_ARTICLE_CAP) {
    log(`Daily cap reached: ${articlesToday}/${DAILY_ARTICLE_CAP} articles today — skipping run`);
    await conn.end();
    return;
  }
  const remainingToday = DAILY_ARTICLE_CAP - articlesToday;
  const effectiveMax = Math.min(MAX_ARTICLES_PER_RUN, remainingToday);
  log(`Daily cap: ${articlesToday}/${DAILY_ARTICLE_CAP} today. This run can add up to ${effectiveMax}.`);

  let articlesPublished = 0;
  const candidates = [];

  // 0. Fetch from Inoreader (Josh's curated feeds — highest quality)
  if (INOREADER_AUTH_TOKEN) {
    log('Fetching: Inoreader (Josh\'s curated aviation feeds)');
    const inoreaderItems = await fetchInoreader(50);
    log(`  Got ${inoreaderItems.length} items from Inoreader`);
    for (const item of inoreaderItems) {
      if (state.seenUrls.includes(item.link)) continue;
      const score = scoreStory(item, 8); // High base priority for Josh's curated feeds
      candidates.push({
        ...item,
        score: score + 5, // Bonus for being from Josh's curated list
        category: detectCategory(item.title, item.summary),
      });
    }
  }

  // 1. Fetch all RSS sources (fallback / supplementary)
  for (const source of RSS_SOURCES) {
    log(`Fetching: ${source.name}`);
    const items = await fetchRSS(source.url);
    
    for (const item of items) {
      // Skip if already seen
      if (state.seenUrls.includes(item.link)) continue;
      
      // Score the story
      const score = scoreStory(item, source.priority);
      
      candidates.push({
        ...item,
        sourceName: source.name,
        score,
        category: detectCategory(item.title, item.summary),
      });
    }
  }

  // 2. Deduplicate — two-tier approach:
  //    Tier 1: Fast keyword fingerprint (catches obvious duplicates instantly)
  //    Tier 2: Claude Opus 4.8 semantic check (catches same-event, different-headline duplicates)

  function titleFingerprint(title) {
    return title.toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !['that', 'this', 'with', 'from', 'after', 'into', 'just', 'have', 'been', 'were', 'they', 'their', 'what', 'when', 'where', 'which', 'while', 'about', 'during', 'before', 'landing', 'flight', 'plane', 'aircraft', 'pilot'].includes(w))
      .slice(0, 8)
      .sort();
  }

  function titleSimilarity(a, b) {
    const fa = new Set(titleFingerprint(a));
    const fb = new Set(titleFingerprint(b));
    const intersection = [...fa].filter(w => fb.has(w)).length;
    const union = new Set([...fa, ...fb]).size;
    return union > 0 ? intersection / union : 0;
  }

  // Claude semantic duplicate check — batches up to 8 pairs per call
  async function claudeSemanticDedupBatch(pairs) {
    if (pairs.length === 0) return [];
    try {
      const pairList = pairs.map((p, i) =>
        `Pair ${i + 1}:\n  Story A: "${p.a}" — ${(p.summaryA || '').slice(0, 80)}\n  Story B: "${p.b}" — ${(p.summaryB || '').slice(0, 80)}`
      ).join('\n\n');
      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: GROQ_MODEL,
          max_tokens: 200,
          messages: [{ role: 'user', content: `You are a news deduplication system. For each pair of aviation news stories, determine if they are about the SAME real-world event (same incident, same flight, same crash, same date/location) — even if written with completely different headlines or angles.\n\n${pairList}\n\nRespond ONLY with a JSON array of booleans, one per pair (true = same event, false = different events):\n[true/false, ...]` }]
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return pairs.map(() => false);
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      const match = content.match(/\[[\s\S]*?\]/);
      if (!match) return pairs.map(() => false);
      return JSON.parse(match[0]).map(r => Boolean(r));
    } catch (e) {
      log(`  Claude dedup batch error: ${e.message}`);
      return pairs.map(() => false);
    }
  }

  // Tier 1: Fast keyword dedup
  const tier1Candidates = [];
  for (const candidate of candidates) {
    const keywordDup = tier1Candidates.some(existing =>
      titleSimilarity(candidate.title, existing.title) > 0.45
    );
    if (!keywordDup) {
      tier1Candidates.push(candidate);
    } else {
      if (!state.seenUrls.includes(candidate.link)) state.seenUrls.push(candidate.link);
    }
  }

  // Tier 2: Claude semantic dedup for grey-zone pairs (similarity 0.15–0.45)
  const greyZonePairs = [];
  const pairMeta = [];
  for (let i = 0; i < tier1Candidates.length; i++) {
    for (let j = i + 1; j < tier1Candidates.length; j++) {
      const sim = titleSimilarity(tier1Candidates[i].title, tier1Candidates[j].title);
      if (sim >= 0.15 && sim < 0.45) {
        greyZonePairs.push({ a: tier1Candidates[i].title, b: tier1Candidates[j].title, summaryA: tier1Candidates[i].summary, summaryB: tier1Candidates[j].summary });
        pairMeta.push({ i, j });
      }
    }
  }
  const semanticDupSet = new Set();
  for (let b = 0; b < greyZonePairs.length; b += 8) {
    const results = await claudeSemanticDedupBatch(greyZonePairs.slice(b, b + 8));
    const metaBatch = pairMeta.slice(b, b + 8);
    for (let k = 0; k < results.length; k++) {
      if (results[k]) {
        const { i, j } = metaBatch[k];
        const removeIdx = (tier1Candidates[i].score >= tier1Candidates[j].score) ? j : i;
        if (!semanticDupSet.has(removeIdx)) {
          log(`  [SemanticDedup] Same event: "${tier1Candidates[Math.min(i,j)].title.slice(0, 45)}" ≈ "${tier1Candidates[Math.max(i,j)].title.slice(0, 45)}" → keeping higher-scored`);
          semanticDupSet.add(removeIdx);
          if (!state.seenUrls.includes(tier1Candidates[removeIdx].link)) state.seenUrls.push(tier1Candidates[removeIdx].link);
        }
      }
    }
  }
  const dedupedCandidates = tier1Candidates.filter((_, idx) => !semanticDupSet.has(idx));
  log(`  Tier1 dedup: ${candidates.length} → ${tier1Candidates.length} | Semantic dedup: → ${dedupedCandidates.length}`);

  // DB check: keyword pass first, then Claude semantic for grey zone
  // Check against BOTH published AND draft articles — drafts matter because
  // the autopilot runs every 5 min and can generate the same story multiple times
  // before any of them are published
  const recentArticles = await (async () => {
    try {
      const [rows] = await conn.execute(
        'SELECT title, excerpt FROM articles WHERE status IN ("published", "draft") AND createdAt > DATE_SUB(NOW(), INTERVAL 7 DAY) ORDER BY createdAt DESC LIMIT 500'
      );
      return rows;
    } catch { return []; }
  })();

  const dbKeywordClear = dedupedCandidates.filter(candidate => {
    const keywordMatch = recentArticles.some(r => titleSimilarity(candidate.title, r.title) > 0.40);
    if (keywordMatch) {
      log(`Skipping (keyword DB match): ${candidate.title.slice(0, 60)}`);
      if (!state.seenUrls.includes(candidate.link)) state.seenUrls.push(candidate.link);
    }
    return !keywordMatch;
  });

  // Claude semantic check against DB articles for remaining candidates
  const dbGreyZonePairs = [];
  const dbPairMeta = [];
  for (let i = 0; i < dbKeywordClear.length; i++) {
    for (const dbArticle of recentArticles) {
      const sim = titleSimilarity(dbKeywordClear[i].title, dbArticle.title);
      if (sim >= 0.12 && sim < 0.40) {
        dbGreyZonePairs.push({ a: dbKeywordClear[i].title, b: dbArticle.title, summaryA: dbKeywordClear[i].summary, summaryB: dbArticle.excerpt });
        dbPairMeta.push({ candidateIdx: i, dbTitle: dbArticle.title });
        break;
      }
    }
  }
  const dbSemanticDupSet = new Set();
  for (let b = 0; b < dbGreyZonePairs.length; b += 8) {
    const results = await claudeSemanticDedupBatch(dbGreyZonePairs.slice(b, b + 8));
    const metaBatch = dbPairMeta.slice(b, b + 8);
    for (let k = 0; k < results.length; k++) {
      if (results[k]) {
        const { candidateIdx, dbTitle } = metaBatch[k];
        log(`  [DBSemanticDedup] Already covered: "${dbKeywordClear[candidateIdx].title.slice(0, 50)}" ≈ DB: "${dbTitle.slice(0, 50)}"`);
        dbSemanticDupSet.add(candidateIdx);
        if (!state.seenUrls.includes(dbKeywordClear[candidateIdx].link)) state.seenUrls.push(dbKeywordClear[candidateIdx].link);
      }
    }
  }
  const finalCandidates = dbKeywordClear.filter((_, idx) => !dbSemanticDupSet.has(idx));

  // 3. Sort by score, take top candidates
  finalCandidates.sort((a, b) => b.score - a.score);
  log(`Found ${candidates.length} stories → ${dedupedCandidates.length} after dedup → ${finalCandidates.length} after DB check. Top score: ${finalCandidates[0]?.score ?? 0}`);
  const candidates_deduped = finalCandidates;

  // 4. Process top stories (deduplicated)
  for (const story of candidates_deduped) {
    if (articlesPublished >= effectiveMax) break;
    if (story.score < 40) {
      log(`Skipping low-score story (${story.score}): ${story.title.slice(0, 60)}`);
      break; // All remaining will be lower score
    }

    // Mark as seen regardless of outcome
    state.seenUrls.push(story.link);

    const storyText = `${story.title}\n\n${story.summary}\n\nSource: ${story.sourceName}\nURL: ${story.link}`;
    
    try {
      log(`Processing (score ${story.score}): ${story.title.slice(0, 70)}`);

      // Step 0: 10-pass story selection QA — is this worth writing?
      try {
        const { runStoryQA } = await import('./flight-drama-story-qa.mjs');
        const storyQA = await runStoryQA(story.title, story.summary, story.sourceName);
        if (!storyQA.approved) {
          log(`  Story QA REJECTED (${storyQA.passCount}/${storyQA.totalPasses} passed, score ${storyQA.score}/10): ${storyQA.rejectReason || 'Not newsworthy enough'}`);
          continue; // Skip to next story
        }
        log(`  Story QA APPROVED (${storyQA.passCount}/${storyQA.totalPasses} passed, score ${storyQA.score}/10)${storyQA.viralAngle ? ` — Angle: ${storyQA.viralAngle.slice(0, 80)}` : ''}`);
      } catch (e) {
        log(`  Story QA error: ${e.message} — proceeding without QA`);
      }

      // Step 1: Generate headline
      const headline = await generateHeadline(storyText);
      if (!headline) { log('No headline generated, skipping'); continue; }
      log(`Headline: ${headline}`);

      // Check slug uniqueness
      const slug = slugify(headline);
      if (await isSlugInDB(conn, slug)) {
        log(`Slug already exists: ${slug}`);
        continue;
      }

      // Step 2: Generate article (with reporter personality selection)
      const reporter = selectReporter(story.category);
      const articleData = await generateArticle(headline, storyText, story.category);
      log(`  Reporter: ${reporter.name} (${story.category})`);
      
      // Step 3: Fetch image using Claude Image System v2
      // Story-type classification, sentiment-aware queries, multi-source (Pexels/Unsplash/Wikimedia/Pixabay/NASA/Flickr),
      // Claude picks best from all candidates, diversity check against recent articles
      const isBreaking = story.score >= 70 && story.category === 'Aviation Incidents';
      let imageUrl = null;
      let imageQaScore = null;
      let imageQaPasses = null;
      let imageAttribution = null;
      let imageAttributionUrl = null;
      let imageRequiresAttribution = false;
      try {
        const { processArticle: claudeProcessArticle } = await import('./claude-image-system.mjs');
        // Build a minimal article object for the image system
        const articleForImage = {
          title: headline,
          excerpt: articleData.excerpt || story.summary || '',
          content: articleData.content || '',
        };
        // Get recent image URLs for diversity check (last 30 days)
        const [recentImgs] = await conn.execute(
          'SELECT featuredImage FROM articles WHERE status IN ("published", "draft") AND featuredImage IS NOT NULL AND createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY) ORDER BY createdAt DESC LIMIT 20'
        );
        const recentImageUrls = recentImgs.map(r => r.featuredImage).filter(Boolean);
        const photoResult = await claudeProcessArticle(articleForImage, recentImageUrls);
        imageUrl = photoResult?.url || null;
        imageQaScore = photoResult?.verification?.score ?? null;
        imageQaPasses = photoResult?.verification?.correct ? 1 : 0;
        imageAttribution = photoResult?.attribution ?? null;
        imageRequiresAttribution = !!(photoResult?.attribution);
        if (imageUrl) log(`  Featured photo [Claude v2, ${photoResult?.source || 'unknown'}, score ${imageQaScore}/10]: ${imageUrl.slice(0, 60)}`);
        if (imageAttribution) log(`  Attribution: ${imageAttribution}`);
      } catch (e) {
        log(`  Claude Image System v2 failed: ${e.message} — falling back to direct fetch`);
        try {
          const { fetchPhotoWithAIQueries } = await import('./flight-drama-photo-fetcher.mjs');
          const photoResult = await fetchPhotoWithAIQueries(headline, story.category, 0);
          imageUrl = photoResult?.url || null;
          imageAttribution = photoResult?.attribution ?? null;
          imageAttributionUrl = photoResult?.attributionUrl ?? null;
          imageRequiresAttribution = photoResult?.requiresAttribution ?? false;
        } catch {}
      }
      // Fallback to a clean Pexels aviation photo if all else fails
      if (!imageUrl) {
        imageUrl = 'https://images.pexels.com/photos/46148/aircraft-jet-landing-cloud-46148.jpeg?auto=compress&cs=tinysrgb&w=1080';
      }

      // Extract article QA score from the generateArticle result
      const articleQaScore = articleData._qaScore ?? null;
      const articleQaPasses = articleData._qaPasses ?? null;

      // Auto-strip em dashes from article content and excerpt (Sonnet loves them, QA hates them)
      if (articleData.content) {
        articleData.content = articleData.content
          .replace(/—/g, ' - ')   // em dash → hyphen with spaces
          .replace(/–/g, ' - ')   // en dash → hyphen with spaces
          .replace(/\s{2,}/g, ' ');  // clean up double spaces
      }
      if (articleData.excerpt) {
        articleData.excerpt = articleData.excerpt
          .replace(/—/g, ' - ')
          .replace(/–/g, ' - ');
      }

      // Step 3.5: Final duplicate guard — Claude checks the generated headline+excerpt
      // against ALL recent drafts and published articles before saving.
      // This is the last line of defence against same-event duplicates.
      try {
        const [recentForFinalCheck] = await conn.execute(
          'SELECT title, excerpt FROM articles WHERE status IN ("published", "draft") AND createdAt > DATE_SUB(NOW(), INTERVAL 7 DAY) ORDER BY createdAt DESC LIMIT 300'
        );
        // Fast keyword check first
        const keywordDup = recentForFinalCheck.some(r => titleSimilarity(headline, r.title) > 0.40);
        if (keywordDup) {
          log(`  [FinalDupGuard] Keyword match found — skipping: ${headline.slice(0, 60)}`);
          continue;
        }
        // Claude semantic check for grey-zone matches
        const greyMatches = recentForFinalCheck.filter(r => {
          const sim = titleSimilarity(headline, r.title);
          return sim >= 0.10 && sim < 0.40;
        }).slice(0, 8); // Check up to 8 grey-zone matches
        if (greyMatches.length > 0) {
          const pairs = greyMatches.map(r => ({
            a: headline,
            b: r.title,
            summaryA: articleData.excerpt || '',
            summaryB: r.excerpt || ''
          }));
          const results = await claudeSemanticDedupBatch(pairs);
          const isDup = results.some(r => r === true);
          if (isDup) {
            const matchedTitle = greyMatches[results.indexOf(true)]?.title || '?';
            log(`  [FinalDupGuard] Claude semantic match — skipping: "${headline.slice(0, 50)}" ≈ "${matchedTitle.slice(0, 50)}"`);
            continue;
          }
        }
        log(`  [FinalDupGuard] ✅ Unique — proceeding to save`);
      } catch (e) {
        log(`  [FinalDupGuard] Error: ${e.message} — proceeding anyway`);
      }

      // Step 4: Publish with reporter attribution, QA scores, and image attribution
      const articleId = await publishArticle(conn, {
        title: headline,
        slug,
        excerpt: articleData.excerpt,
        content: articleData.content,
        featuredImage: imageUrl,
        category: story.category,
        tags: articleData.tags,
        isBreaking,
        reporterSlug: reporter.slug,
        reporterName: reporter.name,
        articleQaScore,
        articleQaPasses,
        imageQaScore,
        imageQaPasses,
        imageAttribution,
        imageAttributionUrl,
        imageRequiresAttribution,
      });

      log(`✅ Published article ID ${articleId}: ${headline.slice(0, 60)}`);
      articlesPublished++;

      // Small delay between articles
      await new Promise(r => setTimeout(r, 3000));

    } catch (err) {
      log(`❌ Error processing story: ${err.message}`);
    }
  }

  await conn.end();
  
  state.lastRun = new Date().toISOString();
  saveState(state);
  
  log(`=== Run complete. Published: ${articlesPublished} articles ===`);
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
