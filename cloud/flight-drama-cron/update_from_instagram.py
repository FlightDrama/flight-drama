#!/usr/bin/env python3
"""
Parse Instagram images and update article featured images.
Uses the alt text from Instagram posts to match to articles.
"""
import re
import json
import os
import sys
import mysql.connector

# Read the Instagram console output
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ig_console_output.txt')) as f:
    content = f.read()

# Parse the JSON - the file is a JSON-encoded string
# First try to decode as a JSON string (outer quotes)
try:
    decoded = json.loads(content.strip())
    ig_images = json.loads(decoded)
except:
    # Fall back to finding the array directly
    inner = content.strip()
    if inner.startswith('"'):
        inner = inner[1:]
    if inner.endswith('"'):
        inner = inner[:-1]
    # Unescape
    inner = inner.replace('\\"', '"').replace('\\/', '/').replace('\\u0026', '&').replace('\\u003c', '<').replace('\\u003e', '>')
    start = inner.find('[{')
    if start == -1:
        print('No JSON found')
        sys.exit(1)
    json_str = inner[start:]
    if not json_str.rstrip().endswith(']'):
        last = json_str.rfind('},')
        if last > 0:
            json_str = json_str[:last+1] + ']'
        else:
            json_str += ']'
    ig_images = json.loads(json_str)

print(f"Parsed {len(ig_images)} Instagram images")

# Build headline -> URL mapping from Instagram
ig_map = {}
for item in ig_images:
    alt = item.get('alt', '')
    src = item.get('src', '')
    
    # Extract headline from alt text
    patterns = [
        r"says '([^']{20,200})'",
        r'says "([^"]{20,200})"',
        r'FLIGHT DRAMA\s+([A-Z][^.\'"\n]{15,200})',
    ]
    
    headline = ''
    for pat in patterns:
        m = re.search(pat, alt, re.IGNORECASE)
        if m:
            text = m.group(1)
            # Extract the actual headline after FLIGHT DRAMA
            fd_match = re.search(r'FLIGHT DRAMA\s+(.+)', text, re.IGNORECASE)
            if fd_match:
                headline = fd_match.group(1).strip()
            else:
                headline = text.strip()
            break
    
    if not headline:
        headline = alt[:100]
    
    # Clean up headline
    headline = re.sub(r'\s+', ' ', headline).strip()
    headline = headline.lower()
    
    if len(headline) > 10:
        ig_map[headline] = src
        print(f"  IG: {headline[:80]}")

print(f"\nExtracted {len(ig_map)} Instagram image mappings")

# Original IG headlines (our bridge)
IG_HEADLINES = [
    "Emirates Cabin Crew Salaries Have Gone Viral, And People Can't Agree If They're Good",
    "The FAA Says Parts Could Separate From Some Boeing 747s During Flight",
    "Delta Air Lines Is Returning To Hong Kong After A Seven-Year Absence",
    "Want To Be A Flight Attendant? Delta Is Hiring Again",
    "A 72-Year-Old Woman Survived The Flight But Died While Disembarking The Aircraft",
    "Seventeen Years After Flight 447 Killed 228 People, Airbus And Air France Were Found Guilty",
    "Delta Backed This Aircraft Project, It Collapsed Before Building A Single Plane",
    "Should Airline Pilots Be Allowed To Fly Passengers Until 67?",
    "Delta's New Premium Suites Were Supposed To Redefine Domestic Travel, They Never Fly",
    "FAA And NTSB Clash Over Deadly Flight 5342 Crash Investigation",
    "An American Airlines Jet Hit The End Of The Runway At Over 100 MPH",
    "Swiss Is Breaking Up Entire Airbus Jets To Keep The Rest Of The Fleet Flying",
    "Lufthansa's New Boeing 777X Is Flying, But Passengers Still Can't Board It",
    "Passenger Speaking Russian Tried Repeatedly To Reach The Cockpit, Forcing United Flight To Divert",
    "Qatar Airways Made Nearly $2 Billion, Then Cancelled Staff Bonuses",
    "Delta Has Reopened Applications For One Of Aviation's Most Competitive Jobs",
    "A Mystery Odor On A Frontier Flight Left Seven Passengers Feeling Unwell",
    "An Airbus A350 Can Look Perfectly Fine And Still Be Too Damaged To Fly",
    "American Airlines Could Keep Most Of Your Money Even If You're Downgraded From Business Class",
    "A Delta First Officer Was Killed In A Helicopter Crash Hours After His Wedding",
    "For The First Time Ever, Boeing Is Building 737s Outside Renton",
    "Seven Years After Pulling Out, Delta Is Returning To The Los Angeles-Vancouver Market",
    "For The First Time Since 1994, United Airlines Is Flying To St. Croix Again",
    "United Passenger Paid $7,400 For Business Class And Spent 14 Hours Sitting Flat",
]

def word_overlap(a, b):
    wa = set(re.findall(r'\b\w{4,}\b', a.lower()))
    wb = set(re.findall(r'\b\w{4,}\b', b.lower()))
    if not wa or not wb: return 0
    return len(wa & wb) / max(len(wa), len(wb))

# Match IG headlines to IG image URLs
ig_headline_to_url = {}
for ig_h in IG_HEADLINES:
    best_score = 0
    best_url = None
    for ig_img_h, url in ig_map.items():
        score = word_overlap(ig_h, ig_img_h)
        if score > best_score:
            best_score = score
            best_url = url
    if best_url and best_score > 0.2:
        ig_headline_to_url[ig_h] = best_url
        print(f"✅ IG match ({best_score:.2f}): {ig_h[:60]}")
    else:
        print(f"❌ No IG match: {ig_h[:60]} ({best_score:.2f})")

print(f"\nMatched {len(ig_headline_to_url)} IG headlines to images")

# Connect to DB
env_path = '/home/ubuntu/flight-drama-cron/.env'
env_vars = {}
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env_vars[k.strip()] = v.strip()

db_url = env_vars.get('DATABASE_URL', '')
m = re.match(r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)', db_url)
user, password, host, port, database = m.groups()
database = database.split('?')[0]

conn = mysql.connector.connect(
    host=host, port=int(port), user=user, password=password,
    database=database, ssl_verify_cert=False
)
cursor = conn.cursor(dictionary=True)

# Get recently created articles (last 3 hours)
cursor.execute("""
    SELECT id, title, slug, featuredImage 
    FROM articles 
    WHERE createdAt > DATE_SUB(NOW(), INTERVAL 3 HOUR)
    ORDER BY id DESC
""")
recent_articles = cursor.fetchall()
print(f"\nFound {len(recent_articles)} recent articles")

updated = 0
for article in recent_articles:
    title = article['title']
    article_id = article['id']
    
    # Find best matching IG headline
    best_ig = None
    best_score = 0
    for ig_h in IG_HEADLINES:
        score = word_overlap(title, ig_h)
        if score > best_score:
            best_score = score
            best_ig = ig_h
    
    if best_ig and best_score > 0.1 and best_ig in ig_headline_to_url:
        img_url = ig_headline_to_url[best_ig]
        print(f"\n✅ {title[:60]}")
        print(f"   → {img_url[:80]}")
        cursor.execute(
            "UPDATE articles SET featuredImage = %s WHERE id = %s",
            (img_url, article_id)
        )
        conn.commit()
        updated += 1
    else:
        print(f"\n❌ No image: {title[:60]}")

cursor.close()
conn.close()
print(f"\n=== Done: {updated} articles updated ===")
