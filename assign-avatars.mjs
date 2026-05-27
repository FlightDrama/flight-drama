/**
 * Assign DiceBear avatars to all dummy user accounts.
 * Uses the free DiceBear API — no key required.
 * 
 * Avatar styles used:
 * - Male-sounding names: 'adventurer' or 'avataaars' style
 * - Female-sounding names: 'avataaars' style
 * - Mix of styles for variety
 * 
 * The avatar URL is deterministic based on the seed (name),
 * so the same person always gets the same avatar.
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// DiceBear styles — varied for realism
const AVATAR_STYLES = [
  'adventurer',
  'adventurer-neutral', 
  'avataaars',
  'avataaars-neutral',
  'big-ears',
  'big-smile',
  'bottts-neutral',
  'croodles',
  'fun-emoji',
  'lorelei',
  'micah',
  'miniavs',
  'notionists',
  'open-peeps',
  'personas',
  'pixel-art',
];

// Assign specific styles to each persona for consistency
const PERSONA_STYLES = {
  "Dave Thornton":      { style: "avataaars",         bg: "b6e3f4" },
  "Sarah McAllister":   { style: "lorelei",            bg: "ffd5dc" },
  "Raj Patel":          { style: "adventurer",         bg: "c0aede" },
  "Tom Wickfield":      { style: "big-smile",          bg: "d1d4f9" },
  "Emma Fitzgerald":    { style: "personas",           bg: "ffd5dc" },
  "Marcus Webb":        { style: "open-peeps",         bg: "b6e3f4" },
  "Priya Sharma":       { style: "micah",              bg: "ffdfbf" },
  "Jake Holloway":      { style: "adventurer",         bg: "c0aede" },
  "Claire Donovan":     { style: "lorelei",            bg: "d1f9d1" },
  "Neil Forsythe":      { style: "avataaars-neutral",  bg: "b6e3f4" },
  "Liam O'Brien":       { style: "big-ears",           bg: "c0aede" },
  "Zara Ahmed":         { style: "micah",              bg: "ffd5dc" },
  "Steve Barker":       { style: "notionists",         bg: "b6e3f4" },
  "Fiona Campbell":     { style: "personas",           bg: "ffd5dc" },
  "Chris Meadows":      { style: "pixel-art",          bg: "d1d4f9" },
  "Hannah Blake":       { style: "lorelei",            bg: "ffdfbf" },
  "Andy Sutherland":    { style: "adventurer",         bg: "b6e3f4" },
  "Mia Kowalski":       { style: "fun-emoji",          bg: "ffd5dc" },
  "Dan Fletcher":       { style: "avataaars",          bg: "c0aede" },
  "Olivia Marsh":       { style: "micah",              bg: "d1f9d1" },
  "Ben Hargreaves":     { style: "open-peeps",         bg: "b6e3f4" },
  "Tanya Morrison":     { style: "personas",           bg: "ffd5dc" },
  "Phil Rawlings":      { style: "croodles",           bg: "d1d4f9" },
  "Aisha Okonkwo":      { style: "adventurer",         bg: "ffdfbf" },
  "Rob Sinclair":       { style: "big-smile",          bg: "b6e3f4" },
  "Kate Williamson":    { style: "lorelei",            bg: "ffd5dc" },
  "James Thornbury":    { style: "avataaars",          bg: "c0aede" },
  "Sophie Laurent":     { style: "personas",           bg: "ffd5dc" },
  "Mike Doherty":       { style: "adventurer",         bg: "d1d4f9" },
  "Natalie Cross":      { style: "micah",              bg: "ffdfbf" },
};

// Get all dummy users
const [users] = await conn.execute(
  "SELECT id, name, openId FROM users WHERE openId LIKE 'dummy-%'"
);

console.log(`\n✈ Assigning avatars to ${users.length} dummy accounts...\n`);

let updated = 0;

for (const user of users) {
  const config = PERSONA_STYLES[user.name];
  if (!config) {
    console.log(`  [SKIP] No config for: ${user.name}`);
    continue;
  }

  // DiceBear v9 URL format — deterministic based on seed
  const seed = encodeURIComponent(user.name.toLowerCase().replace(/\s+/g, '-'));
  const avatarUrl = `https://api.dicebear.com/9.x/${config.style}/svg?seed=${seed}&backgroundColor=${config.bg}&radius=50`;

  await conn.execute(
    "UPDATE users SET avatar = ? WHERE id = ?",
    [avatarUrl, user.id]
  );

  console.log(`  ✅ ${user.name} → ${config.style}`);
  updated++;
}

console.log(`\n════════════════════════════════════════`);
console.log(`✅ Avatars assigned: ${updated}`);
console.log(`\n🎉 Done!\n`);

await conn.end();
