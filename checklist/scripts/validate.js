/**
 * validate.js — CHECKLIST.md schema validator
 *
 * Usage: node scripts/validate.js
 *
 * Parses data/CHECKLIST.md and validates structure/schema.
 * Exits 0 if all pass, 1 if any errors.
 */

const fs = require('fs');
const path = require('path');

const CHECKLIST_PATH = path.join(__dirname, '..', 'data', 'CHECKLIST.md');
const VALID_SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'];

let hasError = false;

function error(context, msg) {
  console.error('  \u2716 ' + context + ': ' + msg);
  hasError = true;
}

// ── Inline parser (mirrors js/parser.js) ──────────────────────────────────────
function parseMeta(commentLine) {
  var inner = commentLine.replace(/<!--\s*/, '').replace(/\s*-->/, '');
  var meta = {};
  inner.split('|').forEach(function(part) {
    var idx = part.indexOf(':');
    if (idx === -1) return;
    meta[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  });
  return meta;
}

function parseTags(str) {
  return str ? str.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [];
}

function parseChecklist(text) {
  var lines = text.split('\n');
  var categories = [];
  var currentCat = null, currentSub = null, currentItem = null;
  var state = 'none', inFence = false, pendingMeta = null;

  function flushItem() {
    if (currentItem && currentSub) { currentSub.items.push(currentItem); currentItem = null; }
    state = 'none'; inFence = false;
  }
  function flushSub() {
    flushItem();
    if (currentSub && currentCat) { currentCat.subcategories.push(currentSub); currentSub = null; }
  }
  function flushCat() {
    flushSub();
    if (currentCat) { categories.push(currentCat); currentCat = null; }
  }

  for (var i = 0; i < lines.length; i++) {
    var trimmed = lines[i].trim();

    if (/^<!--/.test(trimmed) && /-->$/.test(trimmed)) { pendingMeta = parseMeta(trimmed); continue; }

    if (/^# /.test(trimmed)) {
      flushCat();
      currentCat = { category: trimmed.slice(2).trim(), categoryKey: '', icon: '', color: '', description: '', subcategories: [] };
      pendingMeta = null; continue;
    }
    if (/^## /.test(trimmed)) {
      flushSub();
      currentSub = { id: '', title: trimmed.slice(3).trim(), icon: '', color: '', description: '', items: [] };
      pendingMeta = null; continue;
    }
    if (/^### /.test(trimmed)) {
      flushItem();
      currentItem = { id: '', title: trimmed.slice(4).trim(), description: '', severity: 'info', tags: [], commands: [], references: [] };
      pendingMeta = null; state = 'none'; inFence = false; continue;
    }

    if (pendingMeta) {
      var meta = pendingMeta; pendingMeta = null;
      if (currentItem) {
        if (meta.id) currentItem.id = meta.id;
        if (meta.severity) currentItem.severity = meta.severity;
        if (meta.tags) currentItem.tags = parseTags(meta.tags);
      } else if (currentSub) {
        if (meta.id) currentSub.id = meta.id;
        if (meta.icon) currentSub.icon = meta.icon;
        if (meta.color) currentSub.color = meta.color;
      } else if (currentCat) {
        if (meta.categoryKey) currentCat.categoryKey = meta.categoryKey;
        if (meta.icon) currentCat.icon = meta.icon;
        if (meta.color) currentCat.color = meta.color;
      }
    }

    if (/^---+$/.test(trimmed)) continue;
    if (trimmed === '**Commands:**') { state = 'commands'; inFence = false; continue; }
    if (trimmed === '**References:**') { state = 'references'; inFence = false; continue; }
    if (/^```/.test(trimmed)) { inFence = !inFence; continue; }
    if (inFence && state === 'commands' && currentItem && trimmed.length > 0) { currentItem.commands.push(trimmed); continue; }
    if (state === 'references' && /^- /.test(trimmed) && currentItem) { var ref = trimmed.slice(2).trim(); if (ref) currentItem.references.push(ref); continue; }
    if (trimmed.length > 0 && state === 'none') {
      if (currentItem && !currentItem.description) currentItem.description = trimmed;
      else if (currentSub && !currentSub.description && !currentItem) currentSub.description = trimmed;
      else if (currentCat && !currentCat.description && !currentSub) currentCat.description = trimmed;
      continue;
    }
    if (trimmed.length === 0 && state === 'references') state = 'none';
  }
  flushCat();
  return { categories: categories };
}

// ── Validation ─────────────────────────────────────────────────────────────────
function validate() {
  console.log('\n\uD83D\uDD0D Validating data/CHECKLIST.md...\n');

  if (!fs.existsSync(CHECKLIST_PATH)) {
    console.error('data/CHECKLIST.md not found at: ' + CHECKLIST_PATH);
    process.exit(1);
  }

  var text = fs.readFileSync(CHECKLIST_PATH, 'utf-8');
  var parsed;
  try {
    parsed = parseChecklist(text);
  } catch (e) {
    console.error('Failed to parse CHECKLIST.md: ' + e.message);
    process.exit(1);
  }

  var { categories } = parsed;

  if (!categories.length) {
    error('CHECKLIST.md', 'No categories found — check your # headings');
    process.exit(1);
  }

  var totalItems = 0;
  var allItemIds = new Set();

  categories.forEach(function(cat) {
    var ctx = 'Category "' + cat.category + '"';
    if (!cat.categoryKey) error(ctx, 'Missing categoryKey in <!-- --> comment');
    if (!cat.icon)        error(ctx, 'Missing icon in <!-- --> comment');
    if (!cat.color || !/^#[0-9a-fA-F]{6}$/.test(cat.color)) error(ctx, 'Missing or invalid color (must be #rrggbb)');
    if (!cat.description) error(ctx, 'Missing description paragraph');
    if (!cat.subcategories.length) error(ctx, 'No ## subcategories found');

    cat.subcategories.forEach(function(sub) {
      var sctx = ctx + ' > Sub "' + sub.title + '"';
      if (!sub.id)    error(sctx, 'Missing id in <!-- --> comment');
      if (!sub.icon)  error(sctx, 'Missing icon in <!-- --> comment');
      if (!sub.color || !/^#[0-9a-fA-F]{6}$/.test(sub.color)) error(sctx, 'Missing or invalid color');
      if (!sub.description) error(sctx, 'Missing description paragraph');
      if (!sub.items.length) error(sctx, 'No ### items found');

      sub.items.forEach(function(item) {
        var ictx = sctx + ' > Item "' + item.title + '"';
        if (!item.id) {
          error(ictx, 'Missing id in <!-- --> comment');
        } else {
          if (!/^[a-z0-9-]+$/.test(item.id)) error(ictx, '"id" must be lowercase kebab-case, got: ' + item.id);
          if (allItemIds.has(item.id)) error(ictx, 'Duplicate item id: ' + item.id);
          allItemIds.add(item.id);
        }
        if (!item.description)   error(ictx, 'Missing description paragraph');
        if (!item.severity)      error(ictx, 'Missing severity in <!-- --> comment');
        else if (!VALID_SEVERITIES.includes(item.severity)) error(ictx, 'Invalid severity "' + item.severity + '" — must be: ' + VALID_SEVERITIES.join(', '));
        if (!item.tags || item.tags.length < 2) error(ictx, '"tags" must have at least 2 values (got ' + (item.tags ? item.tags.length : 0) + ')');
        totalItems++;
      });
    });
  });

  console.log('  Categories:   ' + categories.length);
  console.log('  Subcategories: ' + categories.reduce(function(n, c) { return n + c.subcategories.length; }, 0));
  console.log('  Items:         ' + totalItems);

  if (hasError) {
    console.error('\n\u274C Validation failed. Fix the errors above.\n');
    process.exit(1);
  } else {
    console.log('\n\u2705 CHECKLIST.md passed validation!\n');
    process.exit(0);
  }
}

validate();