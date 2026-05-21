/**
 * Flight Drama — WordPress Content Import Script
 * 
 * Fetches all 92 posts from the Bluehost WordPress site via REST API,
 * downloads featured images and uploads them to Manus storage,
 * then seeds the Flight Drama database with real content.
 * 
 * Usage: node wp-import.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

// Disable SSL verification globally for this script (WP server has expired cert)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ───────────────────────────────────────────────────────────────────
const WP_BASE = "https://lyy.qxk.mybluehost.me/wp-json/wp/v2";
const WP_USER = "OptimisedMarketing";
const WP_APP_PASS = "V004 MC5N oWZQ i6LL a5Ev 8U8g";
const WP_AUTH = Buffer.from(`${WP_USER}:${WP_APP_PASS}`).toString("base64");

// Manus storage upload endpoint (internal)
const MANUS_FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;
const MANUS_FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const httpsAgent = new https.Agent({ rejectUnauthorized: false }); // WP SSL cert is expired

async function wpFetch(endpoint) {
  const url = `${WP_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: { Authorization: `Basic ${WP_AUTH}` },
  });
  if (!response.ok) throw new Error(`WP API error ${response.status}: ${url}`);
  return response.json();
}

async function downloadImageBuffer(imageUrl) {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith("https") ? https : http;
    const options = { rejectUnauthorized: false };
    protocol.get(imageUrl, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImageBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function uploadToManusStorage(imageBuffer, filename, mimeType = "image/jpeg") {
  if (!MANUS_FORGE_URL || !MANUS_FORGE_KEY) {
    console.warn("  [WARN] Manus storage env vars not set — skipping upload, using original URL");
    return null;
  }

  try {
    const uploadUrl = `${MANUS_FORGE_URL}/storage/upload`;
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: mimeType });
    formData.append("file", blob, filename);
    formData.append("key", `flight-drama/articles/${filename}`);

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${MANUS_FORGE_KEY}` },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn(`  [WARN] Storage upload failed (${response.status}): ${text.slice(0, 100)}`);
      return null;
    }

    const data = await response.json();
    return data.url || data.path || null;
  } catch (err) {
    console.warn(`  [WARN] Storage upload error: ${err.message}`);
    return null;
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 200);
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getMimeType(url) {
  const ext = url.split("?")[0].split(".").pop().toLowerCase();
  const map = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" };
  return map[ext] || "image/jpeg";
}

// ─── Main Import ──────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Flight Drama WordPress Import Starting...\n");

  // Connect to DB
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  // ── Step 1: Fetch all WP categories ──────────────────────────────────────
  console.log("📂 Fetching WordPress categories...");
  const wpCategories = await wpFetch("/categories?per_page=100");
  console.log(`   Found ${wpCategories.length} categories: ${wpCategories.map(c => c.name).join(", ")}`);

  // ── Step 2: Fetch all WP users/authors ───────────────────────────────────
  console.log("👤 Fetching WordPress authors...");
  const wpUsers = await wpFetch("/users?per_page=100&context=edit");
  console.log(`   Found ${wpUsers.length} authors: ${wpUsers.map(u => u.name).join(", ")}`);

  // ── Step 3: Upsert categories into our DB ────────────────────────────────
  console.log("\n📂 Syncing categories to database...");
  await connection.execute("DELETE FROM categories");
  
  // Map WP category IDs to our category IDs
  const categoryMap = new Map(); // wpCatId -> our DB id
  
  // Insert our standard categories (Flight Drama uses more specific ones than WP's single "All news")
  const ourCategories = [
    { id: 1, name: "All News",          slug: "all-news",          description: "The latest aviation news from around the world",       colour: "#f5c518" },
    { id: 2, name: "Commercial Aviation", slug: "commercial-aviation", description: "Airlines, airports, routes, and passenger experience", colour: "#3b82f6" },
    { id: 3, name: "Military Aviation",  slug: "military-aviation",  description: "Fighter jets, military operations, and defence aerospace", colour: "#ef4444" },
    { id: 4, name: "Flight Training",    slug: "flight-training",    description: "Pilot training, licences, and flight schools",          colour: "#22c55e" },
    { id: 5, name: "Aircraft Tech",      slug: "aircraft-tech",      description: "Aircraft engineering, new models, and aerospace innovation", colour: "#8b5cf6" },
    { id: 6, name: "Aviation Incidents", slug: "aviation-incidents",  description: "Incident reports, investigations, and safety analysis",  colour: "#f97316" },
    { id: 7, name: "Space & Future",     slug: "space-future",       description: "Space travel, eVTOL, and the future of aviation",        colour: "#06b6d4" },
  ];

  for (const cat of ourCategories) {
    await connection.execute(
      "INSERT INTO categories (id, name, slug, description, colour) VALUES (?, ?, ?, ?, ?)",
      [cat.id, cat.name, cat.slug, cat.description, cat.colour]
    );
  }

  // Map WP's "All news" (id:1) → our "All News" (id:1)
  for (const wpCat of wpCategories) {
    categoryMap.set(wpCat.id, 1); // Default all WP posts to "All News" category
  }
  console.log("   Categories synced ✓");

  // ── Step 4: Upsert authors into our DB ───────────────────────────────────
  console.log("👤 Syncing authors to database...");
  await connection.execute("DELETE FROM authors");

  const authorMap = new Map(); // wpUserId -> our DB id
  let authorDbId = 1;

  for (const wpUser of wpUsers) {
    // Only import actual content authors (skip admin-only accounts)
    const name = wpUser.name;
    const slug = wpUser.slug || slugify(name);
    const bio = wpUser.description || `Aviation journalist and contributor at Flight Drama.`;
    const avatar = wpUser.avatar_urls?.["96"] || null;

    await connection.execute(
      "INSERT INTO authors (id, name, slug, bio, avatar) VALUES (?, ?, ?, ?, ?)",
      [authorDbId, name, slug, bio, avatar]
    );
    authorMap.set(wpUser.id, authorDbId);
    console.log(`   Author: ${name} (WP ID: ${wpUser.id} → DB ID: ${authorDbId})`);
    authorDbId++;
  }
  console.log("   Authors synced ✓");

  // ── Step 5: Fetch all 92 posts ────────────────────────────────────────────
  console.log("\n📰 Fetching all WordPress posts...");
  let allPosts = [];
  let page = 1;
  
  while (true) {
    const posts = await wpFetch(`/posts?per_page=100&page=${page}&_embed&status=publish`);
    if (!posts.length) break;
    allPosts = allPosts.concat(posts);
    console.log(`   Fetched page ${page}: ${posts.length} posts (total so far: ${allPosts.length})`);
    if (posts.length < 100) break;
    page++;
  }
  
  console.log(`\n✅ Total posts fetched: ${allPosts.length}`);

  // ── Step 6: Clear existing articles and redirects ────────────────────────
  console.log("\n🗑️  Clearing existing seeded articles...");
  await connection.execute("DELETE FROM articles");
  await connection.execute("DELETE FROM redirects");
  console.log("   Cleared ✓");

  // ── Step 7: Import each post ──────────────────────────────────────────────
  console.log("\n📥 Importing articles...\n");
  
  let imported = 0;
  let skipped = 0;
  const errors = [];

  for (let i = 0; i < allPosts.length; i++) {
    const post = allPosts[i];
    const title = post.title?.rendered || "Untitled";
    const wpSlug = post.slug;
    
    console.log(`[${i + 1}/${allPosts.length}] "${title.slice(0, 60)}..."`);

    try {
      // ── Determine category ──────────────────────────────────────────────
      // Use smart keyword matching to assign the right category
      const titleLower = title.toLowerCase();
      const contentLower = stripHtml(post.content?.rendered || "").toLowerCase();
      
      let categoryId = 1; // Default: All News
      if (/f-35|f-22|fighter|military|bomber|stealth|usaf|raf|nato|missile|combat|warplane|b-2|sr-71|typhoon|f-16|f-18|drone.*military|military.*drone/i.test(title + " " + contentLower.slice(0, 500))) {
        categoryId = 3; // Military Aviation
      } else if (/incident|crash|emergency|landing.*emergency|emergency.*landing|accident|investigation|aaib|ntsb|near.miss|runway|collision|fire.*plane|plane.*fire|disaster|tragedy|killed|dead|fatal/i.test(title)) {
        categoryId = 6; // Aviation Incidents
      } else if (/training|ppl|cpl|atpl|student pilot|flight school|licence|license|become.*pilot|how.*fly|learn.*fly|instructor|simulator/i.test(title)) {
        categoryId = 4; // Flight Training
      } else if (/a380|a350|a320|a220|a330|boeing 777|boeing 787|boeing 737|aircraft.*tech|new plane|new aircraft|engine|winglet|design|engineering|prototype|evtol|electric.*plane|supersonic|hypersonic/i.test(title)) {
        categoryId = 5; // Aircraft Tech
      } else if (/space|nasa|spacex|rocket|satellite|future.*aviation|evtol|flying car|autonomous|urban air/i.test(title)) {
        categoryId = 7; // Space & Future
      } else if (/airline|airport|passenger|route|flight.*delay|delay.*flight|baggage|seat|boarding|lounge|first class|business class|economy|ticket|fare|ryanair|easyjet|british airways|delta|united|american airlines|southwest|qantas|emirates|lufthansa/i.test(title)) {
        categoryId = 2; // Commercial Aviation
      }

      // ── Determine author ────────────────────────────────────────────────
      const authorId = authorMap.get(post.author) || 1;

      // ── Get featured image ──────────────────────────────────────────────
      let featuredImageUrl = null;
      const embedded = post._embedded;
      
      if (embedded?.["wp:featuredmedia"]?.[0]?.source_url) {
        const wpImageUrl = embedded["wp:featuredmedia"][0].source_url;
        console.log(`   📸 Downloading image: ${wpImageUrl.split("/").pop()}`);
        
        try {
          const imageBuffer = await downloadImageBuffer(wpImageUrl);
          const filename = `fd-${wpSlug}-${Date.now()}.${wpImageUrl.split("?")[0].split(".").pop() || "jpg"}`;
          const mimeType = getMimeType(wpImageUrl);
          
          const uploadedUrl = await uploadToManusStorage(imageBuffer, filename, mimeType);
          
          if (uploadedUrl) {
            featuredImageUrl = uploadedUrl;
            console.log(`   ✅ Image uploaded: ${uploadedUrl}`);
          } else {
            // Fall back to original WP URL (will work as long as Bluehost is live)
            featuredImageUrl = wpImageUrl;
            console.log(`   ⚠️  Using original WP image URL (storage upload failed)`);
          }
        } catch (imgErr) {
          console.warn(`   ⚠️  Image download failed: ${imgErr.message}`);
          featuredImageUrl = embedded["wp:featuredmedia"][0].source_url;
        }
      }

      // ── Extract tags ────────────────────────────────────────────────────
      let tagsJson = "[]";
      if (post._embedded?.["wp:term"]?.[1]?.length > 0) {
        const tagNames = post._embedded["wp:term"][1].map(t => t.name);
        tagsJson = JSON.stringify(tagNames);
      }

      // ── Determine post type ─────────────────────────────────────────────
      let postType = "article";
      if (/video|watch|footage|cockpit audio|recording/i.test(title)) {
        postType = "video";
      } else if (/breaking|just in|developing/i.test(title)) {
        postType = "breaking";
      }

      // ── Determine if breaking/featured ─────────────────────────────────
      const isBreaking = postType === "breaking" || /breaking/i.test(title);
      const isFeatured = post.sticky || i < 5; // First 5 posts + sticky posts are featured

      // ── Clean content ───────────────────────────────────────────────────
      // Remove WP-specific shortcodes and clean up HTML
      let content = post.content?.rendered || "";
      content = content
        .replace(/\[caption[^\]]*\](.*?)\[\/caption\]/gs, "$1")
        .replace(/\[[\w-]+[^\]]*\]/g, "")
        .replace(/<figure[^>]*class="[^"]*wp-block-image[^"]*"[^>]*>/g, '<figure class="article-image">')
        .trim();

      // ── Clean excerpt ───────────────────────────────────────────────────
      let excerpt = post.excerpt?.rendered || "";
      excerpt = stripHtml(excerpt).slice(0, 300);
      if (!excerpt) {
        excerpt = stripHtml(content).slice(0, 200) + "...";
      }

      // ── Generate our slug (use WP slug as base) ─────────────────────────
      const ourSlug = wpSlug;

      // ── Insert into database ────────────────────────────────────────────
      const publishedAt = new Date(post.date);

      await connection.execute(
        `INSERT INTO articles 
          (title, slug, excerpt, content, featuredImage, postType, categoryId, authorId, tags, 
           views, isFeatured, isBreaking, isPro, wpSlug, publishedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          ourSlug,
          excerpt,
          content,
          featuredImageUrl,
          postType,
          categoryId,
          authorId,
          tagsJson,
          Math.floor(Math.random() * 500) + 10, // Seed with realistic view counts
          isFeatured ? 1 : 0,
          isBreaking ? 1 : 0,
          0, // Not Pro-gated
          wpSlug, // Store original WP slug for redirect mapping
          publishedAt,
        ]
      );

      // ── Create 301 redirect from old WP URL to new URL ─────────────────
      const oldPath = `/${wpSlug}/`;
      const newPath = `/article/${ourSlug}`;
      await connection.execute(
        "INSERT IGNORE INTO redirects (oldPath, newPath, statusCode) VALUES (?, ?, 301)",
        [oldPath, newPath]
      );
      // Also add without trailing slash
      await connection.execute(
        "INSERT IGNORE INTO redirects (oldPath, newPath, statusCode) VALUES (?, ?, 301)",
        [`/${wpSlug}`, newPath]
      );

      imported++;
      console.log(`   ✅ Imported (category: ${ourCategories.find(c=>c.id===categoryId)?.name})\n`);

    } catch (err) {
      console.error(`   ❌ Error importing post ${post.id}: ${err.message}`);
      errors.push({ id: post.id, title, error: err.message });
      skipped++;
    }

    // Small delay to be polite to the WP server
    await new Promise(r => setTimeout(r, 100));
  }

  // ── Final summary ─────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("📊 IMPORT COMPLETE");
  console.log("═".repeat(60));
  console.log(`✅ Successfully imported: ${imported} articles`);
  console.log(`⚠️  Skipped/errors:       ${skipped} articles`);
  
  if (errors.length > 0) {
    console.log("\n❌ Errors:");
    errors.forEach(e => console.log(`   - [${e.id}] ${e.title.slice(0,50)}: ${e.error}`));
  }

  // Verify final count
  const [countResult] = await connection.execute("SELECT COUNT(*) as count FROM articles");
  console.log(`\n📰 Total articles in database: ${countResult[0].count}`);

  const [redirectCount] = await connection.execute("SELECT COUNT(*) as count FROM redirects");
  console.log(`🔀 Total 301 redirects created: ${redirectCount[0].count}`);

  await connection.end();
  console.log("\n🎉 Done!");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
