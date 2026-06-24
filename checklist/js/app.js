/**
 * app.js — Main application logic for the Bug Bounty Checklist Dashboard
 *
 * Responsibilities:
 *  - Fetch data/CHECKLIST.md and parse it via parser.js
 *  - Flatten subcategories into a single list of topic cards
 *  - Initialize the dashboard via renderer.js
 *  - Handle search, category filtering
 *  - Track checked checklist items via localStorage
 *  - Manage state
 */

(function () {
  'use strict';

  // ── Site links config ─────────────────────────────────────
  var SITE_LINKS = [
    { label: 'KrazePlanet Dorks', url: 'https://dorks.krazeplanet.com' },
    { label: 'KrazePlanet Labs',  url: 'https://labs.krazeplanet.com' },
    { label: 'KrazePlanetBlogs', url: 'https://blogs.krazeplanet.com' },
  ];

  let allCategories = [];
  let allTopics = [];
  let currentFilter = 'all';
  let currentSeverity = 'all';
  let currentSearch = '';
  let debounceTimer = null;
  let bookmarkedIds = new Set();
  let currentTarget = 'default';
  let currentUncheckedOnly = false;
  let expandAllState = false;
  let noteDebounceTimer = null;
  let isNewSessionMode = false;

  const dashboardGrid = document.getElementById('dashboardGrid');
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  const navLinks = document.querySelectorAll('.nav-link');
  const navToggle = document.getElementById('navToggle');
  const navLinksContainer = document.getElementById('navLinks');

  document.addEventListener('DOMContentLoaded', init);

  // ── Drag & Drop ───────────────────────────────
  var _dragSrc = null;

  function initDragDrop() {
    dashboardGrid.querySelectorAll('.topic-card').forEach(function(card) {
      card.setAttribute('draggable', 'true');

      card.addEventListener('dragstart', function(e) {
        _dragSrc = card;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.cardId || '');
        setTimeout(function() { card.classList.add('drag-dragging'); }, 0);
      });

      card.addEventListener('dragend', function() {
        card.classList.remove('drag-dragging');
        dashboardGrid.querySelectorAll('.drag-over-before, .drag-over-after')
          .forEach(function(el) { el.classList.remove('drag-over-before', 'drag-over-after'); });
        _dragSrc = null;
      });

      card.addEventListener('dragover', function(e) {
        if (!_dragSrc || _dragSrc === card) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        var mid = card.getBoundingClientRect().top + card.offsetHeight / 2;
        dashboardGrid.querySelectorAll('.drag-over-before, .drag-over-after')
          .forEach(function(el) { el.classList.remove('drag-over-before', 'drag-over-after'); });
        card.classList.add(e.clientY < mid ? 'drag-over-before' : 'drag-over-after');
      });

      card.addEventListener('dragleave', function(e) {
        if (!card.contains(e.relatedTarget)) {
          card.classList.remove('drag-over-before', 'drag-over-after');
        }
      });

      card.addEventListener('drop', function(e) {
        if (!_dragSrc || _dragSrc === card) return;
        e.preventDefault();
        var before = card.classList.contains('drag-over-before');
        card.classList.remove('drag-over-before', 'drag-over-after');
        dashboardGrid.insertBefore(_dragSrc, before ? card : card.nextSibling);
        saveDragOrder();
        syncTopicsFromDom();
      });
    });
  }

  function saveDragOrder() {
    var order = Array.from(dashboardGrid.querySelectorAll('.topic-card')).map(function(c) {
      return c.dataset.cardId;
    });
    try { localStorage.setItem('kp-card-order', JSON.stringify(order)); } catch (e) {}
  }

  function loadDragOrder() {
    try {
      var s = localStorage.getItem('kp-card-order');
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  }

  function applyDragOrder() {
    var order = loadDragOrder();
    if (!order || !order.length) return;
    order.forEach(function(id) {
      var card = dashboardGrid.querySelector('.topic-card[data-card-id="' + id + '"]');
      if (card) dashboardGrid.appendChild(card);
    });
    syncTopicsFromDom();
  }

  function syncTopicsFromDom() {
    var domOrder = Array.from(dashboardGrid.querySelectorAll('.topic-card')).map(function(c) {
      return c.dataset.cardId;
    });
    allTopics.sort(function(a, b) {
      var ai = domOrder.indexOf(a.sub.id), bi = domOrder.indexOf(b.sub.id);
      return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi);
    });
  }
  // ─────────────────────────────────────────────

  async function init() {
    try {
      bookmarkedIds = getBookmarkedIds();
      await loadData();
      flattenTopics();
      sortAllTopics();
      // Hide skeleton placeholders
      var skeletons = document.querySelectorAll('.skeleton-card');
      skeletons.forEach(function(s) { s.style.display = 'none'; });

      renderDashboard(allTopics, dashboardGrid);
      updateTotalStats();
      renderFooterSiteLinks();
      applyDragOrder();
      bindEvents();
      initDragDrop();
      restoreState();
      updateAllProgress();
      updateGlobalProgress();
      renderSessionTabs();
    } catch (err) {
      console.error('Failed to initialize:', err);
      dashboardGrid.innerHTML = `
        <div class="error-state">
          <span class="error-icon">⚠️</span>
          <h2>Failed to load checklists</h2>
          <p>${escapeHtml(err.message)}</p>
          <button onclick="location.reload()" class="btn btn-primary">Retry</button>
        </div>`;
    }
  }

  async function loadData() {
    var resp = await fetch('https://raw.githubusercontent.com/KrazePlanet/BugBountyChecklist/refs/heads/main/CHECKLIST.md');
    if (!resp.ok) throw new Error('HTTP ' + resp.status + ': CHECKLIST.md');
    var text = await resp.text();
    var parsed = parseChecklist(text);
    allCategories = parsed.categories;
    if (!allCategories.length) throw new Error('CHECKLIST.md parsed 0 categories.');
  }

  function flattenTopics() {
    allTopics = [];
    allCategories.forEach(function(cat) {
      if (cat.subcategories && Array.isArray(cat.subcategories)) {
        cat.subcategories.forEach(function(sub) {
          allTopics.push({ sub: sub, categoryKey: cat.categoryKey || getFilterKey(cat.category) });
        });
      } else if (cat.items) {
        allTopics.push({
          sub: {
            id: cat.categoryKey || cat.category.toLowerCase().replace(/\s+/g, ''),
            title: cat.category,
            icon: cat.icon,
            color: cat.color,
            description: cat.description,
            items: cat.items,
          },
          categoryKey: cat.categoryKey || getFilterKey(cat.category),
        });
      }
    });
  }

  function renderFooterSiteLinks() {
    var container = document.getElementById('footerSiteLinks');
    if (!container) return;
    container.innerHTML = SITE_LINKS.map(function(site) {
      return '<li><a href="' + site.url + '" target="_blank" rel="noopener" class="footer-site-link">' + site.label + '</a></li>';
    }).join('');
  }

  function bindEvents() {
    searchInput.addEventListener('input', handleSearchInput);
    searchClear.addEventListener('click', clearSearch);
    navLinks.forEach(function(link) { link.addEventListener('click', handleNavClick); });
    navToggle.addEventListener('click', toggleMobileNav);
    dashboardGrid.addEventListener('click', handleDashboardClick);
    dashboardGrid.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        var target = e.target.closest('[tabindex]');
        if (target) { e.preventDefault(); target.click(); }
      }
    });
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.navbar')) {
        navLinksContainer.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName))) {
        e.preventDefault();
        searchInput.focus();
      }
    });
    dashboardGrid.addEventListener('click', function(e) {
      var copyBtn = e.target.closest('.copy-btn');
      if (copyBtn) handleCopyCommand(copyBtn);
    });
    var filterBar = document.getElementById('filterBar');
    if (filterBar) filterBar.addEventListener('click', handleSeverityClick);
    var resetPanelBtn = document.getElementById('resetProgressPanel');
    if (resetPanelBtn) resetPanelBtn.addEventListener('click', resetProgress);
    var uncheckedBtn = document.getElementById('uncheckedOnly');
    if (uncheckedBtn) uncheckedBtn.addEventListener('click', toggleUncheckedOnly);
    var collapseBtn = document.getElementById('collapseAll');
    if (collapseBtn) collapseBtn.addEventListener('click', toggleExpandAll);
    var exportBtn = document.getElementById('exportReport');
    if (exportBtn) exportBtn.addEventListener('click', exportReport);
    var targetInputEl = document.getElementById('targetInput');
    if (targetInputEl) {
      targetInputEl.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.target.blur(); }
        if (e.key === 'Escape') { isNewSessionMode = false; this.value = currentTarget; this.blur(); }
      });
      targetInputEl.addEventListener('blur', function() {
        var val = this.value.trim();
        if (isNewSessionMode) {
          isNewSessionMode = false;
          this.placeholder = 'target-name';
          if (val && val !== currentTarget) {
            switchTarget(val);
          } else {
            this.value = currentTarget;
          }
        } else {
          if (!val || val === currentTarget) {
            this.value = currentTarget;
          } else {
            renameTarget(currentTarget, val);
          }
        }
      });
      targetInputEl.addEventListener('focus', function() { this.select(); });
    }
    var sessionTabsCont = document.getElementById('sessionTabs');
    if (sessionTabsCont) sessionTabsCont.addEventListener('click', function(e) {
      var del = e.target.closest('.session-tab-del');
      if (del) { e.stopPropagation(); deleteSession(del.dataset.target); return; }
      var tab = e.target.closest('.session-tab');
      if (tab) switchTarget(tab.dataset.target);
    });
    var newSessionBtn = document.getElementById('newSession');
    if (newSessionBtn) newSessionBtn.addEventListener('click', function() {
      var inp = document.getElementById('targetInput');
      if (!inp) return;
      isNewSessionMode = true;
      inp.placeholder = 'New session name...';
      inp.value = '';
      inp.focus();
    });
    dashboardGrid.addEventListener('input', function(e) {
      var textarea = e.target.closest('.item-notes');
      if (textarea) {
        clearTimeout(noteDebounceTimer);
        noteDebounceTimer = setTimeout(function() { saveNote(textarea.dataset.itemId, textarea.value); }, 400);
      }
    });
  }

  function handleSearchInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function() {
      currentSearch = searchInput.value;
      saveState();
      applyVisibilityFilters();
      searchClear.style.display = currentSearch.trim() ? 'flex' : 'none';
    }, 200);
  }

  function clearSearch() {
    searchInput.value = '';
    currentSearch = '';
    searchClear.style.display = 'none';
    applyVisibilityFilters();
    navLinks.forEach(function(l) { l.classList.remove('active'); });
    var activeLink = document.querySelector('.nav-link[data-filter="' + currentFilter + '"]');
    if (activeLink) activeLink.classList.add('active');
    saveState();
    searchInput.focus();
  }

  function handleNavClick(e) {
    var link = e.currentTarget;
    var filterKey = link.dataset.filter;
    if (!filterKey) return;
    e.preventDefault();
    navLinks.forEach(function(l) { l.classList.remove('active'); });
    link.classList.add('active');
    currentFilter = filterKey;
    currentSearch = '';
    searchInput.value = '';
    searchClear.style.display = 'none';
    applyVisibilityFilters();
    navLinksContainer.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    saveState();
  }

  function handleDashboardClick(e) {
    var heart = e.target.closest('.bookmark-heart');
    if (heart) {
      var card = heart.closest('.topic-card');
      if (card) toggleBookmark(card.dataset.cardId);
      return;
    }

    var itemHeader = e.target.closest('.item-header');
    if (itemHeader && !e.target.closest('.item-checkbox') && !e.target.closest('.copy-btn')) {
      var item = itemHeader.closest('.checklist-item');
      if (item) {
        item.classList.toggle('expanded');
        itemHeader.setAttribute('aria-expanded', item.classList.contains('expanded'));
        return;
      }
    }
    var checkbox = e.target.closest('.item-checkbox');
    if (checkbox) toggleCheckItem(checkbox);
  }

  function toggleCheckItem(checkbox) {
    var itemId = checkbox.dataset.itemId;
    if (!itemId) return;
    var item = checkbox.closest('.checklist-item');
    item.classList.toggle('checked');
    var checkedIds = getCheckedIds();
    if (item.classList.contains('checked')) {
      checkedIds.add(itemId);
    } else {
      checkedIds.delete(itemId);
    }
    saveCheckedIds(checkedIds);
    updateAllProgress();
    if (currentUncheckedOnly) applyVisibilityFilters();
  }

  function getCheckedIds() {
    try {
      var stored = localStorage.getItem('kp-' + currentTarget + '-checked');
      return new Set(stored ? JSON.parse(stored) : []);
    } catch (e) { return new Set(); }
  }

  function saveCheckedIds(ids) {
    try { localStorage.setItem('kp-' + currentTarget + '-checked', JSON.stringify(Array.from(ids))); } catch (e) {}
  }

  function getBookmarkedIds() {
    try {
      var stored = localStorage.getItem('kp-checklist-bookmarks');
      return new Set(stored ? JSON.parse(stored) : []);
    } catch (e) { return new Set(); }
  }

  function saveBookmarkedIds() {
    try { localStorage.setItem('kp-checklist-bookmarks', JSON.stringify(Array.from(bookmarkedIds))); } catch (e) {}
  }

  function toggleBookmark(cardId) {
    if (bookmarkedIds.has(cardId)) {
      bookmarkedIds.delete(cardId);
    } else {
      bookmarkedIds.add(cardId);
    }
    saveBookmarkedIds();
    sortAllTopics();
    renderDashboard(allTopics, dashboardGrid);
    applyDragOrder();
    initDragDrop();
    restoreCheckedState();
    updateAllProgress();
    applyCurrentFilter();
  }

  function sortAllTopics() {
    allTopics.sort(function(a, b) {
      var aBookmarked = bookmarkedIds.has(a.sub.id);
      var bBookmarked = bookmarkedIds.has(b.sub.id);
      if (aBookmarked && !bBookmarked) return -1;
      if (!aBookmarked && bBookmarked) return 1;
      return 0;
    });
  }

  function applyCurrentFilter() {
    var link = document.querySelector('.nav-link[data-filter="' + currentFilter + '"]');
    if (link) {
      navLinks.forEach(function(l) { l.classList.remove('active'); });
      link.classList.add('active');
    }
    applyVisibilityFilters();
  }

  function applyVisibilityFilters() {
    var query = currentSearch.trim().toLowerCase();
    var cards = document.querySelectorAll('.topic-card');
    var visibleCards = 0;
    var visibleItems = 0;

    cards.forEach(function(card) {
      var matchesCategory = currentFilter === 'all' || card.dataset.filterKey === currentFilter;
      if (!matchesCategory) {
        card.style.display = 'none';
        return;
      }

      var items = card.querySelectorAll('.checklist-item');
      var cardHasMatch = false;

      items.forEach(function(item) {
        var matchesSeverity = currentSeverity === 'all' || item.dataset.severity === currentSeverity;
        var matchesSearch = true;
        if (query) {
          var title = item.querySelector('.item-title')?.textContent?.toLowerCase() || '';
          var desc = item.querySelector('.item-description')?.textContent?.toLowerCase() || '';
          var tags = Array.from(item.querySelectorAll('.tag')).map(function(t) { return t.textContent.toLowerCase(); }).join(' ');
          matchesSearch = title.includes(query) || desc.includes(query) || tags.includes(query);
        }
        var matchesUnchecked = !currentUncheckedOnly || !item.classList.contains('checked');
        if (matchesSeverity && matchesSearch && matchesUnchecked) {
          item.style.display = '';
          cardHasMatch = true;
          visibleItems++;
        } else {
          item.style.display = 'none';
        }
      });

      card.style.display = cardHasMatch ? '' : 'none';
      if (cardHasMatch) visibleCards++;
    });

    var noResultsEl = document.getElementById('noResults');
    if (noResultsEl) {
      noResultsEl.style.display = visibleCards === 0 ? '' : 'none';
    }

    var resultsEl = document.getElementById('resultsCount');
    if (resultsEl) {
      if (!query && currentSeverity === 'all' && currentFilter === 'all') {
        var totalItems = allTopics.reduce(function(sum, t) { return sum + t.sub.items.length; }, 0);
        resultsEl.textContent = 'Showing all ' + totalItems + ' checklists across ' + allTopics.length + ' topics';
      } else {
        var parts = [];
        if (currentSeverity !== 'all') parts.push(currentSeverity);
        if (query) parts.push('"' + query + '"');
        if (currentFilter !== 'all') parts.push(currentFilter);
        resultsEl.textContent = 'Found ' + visibleItems + ' result' + (visibleItems !== 1 ? 's' : '') + ' in ' + visibleCards + ' topic' + (visibleCards !== 1 ? 's' : '') + (parts.length ? ' for ' + parts.join(' + ') : '');
      }
    }
  }

  function handleSeverityClick(e) {
    var pill = e.target.closest('.severity-pill');
    if (!pill) return;
    var sev = pill.dataset.severity;
    if (!sev) return;
    document.querySelectorAll('.severity-pill').forEach(function(p) { p.classList.remove('active'); });
    pill.classList.add('active');
    currentSeverity = sev;
    applyVisibilityFilters();
  }

  function resetProgress() {
    try { localStorage.removeItem('kp-' + currentTarget + '-checked'); } catch (e) {}
    document.querySelectorAll('.checklist-item.checked').forEach(function(item) {
      item.classList.remove('checked');
    });
    updateAllProgress();
  }

  function updateAllProgress() {
    var checkedIds = getCheckedIds();
    var cards = document.querySelectorAll('.topic-card');
    cards.forEach(function(card) {
      var cardId = card.dataset.cardId;
      if (!cardId) return;
      var items = card.querySelectorAll('.checklist-item');
      var total = items.length;
      var checked = 0;
      items.forEach(function(item) {
        var itemId = item.dataset.itemId;
        if (checkedIds.has(itemId)) checked++;
      });
      var pct = total > 0 ? Math.round((checked / total) * 100) : 0;
      var fill = card.querySelector('.progress-fill');
      var info = card.querySelector('.progress-info');
      if (fill) fill.style.width = pct + '%';
      if (info) info.textContent = checked + '/' + total + ' checked';

      var heart = card.querySelector('.bookmark-heart');
      if (heart) {
        if (bookmarkedIds.has(cardId)) {
          heart.classList.add('bookmarked');
          heart.querySelector('svg').setAttribute('fill', 'currentColor');
          heart.setAttribute('aria-label', 'Remove bookmark');
          heart.setAttribute('aria-pressed', 'true');
          card.classList.add('bookmarked-card');
        } else {
          heart.classList.remove('bookmarked');
          heart.querySelector('svg').setAttribute('fill', 'none');
          heart.setAttribute('aria-label', 'Bookmark this topic');
          heart.setAttribute('aria-pressed', 'false');
          card.classList.remove('bookmarked-card');
        }
      }
    });
    updateGlobalProgress();
  }

  function restoreCheckedState() {
    var checkedIds = getCheckedIds();
    checkedIds.forEach(function(id) {
      var item = document.querySelector('.checklist-item[data-item-id="' + id + '"]');
      if (item) item.classList.add('checked');
    });
  }

  function handleCopyCommand(btn) {
    var cmd = btn.dataset.cmd;
    if (!cmd) return;
    navigator.clipboard.writeText(cmd).then(function() {
      btn.textContent = '\u2705';
      btn.classList.add('copied');
      setTimeout(function() { btn.textContent = '\U0001f4cb'; btn.classList.remove('copied'); }, 1500);
    }).catch(function() {
      var pre = btn.closest('.command-block');
      if (pre) {
        var range = document.createRange();
        range.selectNodeContents(pre);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });
  }

  function toggleMobileNav() {
    var isOpen = navLinksContainer.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen);
  }

  function saveState() {
    try { sessionStorage.setItem('kp-checklist-state', JSON.stringify({ filter: currentFilter })); } catch (e) {}
  }

  function restoreState() {
    var checkedIds = getCheckedIds();
    checkedIds.forEach(function(id) {
      var item = document.querySelector('.checklist-item[data-item-id="' + id + '"]');
      if (item) item.classList.add('checked');
    });
    try {
      var stored = sessionStorage.getItem('kp-checklist-state');
      if (stored) {
        var state = JSON.parse(stored);
        if (state.filter && state.filter !== 'all') {
          var link = document.querySelector('.nav-link[data-filter="' + state.filter + '"]');
          if (link) link.click();
        }
      }
    } catch (e) {}
    restoreNotes();
  }

  function updateTotalStats() {
    var totalItems = allTopics.reduce(function(sum, t) { return sum + t.sub.items.length; }, 0);
    var resultsEl = document.getElementById('resultsCount');
    if (resultsEl) {
      resultsEl.textContent = 'Showing all ' + totalItems + ' checklists across ' + allTopics.length + ' topics';
    }
  }

  function updateGlobalProgress() {
    var checkedIds = getCheckedIds();
    var totalItems = allTopics.reduce(function(sum, t) { return sum + t.sub.items.length; }, 0);
    var pct = totalItems > 0 ? Math.round(checkedIds.size / totalItems * 100) : 0;
    var circumference = 276.46;

    var donutFg = document.getElementById('donutFg');
    if (donutFg) donutFg.setAttribute('stroke-dashoffset', (circumference * (1 - pct / 100)).toFixed(2));

    var donutPct = document.getElementById('donutPct');
    if (donutPct) donutPct.textContent = pct + '%';

    var donutFrac = document.getElementById('donutFrac');
    if (donutFrac) donutFrac.textContent = checkedIds.size + '/' + totalItems;

    var doneCount = document.getElementById('doneCount');
    if (doneCount) doneCount.textContent = checkedIds.size;

    var totalChecks = document.getElementById('totalChecks');
    if (totalChecks) totalChecks.textContent = totalItems;
  }

  function toggleUncheckedOnly() {
    currentUncheckedOnly = !currentUncheckedOnly;
    var btn = document.getElementById('uncheckedOnly');
    if (btn) btn.classList.toggle('active', currentUncheckedOnly);
    applyVisibilityFilters();
  }

  function toggleExpandAll() {
    expandAllState = !expandAllState;
    document.querySelectorAll('.checklist-item').forEach(function(item) {
      if (item.style.display === 'none') return;
      item.classList.toggle('expanded', expandAllState);
      var header = item.querySelector('.item-header');
      if (header) header.setAttribute('aria-expanded', expandAllState);
    });
    var btn = document.getElementById('collapseAll');
    if (btn) btn.textContent = expandAllState ? '\u2191 Collapse all' : '\u2195 Expand all';
  }

  function exportReport() {
    var target = currentTarget;
    var date = new Date().toISOString().split('T')[0];
    var lines = ['# Bug Bounty Report \u2014 ' + target, '**Date:** ' + date, ''];
    document.querySelectorAll('.topic-card').forEach(function(card) {
      if (card.style.display === 'none') return;
      var cardTitle = card.querySelector('.card-title') ? card.querySelector('.card-title').textContent : '';
      var checkedItems = card.querySelectorAll('.checklist-item.checked');
      if (!checkedItems.length) return;
      lines.push('## ' + cardTitle);
      checkedItems.forEach(function(item) {
        var itemTitle = item.querySelector('.item-title') ? item.querySelector('.item-title').textContent : '';
        var sev = item.dataset.severity || 'info';
        var note = getNote(item.dataset.itemId);
        lines.push('- [x] **' + itemTitle + '** `' + sev + '`');
        if (note) lines.push('  > ' + note.split('\n').join('\n  > '));
      });
      lines.push('');
    });
    if (lines.length <= 3) { alert('No checked items to export. Check off some items first!'); return; }
    var blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'bb-report-' + target + '-' + date + '.md';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function getNote(itemId) {
    try { return localStorage.getItem('kp-' + currentTarget + '-note-' + itemId) || ''; } catch(e) { return ''; }
  }

  function saveNote(itemId, text) {
    try {
      if (text) { localStorage.setItem('kp-' + currentTarget + '-note-' + itemId, text); }
      else { localStorage.removeItem('kp-' + currentTarget + '-note-' + itemId); }
      var indicator = document.querySelector('.item-notes-indicator[data-item-id="' + itemId + '"]');
      if (indicator) indicator.classList.toggle('has-notes', !!text);
    } catch(e) {}
  }

  function updateNotesIndicators() {
    document.querySelectorAll('.item-notes-indicator').forEach(function(indicator) {
      var itemId = indicator.dataset.itemId;
      var note = getNote(itemId);
      indicator.classList.toggle('has-notes', !!note);
    });
  }

  function restoreNotes() {
    document.querySelectorAll('.item-notes').forEach(function(textarea) {
      var saved = getNote(textarea.dataset.itemId);
      textarea.value = saved;
    });
    updateNotesIndicators();
  }

  function getTargetList() {
    try { var s = localStorage.getItem('kp-targets'); return s ? JSON.parse(s) : ['default']; } catch(e) { return ['default']; }
  }

  function saveTargetList(targets) {
    try { localStorage.setItem('kp-targets', JSON.stringify(targets)); } catch(e) {}
  }

  function switchTarget(name) {
    name = (name || 'default').trim().replace(/[^a-zA-Z0-9_\-\. ]/g, '-') || 'default';
    currentTarget = name;
    var inp = document.getElementById('targetInput');
    if (inp) inp.value = name;
    var targets = getTargetList();
    if (!targets.includes(name)) {
      targets.unshift(name);
      if (targets.length > 10) targets = targets.slice(0, 10);
      saveTargetList(targets);
    }
    renderSessionTabs();
    document.querySelectorAll('.checklist-item.checked').forEach(function(i) { i.classList.remove('checked'); });
    restoreCheckedState();
    restoreNotes();
    updateAllProgress();
  }

  function renderSessionTabs() {
    var container = document.getElementById('sessionTabs');
    if (!container) return;
    var targets = getTargetList();
    container.innerHTML = targets.map(function(t) {
      return '<span class="session-tab' + (t === currentTarget ? ' active' : '') + '" data-target="' + escapeHtml(t) + '">' +
        '<button class="session-tab-label" data-target="' + escapeHtml(t) + '">' + escapeHtml(t) + '</button>' +
        '<button class="session-tab-del" data-target="' + escapeHtml(t) + '" title="Delete session">\xd7</button>' +
        '</span>';
    }).join('');
  }

  function deleteSession(name) {
    var targets = getTargetList();
    var filtered = targets.filter(function(t) { return t !== name; });
    if (!filtered.length) filtered = ['default'];
    saveTargetList(filtered);
    // Wipe all localStorage data for this session
    var prefix = 'kp-' + name + '-';
    Object.keys(localStorage).forEach(function(key) {
      if (key.indexOf(prefix) === 0) localStorage.removeItem(key);
    });
    if (currentTarget === name) {
      switchTarget(filtered[0]);
    } else {
      renderSessionTabs();
    }
  }

  function handleScroll() {
    var btn = document.getElementById('scrollTopBtn');
    if (!btn) return;
    if (window.scrollY > 300) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }

  // Scroll-to-top button
  document.addEventListener('scroll', handleScroll, { passive: true });

  var scrollBtn = document.getElementById('scrollTopBtn');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function renameTarget(oldName, newName) {
    newName = (newName || '').trim().replace(/[^a-zA-Z0-9_\-\. ]/g, '-').trim() || oldName;
    if (newName === oldName) return;
    // Move checked IDs
    var checkedKey = 'kp-' + oldName + '-checked';
    var checkedData = localStorage.getItem(checkedKey);
    if (checkedData) {
      try { localStorage.setItem('kp-' + newName + '-checked', checkedData); } catch(e) {}
      localStorage.removeItem(checkedKey);
    }
    // Move notes (scan all matching localStorage keys)
    var notePrefix = 'kp-' + oldName + '-note-';
    Object.keys(localStorage).forEach(function(key) {
      if (key.indexOf(notePrefix) === 0) {
        var suffix = key.slice(notePrefix.length);
        try { localStorage.setItem('kp-' + newName + '-note-' + suffix, localStorage.getItem(key)); } catch(e) {}
        localStorage.removeItem(key);
      }
    });
    // Update targets list in-place
    var targets = getTargetList();
    var idx = targets.indexOf(oldName);
    if (idx !== -1) targets[idx] = newName;
    else targets.unshift(newName);
    saveTargetList(targets);
    currentTarget = newName;
    var inp = document.getElementById('targetInput');
    if (inp) inp.value = newName;
    renderSessionTabs();
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

})();
