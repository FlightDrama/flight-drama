/**
 * Avatar upload endpoint — accepts multipart form data,
 * uploads to Manus S3 storage, updates user record.
 */
import { Request, Response } from "express";
import { storagePut } from "../storage";

export async function handleAvatarUpload(req: Request, res: Response) {
  try {
    // The file is attached as req.file via multer (configured in index.ts)
    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: "No file provided" });

    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: "Only JPEG, PNG, WebP, and GIF images are allowed" });
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "Image must be under 5MB" });
    }

    const ext = file.mimetype.split("/")[1].replace("jpeg", "jpg");
    const key = `avatars/user-${user.id}-${Date.now()}.${ext}`;
    const { url } = await storagePut(key, file.buffer, file.mimetype);

    // Update user avatar in DB
    const { rawQuery } = await import("../db");
    await rawQuery("UPDATE users SET avatar = ? WHERE id = ?", [url, user.id]);

    return res.json({ success: true, avatarUrl: url });
  } catch (e: any) {
    console.error("[AvatarUpload] Error:", e);
    return res.status(500).json({ error: e.message });
  }
}
