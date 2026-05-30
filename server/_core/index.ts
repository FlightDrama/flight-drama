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

  // SEO 301 redirect handler — resolves old WordPress URLs
  app.use(async (req, res, next) => {
    const path = req.path;
    if (path.startsWith("/api") || path.startsWith("/manus-storage") || path.includes(".")) return next();
    try {
      const redirect = await getRedirect(path);
      if (redirect) {
        return res.redirect(redirect.statusCode, redirect.newPath);
      }
    } catch {}
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
