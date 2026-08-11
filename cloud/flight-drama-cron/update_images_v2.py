#!/usr/bin/env python3
"""
Match Facebook images to articles using the original Instagram headlines as bridge.
The Instagram headlines are the source of truth — we match them to both the FB images
and the article slugs/content.
"""
import re
import json
import os
import sys
import mysql.connector

# Original Instagram headlines (from our scraping session)
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

# Facebook image headlines (from our scraping)
FB_HEADLINES_TO_URLS = {}
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fb_images_parsed.json')) as f:
    fb_data = json.load(f)

for item in fb_data:
    alt = item.get('alt', '')
    src = item.get('src', '')
    
    # Extract headline from alt
    patterns = [
        r'FLIGHT DRAMA\s+([A-Z][A-Z\s\d\'\-\,\.\!\?]+?)(?:\s+[A-Z][a-z]|\s+The\s|\s+After\s|\s+This\s|\s+It\s|")',
        r'"FLIGHT DRAMA\s+([^"]{10,200})"',
    ]
    headline = ''
    for pat in patterns:
        m = re.search(pat, alt, re.IGNORECASE)
        if m:
            headline = m.group(1).strip().lower()
            break
    
    if not headline:
        headline = item.get('headline', '').lower()
    
    if headline and len(headline) > 10:
        FB_HEADLINES_TO_URLS[headline] = src

print(f"FB image headlines: {len(FB_HEADLINES_TO_URLS)}")

def word_overlap_score(a, b):
    """Score word overlap between two strings."""
    words_a = set(re.findall(r'\b\w{4,}\b', a.lower()))
    words_b = set(re.findall(r'\b\w{4,}\b', b.lower()))
    if not words_a or not words_b:
        return 0
    overlap = len(words_a & words_b)
    return overlap / max(len(words_a), len(words_b))

# Build mapping: IG headline -> best FB image URL
ig_to_fb_url = {}
for ig_headline in IG_HEADLINES:
    best_score = 0
    best_url = None
    best_fb_headline = None
    
    for fb_headline, url in FB_HEADLINES_TO_URLS.items():
        score = word_overlap_score(ig_headline, fb_headline)
        if score > best_score:
            best_score = score
            best_url = url
            best_fb_headline = fb_headline
    
    if best_url and best_score > 0.15:
        ig_to_fb_url[ig_headline] = {'url': best_url, 'score': best_score, 'fb_headline': best_fb_headline}
        print(f"✅ Match ({best_score:.2f}): {ig_headline[:60]}")
        print(f"   FB: {best_fb_headline[:60]}")
    else:
        print(f"❌ No FB match for: {ig_headline[:60]} (best: {best_score:.2f})")

print(f"\nMatched {len(ig_to_fb_url)} of {len(IG_HEADLINES)} IG headlines to FB images")

# Now connect to DB and match IG headlines to article slugs
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
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

# Get recently created articles
cursor.execute("""
    SELECT id, title, slug, featuredImage 
    FROM articles 
    WHERE createdAt > DATE_SUB(NOW(), INTERVAL 3 HOUR)
    ORDER BY id DESC
""")
recent_articles = cursor.fetchall()
print(f"\nFound {len(recent_articles)} recent articles")

# Match articles to IG headlines, then to FB images
updated = 0
for article in recent_articles:
    title = article['title']
    article_id = article['id']
    
    best_ig_headline = None
    best_score = 0
    
    for ig_headline in IG_HEADLINES:
        score = word_overlap_score(title, ig_headline)
        if score > best_score:
            best_score = score
            best_ig_headline = ig_headline
    
    if best_ig_headline and best_score > 0.1 and best_ig_headline in ig_to_fb_url:
        fb_info = ig_to_fb_url[best_ig_headline]
        print(f"\n✅ Article: {title[:60]}")
        print(f"   IG: {best_ig_headline[:60]} ({best_score:.2f})")
        print(f"   FB URL: {fb_info['url'][:80]}")
        
        cursor.execute(
            "UPDATE articles SET featuredImage = %s WHERE id = %s",
            (fb_info['url'], article_id)
        )
        conn.commit()
        updated += 1
    else:
        print(f"\n❌ No match: {title[:60]} (score: {best_score:.2f})")

cursor.close()
conn.close()
print(f"\n=== Done: {updated} articles updated ===")
