#!/usr/bin/env python3
"""
Direct SQL update for article images using Instagram URLs extracted from page markdown.
"""
import re
import json
import os
import sys
import mysql.connector

# These are the Instagram image URLs extracted from the page markdown
# Mapped to the article slugs they match
DIRECT_UPDATES = [
    # (article_slug_pattern, instagram_image_url)
    # Emirates cabin crew salaries
    ("emirates-cabin-crew", "https://scontent-iad3-1.cdninstagram.com/v/t51.82787-15/715338417_18102520055323259_460776042159158836_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=101&ig_cache_key=MzkxMTExNzQ3MzE4ODM1MTQwOQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=yLxeZqApOzUQ7kNvwG-sUoj&_nc_oc=AdrHS-wuJq5S6318ZgR8KVwDVZOH-Ns1TEPLtxTWCirUVs9jwM1uDXmSkc5faQtx1pU&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_gid=cOkD1Wt-D3AwxbEdPps19Q&_nc_ss=7a22e&oh=00_Af9spqbburi2tni93u3OoRjXNdMG_p_BQi-jNNfMaRpqmQ&oe=6A25D0C4"),
    # FAA Boeing 747
    ("faa-warns-parts-could", "https://scontent-iad3-2.cdninstagram.com/v/t51.82787-15/714104539_18102491180323259_5899172197192726067_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=103&ig_cache_key=MzkxMDg4Njk0MDAwNDk5NjQ1Nw%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=X4GJRUxqjYoQ7kNvwFf4VXI&_nc_oc=AdovrtkLg8IFU11ge9q8mX-ZnNkLA0pPngYG9FJ53nVmaP7GL-PJPSAqHLfGQTf0zyg&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad3-2.cdninstagram.com&_nc_gid=cOkD1Wt-D3AwxbEdPps19Q&_nc_ss=7a22e&oh=00_Af_oyqWdru46iitf5J37f9-JezrEsOcgDncF_V3J87AskA&oe=6A25D111"),
    # Delta Hong Kong
    ("delta.*hong-kong", "https://scontent-iad3-1.cdninstagram.com/v/t51.82787-15/714631429_18102491165323259_9109903954778890082_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=101&ig_cache_key=MzkxMDg4NjcyOTgyMDA2MTAxNg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=AhBPcB5FqA8Q7kNvwF6gALF&_nc_oc=AdpwAiTwGhHsK7NGXptkzf6e8WvPe1ojZ3-ChMbgE0Ss85_oHQj7fYpAO1XyZESUfQQ&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_gid=cOkD1Wt-D3AwxbEdPps19Q&_nc_ss=7a22e&oh=00_Af8f4-0RrcWncZFZBberG-20sPcekiz_zD3TL_nG0LktRw&oe=6A25AD58"),
    # Delta hiring flight attendant
    ("delta.*recruiting-cabin|delta.*hiring", "https://scontent-iad3-1.cdninstagram.com/v/t51.82787-15/714631430_18102491144323259_5801318275541383987_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=101&ig_cache_key=MzkxMDg4NjU2ODAxMjAzMTA0MA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=ge8z6nAM1QgQ7kNvwEOryBs&_nc_oc=Adr2hqc1ArqCI1OrXlX1vCfujR_ZW1Q8uYCp6iDnO2-O0Bv1sDri4diTRO9ioOzdzyw&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_gid=cOkD1Wt-D3AwxbEdPps19Q&_nc_ss=7a22e&oh=00_Af-HeTUn1ts5WBkCtWuN5xeDK5e77KbXSqUF-fNgs3U4eA&oe=6A25D3B0"),
    # 72-year-old woman died disembarking
    ("passenger-dies-disembarking|72-year", "https://scontent-iad3-1.cdninstagram.com/v/t51.82787-15/715419331_18102473816323259_1545865265595106498_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=101&ig_cache_key=MzkxMDc3ODA5NzIxMjExNzMzNQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=P1jNnq30KfsQ7kNvwFjczK-&_nc_oc=AdoHltVdsYQ5sKB-cMGOCXsnUSrAe4igp3F8EGn5-JHVNJqE955pa8eptkWLaWDPaYQ&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_gid=cOkD1Wt-D3AwxbEdPps19Q&_nc_ss=7a22e&oh=00_Af_B6W7i7wyOjPCK8yHrZRMDqdwn55ySrG85WwEvuzRBYQ&oe=6A25B299"),
    # Air France 447 guilty
    ("airbus-air-france-found-guilty|justice-served", "https://scontent-iad6-1.cdninstagram.com/v/t51.82787-15/714652375_18102473798323259_1583133231991534656_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=102&ig_cache_key=MzkxMDc3NzkyNTE2MTk0NjI0OQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=wJYwbBDR9MYQ7kNvwFX1LPF&_nc_oc=AdpKHaWcSCpT8nJ_PgUulpdojjmfJUUWqDIiwMHk5VYPVwglXW2CzW1MJKVI9_9OGds&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad6-1.cdninstagram.com&_nc_gid=cOkD1Wt-D3AwxbEdPps19Q&_nc_ss=7a22e&oh=00_Af-7fPeGZYtruw2bJJJO0xhrXEpacAUcbyf7nj820Lohpw&oe=6A25D220"),
    # Pilot retirement age 67
    ("pilot-retirement|aged-out|67", "https://scontent-iad3-2.cdninstagram.com/v/t51.82787-15/714466196_18102446588323259_2965994650519736502_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=103&ig_cache_key=MzkxMDYyNDA1NjI4OTE4OTU5Mg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=-VGeK5gTtw4Q7kNvwGsGzpp&_nc_oc=Adqnc7fygiSXU6bndnZKi4i6Ero4WGsRb6aHNPLBQ6-1odnNXxOjOZk2jy4bVEkhgi4&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad3-2.cdninstagram.com&_nc_gid=cOkD1Wt-D3AwxbEdPps19Q&_nc_ss=7a22e&oh=00_Af__xGvRgsJPUMKyRlt1-KdyaGdL7mwoQmSHmIT0XoPPeg&oe=6A25B78F"),
    # Delta premium suites
    ("delta.*premium-suites|dream-seats", "https://scontent-iad3-1.cdninstagram.com/v/t51.82787-15/714774748_18102446420323259_7668470444071479240_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=101&ig_cache_key=MzkxMDYyMzY1Njc3MzMwODY3OQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMyJ9&_nc_ohc=_2Oxi_plCbkQ7kNvwE_jaxQ&_nc_oc=AdoHMBHok2UQavYj1T4L3pX2zOtR2xb6umOIsIMd41uu-PGK2fqt7JTCG4_sWCFz2Oc&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_gid=cOkD1Wt-D3AwxbEdPps19Q&_nc_ss=7a22e&oh=00_Af89wiKOyZx41hiiHlwCFk4FGKyooLGxnUWj9ip4b-CGbQ&oe=6A25D7B6"),
]

# Connect to DB
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
print(f"Found {len(recent_articles)} recent articles")

updated = 0
for article in recent_articles:
    slug = article['slug']
    title = article['title']
    article_id = article['id']
    
    for pattern, img_url in DIRECT_UPDATES:
        if re.search(pattern, slug, re.IGNORECASE) or re.search(pattern, title, re.IGNORECASE):
            print(f"✅ {title[:60]}")
            print(f"   slug: {slug}")
            cursor.execute(
                "UPDATE articles SET featuredImage = %s WHERE id = %s",
                (img_url, article_id)
            )
            conn.commit()
            updated += 1
            break

cursor.close()
conn.close()
print(f"\n=== Done: {updated} articles updated ===")
