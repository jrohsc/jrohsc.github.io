"""Refresh the public, indexed Reddit watchlist for the static monitoring page."""
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

QUERIES = (
    'site:reddit.com/r/h1b Nebraska premium processing when:7d',
    'site:reddit.com/r/h1b Nebraska PP when:7d',
    'site:reddit.com/r/H1BH4H4EAD_premium Nebraska when:7d',
)
OUTPUT = Path(__file__).with_name('feed.json')


def fetch_items(query):
    feed = 'https://news.google.com/rss/search?' + urllib.parse.urlencode({
        'q': query, 'hl': 'en-US', 'gl': 'US', 'ceid': 'US:en'
    })
    request = urllib.request.Request(feed, headers={'User-Agent': 'Mozilla/5.0 H1B monitoring feed'})
    with urllib.request.urlopen(request, timeout=25) as response:
        root = ET.fromstring(response.read())

    items = []
    for item in root.findall('./channel/item'):
        title = item.findtext('title', '').removesuffix(' - Reddit').strip()
        link = item.findtext('link', '').strip()
        date = item.findtext('pubDate', '').strip()
        if not title or not link.startswith('https://news.google.com/'):
            continue
        if not re.search(r'h.?1.?b|premium|approval|nebraska', title, re.I):
            continue
        items.append({'title': title, 'link': link, 'date': date})
    return items


def main():
    items = {}
    errors = []
    for query in QUERIES:
        try:
            for item in fetch_items(query):
                items.setdefault(item['title'].casefold(), item)
        except (OSError, ET.ParseError) as exc:
            errors.append(f'{query}: {exc}')

    if len(errors) == len(QUERIES):
        raise RuntimeError('All indexed-post searches failed: ' + '; '.join(errors))

    # A transient empty feed must not erase the last useful snapshot.
    if not items:
        raise RuntimeError('Feed returned no relevant items')
    sorted_items = sorted(items.values(), key=lambda item: parsedate_to_datetime(item['date']), reverse=True)[:12]
    previous = json.loads(OUTPUT.read_text()) if OUTPUT.exists() else {}
    if previous.get('items') == sorted_items:
        print('No new indexed posts')
        return
    OUTPUT.write_text(json.dumps({
        'updatedAt': datetime.now(timezone.utc).isoformat(),
        'items': sorted_items,
    }, ensure_ascii=False, indent=2) + '\n')
    print(f'Wrote {len(sorted_items)} indexed posts')


if __name__ == '__main__':
    main()
