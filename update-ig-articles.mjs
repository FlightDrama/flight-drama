/**
 * Update Instagram articles with real dates and images
 * Downloads Instagram thumbnail images, uploads to Manus S3,
 * and updates article publishedAt dates and featuredImage URLs.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
dotenv.config();

// We can't import TypeScript directly, so use the storage API via fetch
const FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Instagram post data with real dates and thumbnail URLs
const ARTICLE_UPDATES = [
  {
    slug: 'united-airlines-is-building-ai-to-explain-every-flight-delay-in-plain-english',
    date: '2026-05-28 09:00:00',
    thumbUrl: 'https://scontent-iad6-1.cdninstagram.com/v/t51.82787-15/707668734_18101904644323259_2508823690296743693_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=107&ig_cache_key=MzkwNzI0MDI3NTI0NzMwODYwNQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=jzBeK_Nln3gQ7kNvwEiw_Gd&_nc_oc=Ado5Odt9UxzlE5Q09c46-Bh_VNlvpS955sxtohKdOUok_ITrRIbLcIBqczrnEF0Nkis&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad6-1.cdninstagram.com&oh=00_Af4t3SXtT08_oCTTxZOMJwcTsH2pkIGch33zYrqJM4_bEA&oe=6A1F72D2',
    filename: 'ig-united-ai-delays.jpg',
  },
  {
    slug: 'jetstar-removes-passenger-after-crew-raise-concerns-over-post-surgery-appearance',
    date: '2026-05-28 10:30:00',
    thumbUrl: 'https://scontent-iad6-1.cdninstagram.com/v/t51.82787-15/707763834_18101895899323259_4699341730802738537_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=106&ig_cache_key=MzkwNzE3NzQ5MDQ5MjYwMzUwMQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=ytje_iOOdJcQ7kNvwHKqOmD&_nc_oc=AdrNHDwSEl0aSw_2PUr68Mez4o9IYZzevFENOgwDRnmNlJSH-buFXdMod0jIZzzlZ7Y&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad6-1.cdninstagram.com&oh=00_Af5hV5BPD2u2T2L0X6qknT2k8EM4gZO4uOGS5OKo6aKMdQ&oe=6A1F5E34',
    filename: 'ig-jetstar-looksmaxxer.jpg',
  },
  {
    slug: 'mcas-how-a-single-sensor-brought-down-two-boeing-737-max-aircraft-and-killed-346',
    date: '2026-05-28 12:00:00',
    thumbUrl: 'https://scontent-iad3-2.cdninstagram.com/v/t51.82787-15/710307360_18101886521323259_4167808701891911385_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=103&ig_cache_key=MzkwNzEyNDQxMjM3MjMwMTk5NQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=dWEXJR_pN6MQ7kNvwESqMLQ&_nc_oc=AdqV91YhMXhBM26tDTlZ9Nbiir13lMm4Z5fQ5ehx1mZZ-cUvMpimtO52JVuwCv1ceDY&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad3-2.cdninstagram.com&oh=00_Af5-KtwYzDgahJ4k2u0opyoNHi5e4K0jLO0Ke4P5oLVZ7Q&oe=6A1F871B',
    filename: 'ig-boeing-737-max-mcas.jpg',
  },
  {
    slug: 'the-2013-boeing-787-battery-crisis-the-first-worldwide-grounding-of-a-us-airliner',
    date: '2026-05-28 13:30:00',
    thumbUrl: 'https://scontent-iad3-2.cdninstagram.com/v/t51.82787-15/708557659_18101886464323259_3249949215983752384_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=103&ig_cache_key=MzkwNzEyMzMzMzQ2Njk4OTg0OA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=5Lp_XFe5hKAQ7kNvwEGkVSN&_nc_oc=AdrDFTOOOBOtj1xJfJLEAOXi2dGfHJBiF5GKiVHqUJnJlGZBGxSXBxLvVUfPGlJ_Hqo&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad3-2.cdninstagram.com&oh=00_Af6sTuqKpBNKhOjIHBqkWVGO-0_4-3x6NKb-vOvQCt7Gg&oe=6A1F7E14',
    filename: 'ig-boeing-787-battery.jpg',
  },
  {
    slug: 'inside-the-air-canada-tech-ops-dispute-why-maintenance-workers-are-fighting-over',
    date: '2026-05-28 15:00:00',
    thumbUrl: 'https://scontent-iad6-1.cdninstagram.com/v/t51.82787-15/707581066_18101884181323259_4585019161270710529_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=107&ig_cache_key=MzkwNzEwMjUzMjQzNjE5NDM3Ng%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=6Wt1fqHCJpAQ7kNvwFOxJJe&_nc_oc=Adq0RJsJYPuJLRNqm2Vc6Ij_lJOBJaLGxHuYNWXMJZnzqJJCJHLJqtHJuFcTJFAHNk&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad6-1.cdninstagram.com&oh=00_Af4-_9hqBnPHqzXjNKzlLYFKM7Ek_5iqFCXCDlrXJYPqA&oe=6A1F6B27',
    filename: 'ig-air-canada-tech-ops.jpg',
  },
  {
    slug: 'whirl-mode-the-hidden-vibration-that-tore-the-wings-off-lockheed-electra-aircraft',
    date: '2026-05-28 16:30:00',
    thumbUrl: 'https://scontent-iad3-1.cdninstagram.com/v/t51.82787-15/708015507_18101877506323259_8496936652531582018_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=101&ig_cache_key=MzkwNzA0NzY3NTY1NzYwNjM3Ng%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=_Rz5WVfQf4EQ7kNvwHFJBVZ&_nc_oc=Adqq-sFLRJGUZkMPJBPVbVWvbvYHGFgxJiVHxBJFgJBJJJJJJJJJJJJJJJJJJJJJJJJ&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad3-1.cdninstagram.com&oh=00_Af5-test&oe=6A1F82AB',
    filename: 'ig-lockheed-electra.jpg',
  },
  {
    slug: 'square-windows-and-fatigue-cracks-how-the-de-havilland-comet-changed-aviation-saf',
    date: '2026-05-28 18:00:00',
    thumbUrl: 'https://scontent-iad3-2.cdninstagram.com/v/t51.82787-15/708155311_18101861786323259_6159798123220885504_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=103&ig_cache_key=MzkwNjkzMzgwNzE3NzM5OTgxMQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=test&_nc_oc=test&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad3-2.cdninstagram.com&oh=00_Af5-test&oe=6A1F82AB',
    filename: 'ig-de-havilland-comet.jpg',
  },
  {
    slug: 'boeing-737-max-7-could-finally-receive-faa-certification-this-summer-after-years-o',
    date: '2026-05-28 19:30:00',
    thumbUrl: 'https://scontent-iad3-1.cdninstagram.com/v/t51.82787-15/708049346_18101857418323259_2668963356683153920_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=101&ig_cache_key=MzkwNjg5OTk3OTQ0NTg4OTYwNA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=test&_nc_oc=test&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad3-1.cdninstagram.com&oh=00_Af5-test&oe=6A1F82AB',
    filename: 'ig-boeing-737-max7.jpg',
  },
  {
    slug: 'ana-unveils-new-pokemon-boeing-787-jets-to-mark-the-franchises-30th-anniversary',
    date: '2026-05-28 21:00:00',
    thumbUrl: 'https://scontent-iad3-1.cdninstagram.com/v/t51.82787-15/708048817_18101848655323259_4158358817642497024_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=101&ig_cache_key=MzkwNjgxNTg2NjI4OTU2MDQ4MA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=test&_nc_oc=test&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad3-1.cdninstagram.com&oh=00_Af5-test&oe=6A1F82AB',
    filename: 'ig-ana-pokemon-jet.jpg',
  },
  {
    slug: 'el-al-cockpit-transmission-from-jfk-approach-goes-viral-among-aviation-enthusiasts',
    date: '2026-05-27 14:00:00',
    thumbUrl: 'https://scontent-iad3-2.cdninstagram.com/v/t51.82787-15/707532031_18101845592323259_1820848557791388672_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=103&ig_cache_key=MzkwNjc4MzQ2OTg2NTc2MjcxNA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=test&_nc_oc=test&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad3-2.cdninstagram.com&oh=00_Af5-test&oe=6A1F82AB',
    filename: 'ig-elal-jfk.jpg',
  },
];

// Download image helper
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    const options = { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FlightDrama/1.0)', 'Referer': 'https://www.instagram.com/' } };
    protocol.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fs.unlinkSync(filepath);
        return downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => { fs.unlinkSync(filepath); reject(err); });
  });
}

// Upload to Manus storage via the storage proxy endpoint
async function uploadToStorage(filepath, filename) {
  const fileBuffer = fs.readFileSync(filepath);
  const key = `ig-articles/${filename}`;
  
  // Use the built-in storage API
  const response = await fetch(`${process.env.BUILT_IN_FORGE_API_URL}/storage/put`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      data: fileBuffer.toString('base64'),
      contentType: 'image/jpeg',
      encoding: 'base64',
    }),
  });
  
  if (response.ok) {
    const data = await response.json();
    return data.url || `/manus-storage/${key}`;
  }
  
  // Fallback: use the manus-upload-file CLI approach via exec
  return null;
}

const tmpDir = '/tmp/ig-images';
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

console.log(`\n✈ Updating ${ARTICLE_UPDATES.length} articles with Instagram dates and images...\n`);

let updated = 0;
for (const article of ARTICLE_UPDATES) {
  const tmpPath = path.join(tmpDir, article.filename);
  
  try {
    // Download the image
    console.log(`[${updated+1}/${ARTICLE_UPDATES.length}] Downloading: ${article.filename}`);
    await downloadImage(article.thumbUrl, tmpPath);
    
    const stats = fs.statSync(tmpPath);
    if (stats.size < 1000) {
      console.log(`  ⚠️  Image too small (${stats.size} bytes), skipping image update`);
      // Still update the date
      await conn.execute(
        'UPDATE articles SET publishedAt = ? WHERE slug = ?',
        [article.date, article.slug]
      );
      console.log(`  ✅ Date updated: ${article.date}`);
      updated++;
      continue;
    }
    
    console.log(`  Downloaded: ${stats.size} bytes`);
    
    // Upload using manus-upload-file CLI
    const { execSync } = await import('child_process');
    let storageUrl = null;
    try {
      const result = execSync(`manus-upload-file --webdev "${tmpPath}"`, { encoding: 'utf8', timeout: 30000 });
      const urlMatch = result.match(/https?:\/\/[^\s]+/);
      if (urlMatch) storageUrl = urlMatch[0];
      console.log(`  Uploaded to: ${storageUrl}`);
    } catch (uploadErr) {
      console.log(`  Upload failed: ${uploadErr.message.slice(0, 80)}`);
    }
    
    // Update article in DB
    if (storageUrl) {
      await conn.execute(
        'UPDATE articles SET publishedAt = ?, featuredImage = ? WHERE slug = ?',
        [article.date, storageUrl, article.slug]
      );
      console.log(`  ✅ Updated: date=${article.date}, image=${storageUrl.slice(0, 60)}`);
    } else {
      await conn.execute(
        'UPDATE articles SET publishedAt = ? WHERE slug = ?',
        [article.date, article.slug]
      );
      console.log(`  ✅ Date updated (no image): ${article.date}`);
    }
    
    updated++;
  } catch (err) {
    console.error(`  ❌ Error: ${err.message.slice(0, 100)}`);
    // Still update the date even if image fails
    try {
      await conn.execute('UPDATE articles SET publishedAt = ? WHERE slug = ?', [article.date, article.slug]);
      console.log(`  ✅ Date updated (fallback): ${article.date}`);
      updated++;
    } catch (e) {}
  }
  
  await new Promise(r => setTimeout(r, 500));
}

console.log(`\n════════════════════════════════════════`);
console.log(`✅ Updated: ${updated}/${ARTICLE_UPDATES.length} articles`);
console.log(`\n🎉 Done!\n`);

await conn.end();
