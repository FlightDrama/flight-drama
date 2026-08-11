#!/usr/bin/env python3
"""
Download Flight Drama Facebook images and update article featured images.
Matches Facebook post headlines to article titles in the database.
"""
import re
import json
import urllib.request
import urllib.error
import os
import subprocess
import sys
import time

# Load the parsed Facebook images
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fb_images_parsed.json')) as f:
    fb_images = json.load(f)

print(f"Loaded {len(fb_images)} Facebook images")

# Build a list of (headline, url) pairs with clean headlines
image_map = []
for item in fb_images:
    alt = item.get('alt', '')
    src = item.get('src', '')
    headline = item.get('headline', '')
    
    # Try to extract clean headline from alt text
    patterns = [
        r'FLIGHT DRAMA\s+([A-Z][A-Z\s\d\'\-\,\.\!\?]+?)(?:\s+[A-Z][a-z]|\s+The\s|\s+After\s|\s+This\s|\s+It\s|")',
        r'"FLIGHT DRAMA\s+([^"]{10,150})"',
        r'FLIGHT DRAMA\s+([A-Z].{10,150}?)(?=\s+[A-Z][a-z]|$)',
    ]
    
    clean_headline = headline
    for pat in patterns:
        m = re.search(pat, alt, re.IGNORECASE)
        if m:
            clean_headline = m.group(1).strip()
            # Remove trailing incomplete words
            clean_headline = re.sub(r'\s+[A-Z]{1,3}$', '', clean_headline).strip()
            break
    
    if not clean_headline or len(clean_headline) < 10:
        # Extract from alt directly
        m = re.search(r'says?\s+"([^"]{20,200})"', alt)
        if m:
            text = m.group(1)
            fd_match = re.search(r'FLIGHT DRAMA\s+(.+)', text)
            if fd_match:
                clean_headline = fd_match.group(1)[:150].strip()
    
    if clean_headline and len(clean_headline) > 10:
        image_map.append({
            'headline': clean_headline.lower(),
            'src': src,
            'original_headline': clean_headline
        })

print(f"\nExtracted {len(image_map)} usable image mappings")

# Now connect to the database and match articles
import mysql.connector
from dotenv import load_dotenv

# Load env
env_path = '/home/ubuntu/flight-drama-cron/.env'
env_vars = {}
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env_vars[k.strip()] = v.strip()

db_url = env_vars.get('DATABASE_URL', '')

# Parse MySQL URL: mysql://user:pass@host:port/dbname?...
m = re.match(r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)', db_url)
if not m:
    print(f"Could not parse DATABASE_URL: {db_url[:50]}")
    sys.exit(1)

user, password, host, port, database = m.groups()
database = database.split('?')[0]

print(f"\nConnecting to {host}:{port}/{database}...")

try:
    conn = mysql.connector.connect(
        host=host, port=int(port), user=user, password=password,
        database=database, ssl_ca=None, ssl_disabled=False,
        ssl_verify_cert=False
    )
    cursor = conn.cursor(dictionary=True)
    print("Connected!")
except Exception as e:
    print(f"Connection error: {e}")
    # Try without SSL
    try:
        conn = mysql.connector.connect(
            host=host, port=int(port), user=user, password=password,
            database=database
        )
        cursor = conn.cursor(dictionary=True)
        print("Connected (no SSL)!")
    except Exception as e2:
        print(f"Still failed: {e2}")
        sys.exit(1)

# Get all articles that were recently created (the 24 new ones)
cursor.execute("""
    SELECT id, title, slug, featuredImage 
    FROM articles 
    WHERE createdAt > DATE_SUB(NOW(), INTERVAL 2 HOUR)
    ORDER BY id DESC
""")
recent_articles = cursor.fetchall()
print(f"\nFound {len(recent_articles)} recently created articles")

# Match each article to a Facebook image
updated = 0
no_match = 0

for article in recent_articles:
    title = article['title'].lower()
    article_id = article['id']
    
    best_match = None
    best_score = 0
    
    for img in image_map:
        img_headline = img['headline'].lower()
        
        # Score based on word overlap
        title_words = set(re.findall(r'\b\w{4,}\b', title))
        headline_words = set(re.findall(r'\b\w{4,}\b', img_headline))
        
        if not title_words or not headline_words:
            continue
        
        overlap = len(title_words & headline_words)
        score = overlap / max(len(title_words), len(headline_words))
        
        if score > best_score:
            best_score = score
            best_match = img
    
    if best_match and best_score > 0.25:
        print(f"\n✅ Match (score={best_score:.2f}):")
        print(f"   Article: {article['title'][:70]}")
        print(f"   FB Image: {best_match['original_headline'][:70]}")
        print(f"   URL: {best_match['src'][:80]}")
        
        # Update the article's featuredImage
        cursor.execute(
            "UPDATE articles SET featuredImage = %s WHERE id = %s",
            (best_match['src'], article_id)
        )
        conn.commit()
        updated += 1
    else:
        print(f"\n❌ No match for: {article['title'][:70]} (best score: {best_score:.2f})")
        no_match += 1

cursor.close()
conn.close()

print(f"\n=== Done: {updated} articles updated, {no_match} unmatched ===")
