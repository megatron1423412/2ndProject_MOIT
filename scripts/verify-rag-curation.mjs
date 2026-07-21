import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('docs', 'RAG');
const requiredFields = [
  'title',
  'category',
  'topic',
  'source_name',
  'source_title',
  'source_url',
  'source_type',
  'curated_at',
  'temporal_status',
  'limitations',
];
const categories = {
  'air-conditioner': [
    'room-size-and-type.md',
    'cooling-efficiency.md',
    'comfort-and-maintenance-features.md',
    'operation-and-installation.md',
  ],
  televisions: [
    'display-and-picture-quality.md',
    'refresh-rate-and-connectivity.md',
    'screen-size-and-viewing-distance.md',
    'sound-smart-and-purchase-cautions.md',
  ],
  refrigerators: [
    'type-capacity-and-installation.md',
    'storage-and-compartment-features.md',
    'cooling-and-energy-efficiency.md',
    'convenience-and-maintenance-features.md',
  ],
  vacuumCleaners: [
    'cleaner-type-and-use.md',
    'suction-and-flooring.md',
    'battery-weight-and-handling.md',
    'filters-disposal-and-accessories.md',
  ],
};
const errors = [];
const bodies = new Map();

function fail(message) {
  errors.push(message);
}

for (const [category, expectedFiles] of Object.entries(categories)) {
  const categoryDir = path.join(root, category);
  const curatedDir = path.join(categoryDir, 'curated');
  if (!fs.existsSync(curatedDir)) {
    fail(`${category}: curated directory is missing`);
    continue;
  }

  const actualFiles = fs.readdirSync(curatedDir).filter((file) => file.endsWith('.md')).sort();
  if (actualFiles.join('|') !== [...expectedFiles].sort().join('|')) {
    fail(`${category}: curated file set does not match the expected topic documents`);
  }

  for (const file of actualFiles) {
    const fullPath = path.join(curatedDir, file);
    const text = fs.readFileSync(fullPath, 'utf8');
    if (text.includes('\uFFFD')) fail(`${category}/${file}: UTF-8 replacement character found`);
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/);
    if (!match) {
      fail(`${category}/${file}: complete YAML frontmatter and body are required`);
      continue;
    }
    const [, frontmatter, body] = match;
    for (const field of requiredFields) {
      const hasField = field === 'limitations'
        ? /^limitations:\s*\r?\n(?:\s+-\s+\S.+\r?\n?)+/m.test(frontmatter)
        : new RegExp(`^${field}:\\s*\\S`, 'm').test(frontmatter);
      if (!hasField) {
        fail(`${category}/${file}: missing frontmatter field ${field}`);
      }
    }
    if (!new RegExp(`^category:\\s*${category}\\s*$`, 'm').test(frontmatter)) {
      fail(`${category}/${file}: category frontmatter does not match its folder`);
    }
    if (body.trim().length < 700 || !/^#\s+.+/m.test(body)) {
      fail(`${category}/${file}: body is too short or lacks a meaningful heading`);
    }
    if (/<\/?[a-z][^>]*>/i.test(body) || /\b(?:script|style)\b/i.test(body)) {
      fail(`${category}/${file}: HTML or script/style residue found in body`);
    }
    if (/\b(?:navigation|cookie|advertisement|banner)\b/i.test(body) || /(?:광고|장바구니|로그인|추천 상품)/.test(body)) {
      fail(`${category}/${file}: navigation or advertisement residue found in body`);
    }
    const normalized = body.replace(/\s+/g, ' ').trim();
    if (bodies.has(normalized)) {
      fail(`${category}/${file}: duplicates ${bodies.get(normalized)}`);
    }
    bodies.set(normalized, `${category}/${file}`);
  }

  const rawHtml = fs.readdirSync(categoryDir).filter((file) => /\.html?$/i.test(file));
  if (rawHtml.length === 0) fail(`${category}: local source HTML is required`);
}

const coveragePath = path.join(root, 'CURATION_COVERAGE.md');
if (!fs.existsSync(coveragePath)) {
  fail('CURATION_COVERAGE.md is missing');
} else {
  const coverage = fs.readFileSync(coveragePath, 'utf8');
  for (const category of Object.keys(categories)) {
    if (!coverage.includes(`## ${category}`)) fail(`CURATION_COVERAGE.md does not list ${category}`);
    for (const file of categories[category]) {
      if (!coverage.includes(file)) fail(`CURATION_COVERAGE.md does not reference ${category}/${file}`);
    }
  }
}

if (errors.length) {
  console.error('RAG curation validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('RAG curation validation passed.');
