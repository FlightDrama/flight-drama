/**
 * Flight Drama — Image Migration Script
 * Downloads featured images from WordPress and re-uploads to Manus storage,
 * then updates the featuredImage URLs in the articles table.
 */

import mysql from "mysql2/promise";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP_DIR = path.join(__dirname, ".image-cache");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;

console.log("FORGE_URL:", FORGE_URL ? FORGE_URL.slice(0, 40) + "..." : "NOT SET");
console.log("FORGE_KEY:", FORGE_KEY ? "SET (" + FORGE_KEY.length + " chars)" : "NOT SET");

async function downloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(TMP_DIR, `img_${Date.now()}_${Math.random().toString(36).slice(2)}.tmp`);
    const protocol = imageUrl.startsWith("https") ? https : http;
    const options = { rejectUnauthorized: false };

    const req = protocol.get(imageUrl, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fs.unlink(tmpFile, () => {});
        return downloadImage(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${imageUrl}`));
      }
      const contentType = res.headers["content-type"] || "image/jpeg";
      const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : contentType.includes("gif") ? "gif" : "jpg";
      const finalFile = tmpFile.replace(".tmp", `.${ext}`);
      const stream = fs.createWriteStream(tmpFile);
      res.pipe(stream);
      stream.on("finish", () => {
        fs.renameSync(tmpFile, finalFile);
        resolve({ filePath: finalFile, contentType, ext });
      });
      stream.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

async function uploadToStorage(filePath, key, contentType) {
  // Use the manus-upload-file CLI tool which is available in the sandbox
  const { execSync } = await import("child_process");
  try {
    const result = execSync(`manus-upload-file --webdev "${filePath}" 2>&1`, { encoding: "utf8" });
    // Parse the returned storage path
    const match = result.match(/Storage Path:\s*(\S+)/);
    if (match) {
      return match[1]; // e.g. /manus-storage/filename_abc123.jpg
    }
    console.warn("  Could not parse storage path from:", result.slice(0, 200));
    return null;
  } catch (err) {
    console.warn("  Upload CLI error:", err.message.slice(0, 200));
    return null;
  }
}

async function main() {
  console.log("\n🖼️  Flight Drama Image Migration\n");

  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Get all articles with WP image URLs
  const [articles] = await conn.execute(
    "SELECT id, title, slug, featuredImage FROM articles WHERE featuredImage IS NOT NULL ORDER BY id ASC"
  );

  console.log(`Found ${articles.length} articles with images\n`);

  let migrated = 0;
  let failed = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const wpImageUrl = article.featuredImage;

    // Skip if already on Manus storage
    if (wpImageUrl.startsWith("/manus-storage/")) {
      console.log(`[${i+1}/${articles.length}] Already migrated: ${article.title.slice(0,50)}`);
      migrated++;
      continue;
    }

    console.log(`[${i+1}/${articles.length}] "${article.title.slice(0,60)}"`);
    console.log(`   Source: ${wpImageUrl.split("/").pop()}`);

    try {
      // Download image
      const { filePath, contentType, ext } = await downloadImage(wpImageUrl);
      const fileSize = fs.statSync(filePath).size;
      console.log(`   Downloaded: ${(fileSize / 1024).toFixed(1)}KB`);

      // Upload to Manus storage
      const storagePath = await uploadToStorage(filePath, `fd-articles/${article.slug}.${ext}`, contentType);

      // Clean up temp file
      try { fs.unlinkSync(filePath); } catch {}

      if (storagePath) {
        // Update database
        await conn.execute(
          "UPDATE articles SET featuredImage = ? WHERE id = ?",
          [storagePath, article.id]
        );
        console.log(`   ✅ Uploaded: ${storagePath}\n`);
        migrated++;
      } else {
        console.log(`   ⚠️  Upload failed — keeping original URL\n`);
        failed++;
      }

    } catch (err) {
      console.warn(`   ❌ Error: ${err.message}\n`);
      failed++;
    }

    // Small delay
    await new Promise(r => setTimeout(r, 200));
  }

  // Cleanup temp dir
  try { fs.rmdirSync(TMP_DIR); } catch {}

  console.log("═".repeat(50));
  console.log(`✅ Migrated: ${migrated} images`);
  console.log(`❌ Failed:   ${failed} images`);

  // Final check
  const [withStorage] = await conn.execute(
    "SELECT COUNT(*) as c FROM articles WHERE featuredImage LIKE '/manus-storage/%'"
  );
  const [withWP] = await conn.execute(
    "SELECT COUNT(*) as c FROM articles WHERE featuredImage NOT LIKE '/manus-storage/%' AND featuredImage IS NOT NULL"
  );
  console.log(`\n📊 On Manus storage: ${withStorage[0].c}`);
  console.log(`📊 Still on WP:      ${withWP[0].c}`);

  await conn.end();
  console.log("\n🎉 Done!");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
