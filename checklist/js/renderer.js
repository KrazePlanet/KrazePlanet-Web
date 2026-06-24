/**
 * renderer.js — DOM rendering functions for the Bug Bounty Checklist Dashboard
 *
 * Renders per-topic cards that are always expanded, showing all checklist items.
 * No category-level collapse logic — each topic is its own card.
 */

/**
 * Create a severity badge element
 * @param {string} severity - Severity level (critical, high, medium, low, info)
 * @returns {string} HTML for the badge
 */
function severityBadge(severity) {
  const colors = {
    critical: { bg: '#ff00180f', text: '#ff0018', border: '#ff001840' },
    high:     { bg: '#ff88000f', text: '#ff8800', border: '#ff880040' },
    medium:   { bg: '#ffdd000f', text: '#ffdd00', border: '#ffdd0040' },
    low:      { bg: '#00cc880f', text: '#00cc88', border: '#00cc8840' },
    info:     { bg: '#4488ff0f', text: '#4488ff', border: '#4488ff40' },
  };
  const c = colors[severity] || colors.info;
  return `<span class="severity-badge" style="--badge-bg:${c.bg};--badge-text:${c.text};--badge-border:${c.border}">${severity}</span>`;
}

/**
 * Render a single checklist item row (inside an always-expanded card)
 * @param {object} item - The checklist item object
 * @returns {string} HTML string
 */
function renderChecklistItem(item) {
  const commandsHtml = item.commands && item.commands.length
    ? `
      <div class="item-commands">
        <span class="item-label">📟 Commands</span>
        ${item.commands.map(cmd => `<pre class="command-block"><code>${escapeHtml(cmd)}</code><button class="copy-btn" data-cmd="${escapeHtml(cmd)}" title="Copy command">📋</button></pre>`).join('')}
      </div>`
    : '';

  const refsHtml = item.references && item.references.length
    ? `
      <div class="item-refs">
        <span class="item-label">🔗 References</span>
        <ul>${item.references.map(ref => `<li><a href="${escapeHtml(ref)}" target="_blank" rel="noopener">${escapeHtml(ref)}</a></li>`).join('')}</ul>
      </div>`
    : '';

  const tagsHtml = item.tags && item.tags.length
    ? `<div class="item-tags">${item.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`
    : '';

  return `
    <div class="checklist-item" data-item-id="${escapeHtml(item.id)}" data-severity="${escapeHtml(item.severity || 'info')}">
      <div class="item-header" tabindex="0" role="button" aria-expanded="false">
        <div class="item-title-row">
          <span class="item-checkbox" data-item-id="${escapeHtml(item.id)}">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <polyline class="check-mark" points="7,12 10.5,15.5 17,8.5"/>
            </svg>
          </span>
          <span class="item-title">${escapeHtml(item.title)}</span>
          <span class="item-notes-indicator" data-item-id="${escapeHtml(item.id)}" title="Has notes">📝</span>
          ${severityBadge(item.severity)}
        </div>
        <p class="item-description">${escapeHtml(item.description)}</p>
        ${tagsHtml}
      </div>
      <div class="item-details">
        ${commandsHtml}
        ${refsHtml}
        <div class="item-notes-section">
          <span class="item-label">📝 Notes</span>
          <textarea class="item-notes" data-item-id="${escapeHtml(item.id)}" placeholder="Add notes for this check..." rows="2"></textarea>
        </div>
      </div>
    </div>`;
}

/**
 * Create a topic card (always expanded) for a single subcategory
 * @param {object} sub - The subcategory object with title, icon, color, items, etc.
 * @param {string} categoryKey - The parent category key for filtering
 * @returns {HTMLElement} The card element
 */
function createTopicCard(sub, categoryKey) {
  const card = document.createElement('div');
  card.className = 'topic-card';
  card.dataset.category = sub.id;
  card.dataset.filterKey = categoryKey;
  card.dataset.cardId = sub.id;
  card.style.setProperty('--card-color', sub.color);

  const itemsHtml = sub.items.map(item => renderChecklistItem(item)).join('');
  const count = sub.items.length;

  card.innerHTML = `
    <div class="card-header">
      <div class="card-drag-handle" title="Drag to reorder">
        <svg viewBox="0 0 10 16" width="10" height="16" fill="currentColor">
          <circle cx="3" cy="2" r="1.4"/><circle cx="7" cy="2" r="1.4"/>
          <circle cx="3" cy="8" r="1.4"/><circle cx="7" cy="8" r="1.4"/>
          <circle cx="3" cy="14" r="1.4"/><circle cx="7" cy="14" r="1.4"/>
        </svg>
      </div>
      <div class="card-header-left">
        <span class="card-icon" style="--card-color:${sub.color}">${sub.icon}</span>
        <div class="card-info">
          <h2 class="card-title">${escapeHtml(sub.title)}</h2>
          <p class="card-desc">${escapeHtml(sub.description)}</p>
        </div>
      </div>
      <div class="card-header-right">
        <button class="bookmark-heart" data-card-id="${escapeHtml(sub.id)}" title="Bookmark this topic" aria-label="Bookmark this topic" aria-pressed="false">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <span class="category-badge" style="--badge-color:${sub.color}">${escapeHtml(categoryKey)}</span>
        <div class="card-progress">
          <span class="progress-info">0/${count} checked</span>
          <span class="progress-track"><span class="progress-fill" style="width:0%"></span></span>
        </div>
      </div>
    </div>
    <div class="card-body">
      <div class="card-checklist">
        ${itemsHtml}
      </div>
    </div>`;

  return card;
}

/**
 * Render the full dashboard grid with all topic cards
 * @param {Array<object>} allTopics - Flattened array of { sub, categoryKey } objects
 * @param {HTMLElement} container - The container to render into
 */
function renderDashboard(allTopics, container) {
  container.innerHTML = '';
  allTopics.forEach(topic => {
    const card = createTopicCard(topic.sub, topic.categoryKey);
    container.appendChild(card);
  });

  // Render total count badge
  const totalItems = allTopics.reduce((sum, t) => sum + t.sub.items.length, 0);
  const totalBadge = document.getElementById('totalChecklists');
  if (totalBadge) {
    totalBadge.textContent = `${totalItems} checklists`;
  }
}

/**
 * Filter cards based on search query
 * @param {string} query - Search query
 * @param {Array<object>} allTopics - All topics for stats
 */
function filterCardsBySearch(query, allTopics) {
  const cards = document.querySelectorAll('.topic-card');
  const trimmedQuery = query.trim().toLowerCase();
  let visibleCards = 0;
  let visibleItems = 0;

  cards.forEach(card => {
    if (!trimmedQuery) {
      card.style.display = '';
      card.classList.remove('search-filtered');
      const items = card.querySelectorAll('.checklist-item');
      items.forEach(item => item.style.display = '');
      visibleCards++;
      visibleItems += items.length;
      return;
    }

    const items = card.querySelectorAll('.checklist-item');
    let cardHasMatch = false;

    items.forEach(item => {
      const title = item.querySelector('.item-title')?.textContent?.toLowerCase() || '';
      const desc = item.querySelector('.item-description')?.textContent?.toLowerCase() || '';
      const tags = Array.from(item.querySelectorAll('.tag')).map(t => t.textContent.toLowerCase());
      const allTags = tags.join(' ');

      const matches = title.includes(trimmedQuery) || desc.includes(trimmedQuery) || allTags.includes(trimmedQuery);

      if (matches) {
        item.style.display = '';
        cardHasMatch = true;
        visibleItems++;
      } else {
        item.style.display = 'none';
      }
    });

    if (cardHasMatch) {
      card.style.display = '';
      card.classList.add('search-filtered');
      visibleCards++;
    } else {
      card.style.display = 'none';
      card.classList.remove('search-filtered');
    }
  });

  // Update search stats
  const resultsEl = document.getElementById('resultsCount');
  if (resultsEl) {
    if (trimmedQuery) {
      resultsEl.textContent = `Found ${visibleItems} results in ${visibleCards} topics for "${escapeHtml(trimmedQuery)}"`;
    } else {
      const totalItems = allTopics.reduce((sum, t) => sum + t.sub.items.length, 0);
      resultsEl.textContent = `Showing all ${totalItems} checklists across ${allTopics.length} topics`;
    }
  }
}

/**
 * Filter cards by category (navbar clicks)
 * @param {string} filterKey - The category key to filter by, or 'all'
 */
function filterCardsByCategory(filterKey) {
  const cards = document.querySelectorAll('.topic-card');

  cards.forEach(card => {
    if (filterKey === 'all') {
      card.style.display = '';
      card.classList.remove('category-filtered');
      const items = card.querySelectorAll('.checklist-item');
      items.forEach(item => item.style.display = '');
    } else {
      const matches = card.dataset.filterKey === filterKey;
      card.style.display = matches ? '' : 'none';
      card.classList.toggle('category-filtered', !matches);
      const items = card.querySelectorAll('.checklist-item');
      items.forEach(item => item.style.display = '');
    }
  });

  // Update stats
  const resultsEl = document.getElementById('resultsCount');
  if (resultsEl) {
    const hiddenCards = document.querySelectorAll('.topic-card[style*="display: none"]');
    const totalCards = cards.length;
    const visibleCount = filterKey === 'all' ? totalCards : totalCards - hiddenCards.length;
    resultsEl.textContent = filterKey === 'all'
      ? 'Showing all categories'
      : `Showing ${visibleCount} topic${visibleCount !== 1 ? 's' : ''}`;
  }
}

/**
 * Utility: escape HTML to prevent XSS
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Utility: extract a filter key from a category name
 */
function getFilterKey(categoryName) {
  const map = {
    'Technologies': 'technologies',
    'Subdomain Statuses': 'subdomains',
    'Vulnerabilities': 'vulnerabilities',
    'Methodologies': 'methodologies',
    'Scope Types': 'scopes',
  };
  return map[categoryName] || categoryName.toLowerCase().replace(/\s+/g, '');
}
