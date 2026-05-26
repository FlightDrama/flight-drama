/**
 * Enhance article HTML with proper semantic markup:
 * - Convert plain text headings to <h2>/<h3> tags
 * - Add blockquote styling to quoted text
 * - Ensure paragraphs are properly wrapped
 * - Add data-enhanced marker to avoid re-processing
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [articles] = await conn.execute(
  "SELECT id, title, slug, content FROM articles WHERE content NOT LIKE '%data-enhanced%' ORDER BY id ASC"
);

console.log(`\n✈ Enhancing HTML for ${articles.length} articles...\n`);

let updated = 0;

for (const article of articles) {
  let html = article.content;

  // Step 1: Identify lines that look like headings (short, no period at end, not in a tag)
  // These are typically the bold section titles in the WP content
  // Pattern: a <p> containing only a short text with no trailing period that looks like a heading
  html = html.replace(/<p>(<strong>)?([A-Z][^<]{5,80}?)(<\/strong>)?<\/p>/g, (match, openStrong, text, closeStrong) => {
    // Skip if it's a very long paragraph (it's not a heading)
    if (text.length > 100) return match;
    // Skip if it ends with a period (it's a sentence, not a heading)
    if (text.trim().endsWith('.') || text.trim().endsWith(',')) return match;
    // Skip if it contains affiliate content
    if (match.includes('affiliate') || match.includes('Amazon') || match.includes('Skyscanner')) return match;
    // Convert to h2
    return `<h2>${text}</h2>`;
  });

  // Step 2: Convert <p><strong>Short heading</strong></p> to h2 (another common WP pattern)
  html = html.replace(/<p><strong>([^<]{5,80}?)<\/strong><\/p>/g, (match, text) => {
    if (text.length > 100) return match;
    if (text.trim().endsWith('.') || text.trim().endsWith(',')) return match;
    if (match.includes('affiliate') || match.includes('Amazon')) return match;
    return `<h2>${text}</h2>`;
  });

  // Step 3: Wrap any text that looks like a pull quote in blockquote
  // Pattern: short paragraph that starts with a quote mark or is in quotes
  html = html.replace(/<p>"([^"]{20,200})"<\/p>/g, (match, text) => {
    return `<blockquote><p>"${text}"</p></blockquote>`;
  });

  // Step 4: Add data-enhanced marker
  html = html + '<!-- data-enhanced -->';

  if (html !== article.content + '<!-- data-enhanced -->') {
    await conn.execute("UPDATE articles SET content = ? WHERE id = ?", [html, article.id]);
    console.log(`  [OK] Enhanced: ${article.slug}`);
    updated++;
  } else {
    // Still mark as enhanced even if no changes
    await conn.execute(
      "UPDATE articles SET content = CONCAT(content, '<!-- data-enhanced -->') WHERE id = ?",
      [article.id]
    );
    console.log(`  [SKIP] No headings found: ${article.slug}`);
  }
}

console.log(`\n════════════════════════════════════════`);
console.log(`✅ Enhanced: ${updated} articles`);
console.log(`\n🎉 Done!\n`);

await conn.end();
