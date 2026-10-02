"""Refresh the public H-1B watchlist from Reddit RSS and indexed searches."""
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import format_datetime, parsedate_to_datetime
from pathlib import Path

QUERIES = (
    'site:reddit.com/r/h1b Nebraska premium processing when:7d',
    'site:reddit.com/r/h1b Nebraska PP when:7d',
    'site:reddit.com/r/H1BH4H4EAD_premium Nebraska when:7d',
)
OUTPUT = Path(__file__).with_name('feed.json')
REDDIT_FEED = 'https://www.reddit.com/r/h1b/new/.rss?limit=100'
ATOM = '{http://www.w3.org/2005/Atom}'


def fetch_reddit_items():
    request = urllib.request.Request(REDDIT_FEED, headers={
        'User-Agent': 'H1BMonitor/1.0 (https://jrohsc.github.io/h1b-monitoring/)'
    })
    with urllib.request.urlopen(request, timeout=25) as response:
        root = ET.fromstring(response.read())

    items = []
    for entry in root.findall(f'{ATOM}entry'):
        title = (entry.findtext(f'{ATOM}title') or '').strip()
        content = entry.findtext(f'{ATOM}content') or ''
        link = next((node.get('href', '') for node in entry.findall(f'{ATOM}link')
                     if node.get('rel', 'alternate') == 'alternate'), '')
        published = entry.findtext(f'{ATOM}published') or entry.findtext(f'{ATOM}updated') or ''
        body = re.sub(r'<[^>]+>', ' ', title + ' ' + content)
        if not re.search(r'\bnebraska\b|\bnsc\b', body, re.I):
            continue
        if not re.search(r'\bpremium\b|\bpp\b|i.?907', body, re.I):
            continue
        if urllib.parse.urlparse(link).hostname not in ('www.reddit.com', 'reddit.com'):
            continue
        try:
            date = format_datetime(datetime.fromisoformat(published.replace('Z', '+00:00')))
        except ValueError:
            continue
        items.append({'title': title, 'link': link, 'date': date, 'source': 'reddit'})
    return items


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
        items.append({'title': title, 'link': link, 'date': date, 'source': 'indexed'})
    return items


def main():
    items = {}
    errors = []
    try:
        for item in fetch_reddit_items():
            items.setdefault(item['title'].casefold(), item)
    except (OSError, ET.ParseError) as exc:
        errors.append(f'Reddit RSS: {exc}')
    for query in QUERIES:
        try:
            for item in fetch_items(query):
                items.setdefault(item['title'].casefold(), item)
        except (OSError, ET.ParseError) as exc:
            errors.append(f'{query}: {exc}')

    for error in errors:
        print('Source unavailable:', error)
    if len(errors) == len(QUERIES) + 1:
        raise RuntimeError('All public-post sources failed: ' + '; '.join(errors))

    # A transient empty feed must not erase the last useful snapshot.
    if not items:
        raise RuntimeError('Feed returned no relevant items')
    sorted_items = sorted(items.values(), key=lambda item: parsedate_to_datetime(item['date']), reverse=True)[:12]
    previous = json.loads(OUTPUT.read_text()) if OUTPUT.exists() else {}
    if previous.get('items') == sorted_items:
        print('No new public posts')
        return
    OUTPUT.write_text(json.dumps({
        'updatedAt': datetime.now(timezone.utc).isoformat(),
        'items': sorted_items,
    }, ensure_ascii=False, indent=2) + '\n')
    print(f'Wrote {len(sorted_items)} public posts')


if __name__ == '__main__':
    main()
