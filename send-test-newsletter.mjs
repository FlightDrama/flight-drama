/**
 * Standalone newsletter test send script
 * Uses Resend directly without importing TypeScript files
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const { Resend } = await import('/home/ubuntu/flight-drama/node_modules/resend/dist/index.mjs');
const resend = new Resend(process.env.RESEND_API_KEY);

const SITE_URL = 'https://flightnews-qolpdepj.manus.space';
const FROM = 'Flight Drama <onboarding@resend.dev>'; // Using Resend test domain until flightdrama.com is verified

const BASE_STYLES = `
  body { margin: 0; padding: 0; background: #0a0a0a; font-family: Inter, -apple-system, sans-serif; }
  .wrapper { max-width: 600px; margin: 0 auto; background: #0a0a0a; }
  .header { background: #F5C518; padding: 16px 24px; }
  .header-logo { font-size: 22px; font-weight: 900; color: #000; letter-spacing: 2px; text-decoration: none; display: block; }
  .header-tagline { font-size: 11px; color: rgba(0,0,0,0.6); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
  .body { padding: 32px 24px; }
  .footer { background: #111; border-top: 1px solid #222; padding: 20px 24px; text-align: center; }
  .footer p { color: #555; font-size: 11px; margin: 4px 0; }
  .footer a { color: #888; text-decoration: underline; }
  .btn { display: inline-block; background: #F5C518; color: #000; font-weight: 900; font-size: 14px; padding: 14px 28px; text-decoration: none; }
  h1 { color: #fff; font-size: 26px; font-weight: 900; margin: 0 0 12px; line-height: 1.3; }
  h2 { color: #fff; font-size: 18px; font-weight: 900; margin: 24px 0 8px; }
  p { color: #9ca3af; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
  .divider { border: none; border-top: 1px solid #222; margin: 24px 0; }
  .article-card { background: #111; border: 1px solid #222; padding: 16px; margin-bottom: 12px; }
  .article-card img { width: 100%; height: 160px; object-fit: cover; margin-bottom: 12px; display: block; }
  .article-card .cat { font-size: 10px; font-weight: 900; color: #F5C518; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .article-card h3 { color: #fff; font-size: 16px; font-weight: 900; margin: 0 0 8px; line-height: 1.4; }
  .article-card p { color: #777; font-size: 13px; margin: 0 0 10px; }
  .article-card a { color: #F5C518; font-size: 12px; font-weight: 700; text-decoration: none; }
`;

function buildEmail(articles) {
  const articlesHtml = articles.map(a => `
    <div class="article-card">
      ${a.featuredImage ? `<img src="${a.featuredImage}" alt="${a.title.replace(/"/g, '&quot;')}">` : ''}
      ${a.categoryName ? `<div class="cat">${a.categoryName}</div>` : ''}
      <h3>${a.title}</h3>
      ${a.excerpt ? `<p>${a.excerpt.replace(/<[^>]+>/g, '').slice(0, 150)}...</p>` : ''}
      <a href="${SITE_URL}/article/${a.slug}">Read the full story →</a>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${BASE_STYLES}</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <a href="${SITE_URL}" class="header-logo">✈ FLIGHT DRAMA</a>
    <div class="header-tagline">Aviation News</div>
  </div>
  <div class="body">
    <p style="color:#F5C518;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Flight Drama Weekly</p>
    <h1>This Week in Aviation</h1>
    <p>Hi Lee, here's your weekly roundup of the biggest aviation stories from the Flight Drama team.</p>
    <hr class="divider">
    <h2>This Week's Top Stories</h2>
    ${articlesHtml}
    <hr class="divider">
    <p style="text-align:center;margin:20px 0;">
      <a href="${SITE_URL}" class="btn">Read All Stories on Flight Drama →</a>
    </p>
    <hr class="divider">
    <div style="background:#111;border:1px solid #222;padding:16px;text-align:center;">
      <p style="color:#F5C518;font-weight:900;font-size:14px;margin-bottom:4px;">Join the Conversation</p>
      <p style="font-size:13px;color:#666;margin-bottom:12px;">Discuss these stories with fellow aviation enthusiasts in the Flight Drama forum.</p>
      <a href="${SITE_URL}/forum" style="color:#F5C518;font-weight:700;font-size:13px;text-decoration:none;">Visit the Forum ✈</a>
    </div>
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Flight Drama. All rights reserved.</p>
    <p>You're receiving this because you subscribed at <a href="${SITE_URL}">flightdrama.com</a></p>
    <p><a href="${SITE_URL}/unsubscribe">Unsubscribe</a> · <a href="${SITE_URL}/newsletter">Manage preferences</a></p>
    <p style="margin-top:8px;color:#333;">✈ — — ✈ — — ✈</p>
  </div>
</div>
</body>
</html>`;
}

// Connect to DB and get top 5 articles
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [articles] = await conn.execute(
  `SELECT a.id, a.title, a.slug, a.excerpt, a.featuredImage, a.views, c.name as categoryName 
   FROM articles a 
   LEFT JOIN categories c ON a.categoryId = c.id 
   ORDER BY a.views DESC LIMIT 5`
);

console.log('\n✈ Top 5 articles selected:');
articles.forEach((a, i) => console.log(`  ${i+1}. ${a.title.slice(0, 65)} (${a.views} views)`));

// Save draft to DB
const articleIds = JSON.stringify(articles.map(a => a.id));
const subject = "This Week in Aviation ✈ — Emergency Landings, Boeing Crisis & More";
const previewText = "Plus: Why cargo planes are older than their pilots, and the A350 wheel loss story";
const html = buildEmail(articles);

const [result] = await conn.execute(
  `INSERT INTO newsletter_editions (subject, previewText, articleIds, htmlContent, status) VALUES (?, ?, ?, ?, 'draft')`,
  [subject, previewText, articleIds, html]
);
const editionId = result.insertId;
console.log(`\n✅ Draft saved (ID: ${editionId})`);
console.log(`   Subject: ${subject}`);

// Send test email
console.log('\n📧 Sending test email to lee_ncfc@hotmail.com...');
const sendResult = await resend.emails.send({
  from: FROM,
  to: 'lee_ncfc@hotmail.com',
  subject: `[TEST] ${subject}`,
  html,
});

if (sendResult.error) {
  console.error('❌ Send failed:', sendResult.error);
} else {
  console.log('✅ Test email sent! Resend ID:', sendResult.data?.id);
}

await conn.end();
console.log('\n🎉 Done! Check lee_ncfc@hotmail.com for the test email.');
