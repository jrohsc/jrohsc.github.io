"""Refresh the public, indexed Reddit watchlist for the static monitoring page."""
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

QUERY = 'site:reddit.com/r/h1b Nebraska premium processing when:7d'
FEED = 'https://news.google.com/rss/search?' + urllib.parse.urlencode({
    'q': QUERY, 'hl': 'en-US', 'gl': 'US', 'ceid': 'US:en'
})
OUTPUT = Path(__file__).with_name('feed.json')


def main():
    request = urllib.request.Request(FEED, headers={'User-Agent': 'Mozilla/5.0 H1B monitoring feed'})
    with urllib.request.urlopen(request, timeout=25) as response:
        root = ET.fromstring(response.read())

    items = []
    for item in root.findall('./channel/item'):
        title = item.findtext('title', '').removesuffix(' - Reddit').strip()
        link = item.findtext('link', '').strip()
        date = item.findtext('pubDate', '').strip()
        if not title or not link.startswith('https://news.google.com/'):
            continue
        if not re.search(r'h.?1b|premium|approval|nebraska', title, re.I):
            continue
        items.append({'title': title, 'link': link, 'date': date})

    # A transient empty feed must not erase the last useful snapshot.
    if not items:
        raise RuntimeError('Feed returned no relevant items')
    previous = json.loads(OUTPUT.read_text()) if OUTPUT.exists() else {}
    if previous.get('items') == items[:12]:
        print('No new indexed posts')
        return
    OUTPUT.write_text(json.dumps({
        'updatedAt': datetime.now(timezone.utc).isoformat(),
        'items': items[:12],
    }, ensure_ascii=False, indent=2) + '\n')
    print(f'Wrote {min(len(items), 12)} indexed posts')


if __name__ == '__main__':
    main()
