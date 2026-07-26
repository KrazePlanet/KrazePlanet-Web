/* ==========================================================================
   KrazePlanet Writeups Hub - Enhanced Application Logic
   ========================================================================== */

(function () {
  'use strict';

  // LocalStorage Keys
  const STORAGE_BOOKMARKS = 'kraze_writeups_bookmarks';
  const STORAGE_READ_HISTORY = 'kraze_writeups_read_history';

  // Application State
  const state = {
    allWriteups: [],
    filteredWriteups: [],
    tagsMap: new Map(), // tag -> count

    // Persistent User State
    bookmarks: new Set(JSON.parse(localStorage.getItem(STORAGE_BOOKMARKS) || '[]')),
    readHistory: new Set(JSON.parse(localStorage.getItem(STORAGE_READ_HISTORY) || '[]')),

    // Active Filters
    searchQuery: '',
    timeRange: 'any', // 'any', '1h', '24h', '7d', '30d', '365d', 'custom'
    customStart: null,
    customEnd: null,
    isNewOnly: false,
    isTodayOnly: false,
    isBookmarksOnly: false,
    isUnreadOnly: false,
    selectedTags: new Set(),

    // View & Sorting & Selection
    sortBy: 'newest', // 'newest', 'oldest', 'title'
    viewMode: 'grid', // 'grid', 'list'
    currentPage: 1,
    pageSize: 24,
    selectedIndex: -1, // Keyboard navigation index

    // Reference time for relative calculations
    latestArticleTime: Date.now()
  };

  // DOM Elements
  const elements = {
    searchInput: document.getElementById('search-input'),
    searchClear: document.getElementById('search-clear'),

    timeDropdownBtn: document.getElementById('time-dropdown-btn'),
    timeDropdownLabel: document.getElementById('time-dropdown-label'),
    timeDropdownMenu: document.getElementById('time-dropdown-menu'),

    toggleNewBtn: document.getElementById('toggle-new-btn'),
    toggleTodayBtn: document.getElementById('toggle-today-btn'),
    toggleBookmarksBtn: document.getElementById('toggle-bookmarks-btn'),
    toggleUnreadBtn: document.getElementById('toggle-unread-btn'),
    sortSelect: document.getElementById('sort-select'),

    viewGridBtn: document.getElementById('view-grid-btn'),
    viewListBtn: document.getElementById('view-list-btn'),

    tagPillsContainer: document.getElementById('tag-pills-container'),
    tagSearchInput: document.getElementById('tag-search-input'),
    clearAllTagsBtn: document.getElementById('clear-all-tags'),

    writeupsContainer: document.getElementById('writeups-container'),
    resultsCount: document.getElementById('results-count'),
    activeFilterSummary: document.getElementById('active-filter-summary'),

    paginationContainer: document.getElementById('pagination-container'),
    prevPageBtn: document.getElementById('prev-page-btn'),
    nextPageBtn: document.getElementById('next-page-btn'),
    pageInfo: document.getElementById('page-info'),

    // Header Widgets
    statTotal: document.getElementById('stat-total'),
    statNew: document.getElementById('stat-new'),
    statToday: document.getElementById('stat-today'),
    statBookmarks: document.getElementById('stat-bookmarks'),
    progressBarFill: document.getElementById('progress-bar-fill'),
    progressPercent: document.getElementById('progress-percent'),

    // Header Action Buttons
    toggleAnalyticsBtn: document.getElementById('toggle-analytics-btn'),
    exportBtn: document.getElementById('export-btn'),
    shortcutsBtn: document.getElementById('shortcuts-btn'),

    // Analytics Drawer
    analyticsDrawer: document.getElementById('analytics-drawer'),
    closeAnalyticsBtn: document.getElementById('close-analytics-btn'),
    topTagsChart: document.getElementById('top-tags-chart'),
    vulnTypesChart: document.getElementById('vuln-types-chart'),
    totalReadingTime: document.getElementById('total-reading-time'),

    // Modals
    customRangeModal: document.getElementById('custom-range-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    startDateInput: document.getElementById('start-date-input'),
    endDateInput: document.getElementById('end-date-input'),
    applyCustomRangeBtn: document.getElementById('apply-custom-range'),
    cancelCustomRangeBtn: document.getElementById('cancel-custom-range'),

    readerModal: document.getElementById('reader-modal'),
    readerTitle: document.getElementById('reader-title'),
    readerIframe: document.getElementById('reader-iframe'),
    closeReaderBtn: document.getElementById('close-reader-btn'),
    openExternalLinkBtn: document.getElementById('open-external-link'),
    readerThemeDark: document.getElementById('reader-theme-dark'),
    readerThemeSepia: document.getElementById('reader-theme-sepia'),

    exportModal: document.getElementById('export-modal'),
    closeExportBtn: document.getElementById('close-export-btn'),
    exportMarkdownBtn: document.getElementById('export-markdown-btn'),
    exportDiscordBtn: document.getElementById('export-discord-btn'),
    exportJsonBtn: document.getElementById('export-json-btn'),
    exportCsvBtn: document.getElementById('export-csv-btn'),

    shortcutsModal: document.getElementById('shortcuts-modal'),
    closeShortcutsBtn: document.getElementById('close-shortcuts-btn'),

    toastContainer: document.getElementById('toast-container')
  };

  // Human Readable Label Map for Time Filter Dropdown
  const timeLabels = {
    'any': 'Any time',
    '1h': 'Past hour',
    '24h': 'Past 24 hours',
    '7d': 'Past week',
    '30d': 'Past month',
    '365d': 'Past year',
    'custom': 'Custom range...'
  };

  // Initialize App
  async function init() {
    setupEventListeners();
    await loadWriteups();
  }

  // Load and Parse README.md
  async function loadWriteups() {
    try {
      showLoadingState();
      const response = await fetch('https://raw.githubusercontent.com/rix4uni/medium-writeups/refs/heads/main/README.md');
      if (!response.ok) {
        throw new Error(`Failed to load README.md (${response.status})`);
      }
      const markdown = await response.text();
      state.allWriteups = parseMarkdownTable(markdown);

      if (state.allWriteups.length > 0) {
        const maxTime = Math.max(...state.allWriteups.map(w => w.timestamp));
        if (maxTime > 0) {
          state.latestArticleTime = Math.max(Date.now(), maxTime);
        }
      }

      extractTags();
      updateHeaderStats();
      renderTagPills();
      renderAnalytics();
      applyFilters();
    } catch (err) {
      console.error('Error loading writeups:', err);
      showErrorState(err.message);
    }
  }

  // Markdown Table Parser & Smart Badges Extractor Engine
  function parseMarkdownTable(markdown) {
    const lines = markdown.split('\n');
    const writeups = [];

    for (let line of lines) {
      line = line.trim();
      if (!line.startsWith('|') || line.includes('| Time |') || line.includes('|-----------|')) {
        continue;
      }

      const columns = line.split('|').map(col => col.trim());
      if (columns.length < 6) continue;

      const rawTime = columns[1];
      const rawTitleCol = columns[2];
      const rawFeedCol = columns[3];
      const rawIsNew = columns[4];
      const rawIsToday = columns[5];

      const dateObj = new Date(rawTime);
      const timestamp = isNaN(dateObj.getTime()) ? 0 : dateObj.getTime();

      const titleMatch = rawTitleCol.match(/\[(.*?)\]\((.*?)\)/);
      let title = titleMatch ? titleMatch[1] : rawTitleCol;
      let url = titleMatch ? titleMatch[2] : '#';

      title = sanitizeTitleText(title);

      const tags = [];
      const tagRegex = /\[(.*?)\]\((.*?)\)/g;
      let tagMatch;
      while ((tagMatch = tagRegex.exec(rawFeedCol)) !== null) {
        tags.push(tagMatch[1].toLowerCase().trim());
      }

      const isNew = rawIsNew.toLowerCase() === 'yes';
      const isToday = rawIsToday.toLowerCase() === 'yes';

      // Smart Extraction: CVEs, Bounty Amounts, Vulnerability Categories
      const cves = title.match(/CVE-\d{4}-\d{4,7}/gi) || [];
      const bountyMatch = title.match(/\$\d+(?:\.\d+)?k?\b|\$\d+,\d+/gi) || [];
      const bounty = bountyMatch.length > 0 ? bountyMatch[0] : null;

      // Detect Vulnerabilities
      const extractedVulns = detectVulnerabilities(title, tags);

      const id = url; // Use URL as unique identifier for state tracking

      writeups.push({
        id,
        rawTime,
        timestamp,
        dateObj,
        title,
        url,
        tags,
        isNew,
        isToday,
        cves: Array.from(new Set(cves.map(c => c.toUpperCase()))),
        bounty,
        extractedVulns
      });
    }

    return writeups;
  }

  // Detect vulnerability keywords
  function detectVulnerabilities(title, tags) {
    const text = (title + ' ' + tags.join(' ')).toLowerCase();
    const vulns = [];

    if (text.includes('ssrf')) vulns.push('SSRF');
    if (text.includes('xss') || text.includes('cross site scripting')) vulns.push('XSS');
    if (text.includes('idor') || text.includes('broken object level')) vulns.push('IDOR');
    if (text.includes('rce') || text.includes('remote code execution')) vulns.push('RCE');
    if (text.includes('sqli') || text.includes('sql injection')) vulns.push('SQLi');
    if (text.includes('lfi') || text.includes('local file inclusion')) vulns.push('LFI');
    if (text.includes('privilege escalation') || text.includes('privesc')) vulns.push('PrivEsc');
    if (text.includes('dorking')) vulns.push('Dorking');
    if (text.includes('auth') || text.includes('authentication')) vulns.push('Auth');

    return Array.from(new Set(vulns));
  }

  // Clean title strings from UTF artifacts
  function sanitizeTitleText(str) {
    return str
      .replace(/\?\?\?/g, '')
      .replace(/\?Ts/g, "'s")
      .replace(/\?Tt/g, "'t")
      .replace(/\?"/g, ' - ')
      .replace(/\?/g, "'");
  }

  // Extract and count tags
  function extractTags() {
    state.tagsMap.clear();
    state.allWriteups.forEach(w => {
      w.tags.forEach(tag => {
        state.tagsMap.set(tag, (state.tagsMap.get(tag) || 0) + 1);
      });
    });
  }

  // Update Header Stats & Reading Progress
  function updateHeaderStats() {
    const total = state.allWriteups.length;
    const countNew = state.allWriteups.filter(w => w.isNew).length;
    const countToday = state.allWriteups.filter(w => w.isToday).length;
    const countBookmarks = state.bookmarks.size;

    if (elements.statTotal) elements.statTotal.textContent = total;
    if (elements.statNew) elements.statNew.textContent = countNew;
    if (elements.statToday) elements.statToday.textContent = countToday;
    if (elements.statBookmarks) elements.statBookmarks.textContent = countBookmarks;

    // Daily Reading Progress Calculation
    const todayItems = state.allWriteups.filter(w => w.isToday);
    if (todayItems.length > 0) {
      const readTodayCount = todayItems.filter(w => state.readHistory.has(w.id)).length;
      const pct = Math.round((readTodayCount / todayItems.length) * 100);
      if (elements.progressBarFill) elements.progressBarFill.style.width = `${pct}%`;
      if (elements.progressPercent) elements.progressPercent.textContent = `${pct}% (${readTodayCount}/${todayItems.length})`;
    }
  }

  // Render Analytics Dashboard Charts
  function renderAnalytics() {
    if (!elements.topTagsChart || !elements.vulnTypesChart) return;

    // Top 5 Tags
    const sortedTags = Array.from(state.tagsMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxTagCount = sortedTags[0] ? sortedTags[0][1] : 1;

    elements.topTagsChart.innerHTML = sortedTags.map(([tag, count]) => {
      const pct = Math.round((count / maxTagCount) * 100);
      return `
        <div class="chart-bar-item">
          <div class="chart-bar-info">
            <span>#${tag}</span>
            <span><strong>${count}</strong> writeups</span>
          </div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');

    // Vulnerability Types Breakdown
    const vulnCounts = new Map();
    state.allWriteups.forEach(w => {
      w.extractedVulns.forEach(v => {
        vulnCounts.set(v, (vulnCounts.get(v) || 0) + 1);
      });
    });

    const sortedVulns = Array.from(vulnCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxVuln = sortedVulns[0] ? sortedVulns[0][1] : 1;

    elements.vulnTypesChart.innerHTML = sortedVulns.map(([vuln, count]) => {
      const pct = Math.round((count / maxVuln) * 100);
      return `
        <div class="chart-bar-item">
          <div class="chart-bar-info">
            <span>${vuln}</span>
            <span><strong>${count}</strong> writeups</span>
          </div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width: ${pct}%; background:var(--gradient-emerald);"></div>
          </div>
        </div>
      `;
    }).join('');

    // Estimated Reading Time (~4 min per writeup)
    if (elements.totalReadingTime) {
      const totalMins = state.allWriteups.length * 4;
      const hours = Math.floor(totalMins / 60);
      elements.totalReadingTime.textContent = `${hours} hours (${state.allWriteups.length} writeups)`;
    }
  }

  // Render Tag Cloud / Pills
  function renderTagPills(filterQuery = '') {
    if (!elements.tagPillsContainer) return;
    elements.tagPillsContainer.innerHTML = '';

    const sortedTags = Array.from(state.tagsMap.entries()).sort((a, b) => b[1] - a[1]);

    sortedTags.forEach(([tag, count]) => {
      if (filterQuery && !tag.includes(filterQuery.toLowerCase())) return;

      const isSelected = state.selectedTags.has(tag);
      const pill = document.createElement('div');
      pill.className = `tag-pill ${isSelected ? 'active' : ''}`;
      pill.innerHTML = `
        #${tag}
        <span class="tag-count">${count}</span>
      `;

      pill.addEventListener('click', () => {
        if (state.selectedTags.has(tag)) {
          state.selectedTags.delete(tag);
        } else {
          state.selectedTags.add(tag);
        }
        renderTagPills(elements.tagSearchInput ? elements.tagSearchInput.value : '');
        state.currentPage = 1;
        applyFilters();
      });

      elements.tagPillsContainer.appendChild(pill);
    });

    if (elements.clearAllTagsBtn) {
      elements.clearAllTagsBtn.style.display = state.selectedTags.size > 0 ? 'inline' : 'none';
    }
  }

  // Main Filter Logic Engine
  function applyFilters() {
    let result = [...state.allWriteups];

    // 1. Search Query Filter
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      result = result.filter(w =>
        w.title.toLowerCase().includes(q) ||
        w.url.toLowerCase().includes(q) ||
        w.tags.some(t => t.includes(q)) ||
        w.cves.some(c => c.toLowerCase().includes(q)) ||
        w.extractedVulns.some(v => v.toLowerCase().includes(q))
      );
    }

    // 2. Status Toggles (IsNew / IsToday / Bookmarks / Unread)
    if (state.isNewOnly) {
      result = result.filter(w => w.isNew);
    }
    if (state.isTodayOnly) {
      result = result.filter(w => w.isToday);
    }
    if (state.isBookmarksOnly) {
      result = result.filter(w => state.bookmarks.has(w.id));
    }
    if (state.isUnreadOnly) {
      result = result.filter(w => !state.readHistory.has(w.id));
    }

    // 3. Selected Tags Multi-Filter
    if (state.selectedTags.size > 0) {
      result = result.filter(w =>
        Array.from(state.selectedTags).every(selectedTag => w.tags.includes(selectedTag))
      );
    }

    // 4. Date/Time Range Filter
    const refTime = state.latestArticleTime;
    const hourMs = 60 * 60 * 1000;

    switch (state.timeRange) {
      case '1h':
        result = result.filter(w => w.timestamp > 0 && (refTime - w.timestamp) <= hourMs);
        break;
      case '24h':
        result = result.filter(w => w.timestamp > 0 && (refTime - w.timestamp) <= 24 * hourMs);
        break;
      case '7d':
        result = result.filter(w => w.timestamp > 0 && (refTime - w.timestamp) <= 7 * 24 * hourMs);
        break;
      case '30d':
        result = result.filter(w => w.timestamp > 0 && (refTime - w.timestamp) <= 30 * 24 * hourMs);
        break;
      case '365d':
        result = result.filter(w => w.timestamp > 0 && (refTime - w.timestamp) <= 365 * 24 * hourMs);
        break;
      case 'custom':
        if (state.customStart || state.customEnd) {
          result = result.filter(w => {
            if (!w.timestamp) return false;
            let match = true;
            if (state.customStart) match = match && (w.timestamp >= state.customStart);
            if (state.customEnd) match = match && (w.timestamp <= state.customEnd);
            return match;
          });
        }
        break;
      default: // 'any'
        break;
    }

    // 5. Sorting
    if (state.sortBy === 'newest') {
      result.sort((a, b) => b.timestamp - a.timestamp);
    } else if (state.sortBy === 'oldest') {
      result.sort((a, b) => a.timestamp - b.timestamp);
    } else if (state.sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    state.filteredWriteups = result;
    state.selectedIndex = -1; // Reset keyboard highlight
    renderResults();
    renderPagination();
    renderActiveFilterSummary();
  }

  // Render Results Grid or List
  function renderResults() {
    if (!elements.writeupsContainer) return;
    elements.writeupsContainer.innerHTML = '';

    if (elements.resultsCount) {
      elements.resultsCount.textContent = `${state.filteredWriteups.length} writeup${state.filteredWriteups.length === 1 ? '' : 's'} found`;
    }

    if (state.filteredWriteups.length === 0) {
      renderEmptyState();
      return;
    }

    const startIndex = (state.currentPage - 1) * state.pageSize;
    const endIndex = startIndex + state.pageSize;
    const pageItems = state.filteredWriteups.slice(startIndex, endIndex);

    elements.writeupsContainer.className = state.viewMode === 'grid' ? 'writeups-grid' : 'writeups-list';

    pageItems.forEach((writeup, index) => {
      const card = document.createElement('div');
      const isBookmarked = state.bookmarks.has(writeup.id);
      const isRead = state.readHistory.has(writeup.id);
      const isSelected = index === state.selectedIndex;

      card.className = `writeup-card ${writeup.isNew ? 'card-is-new' : ''} ${writeup.isToday ? 'card-is-today' : ''} ${isRead ? 'card-is-read' : ''} ${isSelected ? 'card-keyboard-selected' : ''}`;
      card.dataset.index = index;

      const relTime = formatRelativeTime(writeup.timestamp, state.latestArticleTime);

      const tagsHtml = writeup.tags.map(tag =>
        `<span class="card-tag" data-tag="${tag}">#${tag}</span>`
      ).join('');

      const cveBadges = writeup.cves.map(cve => `<span class="badge badge-cve">${cve}</span>`).join('');
      const bountyBadge = writeup.bounty ? `<span class="badge badge-bounty">${writeup.bounty}</span>` : '';
      const vulnBadges = writeup.extractedVulns.map(v => `<span class="badge badge-vuln">${v}</span>`).join('');

      card.innerHTML = `
        <div class="card-header">
          <div class="card-badges">
            ${writeup.isNew ? '<span class="badge badge-new">⚡ New</span>' : ''}
            ${writeup.isToday ? '<span class="badge badge-today">📅 Today</span>' : ''}
            ${cveBadges}
            ${bountyBadge}
            ${vulnBadges}
          </div>
          <div class="card-time" title="${writeup.rawTime}">
            <i class="far fa-clock"></i> ${relTime}
          </div>
        </div>

        <a href="${writeup.url}" target="_blank" rel="noopener noreferrer" class="card-title">
          ${highlightSearchText(writeup.title, state.searchQuery)}
        </a>

        <div class="card-tags">
          ${tagsHtml}
        </div>

        <div class="card-footer">
          <div class="read-btn-group">
            <a href="${writeup.url}" target="_blank" rel="noopener noreferrer" class="read-btn">
              <i class="fas fa-external-link-alt"></i> External
            </a>
            <button class="read-btn quick-read-btn" data-url="${writeup.url}" data-title="${escapeHtml(writeup.title)}">
              <i class="fas fa-book-open"></i> Quick Read
            </button>
          </div>
          <div class="card-actions">
            <button class="action-icon-btn is-read-btn ${isRead ? 'active' : ''}" title="${isRead ? 'Mark as Unread' : 'Mark as Read'}">
              <i class="${isRead ? 'fas fa-eye' : 'far fa-eye'}"></i>
            </button>
            <button class="action-icon-btn bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" title="${isBookmarked ? 'Remove Bookmark' : 'Bookmark Article'}">
              <i class="${isBookmarked ? 'fas fa-star' : 'far fa-star'}"></i>
            </button>
            <button class="action-icon-btn copy-btn" title="Copy Link" data-url="${writeup.url}">
              <i class="far fa-copy"></i>
            </button>
          </div>
        </div>
      `;

      // Card Events
      card.querySelectorAll('.card-tag').forEach(tagEl => {
        tagEl.addEventListener('click', (e) => {
          e.preventDefault();
          state.selectedTags.add(tagEl.dataset.tag);
          renderTagPills(elements.tagSearchInput ? elements.tagSearchInput.value : '');
          state.currentPage = 1;
          applyFilters();
        });
      });

      // Quick Read Modal Event
      card.querySelector('.quick-read-btn')?.addEventListener('click', () => {
        openReaderModal(writeup.url, writeup.title);
        markAsRead(writeup.id);
      });

      // Bookmark Toggle Event
      card.querySelector('.bookmark-btn')?.addEventListener('click', () => {
        toggleBookmark(writeup.id);
      });

      // Read Status Toggle Event
      card.querySelector('.is-read-btn')?.addEventListener('click', () => {
        toggleReadStatus(writeup.id);
      });

      // Copy Link Event
      card.querySelector('.copy-btn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(writeup.url).then(() => {
          showToast('Article link copied to clipboard!');
        });
      });

      elements.writeupsContainer.appendChild(card);
    });
  }

  // Bookmark State Manager
  function toggleBookmark(id) {
    if (state.bookmarks.has(id)) {
      state.bookmarks.delete(id);
      showToast('Removed from bookmarks');
    } else {
      state.bookmarks.add(id);
      showToast('Saved to bookmarks ⭐');
    }
    localStorage.setItem(STORAGE_BOOKMARKS, JSON.stringify(Array.from(state.bookmarks)));
    updateHeaderStats();
    applyFilters();
  }

  // Read History Manager
  function toggleReadStatus(id) {
    if (state.readHistory.has(id)) {
      state.readHistory.delete(id);
    } else {
      state.readHistory.add(id);
    }
    localStorage.setItem(STORAGE_READ_HISTORY, JSON.stringify(Array.from(state.readHistory)));
    updateHeaderStats();
    applyFilters();
  }

  function markAsRead(id) {
    if (!state.readHistory.has(id)) {
      state.readHistory.add(id);
      localStorage.setItem(STORAGE_READ_HISTORY, JSON.stringify(Array.from(state.readHistory)));
      updateHeaderStats();
      applyFilters();
    }
  }

  // In-App Reader Modal Control
  function openReaderModal(url, title) {
    if (!elements.readerModal || !elements.readerIframe) return;
    if (elements.readerTitle) elements.readerTitle.textContent = title;
    if (elements.openExternalLinkBtn) elements.openExternalLinkBtn.href = url;

    elements.readerIframe.src = url;
    elements.readerModal.classList.add('show');
  }

  function closeReaderModal() {
    if (!elements.readerModal) return;
    elements.readerModal.classList.remove('show');
    if (elements.readerIframe) elements.readerIframe.src = 'about:blank';
  }

  // Export Utilities (Markdown, JSON, CSV, Discord)
  function exportMarkdown() {
    const content = state.filteredWriteups.map(w => `- [${w.title}](${w.url}) - *Tags: #${w.tags.join(', #')}*`).join('\n');
    navigator.clipboard.writeText(content).then(() => {
      showToast('Copied filtered list as Markdown to clipboard!');
      closeExportModal();
    });
  }

  function exportDiscord() {
    const content = state.filteredWriteups.map(w => `**${w.title}**\n<${w.url}>`).join('\n\n');
    navigator.clipboard.writeText(content).then(() => {
      showToast('Copied Discord formatted list to clipboard!');
      closeExportModal();
    });
  }

  function exportJson() {
    const jsonStr = JSON.stringify(state.filteredWriteups, null, 2);
    downloadFile(jsonStr, 'writeups_export.json', 'application/json');
    showToast('Downloaded writeups_export.json');
    closeExportModal();
  }

  function exportCsv() {
    const headers = 'Title,URL,Time,IsNew,IsToday,Tags\n';
    const rows = state.filteredWriteups.map(w =>
      `"${escapeCsv(w.title)}","${w.url}","${w.rawTime}","${w.isNew}","${w.isToday}","${w.tags.join(';')}"`
    ).join('\n');

    downloadFile(headers + rows, 'writeups_export.csv', 'text/csv');
    showToast('Downloaded writeups_export.csv');
    closeExportModal();
  }

  function downloadFile(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function escapeCsv(str) {
    return str.replace(/"/g, '""');
  }

  // Active Filter Summary Bar
  function renderActiveFilterSummary() {
    if (!elements.activeFilterSummary) return;

    const parts = [];

    if (state.timeRange !== 'any') parts.push(`Time: <strong>${timeLabels[state.timeRange]}</strong>`);
    if (state.isNewOnly) parts.push(`Status: <strong>IsNew Only</strong>`);
    if (state.isTodayOnly) parts.push(`Status: <strong>IsToday Only</strong>`);
    if (state.isBookmarksOnly) parts.push(`Status: <strong>Bookmarks Only</strong>`);
    if (state.isUnreadOnly) parts.push(`Status: <strong>Unread Only</strong>`);
    if (state.selectedTags.size > 0) parts.push(`Tags: <strong>#${Array.from(state.selectedTags).join(', #')}</strong>`);
    if (state.searchQuery) parts.push(`Search: <strong>"${escapeHtml(state.searchQuery)}"</strong>`);

    if (parts.length > 0) {
      elements.activeFilterSummary.style.display = 'flex';
      elements.activeFilterSummary.innerHTML = `
        <div>Filtering by: ${parts.join(' &bull; ')}</div>
        <button class="clear-all-btn" id="reset-all-filters-btn">Clear All Filters</button>
      `;
      document.getElementById('reset-all-filters-btn')?.addEventListener('click', resetAllFilters);
    } else {
      elements.activeFilterSummary.style.display = 'none';
    }
  }

  function resetAllFilters() {
    state.searchQuery = '';
    state.timeRange = 'any';
    state.customStart = null;
    state.customEnd = null;
    state.isNewOnly = false;
    state.isTodayOnly = false;
    state.isBookmarksOnly = false;
    state.isUnreadOnly = false;
    state.selectedTags.clear();
    state.currentPage = 1;

    if (elements.searchInput) elements.searchInput.value = '';
    if (elements.searchClear) elements.searchClear.style.display = 'none';

    updateTimeDropdownUI('any');
    updateToggleButtonsUI();
    renderTagPills();
    applyFilters();
  }

  // Pagination Renderer
  function renderPagination() {
    if (!elements.paginationContainer) return;

    const totalItems = state.filteredWriteups.length;
    const totalPages = Math.ceil(totalItems / state.pageSize);

    if (totalPages <= 1) {
      elements.paginationContainer.style.display = 'none';
      return;
    }

    elements.paginationContainer.style.display = 'flex';
    if (elements.pageInfo) {
      elements.pageInfo.textContent = `Page ${state.currentPage} of ${totalPages}`;
    }

    if (elements.prevPageBtn) elements.prevPageBtn.disabled = state.currentPage <= 1;
    if (elements.nextPageBtn) elements.nextPageBtn.disabled = state.currentPage >= totalPages;
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // Search Input
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        if (elements.searchClear) elements.searchClear.style.display = state.searchQuery ? 'block' : 'none';
        state.currentPage = 1;
        applyFilters();
      });
    }

    if (elements.searchClear) {
      elements.searchClear.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.searchClear.style.display = 'none';
        state.currentPage = 1;
        applyFilters();
      });
    }

    // Time Dropdown Toggle
    if (elements.timeDropdownBtn && elements.timeDropdownMenu) {
      elements.timeDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = elements.timeDropdownMenu.classList.contains('show');
        elements.timeDropdownMenu.classList.toggle('show', !isOpen);
        elements.timeDropdownBtn.classList.toggle('active', !isOpen);
      });

      document.addEventListener('click', () => {
        elements.timeDropdownMenu.classList.remove('show');
        elements.timeDropdownBtn.classList.remove('active');
      });

      elements.timeDropdownMenu.querySelectorAll('.time-option').forEach(option => {
        option.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = option.dataset.value;

          if (val === 'custom') {
            elements.timeDropdownMenu.classList.remove('show');
            elements.timeDropdownBtn.classList.remove('active');
            openCustomRangeModal();
            return;
          }

          updateTimeDropdownUI(val);
          state.timeRange = val;
          state.currentPage = 1;
          applyFilters();
          elements.timeDropdownMenu.classList.remove('show');
          elements.timeDropdownBtn.classList.remove('active');
        });
      });
    }

    // Status Toggles
    if (elements.toggleNewBtn) {
      elements.toggleNewBtn.addEventListener('click', () => {
        state.isNewOnly = !state.isNewOnly;
        updateToggleButtonsUI();
        state.currentPage = 1;
        applyFilters();
      });
    }

    if (elements.toggleTodayBtn) {
      elements.toggleTodayBtn.addEventListener('click', () => {
        state.isTodayOnly = !state.isTodayOnly;
        updateToggleButtonsUI();
        state.currentPage = 1;
        applyFilters();
      });
    }

    if (elements.toggleBookmarksBtn) {
      elements.toggleBookmarksBtn.addEventListener('click', () => {
        state.isBookmarksOnly = !state.isBookmarksOnly;
        updateToggleButtonsUI();
        state.currentPage = 1;
        applyFilters();
      });
    }

    if (elements.statBookmarks) {
      elements.statBookmarks.parentElement.addEventListener('click', () => {
        state.isBookmarksOnly = true;
        updateToggleButtonsUI();
        state.currentPage = 1;
        applyFilters();
      });
    }

    if (elements.toggleUnreadBtn) {
      elements.toggleUnreadBtn.addEventListener('click', () => {
        state.isUnreadOnly = !state.isUnreadOnly;
        updateToggleButtonsUI();
        state.currentPage = 1;
        applyFilters();
      });
    }

    // Sort Select
    if (elements.sortSelect) {
      elements.sortSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        applyFilters();
      });
    }

    // View Toggle Buttons
    if (elements.viewGridBtn && elements.viewListBtn) {
      elements.viewGridBtn.addEventListener('click', () => {
        state.viewMode = 'grid';
        elements.viewGridBtn.classList.add('active');
        elements.viewListBtn.classList.remove('active');
        renderResults();
      });

      elements.viewListBtn.addEventListener('click', () => {
        state.viewMode = 'list';
        elements.viewListBtn.classList.add('active');
        elements.viewGridBtn.classList.remove('active');
        renderResults();
      });
    }

    // Header Toolbar Buttons
    if (elements.toggleAnalyticsBtn) {
      elements.toggleAnalyticsBtn.addEventListener('click', () => {
        elements.analyticsDrawer?.classList.toggle('show');
      });
    }
    if (elements.closeAnalyticsBtn) {
      elements.closeAnalyticsBtn.addEventListener('click', () => {
        elements.analyticsDrawer?.classList.remove('show');
      });
    }

    if (elements.exportBtn) {
      elements.exportBtn.addEventListener('click', openExportModal);
    }
    if (elements.closeExportBtn) {
      elements.closeExportBtn.addEventListener('click', closeExportModal);
    }
    if (elements.exportMarkdownBtn) elements.exportMarkdownBtn.addEventListener('click', exportMarkdown);
    if (elements.exportDiscordBtn) elements.exportDiscordBtn.addEventListener('click', exportDiscord);
    if (elements.exportJsonBtn) elements.exportJsonBtn.addEventListener('click', exportJson);
    if (elements.exportCsvBtn) elements.exportCsvBtn.addEventListener('click', exportCsv);

    if (elements.shortcutsBtn) {
      elements.shortcutsBtn.addEventListener('click', openShortcutsModal);
    }
    if (elements.closeShortcutsBtn) {
      elements.closeShortcutsBtn.addEventListener('click', closeShortcutsModal);
    }

    // Reader Modal Listeners
    if (elements.closeReaderBtn) elements.closeReaderBtn.addEventListener('click', closeReaderModal);
    if (elements.readerThemeDark) {
      elements.readerThemeDark.addEventListener('click', () => {
        elements.readerModal?.classList.add('reader-theme-dark');
        elements.readerModal?.classList.remove('reader-theme-sepia');
      });
    }
    if (elements.readerThemeSepia) {
      elements.readerThemeSepia.addEventListener('click', () => {
        elements.readerModal?.classList.add('reader-theme-sepia');
        elements.readerModal?.classList.remove('reader-theme-dark');
      });
    }

    // Pagination Click Listeners
    if (elements.prevPageBtn) {
      elements.prevPageBtn.addEventListener('click', () => {
        if (state.currentPage > 1) {
          state.currentPage--;
          applyFilters();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    if (elements.nextPageBtn) {
      elements.nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(state.filteredWriteups.length / state.pageSize);
        if (state.currentPage < totalPages) {
          state.currentPage++;
          applyFilters();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    // Custom Date Range Modal Listeners
    if (elements.modalCloseBtn) elements.modalCloseBtn.addEventListener('click', closeCustomRangeModal);
    if (elements.cancelCustomRangeBtn) elements.cancelCustomRangeBtn.addEventListener('click', closeCustomRangeModal);
    if (elements.applyCustomRangeBtn) {
      elements.applyCustomRangeBtn.addEventListener('click', () => {
        const startVal = elements.startDateInput.value;
        const endVal = elements.endDateInput.value;

        if (!startVal && !endVal) {
          showToast('Please select at least one date.');
          return;
        }

        state.customStart = startVal ? new Date(startVal).getTime() : null;
        state.customEnd = endVal ? new Date(endVal + 'T23:59:59').getTime() : null;

        state.timeRange = 'custom';
        updateTimeDropdownUI('custom');
        closeCustomRangeModal();
        state.currentPage = 1;
        applyFilters();
      });
    }

    // Power-User Keyboard Shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
  }

  // Keyboard Shortcuts Handler
  function handleKeyboardShortcuts(e) {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      if (e.key === 'Escape') document.activeElement.blur();
      return;
    }

    if (e.key === '/' || e.key === 's') {
      e.preventDefault();
      elements.searchInput?.focus();
    } else if (e.key === '?') {
      e.preventDefault();
      openShortcutsModal();
    } else if (e.key === 'Escape') {
      closeCustomRangeModal();
      closeReaderModal();
      closeExportModal();
      closeShortcutsModal();
      elements.analyticsDrawer?.classList.remove('show');
    } else if (e.key === 'j' || e.key === 'ArrowDown') {
      e.preventDefault();
      moveKeyboardHighlight(1);
    } else if (e.key === 'k' || e.key === 'ArrowUp') {
      e.preventDefault();
      moveKeyboardHighlight(-1);
    } else if (e.key === 'b') {
      e.preventDefault();
      const currentItem = getHighlightedItem();
      if (currentItem) toggleBookmark(currentItem.id);
    } else if (e.key === 'r') {
      e.preventDefault();
      const currentItem = getHighlightedItem();
      if (currentItem) toggleReadStatus(currentItem.id);
    } else if (e.key === 'o' || e.key === 'Enter') {
      const currentItem = getHighlightedItem();
      if (currentItem) openReaderModal(currentItem.url, currentItem.title);
    }
  }

  function moveKeyboardHighlight(direction) {
    const pageItems = getPageItems();
    if (pageItems.length === 0) return;

    state.selectedIndex += direction;
    if (state.selectedIndex < 0) state.selectedIndex = 0;
    if (state.selectedIndex >= pageItems.length) state.selectedIndex = pageItems.length - 1;

    renderResults();
    const selectedCard = elements.writeupsContainer.querySelector(`[data-index="${state.selectedIndex}"]`);
    if (selectedCard) {
      selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function getPageItems() {
    const startIndex = (state.currentPage - 1) * state.pageSize;
    return state.filteredWriteups.slice(startIndex, startIndex + state.pageSize);
  }

  function getHighlightedItem() {
    const pageItems = getPageItems();
    if (state.selectedIndex >= 0 && state.selectedIndex < pageItems.length) {
      return pageItems[state.selectedIndex];
    }
    return null;
  }

  // Update UI state for Time Dropdown
  function updateTimeDropdownUI(val) {
    if (!elements.timeDropdownLabel || !elements.timeDropdownMenu) return;
    elements.timeDropdownLabel.textContent = timeLabels[val] || 'Any time';

    elements.timeDropdownMenu.querySelectorAll('.time-option').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.value === val);
    });
  }

  // Update UI for Toggle Buttons
  function updateToggleButtonsUI() {
    if (elements.toggleNewBtn) elements.toggleNewBtn.classList.toggle('active', state.isNewOnly);
    if (elements.toggleTodayBtn) elements.toggleTodayBtn.classList.toggle('active', state.isTodayOnly);
    if (elements.toggleBookmarksBtn) elements.toggleBookmarksBtn.classList.toggle('active', state.isBookmarksOnly);
    if (elements.toggleUnreadBtn) elements.toggleUnreadBtn.classList.toggle('active', state.isUnreadOnly);
  }

  // Modal Control Functions
  function openCustomRangeModal() { elements.customRangeModal?.classList.add('show'); }
  function closeCustomRangeModal() { elements.customRangeModal?.classList.remove('show'); }
  function openExportModal() { elements.exportModal?.classList.add('show'); }
  function closeExportModal() { elements.exportModal?.classList.remove('show'); }
  function openShortcutsModal() { elements.shortcutsModal?.classList.add('show'); }
  function closeShortcutsModal() { elements.shortcutsModal?.classList.remove('show'); }

  // Loading & Empty States
  function showLoadingState() {
    if (!elements.writeupsContainer) return;
    elements.writeupsContainer.className = 'writeups-grid';
    elements.writeupsContainer.innerHTML = Array(6).fill(0).map(() => `
      <div class="writeup-card" style="opacity:0.5; min-height:180px;">
        <div style="height:15px; background:rgba(255,255,255,0.1); border-radius:4px; width:40%;"></div>
        <div style="height:24px; background:rgba(255,255,255,0.1); border-radius:4px; width:85%; margin-top:10px;"></div>
        <div style="height:15px; background:rgba(255,255,255,0.1); border-radius:4px; width:60%; margin-top:10px;"></div>
      </div>
    `).join('');
  }

  function showErrorState(msg) {
    if (!elements.writeupsContainer) return;
    elements.writeupsContainer.className = '';
    elements.writeupsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="empty-title">Failed to load writeups</div>
        <div class="empty-desc">${escapeHtml(msg)}</div>
      </div>
    `;
  }

  function renderEmptyState() {
    elements.writeupsContainer.className = '';
    elements.writeupsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-search"></i></div>
        <div class="empty-title">No writeups match your criteria</div>
        <div class="empty-desc">Try clearing your filters, broadening your search query, or selecting a different date range.</div>
        <button class="btn-primary" id="empty-reset-btn" style="margin-top:0.5rem;">Reset All Filters</button>
      </div>
    `;
    document.getElementById('empty-reset-btn')?.addEventListener('click', resetAllFilters);
  }

  // Relative Time Formatter
  function formatRelativeTime(timestamp, refTime) {
    if (!timestamp || timestamp === 0) return 'Recently';

    const diffMs = refTime - timestamp;
    if (diffMs < 0) return 'Just now';

    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffMins < 60) return `${diffMins || 1}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;

    const d = new Date(timestamp);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Highlight matching search text
  function highlightSearchText(text, query) {
    if (!query) return escapeHtml(text);
    const escapedText = escapeHtml(text);
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return escapedText.replace(regex, '<mark style="background:rgba(56,189,248,0.3); color:#fff; border-radius:2px; padding:0 2px;">$1</mark>');
  }

  // Toast Notification System
  function showToast(message) {
    if (!elements.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-check-circle" style="color:var(--accent-emerald);"></i> ${escapeHtml(message)}`;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 350);
    }, 2500);
  }

  // Helper Utilities
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
