/**
 * Flight Drama — Email Service
 * ============================
 * Handles all transactional and newsletter emails via Resend.
 * 
 * Emails sent from: noreply@flightdrama.com
 * (Requires flightdrama.com to be verified in Resend dashboard)
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Flight Drama <noreply@flightdrama.com>";
const SITE_URL = process.env.VITE_SITE_URL || "https://flightnews-qolpdepj.manus.space";

// ─── Shared styles ────────────────────────────────────────────────────────────

const BASE_STYLES = `
  body { margin: 0; padding: 0; background: #0a0a0a; font-family: Inter, -apple-system, sans-serif; }
  .wrapper { max-width: 600px; margin: 0 auto; background: #0a0a0a; }
  .header { background: #F5C518; padding: 16px 24px; display: flex; align-items: center; gap: 12px; }
  .header-logo { font-size: 22px; font-weight: 900; color: #000; letter-spacing: 2px; text-decoration: none; }
  .header-tagline { font-size: 11px; color: rgba(0,0,0,0.6); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
  .body { padding: 32px 24px; }
  .footer { background: #111; border-top: 1px solid #222; padding: 20px 24px; text-align: center; }
  .footer p { color: #555; font-size: 11px; margin: 4px 0; }
  .footer a { color: #888; text-decoration: underline; }
  .btn { display: inline-block; background: #F5C518; color: #000; font-weight: 900; font-size: 14px; padding: 14px 28px; text-decoration: none; letter-spacing: 0.5px; }
  .btn-dark { background: #1a1a1a; color: #F5C518; border: 1px solid #333; }
  h1 { color: #fff; font-size: 26px; font-weight: 900; margin: 0 0 12px; line-height: 1.3; }
  h2 { color: #fff; font-size: 20px; font-weight: 900; margin: 24px 0 8px; }
  p { color: #9ca3af; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
  .divider { border: none; border-top: 1px solid #222; margin: 24px 0; }
  .article-card { background: #111; border: 1px solid #222; padding: 16px; margin-bottom: 12px; }
  .article-card img { width: 100%; height: 160px; object-fit: cover; margin-bottom: 12px; }
  .article-card .cat { font-size: 10px; font-weight: 900; color: #F5C518; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .article-card h3 { color: #fff; font-size: 16px; font-weight: 900; margin: 0 0 8px; line-height: 1.4; }
  .article-card p { color: #777; font-size: 13px; margin: 0 0 10px; }
  .article-card a { color: #F5C518; font-size: 12px; font-weight: 700; text-decoration: none; }
  .sponsor-banner { background: #111; border: 1px solid #F5C518; padding: 16px 20px; margin: 20px 0; }
  .sponsor-label { font-size: 9px; color: #555; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .sponsor-brand { font-size: 18px; font-weight: 900; color: #fff; margin-bottom: 4px; }
  .sponsor-tagline { font-size: 13px; color: #888; margin-bottom: 12px; }
`;

function emailWrapper(content: string, unsubscribeUrl?: string): string {
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
    <div>
      <a href="${SITE_URL}" class="header-logo">✈ FLIGHT DRAMA</a>
      <div class="header-tagline">Aviation News</div>
    </div>
  </div>
  <div class="body">
    ${content}
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Flight Drama. All rights reserved.</p>
    <p>You're receiving this because you subscribed at <a href="${SITE_URL}">flightdrama.com</a></p>
    ${unsubscribeUrl ? `<p><a href="${unsubscribeUrl}">Unsubscribe</a> · <a href="${SITE_URL}/newsletter">Manage preferences</a></p>` : ""}
    <p style="margin-top:8px;color:#333;">✈ — — ✈ — — ✈</p>
  </div>
</div>
</body>
</html>`;
}

// ─── Welcome Email ─────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(
  email: string,
  name: string | null,
  unsubscribeToken: string
): Promise<void> {
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${unsubscribeToken}`;
  const firstName = name?.split(" ")[0] || "Aviator";

  const content = `
    <h1>Welcome aboard, ${firstName}! ✈</h1>
    <p>You've joined the Flight Drama community — the internet's home for aviation enthusiasts, pilots, spotters, and everyone who looks up when a plane flies over.</p>
    <p>Here's what you can expect from us:</p>
    <ul style="color:#9ca3af;font-size:15px;line-height:2;padding-left:20px;">
      <li>Breaking aviation news as it happens</li>
      <li>Deep dives into incidents, accidents, and investigations</li>
      <li>The stories behind the headlines that other outlets miss</li>
      <li>Community forum discussions from fellow aviation enthusiasts</li>
    </ul>
    <hr class="divider">
    <p>Your first step: explore the latest stories on the site.</p>
    <p style="text-align:center;margin:24px 0;">
      <a href="${SITE_URL}" class="btn">Read the Latest News →</a>
    </p>
    <hr class="divider">
    <p style="font-size:13px;color:#555;">Want more? Join the Flight Drama community forum to discuss aviation news with fellow enthusiasts, earn pilot rank badges, and be part of the conversation.</p>
    <p style="text-align:center;margin:16px 0;">
      <a href="${SITE_URL}/forum" class="btn btn-dark">Join the Forum ✈</a>
    </p>
  `;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Welcome to Flight Drama ✈ — You're in!",
    html: emailWrapper(content, unsubscribeUrl),
  });
}

// ─── Newsletter Edition Email ──────────────────────────────────────────────────

interface ArticlePreview {
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  categoryName?: string;
}

interface SponsorData {
  brandName: string;
  tagline?: string;
  ctaText: string;
  ctaUrl: string;
  logoUrl?: string;
}

export async function sendNewsletterEdition(
  email: string,
  name: string | null,
  unsubscribeToken: string,
  subject: string,
  previewText: string,
  articles: ArticlePreview[],
  sponsor?: SponsorData | null
): Promise<void> {
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${unsubscribeToken}`;
  const firstName = name?.split(" ")[0] || "Aviator";

  // Sponsor banner HTML
  const sponsorHtml = sponsor ? `
    <div class="sponsor-banner">
      <div class="sponsor-label">This week's sponsor</div>
      ${sponsor.logoUrl ? `<img src="${sponsor.logoUrl}" alt="${sponsor.brandName}" style="max-height:40px;margin-bottom:8px;">` : ""}
      <div class="sponsor-brand">${sponsor.brandName}</div>
      ${sponsor.tagline ? `<div class="sponsor-tagline">${sponsor.tagline}</div>` : ""}
      <a href="${sponsor.ctaUrl}" class="btn" style="font-size:12px;padding:10px 20px;">${sponsor.ctaText} →</a>
    </div>
  ` : "";

  // Articles HTML
  const articlesHtml = articles.map(article => `
    <div class="article-card">
      ${article.featuredImage ? `<img src="${article.featuredImage}" alt="${article.title}">` : ""}
      ${article.categoryName ? `<div class="cat">${article.categoryName}</div>` : ""}
      <h3>${article.title}</h3>
      ${article.excerpt ? `<p>${article.excerpt.replace(/<[^>]+>/g, "").slice(0, 120)}...</p>` : ""}
      <a href="${SITE_URL}/article/${article.slug}">Read the full story →</a>
    </div>
  `).join("");

  const content = `
    <p style="color:#F5C518;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Flight Drama Weekly</p>
    <h1>This Week in Aviation</h1>
    <p>Hi ${firstName}, here's your weekly roundup of the biggest aviation stories from the Flight Drama team.</p>
    
    ${sponsorHtml}
    
    <hr class="divider">
    <h2>This Week's Stories</h2>
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
  `;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject,
    headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
    html: emailWrapper(content, unsubscribeUrl),
  });
}

// ─── Generate HTML preview ─────────────────────────────────────────────────────

export function generateNewsletterPreviewHtml(
  subject: string,
  articles: ArticlePreview[],
  sponsor?: SponsorData | null
): string {
  const sponsorHtml = sponsor ? `
    <div class="sponsor-banner">
      <div class="sponsor-label">This week's sponsor</div>
      <div class="sponsor-brand">${sponsor.brandName}</div>
      ${sponsor.tagline ? `<div class="sponsor-tagline">${sponsor.tagline}</div>` : ""}
      <a href="${sponsor.ctaUrl}" class="btn" style="font-size:12px;padding:10px 20px;">${sponsor.ctaText} →</a>
    </div>
  ` : "";

  const articlesHtml = articles.map(article => `
    <div class="article-card">
      ${article.featuredImage ? `<img src="${article.featuredImage}" alt="${article.title}">` : ""}
      ${article.categoryName ? `<div class="cat">${article.categoryName}</div>` : ""}
      <h3>${article.title}</h3>
      ${article.excerpt ? `<p>${article.excerpt.replace(/<[^>]+>/g, "").slice(0, 120)}...</p>` : ""}
      <a href="#">Read the full story →</a>
    </div>
  `).join("");

  const content = `
    <p style="color:#F5C518;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Flight Drama Weekly</p>
    <h1>This Week in Aviation</h1>
    <p>Hi [Subscriber], here's your weekly roundup of the biggest aviation stories.</p>
    ${sponsorHtml}
    <hr class="divider">
    <h2>This Week's Stories</h2>
    ${articlesHtml}
    <hr class="divider">
    <p style="text-align:center;"><a href="#" class="btn">Read All Stories →</a></p>
  `;

  return emailWrapper(content, "#unsubscribe");
}
