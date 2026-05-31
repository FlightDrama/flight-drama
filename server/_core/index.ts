import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import Stripe from "stripe";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getRedirect, upsertProMembership, getUserByOpenId } from "../db";
import multer from "multer";
import { handleAvatarUpload } from "../routers/avatarUpload";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Stripe webhook — MUST be before json() middleware
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2026-04-22.dahlia" as any });
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? "");
    } catch (err) {
      console.error("[Stripe] Webhook signature verification failed", err);
      return res.status(400).send("Webhook Error");
    }
    if (event.id.startsWith("evt_test_")) {
      console.log("[Stripe] Test event detected");
      return res.json({ verified: true });
    }
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = parseInt(session.metadata?.user_id ?? "0");
      const plan = (session.metadata?.plan as "monthly" | "annual") ?? "monthly";
      if (userId) {
        await upsertProMembership({
          userId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          status: "active",
          plan,
        });
        console.log(`[Stripe] Pro membership activated for user ${userId}`);
      }
    }
    res.json({ received: true });
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Avatar upload route
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
  app.post("/api/avatar/upload", upload.single("avatar"), async (req, res) => {
    // Inject user from session cookie
    try {
      const ctx = await createContext({ req, res } as any);
      (req as any).user = ctx.user;
      return handleAvatarUpload(req, res);
    } catch (e) {
      return res.status(500).json({ error: "Upload failed" });
    }
  });

  // CMS image upload endpoint — for the RichTextEditor drag-and-drop
  const cmsUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
  app.post("/api/cms/upload-image", cmsUpload.single("image"), async (req, res) => {
    try {
      const ctx = await createContext({ req, res } as any);
      if (!ctx.user || ctx.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only' });
      }
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const { storagePut } = await import('../storage');
      const ext = req.file.originalname.split('.').pop() ?? 'jpg';
      const key = `cms-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);
      return res.json({ url, key });
    } catch (e: any) {
      return res.status(500).json({ error: e.message ?? 'Upload failed' });
    }
  });

  // Scheduled article publish handler — fires via Heartbeat cron every minute
  app.post("/api/scheduled/publish-articles", async (req, res) => {
    try {
      const { sdk } = await import('./sdk');
      const { rawQuery } = await import('../db');
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron) return res.status(403).json({ error: 'cron-only' });

      // Find all articles scheduled to publish now or in the past that are still draft/scheduled
      const now = new Date();
      const rows = await rawQuery<any>(
        `SELECT id, title, slug FROM articles WHERE scheduledAt IS NOT NULL AND scheduledAt <= ? AND status = 'scheduled' LIMIT 50`,
        [now]
      );

      if (rows.length === 0) return res.json({ ok: true, published: 0 });

      // Publish each article
      for (const article of rows) {
        await rawQuery(
          `UPDATE articles SET status = 'published', publishedAt = ?, scheduledAt = NULL WHERE id = ?`,
          [now, article.id]
        );
      }

      console.log(`[Scheduled Publish] Published ${rows.length} articles: ${rows.map((a: any) => a.slug).join(', ')}`);
      return res.json({ ok: true, published: rows.length, articles: rows.map((a: any) => a.slug) });
    } catch (e: any) {
      console.error('[Scheduled Publish] Error:', e);
      return res.status(500).json({ error: e.message, timestamp: new Date().toISOString() });
    }
  });

  // SEO 301 redirect handler — resolves old WordPress URLs
  app.use(async (req, res, next) => {
    const path = req.path;
    if (path.startsWith("/api") || path.startsWith("/manus-storage") || path.includes(".")) return next();

    // Pattern 1: WordPress date-based URLs /YYYY/MM/DD/slug/ or /YYYY/MM/slug/
    const wpDateSlugMatch = path.match(/^\/\d{4}\/\d{2}(?:\/\d{2})?\/([^/]+)\/?$/);
    if (wpDateSlugMatch) {
      const wpSlug = wpDateSlugMatch[1];
      // Try to find an article by wpSlug or by matching the slug
      try {
        const { rawQuery } = await import('../db');
        // First try exact wpSlug match
        let rows = await rawQuery<any>('SELECT slug FROM articles WHERE wpSlug = ? LIMIT 1', [wpSlug]);
        if (!rows[0]) {
          // Try slug match (strip common WP suffixes)
          rows = await rawQuery<any>('SELECT slug FROM articles WHERE slug = ? OR slug LIKE ? LIMIT 1', [wpSlug, wpSlug.replace(/-\d+$/, '') + '%']);
        }
        if (rows[0]) {
          return res.redirect(301, `/article/${rows[0].slug}`);
        }
        // No exact match — try fuzzy match on slug words
        const words = wpSlug.split('-').filter((w: string) => w.length > 4).slice(0, 3);
        if (words.length >= 2) {
          const likePattern = `%${words[0]}%${words[1]}%`;
          rows = await rawQuery<any>('SELECT slug FROM articles WHERE slug LIKE ? LIMIT 1', [likePattern]);
          if (rows[0]) {
            return res.redirect(301, `/article/${rows[0].slug}`);
          }
        }
      } catch {}
      // No article found — redirect to homepage with 301
      return res.redirect(301, '/');
    }

    // Pattern 2: WordPress /p/12345/ numeric post IDs
    const wpPostIdMatch = path.match(/^\/p\/(\d+)\/?$/);
    if (wpPostIdMatch) {
      return res.redirect(301, '/');
    }

    // Pattern 3: WordPress category URLs /category/slug/
    const wpCategoryMatch = path.match(/^\/category\/([^/]+)\/?$/);
    if (wpCategoryMatch) {
      return res.redirect(301, `/category/${wpCategoryMatch[1]}`);
    }

    // Pattern 4: WordPress tag URLs /tag/slug/
    const wpTagMatch = path.match(/^\/tag\/([^/]+)\/?$/);
    if (wpTagMatch) {
      return res.redirect(301, '/');
    }

    // Pattern 5: WordPress author URLs /author/slug/
    const wpAuthorMatch = path.match(/^\/author\/([^/]+)\/?$/);
    if (wpAuthorMatch) {
      return res.redirect(301, '/');
    }

    // Pattern 6: WordPress feed URLs
    if (path === '/feed/' || path === '/feed' || path === '/rss' || path === '/rss.xml') {
      return res.redirect(301, '/');
    }

    // Pattern 7: Bare slug at root level (e.g. /delta-flight-dl2351-emergency-landing/)
    const bareSlugMatch = path.match(/^\/([a-z0-9-]{10,})\/?$/);
    if (bareSlugMatch) {
      const bareSlug = bareSlugMatch[1];
      try {
        const { rawQuery } = await import('../db');
        const rows = await rawQuery<any>('SELECT slug FROM articles WHERE slug = ? OR wpSlug = ? LIMIT 1', [bareSlug, bareSlug]);
        if (rows[0]) {
          return res.redirect(301, `/article/${rows[0].slug}`);
        }
      } catch {}
    }

    // Pattern 8: Existing DB-stored redirects
    try {
      const redirect = await getRedirect(path);
      if (redirect) {
        return res.redirect(redirect.statusCode, redirect.newPath);
      }
    } catch {}

    // No redirect found — log the 404 for monitoring (only for paths that look like article/page URLs)
    if (path.length > 5 && !path.startsWith('/_') && !path.startsWith('/preview')) {
      try {
        const { rawQuery } = await import('../db');
        await rawQuery(
          `INSERT INTO error_404_log (path, referrer, userAgent, hitCount, firstSeen, lastSeen)
           VALUES (?, ?, ?, 1, NOW(), NOW())
           ON DUPLICATE KEY UPDATE hitCount = hitCount + 1, lastSeen = NOW()`,
          [
            path.slice(0, 999),
            (req.headers.referer || req.headers.referrer || '').toString().slice(0, 999),
            (req.headers['user-agent'] || '').toString().slice(0, 499),
          ]
        );
      } catch {}
    }
    next();
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
