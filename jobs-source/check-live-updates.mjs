import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { manifestFor } from './snapshot.mjs';

const original = JSON.parse(await readFile(new URL('../ai-jobs/data.json', import.meta.url)));
const intern = original.jobs.find(j => j.type === 'Internship' && j.status === 'open');
const fulltime = original.jobs.find(j => j.type === 'Full-time' && j.status === 'open');
let snapshot = { ...original, jobs: [intern, fulltime] }, downloads = 0, fail = false;
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
const page = await browser.newPage();
await page.clock.install();
await page.route('**/manifest.json*', route => route.fulfill(fail ? { status: 503, body: 'Unavailable' } : { json: manifestFor(snapshot) }));
await page.route('**/data.json*', route => { downloads++; return route.fulfill({ json: snapshot }); });
await page.goto('http://localhost:8766/ai-jobs/');
await expect(page.locator('.job-card')).toHaveCount(1);
await page.locator('.save').click();
await page.locator('.status-select').selectOption('Applied');
await page.locator('#company').selectOption(intern.sourceId);
await page.locator(`[data-topic="${intern.topics[0]}"]`).click();
await page.locator('#search').fill(intern.title);

// Simulate a newly published feed; the page must notice without a reload/click.
snapshot = { ...snapshot, updatedAt: new Date(Date.now() + 60000).toISOString(), jobs: [...snapshot.jobs, { ...intern, id: 'test:new-intern', title: `${intern.title} — live update fixture` }] };
await page.clock.fastForward(30001);
await expect(page.locator('.job-card')).toHaveCount(2);
await expect(page.locator('#tab-internship')).toHaveAttribute('aria-selected', 'true');
await expect(page.locator('#company')).toHaveValue(intern.sourceId);
await expect(page.locator('#search')).toHaveValue(intern.title);
await expect(page.locator(`[data-id="${intern.id}"] .status-select`)).toHaveValue('Applied');
await expect(page.locator(`[data-id="${intern.id}"] .save`)).toHaveAttribute('aria-pressed', 'true');
assert.equal(downloads, 2);

// Unchanged checks should leave the actual job elements untouched.
await page.locator('.job-card').first().evaluate(el => el.setAttribute('data-probe', 'unchanged'));
await page.clock.fastForward(30001);
await expect(page.locator('.job-card').first()).toHaveAttribute('data-probe', 'unchanged');
assert.equal(downloads, 2);
fail = true;
await page.clock.fastForward(30001);
await expect(page.locator('#sync-label')).toContainText('Connection interrupted');
await expect(page.locator('.job-card')).toHaveCount(2);
fail = false;
await page.clock.fastForward(30001);
await expect(page.locator('#sync-label')).toContainText('Auto-updating');
assert.equal(downloads, 2);
console.log('PASS: automatic 30-second update, new internship appears, filters/save/application preserved, unchanged feed avoids redraw/download, outage recovery.');
await browser.close();
