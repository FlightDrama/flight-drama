/**
 * Inject inline images into AI-generated articles that have no inline images
 * Uses Manus S3 images already uploaded
 * AdSense-safe: all images are standard aviation photography
 */

import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Map of image URLs to use for different article topics
const IMAGES = {
  cockpit: '/manus-storage/cockpit-instruments_58392546.jpg',
  modernCockpit: '/manus-storage/modern-cockpit_e616c74e.jpg',
  takeoff: '/manus-storage/aircraft-takeoff_9f02558a.jpg',
  terminal: '/manus-storage/airport-terminal_eed7a3de.jpg',
  atcTower: '/manus-storage/atc-tower_25771bc1.jpg',
  atcScreens: '/manus-storage/atc-screens_6112b7ce.jpg',
  cabin: '/manus-storage/aircraft-cabin_1a0ea8c8.jpg',
  cabinPassengers: '/manus-storage/cabin-passengers_5b499774.jpg',
};

// Assign images based on article topic keywords
function getImageForArticle(slug, title) {
  const text = (slug + ' ' + title).toLowerCase();
  
  if (text.includes('cockpit') || text.includes('pilot') || text.includes('instrument') || text.includes('training') || text.includes('captain')) {
    return IMAGES.modernCockpit;
  }
  if (text.includes('atc') || text.includes('air traffic') || text.includes('tower') || text.includes('radar') || text.includes('control')) {
    return IMAGES.atcTower;
  }
  if (text.includes('cabin') || text.includes('passenger') || text.includes('seat') || text.includes('crew') || text.includes('attendant') || text.includes('customer') || text.includes('size')) {
    return IMAGES.cabinPassengers;
  }
  if (text.includes('terminal') || text.includes('airport') || text.includes('gate') || text.includes('boarding') || text.includes('lounge')) {
    return IMAGES.terminal;
  }
  if (text.includes('takeoff') || text.includes('take-off') || text.includes('landing') || text.includes('runway') || text.includes('emergency') || text.includes('divert') || text.includes('incident')) {
    return IMAGES.takeoff;
  }
  if (text.includes('battery') || text.includes('engine') || text.includes('technical') || text.includes('tech') || text.includes('system') || text.includes('mcas') || text.includes('boeing')) {
    return IMAGES.cockpit;
  }
  // Default: use aircraft takeoff
  return IMAGES.takeoff;
}

// Build the inline image HTML to inject mid-article
function buildImageHtml(imageUrl, altText) {
  return `\n<figure style="margin: 2rem 0; text-align: center;">
  <img src="${imageUrl}" alt="${altText}" style="width: 100%; max-width: 800px; height: auto; border: 1px solid #222;" loading="lazy">
</figure>\n`;
}

// Get all articles without inline images
const [articles] = await conn.execute(
  `SELECT id, title, slug, content FROM articles WHERE content NOT LIKE '%<img%' AND status = 'published' ORDER BY publishedAt DESC`
);

console.log(`Found ${articles.length} articles without inline images`);

let updated = 0;
for (const article of articles) {
  const imageUrl = getImageForArticle(article.slug, article.title);
  const altText = article.title.replace(/"/g, "'");
  const imageHtml = buildImageHtml(imageUrl, altText);
  
  // Find a good insertion point — after the second </p> tag (mid-article)
  let content = article.content;
  const paragraphs = content.split('</p>');
  
  if (paragraphs.length >= 3) {
    // Insert after the 2nd paragraph
    const insertPoint = paragraphs[0] + '</p>' + paragraphs[1] + '</p>';
    const rest = paragraphs.slice(2).join('</p>');
    content = insertPoint + imageHtml + rest;
  } else if (paragraphs.length >= 2) {
    // Insert after the 1st paragraph
    content = paragraphs[0] + '</p>' + imageHtml + paragraphs.slice(1).join('</p>');
  } else {
    // Append at the end
    content = content + imageHtml;
  }
  
  await conn.execute('UPDATE articles SET content = ? WHERE id = ?', [content, article.id]);
  console.log(`✅ ${article.slug.slice(0, 50)}`);
  updated++;
}

await conn.end();
console.log(`\n✈ Done! Updated ${updated} articles with inline images.`);
