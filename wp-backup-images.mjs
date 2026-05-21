/**
 * Flight Drama — Image Backup to Cloud Computer
 * 
 * Downloads all WordPress article images and:
 * 1. Uploads to Manus S3 storage (primary CDN)
 * 2. Saves to cloud computer at /home/ubuntu/flight-drama-images/ (backup)
 * 3. Updates database with Manus storage URLs
 * 
 * Usage: node wp-backup-images.mjs
 */

import mysql from "mysql2/promise";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { execSync, exec } from "child_process";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP_DIR = path.join(__dirname, ".image-cache");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// Cloud computer backup directory (via FUSE mount)
const CLOUD_BACKUP_DIR = "/mnt/6qi1c7ep34rhsqdxvwy2s90mb/ubuntu/flight-drama-images";

async function downloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(TMP_DIR, `img_${Date.now()}_${Math.random().toString(36).slice(2)}.tmp`);
    const protocol = imageUrl.startsWith("https") ? https : http;

    const req = protocol.get(imageUrl, { rejectUnauthorized: false }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fs.unlink(tmpFile, () => {});
        return downloadImage(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
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
    req.setTimeout(20000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

async function uploadToManusStorage(filePath) {
  try {
    const result = execSync(`manus-upload-file --webdev "${filePath}" 2>&1`, { encoding: "utf8", timeout: 30000 });
    const match = result.match(/Storage Path:\s*(\S+)/);
    if (match) return match[1];
    console.warn("    Could not parse storage path:", result.slice(0, 100));
    return null;
  } catch (err) {
    console.warn("    Upload error:", err.message.slice(0, 100));
    return null;
  }
}

async function backupToCloudComputer(filePath, articleSlug, ext) {
  try {
    // Ensure backup directory exists on cloud computer
    if (!fs.existsSync(CLOUD_BACKUP_DIR)) {
      fs.mkdirSync(CLOUD_BACKUP_DIR, { recursive: true });
    }
    const destFile = path.join(CLOUD_BACKUP_DIR, `${articleSlug}.${ext}`);
    fs.copyFileSync(filePath, destFile);
    return destFile;
  } catch (err) {
    console.warn(`    Cloud backup error: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log("\n🖼️  Flight Drama Image Backup & Migration\n");
  console.log("📍 Manus S3 storage: primary CDN");
  console.log("📍 Cloud computer:   /home/ubuntu/flight-drama-images/ (backup)\n");

  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Get ALL articles — re-process any still on WP URLs
  const [articles] = await conn.execute(
    `SELECT id, title, slug, featuredImage 
     FROM articles 
     WHERE featuredImage IS NOT NULL 
     ORDER BY id ASC`
  );

  console.log(`Found ${articles.length} articles with images\n`);

  // Ensure cloud backup dir exists
  try {
    if (!fs.existsSync(CLOUD_BACKUP_DIR)) {
      fs.mkdirSync(CLOUD_BACKUP_DIR, { recursive: true });
      console.log(`✅ Created cloud backup directory: ${CLOUD_BACKUP_DIR}\n`);
    } else {
      console.log(`✅ Cloud backup directory exists: ${CLOUD_BACKUP_DIR}\n`);
    }
  } catch (err) {
    console.warn(`⚠️  Could not create cloud backup dir: ${err.message}\n`);
  }

  let uploaded = 0;
  let backedUp = 0;
  let alreadyDone = 0;
  let failed = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const imageUrl = article.featuredImage;
    const isAlreadyOnManus = imageUrl.startsWith("/manus-storage/");

    console.log(`[${i+1}/${articles.length}] "${article.title.slice(0, 55)}"`);

    // Check if cloud backup already exists
    const backupFiles = fs.existsSync(CLOUD_BACKUP_DIR)
      ? fs.readdirSync(CLOUD_BACKUP_DIR).filter(f => f.startsWith(article.slug))
      : [];
    const cloudBackupExists = backupFiles.length > 0;

    if (isAlreadyOnManus && cloudBackupExists) {
      console.log(`   ✅ Already on Manus storage + cloud backup exists\n`);
      alreadyDone++;
      continue;
    }

    let filePath = null;
    let ext = "jpg";
    let contentType = "image/jpeg";

    // Download if needed (either for upload or backup)
    if (!isAlreadyOnManus || !cloudBackupExists) {
      const sourceUrl = isAlreadyOnManus
        ? null // Can't re-download from Manus storage path easily
        : imageUrl;

      if (sourceUrl) {
        console.log(`   📥 Downloading: ${sourceUrl.split("/").pop()}`);
        try {
          const result = await downloadImage(sourceUrl);
          filePath = result.filePath;
          ext = result.ext;
          contentType = result.contentType;
          const size = fs.statSync(filePath).size;
          console.log(`   📦 ${(size / 1024).toFixed(1)}KB`);
        } catch (err) {
          console.warn(`   ❌ Download failed: ${err.message}\n`);
          failed++;
          continue;
        }
      }
    }

    // Upload to Manus S3 if not already there
    let manusPath = isAlreadyOnManus ? imageUrl : null;
    if (!isAlreadyOnManus && filePath) {
      console.log(`   ☁️  Uploading to Manus S3...`);
      manusPath = await uploadToManusStorage(filePath);
      if (manusPath) {
        await conn.execute("UPDATE articles SET featuredImage = ? WHERE id = ?", [manusPath, article.id]);
        console.log(`   ✅ S3: ${manusPath}`);
        uploaded++;
      } else {
        console.warn(`   ⚠️  S3 upload failed — keeping original URL`);
        failed++;
      }
    }

    // Backup to cloud computer
    if (!cloudBackupExists && filePath) {
      console.log(`   💾 Backing up to cloud computer...`);
      const cloudPath = await backupToCloudComputer(filePath, article.slug, ext);
      if (cloudPath) {
        console.log(`   ✅ Cloud: ${cloudPath}`);
        backedUp++;
      }
    } else if (cloudBackupExists) {
      console.log(`   ✅ Cloud backup: already exists`);
      backedUp++;
    }

    // Clean up temp file
    if (filePath) {
      try { fs.unlinkSync(filePath); } catch {}
    }

    console.log();
    await new Promise(r => setTimeout(r, 150));
  }

  // Clean up temp dir
  try { fs.rmdirSync(TMP_DIR); } catch {}

  // Final summary
  console.log("═".repeat(60));
  console.log("📊 BACKUP & MIGRATION COMPLETE");
  console.log("═".repeat(60));
  console.log(`✅ Already complete:    ${alreadyDone}`);
  console.log(`☁️  Uploaded to S3:     ${uploaded}`);
  console.log(`💾 Backed up to cloud: ${backedUp}`);
  console.log(`❌ Failed:              ${failed}`);

  // Final DB check
  const [onManus] = await conn.execute("SELECT COUNT(*) as c FROM articles WHERE featuredImage LIKE '/manus-storage/%'");
  const [onWP] = await conn.execute("SELECT COUNT(*) as c FROM articles WHERE featuredImage NOT LIKE '/manus-storage/%' AND featuredImage IS NOT NULL");
  console.log(`\n📰 On Manus S3 storage: ${onManus[0].c} / ${articles.length}`);
  console.log(`📰 Still on WP server:  ${onWP[0].c} / ${articles.length}`);

  // List cloud backup files
  if (fs.existsSync(CLOUD_BACKUP_DIR)) {
    const files = fs.readdirSync(CLOUD_BACKUP_DIR);
    console.log(`\n💾 Cloud backup files: ${files.length} images at ${CLOUD_BACKUP_DIR}`);
    const totalSize = files.reduce((sum, f) => {
      try { return sum + fs.statSync(path.join(CLOUD_BACKUP_DIR, f)).size; } catch { return sum; }
    }, 0);
    console.log(`   Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  }

  await conn.end();
  console.log("\n🎉 Done!");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
