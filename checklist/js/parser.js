/**
 * parser.js — Markdown → checklist data structure
 *
 * Parses CHECKLIST.md into the same { categories[] } structure
 * that app.js and renderer.js already consume.
 *
 * Markdown format:
 *   # Category Title
 *   <!-- categoryKey: key | icon: emoji | color: #hex -->
 *   Category description.
 *
 *   ## Subcategory Title
 *   <!-- id: sub-id | icon: emoji | color: #hex -->
 *   Subcategory description.
 *
 *   ### Item Title
 *   <!-- id: item-id | severity: low | tags: tag1, tag2 -->
 *   Item description.
 *
 *   **Commands:**
 *   ```
 *   command1
 *   command2
 *   ```
 *
 *   **References:**
 *   - https://example.com
 */

function parseChecklist(text) {
  var lines = text.split('\n');
  var categories = [];
  var currentCat = null;
  var currentSub = null;
  var currentItem = null;

  // State for multi-line sections
  var state = 'none'; // 'none' | 'commands' | 'references'
  var inFence = false;

  // Pending metadata comment (read on the line after a heading)
  var pendingMeta = null;

  function parseMeta(commentLine) {
    // e.g. <!-- categoryKey: technologies | icon: 🛠️ | color: #e06c75 -->
    var inner = commentLine.replace(/<!--\s*/, '').replace(/\s*-->/, '');
    var meta = {};
    inner.split('|').forEach(function(part) {
      var idx = part.indexOf(':');
      if (idx === -1) return;
      var key = part.slice(0, idx).trim();
      var val = part.slice(idx + 1).trim();
      meta[key] = val;
    });
    return meta;
  }

  function parseTags(str) {
    return str ? str.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [];
  }

  function flushItem() {
    if (currentItem && currentSub) {
      currentSub.items.push(currentItem);
      currentItem = null;
    }
    state = 'none';
    inFence = false;
  }

  function flushSub() {
    flushItem();
    if (currentSub && currentCat) {
      currentCat.subcategories.push(currentSub);
      currentSub = null;
    }
  }

  function flushCat() {
    flushSub();
    if (currentCat) {
      categories.push(currentCat);
      currentCat = null;
    }
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var trimmed = line.trim();

    // HTML comment — metadata for the previous heading
    if (/^<!--/.test(trimmed) && /-->$/.test(trimmed)) {
      pendingMeta = parseMeta(trimmed);
      continue;
    }

    // H1 — new category
    if (/^# /.test(trimmed)) {
      flushCat();
      var title = trimmed.slice(2).trim();
      currentCat = {
        category: title,
        categoryKey: '',
        icon: '',
        color: '',
        description: '',
        subcategories: [],
      };
      pendingMeta = null;
      // Metadata comment comes on the next non-blank line
      // We peek ahead for it
      continue;
    }

    // H2 — new subcategory
    if (/^## /.test(trimmed)) {
      flushSub();
      var title = trimmed.slice(3).trim();
      currentSub = {
        id: '',
        title: title,
        icon: '',
        color: '',
        description: '',
        items: [],
      };
      pendingMeta = null;
      continue;
    }

    // H3 — new item
    if (/^### /.test(trimmed)) {
      flushItem();
      var title = trimmed.slice(4).trim();
      currentItem = {
        id: '',
        title: title,
        description: '',
        severity: 'info',
        tags: [],
        commands: [],
        references: [],
      };
      pendingMeta = null;
      state = 'none';
      inFence = false;
      continue;
    }

    // Apply pending metadata to the most recent open object
    if (pendingMeta) {
      var meta = pendingMeta;
      pendingMeta = null;

      if (currentItem) {
        if (meta.id)       currentItem.id = meta.id;
        if (meta.severity) currentItem.severity = meta.severity;
        if (meta.tags)     currentItem.tags = parseTags(meta.tags);
      } else if (currentSub) {
        if (meta.id)    currentSub.id = meta.id;
        if (meta.icon)  currentSub.icon = meta.icon;
        if (meta.color) currentSub.color = meta.color;
      } else if (currentCat) {
        if (meta.categoryKey) currentCat.categoryKey = meta.categoryKey;
        if (meta.icon)        currentCat.icon = meta.icon;
        if (meta.color)       currentCat.color = meta.color;
      }
    }

    // Horizontal rule — separator, skip
    if (/^---+$/.test(trimmed)) continue;

    // Section markers
    if (trimmed === '**Commands:**') {
      state = 'commands';
      inFence = false;
      continue;
    }
    if (trimmed === '**References:**') {
      state = 'references';
      inFence = false;
      continue;
    }

    // Fenced code block toggle
    if (/^```/.test(trimmed)) {
      inFence = !inFence;
      continue;
    }

    // Inside a fenced code block → commands
    if (inFence && state === 'commands' && currentItem) {
      if (trimmed.length > 0) {
        currentItem.commands.push(trimmed);
      }
      continue;
    }

    // Bullet list line → references
    if (state === 'references' && /^- /.test(trimmed) && currentItem) {
      var ref = trimmed.slice(2).trim();
      if (ref) currentItem.references.push(ref);
      continue;
    }

    // Description line (plain paragraph text — not empty, not in a special section)
    if (trimmed.length > 0 && state === 'none') {
      if (currentItem && !currentItem.description) {
        currentItem.description = trimmed;
      } else if (currentSub && !currentSub.description && !currentItem) {
        currentSub.description = trimmed;
      } else if (currentCat && !currentCat.description && !currentSub) {
        currentCat.description = trimmed;
      }
      continue;
    }

    // Blank line — reset references state so next section starts fresh
    if (trimmed.length === 0 && state === 'references') {
      state = 'none';
    }
  }

  // Flush the last open objects
  flushCat();

  return { categories: categories };
}