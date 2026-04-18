#!/usr/bin/env node
// Builds root *.html from src/*.src.html by inlining partials and placeholders.
// Idempotent — running build on output does not re-include (markers are only in sources).

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const APK_VERSION = pkg.appVersion || pkg.version || '0.0.0';

const INCLUDE_RE = /<!--\s*@include\s+(\S+)\s*-->/g;

function resolvePartial(ref) {
  const abs = path.join(ROOT, ref);
  if (!abs.startsWith(ROOT + path.sep)) throw new Error(`Unsafe include path: ${ref}`);
  if (!fs.existsSync(abs)) throw new Error(`Missing partial: ${ref}`);
  return fs.readFileSync(abs, 'utf8');
}

function render(html, file) {
  const out = html.replace(INCLUDE_RE, (_, ref) => {
    try {
      return resolvePartial(ref);
    } catch (err) {
      throw new Error(`${file}: ${err.message}`);
    }
  });
  return out
    .replace(/\{\{APK_VERSION\}\}/g, APK_VERSION)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*[\r\n]/gm, '');
}

function build() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`src/ directory not found at ${SRC_DIR}`);
    process.exit(1);
  }
  const sources = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.src.html'));
  if (!sources.length) {
    console.warn('No *.src.html found in src/');
    return;
  }
  for (const src of sources) {
    const srcPath = path.join(SRC_DIR, src);
    const outName = src.replace(/\.src\.html$/, '.html');
    const outPath = path.join(ROOT, outName);
    const raw = fs.readFileSync(srcPath, 'utf8');
    const built = render(raw, src);
    fs.writeFileSync(outPath, built);
    console.log(`✓ ${outName} (${built.length} bytes)`);
  }
}

build();
