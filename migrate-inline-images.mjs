/**
 * Flight Drama — Inline Image Migration
 * Finds all <img> tags in article content that point to the Bluehost server,
 * downloads each image, uploads to Manus S3 storage, and updates the DB.
 */

import mysql from "mysql2/promise";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import dotenv from "dotenv";
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const TMP_DIR = "/tmp/fd-inline-imgs";
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Find all articles with inline images pointing to external hosts
const [articles] = await conn.execute(
  "SELECT id, slug, content FROM articles WHERE content LIKE '%<img%src=%' ORDER BY id ASC"
);

console.log(`\n✈ Scanning ${articles.length} articles for inline images...\n`);

// Extract all img src URLs from HTML
function extractImgSrcs(html) {
  const matches = [];
  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const src = m[1];
    // Only process external URLs (not already on Manus storage or data URIs)
    if (src.startsWith("http") && !src.startsWith("/manus-storage/")) {
      matches.push({ full: m[0], src });
    }
  }
  return matches;
}

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(TMP_DIR, `img_${Date.now()}_${Math.random().toString(36).slice(2)}.tmp`);
    const protocol = url.startsWith("https") ? https : http;
    const req = protocol.get(url, { rejectUnauthorized: false }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const ct = res.headers["content-type"] || "image/jpeg";
      const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : ct.includes("gif") ? "gif" : "jpg";
      const finalFile = tmpFile.replace(".tmp", `.${ext}`);
      const stream = fs.createWriteStream(tmpFile);
      res.pipe(stream);
      stream.on("finish", () => { fs.renameSync(tmpFile, finalFile); resolve(finalFile); });
      stream.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

async function uploadToStorage(filePath) {
  try {
    const result = execSync(`manus-upload-file --webdev "${filePath}" 2>&1`, { encoding: "utf8", timeout: 30000 });
    const match = result.match(/Storage Path:\s*(\S+)/);
    return match ? match[1] : null;
  } catch (err) {
    return null;
  }
}

let totalImages = 0;
let migratedImages = 0;
let failedImages = 0;

for (const article of articles) {
  const imgMatches = extractImgSrcs(article.content);
  if (imgMatches.length === 0) continue;

  console.log(`\n📰 ${article.slug} — ${imgMatches.length} inline image(s)`);
  let content = article.content;
  let changed = false;

  for (const { full, src } of imgMatches) {
    totalImages++;
    const filename = src.split("/").pop()?.split("?")[0] || "image.jpg";
    console.log(`   📸 ${filename}`);

    try {
      const filePath = await downloadImage(src);
      const size = fs.statSync(filePath).size;
      console.log(`      Downloaded: ${(size / 1024).toFixed(1)}KB`);

      const storagePath = await uploadToStorage(filePath);
      try { fs.unlinkSync(filePath); } catch {}

      if (storagePath) {
        // Replace the src in the img tag
        const newImgTag = full.replace(src, storagePath);
        content = content.replace(full, newImgTag);
        changed = true;
        migratedImages++;
        console.log(`      ✅ ${storagePath}`);
      } else {
        failedImages++;
        console.log(`      ⚠️  Upload failed — keeping original URL`);
      }
    } catch (err) {
      failedImages++;
      console.log(`      ❌ ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  if (changed) {
    await conn.execute("UPDATE articles SET content = ? WHERE id = ?", [content, article.id]);
    console.log(`   ✅ Article updated`);
  }
}

// Cleanup
try { fs.rmdirSync(TMP_DIR); } catch {}

console.log(`\n════════════════════════════════════════`);
console.log(`📊 Total inline images found: ${totalImages}`);
console.log(`✅ Migrated to Manus S3:      ${migratedImages}`);
console.log(`❌ Failed:                    ${failedImages}`);
console.log(`\n🎉 Done!\n`);

await conn.end();
