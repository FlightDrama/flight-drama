/**
 * Back up all 23 article images to cloud computer.
 * For images already on Manus S3, re-fetches from original WP URLs via API.
 */

import mysql from "mysql2/promise";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const WP_BASE = "https://lyy.qxk.mybluehost.me/wp-json/wp/v2";
const WP_AUTH = Buffer.from("OptimisedMarketing:V004 MC5N oWZQ i6LL a5Ev 8U8g").toString("base64");
const CLOUD_BACKUP_DIR = "/mnt/6qi1c7ep34rhsqdxvwy2s90mb/ubuntu/flight-drama-images";
const TMP_DIR = "/tmp/fd-img-backup";

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
if (!fs.existsSync(CLOUD_BACKUP_DIR)) fs.mkdirSync(CLOUD_BACKUP_DIR, { recursive: true });

async function downloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(TMP_DIR, `img_${Date.now()}.tmp`);
    const protocol = imageUrl.startsWith("https") ? https : http;
    const req = protocol.get(imageUrl, { rejectUnauthorized: false }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const ct = res.headers["content-type"] || "image/jpeg";
      const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : ct.includes("gif") ? "gif" : "jpg";
      const finalFile = tmpFile.replace(".tmp", `.${ext}`);
      const stream = fs.createWriteStream(tmpFile);
      res.pipe(stream);
      stream.on("finish", () => { fs.renameSync(tmpFile, finalFile); resolve({ filePath: finalFile, ext }); });
      stream.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

async function main() {
  console.log("💾 Flight Drama — Cloud Computer Image Backup\n");

  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Fetch all WP posts to get original image URLs
  console.log("📡 Fetching WP posts with embedded media...");
  const response = await fetch(`${WP_BASE}/posts?per_page=100&_embed&status=publish`, {
    headers: { Authorization: `Basic ${WP_AUTH}` },
  });
  const wpPosts = await response.json();
  console.log(`   Got ${wpPosts.length} posts from WP\n`);

  // Build slug → original WP image URL map
  const wpImageMap = new Map();
  for (const post of wpPosts) {
    const imgUrl = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
    if (imgUrl) wpImageMap.set(post.slug, imgUrl);
  }

  // Get all articles from DB
  const [articles] = await conn.execute("SELECT id, title, slug, featuredImage FROM articles ORDER BY id ASC");
  console.log(`Found ${articles.length} articles in DB\n`);

  let backed = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < articles.length; i++) {
    const art = articles[i];
    const wpImageUrl = wpImageMap.get(art.slug);

    // Check if cloud backup already exists
    const existing = fs.existsSync(CLOUD_BACKUP_DIR)
      ? fs.readdirSync(CLOUD_BACKUP_DIR).filter(f => f.startsWith(art.slug))
      : [];

    console.log(`[${i+1}/${articles.length}] "${art.title.slice(0, 55)}"`);

    if (existing.length > 0) {
      console.log(`   ✅ Already backed up: ${existing[0]}\n`);
      skipped++;
      continue;
    }

    if (!wpImageUrl) {
      console.log(`   ⚠️  No WP image URL found for slug: ${art.slug}\n`);
      failed++;
      continue;
    }

    console.log(`   📥 Downloading: ${wpImageUrl.split("/").pop()}`);
    try {
      const { filePath, ext } = await downloadImage(wpImageUrl);
      const size = fs.statSync(filePath).size;
      console.log(`   📦 ${(size / 1024).toFixed(1)}KB`);

      const destFile = path.join(CLOUD_BACKUP_DIR, `${art.slug}.${ext}`);
      fs.copyFileSync(filePath, destFile);
      fs.unlinkSync(filePath);

      console.log(`   ✅ Saved: ${destFile}\n`);
      backed++;
    } catch (err) {
      console.warn(`   ❌ Failed: ${err.message}\n`);
      failed++;
    }

    await new Promise(r => setTimeout(r, 150));
  }

  // Summary
  console.log("═".repeat(60));
  console.log("📊 CLOUD BACKUP COMPLETE");
  console.log("═".repeat(60));
  console.log(`✅ Newly backed up: ${backed}`);
  console.log(`⏭️  Already existed: ${skipped}`);
  console.log(`❌ Failed:          ${failed}`);

  const files = fs.readdirSync(CLOUD_BACKUP_DIR);
  const totalSize = files.reduce((s, f) => {
    try { return s + fs.statSync(path.join(CLOUD_BACKUP_DIR, f)).size; } catch { return s; }
  }, 0);
  console.log(`\n💾 Cloud backup: ${files.length} files, ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📁 Location: ${CLOUD_BACKUP_DIR}`);

  await conn.end();
  console.log("\n🎉 Done!");
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
