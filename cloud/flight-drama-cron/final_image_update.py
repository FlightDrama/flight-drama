#!/usr/bin/env python3
"""Final direct SQL update for the 5 remaining articles."""
import re
import os
import mysql.connector

# Lufthansa 777X image found
LUFTHANSA_777X = "https://scontent-iad3-1.cdninstagram.com/v/t51.82787-15/713184792_18102440576323259_4932005686755815447_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=101&ig_cache_key=MzkxMDU5MTA3MDAyNjAxMDA2Mg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=iOUlxefrhQgQ7kNvwFp93x5&_nc_oc=AdrYim4bhgrkHs__pm3Qjs39JnK0xvg4CaMnyEtEEFJ2qIPxCQ-77wOLRvXJAgLufy0&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_gid=VIP2oSbsU-z0wOlK8L3r7A&_nc_ss=7a22e&oh=00_Af-2_TQE9FzNEsBC8unyxrZ99gsHsHHkuT1TRdvfZ3TLTQ&oe=6A25A814"

# Delta premium suites image found
DELTA_PREMIUM = "https://scontent-iad3-1.cdninstagram.com/v/t51.82787-15/714774748_18102446420323259_7668470444071479240_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=101&ig_cache_key=MzkxMDYyMzY1Njc3MzMwODY3OQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=_2Oxi_plCbkQ7kNvwE_jaxQ&_nc_oc=AdoHMBHok2UQavYj1T4L3pX2zOtR2xb6umOIsIMd41uu-PGK2fqt7JTCG4_sWCFz2Oc&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_gid=cOkD1Wt-D3AwxbEdPps19Q&_nc_ss=7a22e&oh=00_Af89wiKOyZx41hiiHlwCFk4FGKyooLGxnUWj9ip4b-CGbQ&oe=6A25D7B6"

# Emirates cabin crew - use the first image (Emirates A380 visible in screenshot)
EMIRATES_CABIN = "https://scontent-iad3-1.cdninstagram.com/v/t51.82787-15/715338417_18102520055323259_460776042159158836_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=101&ig_cache_key=MzkxMTExNzQ3MzE4ODM1MTQwOQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=yLxeZqApOzUQ7kNvwH08gvh&_nc_oc=AdrHS-wuJq5S6318ZgR8KVwDVZOH-Ns1TEPLtxTWCirUVs9jwM1uDXmSkc5faQtx1pU&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_gid=cOkD1Wt-D3AwxbEdPps19Q&_nc_ss=7a22e&oh=00_Af9spqbburi2tni93u3OoRjXNdMG_p_BQi-jNNfMaRpqmQ&oe=6A25D0C4"

# For Delta backed aircraft project and Delta hiring - use Delta-related images
DELTA_PROJECT = "https://scontent-iad3-1.cdninstagram.com/v/t51.82787-15/714631429_18102491165323259_9109903954778890082_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=101&ig_cache_key=MzkxMDg4NjcyOTgyMDA2MTAxNg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=AhBPcB5FqA8Q7kNvwF6gALF&_nc_oc=AdpwAiTwGhHsK7NGXptkzf6e8WvPe1ojZ3-ChMbgE0Ss85_oHQj7fYpAO1XyZESUfQQ&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_gid=cOkD1Wt-D3AwxbEdPps19Q&_nc_ss=7a22e&oh=00_Af8f4-0RrcWncZFZBberG-20sPcekiz_zD3TL_nG0LktRw&oe=6A25AD58"

DIRECT_UPDATES = [
    ("lufthansa.*777|shiny.*777", LUFTHANSA_777X),
    ("dream-seats|premium-suites", DELTA_PREMIUM),
    ("emirates-cabin-crew", EMIRATES_CABIN),
    ("delta.*big-bet|aircraft.*project.*belly|belly.*up", DELTA_PROJECT),
    ("golden-ticket|reopened.*applications|most-competitive", "https://scontent-iad3-1.cdninstagram.com/v/t51.82787-15/714631430_18102491144323259_5801318275541383987_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=101&ig_cache_key=MzkxMDg4NjU2ODAxMjAzMTA0MA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=ge8z6nAM1QgQ7kNvwEOryBs&_nc_oc=Adr2hqc1ArqCI1OrXlX1vCfujR_ZW1Q8uYCp6iDnO2-O0Bv1sDri4diTRO9ioOzdzyw&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_gid=cOkD1Wt-D3AwxbEdPps19Q&_nc_ss=7a22e&oh=00_Af-HeTUn1ts5WBkCtWuN5xeDK5e77KbXSqUF-fNgs3U4eA&oe=6A25D3B0"),
]

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

conn = mysql.connector.connect(host=host, port=int(port), user=user, password=password, database=database, ssl_verify_cert=False)
cursor = conn.cursor(dictionary=True)

cursor.execute("SELECT id, title, slug, featuredImage FROM articles WHERE createdAt > DATE_SUB(NOW(), INTERVAL 3 HOUR) ORDER BY id DESC")
recent_articles = cursor.fetchall()

updated = 0
for article in recent_articles:
    slug = article['slug']
    title = article['title']
    article_id = article['id']
    current_img = article.get('featuredImage', '')
    
    # Skip if already has a good Instagram/Facebook image
    if current_img and ('cdninstagram' in current_img or 'fbcdn' in current_img):
        continue
    
    for pattern, img_url in DIRECT_UPDATES:
        if re.search(pattern, slug, re.IGNORECASE) or re.search(pattern, title, re.IGNORECASE):
            print(f"✅ {title[:60]}")
            cursor.execute("UPDATE articles SET featuredImage = %s WHERE id = %s", (img_url, article_id))
            conn.commit()
            updated += 1
            break

cursor.close()
conn.close()
print(f"\n=== Done: {updated} articles updated ===")
