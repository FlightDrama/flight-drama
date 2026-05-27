/**
 * Flight Drama — Custom Email/Password Authentication
 * =====================================================
 * Provides register, login, email verification, and password reset
 * alongside the existing Manus OAuth flow.
 *
 * Users created here get openId = "local_<email>" and loginMethod = "email".
 * Session management reuses the existing SDK cookie infrastructure.
 */

import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { getSessionCookieOptions } from "./_core/cookies";
import { rawQuery } from "./db";
import { COOKIE_NAME } from "@shared/const";
import { ENV } from "./_core/env";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "noreply@flightdrama.com";
const FROM_NAME = "Flight Drama";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

async function getUserByEmail(email: string) {
  const rows = await rawQuery<any>(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email.toLowerCase()]
  );
  return rows[0] ?? null;
}

async function sendVerificationEmail(email: string, name: string, token: string, origin: string) {
  const link = `${origin}/verify-email?token=${token}`;
  await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: "Verify your Flight Drama account ✈",
    html: `
      <div style="background:#0a0a0a;padding:40px 20px;font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#F5C518;padding:12px 20px;margin-bottom:24px;">
          <span style="font-size:18px;font-weight:900;color:#000;letter-spacing:2px;">✈ FLIGHT DRAMA</span>
        </div>
        <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0 0 12px;">Welcome aboard, ${name || "Aviator"}!</h1>
        <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 24px;">
          You're one step away from joining the Flight Drama community. Click the button below to verify your email address.
        </p>
        <a href="${link}" style="display:inline-block;background:#F5C518;color:#000;font-weight:900;font-size:14px;padding:14px 28px;text-decoration:none;letter-spacing:1px;">
          VERIFY EMAIL ADDRESS →
        </a>
        <p style="color:#4b5563;font-size:12px;margin:24px 0 0;">
          This link expires in 24 hours. If you didn't create an account, you can ignore this email.
        </p>
        <p style="color:#374151;font-size:11px;margin:8px 0 0;">
          Or copy this link: <span style="color:#F5C518;">${link}</span>
        </p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(email: string, token: string, origin: string) {
  const link = `${origin}/reset-password?token=${token}`;
  await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: "Reset your Flight Drama password",
    html: `
      <div style="background:#0a0a0a;padding:40px 20px;font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#F5C518;padding:12px 20px;margin-bottom:24px;">
          <span style="font-size:18px;font-weight:900;color:#000;letter-spacing:2px;">✈ FLIGHT DRAMA</span>
        </div>
        <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0 0 12px;">Password Reset Request</h1>
        <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 24px;">
          We received a request to reset your password. Click the button below to set a new one. This link expires in 1 hour.
        </p>
        <a href="${link}" style="display:inline-block;background:#F5C518;color:#000;font-weight:900;font-size:14px;padding:14px 28px;text-decoration:none;letter-spacing:1px;">
          RESET PASSWORD →
        </a>
        <p style="color:#4b5563;font-size:12px;margin:24px 0 0;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const customAuthRouter = router({
  // Register a new account
  register: publicProcedure
    .input(z.object({
      email: z.string().email().toLowerCase(),
      password: z.string().min(8, "Password must be at least 8 characters"),
      name: z.string().min(1).max(100),
      origin: z.string().url(),
    }))
    .mutation(async ({ input, ctx }) => {
      const existing = await getUserByEmail(input.email);
      if (existing) {
        // Email enumeration prevention — always return success
        return { success: true, message: "If this email is new, a verification link has been sent." };
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const verifyToken = randomToken();
      const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
      const openId = `local_${input.email}`;

      await rawQuery(
        `INSERT INTO users (openId, name, email, loginMethod, role, passwordHash, emailVerified, emailVerifyToken, emailVerifyExpiry, createdAt, updatedAt, lastSignedIn)
         VALUES (?, ?, ?, 'email', 'user', ?, 0, ?, ?, NOW(), NOW(), NOW())`,
        [openId, input.name, input.email, passwordHash, verifyToken, verifyExpiry]
      );

      // Send verification email (best-effort — don't fail registration if email fails)
      try {
        await sendVerificationEmail(input.email, input.name, verifyToken, input.origin);
      } catch (e) {
        console.error("[CustomAuth] Verification email failed:", e);
      }

      return { success: true, message: "Account created! Check your email to verify your account." };
    }),

  // Verify email address
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const rows = await rawQuery<any>(
        "SELECT * FROM users WHERE emailVerifyToken = ? AND emailVerifyExpiry > NOW() LIMIT 1",
        [input.token]
      );
      const user = rows[0];
      if (!user) throw new Error("INVALID_OR_EXPIRED_TOKEN");

      await rawQuery(
        "UPDATE users SET emailVerified = 1, emailVerifyToken = NULL, emailVerifyExpiry = NULL WHERE id = ?",
        [user.id]
      );

      // Auto sign-in after verification
      const sessionToken = await sdk.signSession({ openId: user.openId, appId: ENV.appId, name: user.name ?? '' });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

      return { success: true, message: "Email verified! You are now signed in." };
    }),

  // Login with email + password
  login: publicProcedure
    .input(z.object({
      email: z.string().email().toLowerCase(),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await getUserByEmail(input.email);
      if (!user || !user.passwordHash) throw new Error("INVALID_CREDENTIALS");

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) throw new Error("INVALID_CREDENTIALS");

      if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED");

      // Update last signed in
      await rawQuery("UPDATE users SET lastSignedIn = NOW() WHERE id = ?", [user.id]);

      const sessionToken = await sdk.signSession({ openId: user.openId, appId: ENV.appId, name: user.name ?? '' });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),

  // Resend verification email
  resendVerification: publicProcedure
    .input(z.object({ email: z.string().email().toLowerCase(), origin: z.string().url() }))
    .mutation(async ({ input }) => {
      const user = await getUserByEmail(input.email);
      if (!user || user.emailVerified) {
        return { success: true }; // Enumeration prevention
      }
      const token = randomToken();
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await rawQuery(
        "UPDATE users SET emailVerifyToken = ?, emailVerifyExpiry = ? WHERE id = ?",
        [token, expiry, user.id]
      );
      try { await sendVerificationEmail(input.email, user.name ?? "", token, input.origin); } catch {}
      return { success: true };
    }),

  // Request password reset
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email().toLowerCase(), origin: z.string().url() }))
    .mutation(async ({ input }) => {
      const user = await getUserByEmail(input.email);
      if (!user) return { success: true }; // Enumeration prevention

      const token = randomToken();
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await rawQuery(
        "UPDATE users SET passwordResetToken = ?, passwordResetExpiry = ?, passwordResetUsed = 0 WHERE id = ?",
        [token, expiry, user.id]
      );
      try { await sendPasswordResetEmail(input.email, token, input.origin); } catch {}
      return { success: true };
    }),

  // Reset password with token
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string(),
      password: z.string().min(8),
    }))
    .mutation(async ({ input }) => {
      const rows = await rawQuery<any>(
        "SELECT * FROM users WHERE passwordResetToken = ? AND passwordResetExpiry > NOW() AND passwordResetUsed = 0 LIMIT 1",
        [input.token]
      );
      const user = rows[0];
      if (!user) throw new Error("INVALID_OR_EXPIRED_TOKEN");

      const passwordHash = await bcrypt.hash(input.password, 12);
      await rawQuery(
        "UPDATE users SET passwordHash = ?, passwordResetToken = NULL, passwordResetUsed = 1 WHERE id = ?",
        [passwordHash, user.id]
      );
      return { success: true, message: "Password updated. You can now sign in." };
    }),

  // Upload/update profile avatar
  updateAvatar: protectedProcedure
    .input(z.object({ avatarUrl: z.string().url().max(2000) }))
    .mutation(async ({ input, ctx }) => {
      await rawQuery("UPDATE users SET avatar = ? WHERE id = ?", [input.avatarUrl, ctx.user.id]);
      return { success: true, avatarUrl: input.avatarUrl };
    }),
});
