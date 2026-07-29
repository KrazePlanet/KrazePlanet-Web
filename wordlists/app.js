document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const searchInput = document.getElementById('searchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const categoryPillsContainer = document.getElementById('categoryPills');
  const moreCategoriesDropdown = document.getElementById('moreCategoriesDropdown');
  const moreCategoriesTrigger = document.getElementById('moreCategoriesTrigger');
  const moreCategoriesMenu = document.getElementById('moreCategoriesMenu');
  const wordlistsTableBody = document.getElementById('wordlistsTableBody');
  // Custom Dropdown Elements
  const customSortDropdown = document.getElementById('customSortDropdown');
  const customSortTrigger = document.getElementById('customSortTrigger');
  const customSortSelectedText = document.getElementById('customSortSelectedText');
  const customSortMenu = document.getElementById('customSortMenu');

  // About Modal Elements
  const navAboutBtn = document.getElementById('navAboutBtn');
  const aboutModalOverlay = document.getElementById('aboutModalOverlay');
  const aboutModalCloseBtn = document.getElementById('aboutModalCloseBtn');

  // Modal Elements
  const modalOverlay = document.getElementById('modalOverlay');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalFilename = document.getElementById('modalFilename');
  const modalCategory = document.getElementById('modalCategory');
  const modalLines = document.getElementById('modalLines');
  const modalSize = document.getElementById('modalSize');
  const modalUpdated = document.getElementById('modalUpdated');
  const modalDownloads = document.getElementById('modalDownloads');
  const modalDescription = document.getElementById('modalDescription');
  const modalSampleCode = document.getElementById('modalSampleCode');
  const modalDownloadBtn = document.getElementById('modalDownloadBtn');
  const modalCopyUrlBtn = document.getElementById('modalCopyUrlBtn');

  // Command Generator Elements
  const targetUrlInput = document.getElementById('targetUrlInput');
  const toolTabsContainer = document.getElementById('toolTabsContainer');
  const cmdSnippetText = document.getElementById('cmdSnippetText');
  const btnCopyCmdSnippet = document.getElementById('btnCopyCmdSnippet');

  // Batch Multi-Select Elements
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const batchActionBar = document.getElementById('batchActionBar');
  const selectedCountText = document.getElementById('selectedCountText');
  const btnGenerateScript = document.getElementById('btnGenerateScript');
  const btnCopyBatchUrls = document.getElementById('btnCopyBatchUrls');
  const btnClearSelection = document.getElementById('btnClearSelection');

  // Batch Script Modal Elements
  const batchScriptModalOverlay = document.getElementById('batchScriptModalOverlay');
  const batchScriptCloseBtn = document.getElementById('batchScriptCloseBtn');
  const batchScriptCode = document.getElementById('batchScriptCode');
  const btnCopyBatchScript = document.getElementById('btnCopyBatchScript');

  // State
  let activeCategory = 'All';
  let searchQuery = '';
  let currentSort = 'category-asc';
  let activeItemModal = null;
  let activeToolName = 'ffuf';
  const selectedWordlistIds = new Set();

  // Tool Templates Definition Generator
  function getToolsForItem(item, targetUrl) {
    const url = item.downloadUrl;
    let target = targetUrl.trim() || 'https://target.com';

    // Remove trailing slash for target
    target = target.replace(/\/+$/, '');

    // Extract domain from target
    let domain = 'target.com';
    try {
      const u = new URL(target.startsWith('http') ? target : 'https://' + target);
      domain = u.hostname;
    } catch (e) {
      domain = target.replace(/^https?:\/\//, '').split('/')[0];
    }

    const category = item.category;
    const subCat = item.subCategory;
    const filename = item.name || url.split('/').pop();
    const wgetPrefix = `wget -q -nc ${url} && `;

    if (subCat === 'Subdomains') {
      return [
        { name: 'ffuf', cmd: `${wgetPrefix}ffuf -w ${filename} -u https://FUZZ.${domain}` },
        { name: 'puredns', cmd: `${wgetPrefix}puredns bruteforce ${filename} ${domain}` },
        { name: 'gobuster', cmd: `${wgetPrefix}gobuster dns -d ${domain} -w ${filename}` },
        { name: 'shuffledns', cmd: `${wgetPrefix}shuffledns -d ${domain} -w ${filename} -r resolvers.txt` }
      ];
    }

    if (subCat === 'Parameters') {
      return [
        { name: 'arjun', cmd: `${wgetPrefix}arjun -u ${target} -w ${filename}` },
        { name: 'x8', cmd: `${wgetPrefix}x8 -u "${target}" -w ${filename}` },
        { name: 'ffuf', cmd: `${wgetPrefix}ffuf -w ${filename} -u ${target}?FUZZ=1` }
      ];
    }

    if (subCat === 'DNS') {
      return [
        { name: 'puredns', cmd: `${wgetPrefix}puredns bruteforce subdomains.txt ${domain} -r ${filename}` },
        { name: 'massdns', cmd: `${wgetPrefix}massdns -r ${filename} -t A subdomains.txt` }
      ];
    }

    if (subCat === 'Virtual Hosts') {
      return [
        { name: 'ffuf', cmd: `${wgetPrefix}ffuf -w ${filename} -u ${target} -H "Host: FUZZ"` },
        { name: 'gobuster', cmd: `${wgetPrefix}gobuster vhost -u ${target} -w ${filename}` }
      ];
    }

    if (item.name === 'jwt.txt') {
      return [
        { name: 'hashcat', cmd: `${wgetPrefix}hashcat -m 16500 jwt.txt ${filename}` },
        { name: 'john', cmd: `${wgetPrefix}john --wordlist=${filename} --format=HMAC-SHA256 jwt.txt` }
      ];
    }

    // Default for Directories, Files, API, Cloud, Vulnerabilities, Tech
    return [
      { name: 'ffuf', cmd: `${wgetPrefix}ffuf -w ${filename} -u ${target}/FUZZ` },
      { name: 'gobuster', cmd: `${wgetPrefix}gobuster dir -u ${target} -w ${filename}` },
      { name: 'dirsearch', cmd: `${wgetPrefix}dirsearch -u ${target} -w ${filename}` },
      { name: 'feroxbuster', cmd: `${wgetPrefix}feroxbuster -u ${target} -w ${filename}` },
      { name: 'ffufscan', cmd: `${wgetPrefix}echo "${target}" | ffufscan --filter --wordlist ${filename}` }
    ];
  }

  function renderCmdGenerator() {
    if (!activeItemModal) return;

    const tools = getToolsForItem(activeItemModal, targetUrlInput.value);

    // If activeToolName is not in the list for this item, pick the first tool
    if (!tools.some(t => t.name === activeToolName)) {
      activeToolName = tools[0].name;
    }

    toolTabsContainer.innerHTML = tools.map(t => `
      <button class="tool-tab-btn ${t.name === activeToolName ? 'active' : ''}" data-tool="${t.name}">
        ${t.name}
      </button>
    `).join('');

    const currentToolObj = tools.find(t => t.name === activeToolName) || tools[0];
    cmdSnippetText.textContent = currentToolObj.cmd;

    // Attach listeners to tabs
    toolTabsContainer.querySelectorAll('.tool-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeToolName = e.target.getAttribute('data-tool');
        renderCmdGenerator();
      });
    });
  }

  // Target input listener for live command update
  targetUrlInput.addEventListener('input', () => {
    renderCmdGenerator();
  });

  btnCopyCmdSnippet.addEventListener('click', () => {
    copyToClipboard(cmdSnippetText.textContent);
    showToast(`${activeToolName} command copied to clipboard!`);
    const origHtml = btnCopyCmdSnippet.innerHTML;
    btnCopyCmdSnippet.innerHTML = '✓ Copied!';
    btnCopyCmdSnippet.style.borderColor = '#10b981';
    btnCopyCmdSnippet.style.color = '#10b981';
    setTimeout(() => {
      btnCopyCmdSnippet.innerHTML = origHtml;
      btnCopyCmdSnippet.style.borderColor = '';
      btnCopyCmdSnippet.style.color = '';
    }, 1800);
  });

  // Primary Categories (Always visible)
  const CATEGORIES_PRIMARY = [
    { name: "All", icon: "⚡" },
    { name: "Attack Surface Discovery", icon: "📁" },
    { name: "Content Discovery", icon: "📂" },
    { name: "Cloud Security", icon: "☁️" },
    { name: "Secrets & Exposures", icon: "🔑" },
    { name: "API Testing", icon: "🌐" }
  ];

  // Secondary Categories (Inside +More Dropdown Menu)
  const CATEGORIES_SECONDARY = [
    { name: "Mobile", icon: "📱" },
    { name: "Vulnerability Specific", icon: "💉" },
    { name: "AI & LLM Security", icon: "🤖" },
    { name: "Bug Bounty Specific", icon: "🏢" },
    { name: "Special Collections", icon: "🎯" }
  ];

  // Render Category Pills & Dropdown
  function renderCategoryPills() {
    // Render Primary Category Pills
    categoryPillsContainer.innerHTML = CATEGORIES_PRIMARY.map(cat => `
      <button class="pill-btn ${cat.name === activeCategory ? 'active' : ''}" data-category="${cat.name}">
        <span class="pill-icon">${cat.icon}</span>
        <span>${cat.name}</span>
      </button>
    `).join('');

    // Render Secondary Category Menu Options
    if (moreCategoriesMenu) {
      moreCategoriesMenu.innerHTML = CATEGORIES_SECONDARY.map(cat => `
        <div class="custom-dropdown-option ${cat.name === activeCategory ? 'active' : ''}" data-category="${cat.name}">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>${cat.icon}</span>
            <span>${cat.name}</span>
          </div>
          <svg class="check-icon" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
      `).join('');
    }

    // Attach listeners to primary pills
    categoryPillsContainer.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.getAttribute('data-category');
        renderCategoryPills();
        filterAndRenderTable();
      });
    });

    // Attach listeners to dropdown options
    if (moreCategoriesMenu) {
      moreCategoriesMenu.querySelectorAll('.custom-dropdown-option').forEach(option => {
        option.addEventListener('click', () => {
          activeCategory = option.getAttribute('data-category');
          moreCategoriesDropdown.classList.remove('open');
          renderCategoryPills();
          filterAndRenderTable();
        });
      });
    }

    // Update +More Trigger Button Text/State
    if (moreCategoriesTrigger) {
      const activeSecondary = CATEGORIES_SECONDARY.find(c => c.name === activeCategory);
      if (activeSecondary) {
        moreCategoriesTrigger.innerHTML = `<span>${activeSecondary.icon} ${activeSecondary.name}</span> <svg class="dropdown-chevron" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;
        moreCategoriesTrigger.style.borderColor = 'var(--accent-cyan)';
        moreCategoriesTrigger.style.color = 'var(--accent-cyan)';
        moreCategoriesTrigger.style.borderStyle = 'solid';
      } else {
        moreCategoriesTrigger.innerHTML = `<span>✨ + More (${CATEGORIES_SECONDARY.length})</span> <svg class="dropdown-chevron" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;
        moreCategoriesTrigger.style.borderColor = 'rgba(0, 242, 254, 0.4)';
        moreCategoriesTrigger.style.color = 'var(--accent-cyan)';
        moreCategoriesTrigger.style.borderStyle = 'dashed';
      }
    }
  }

  // Toggle More Categories Dropdown
  if (moreCategoriesTrigger) {
    moreCategoriesTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      moreCategoriesDropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (moreCategoriesDropdown && !moreCategoriesDropdown.contains(e.target)) {
        moreCategoriesDropdown.classList.remove('open');
      }
    });
  }

  // Filter & Sort Logic
  function getFilteredData() {
    return WORDLISTS_DATA.filter(item => {
      // Category filter
      if (activeCategory !== 'All' && item.category !== activeCategory) {
        return false;
      }

      // Search Query filter (Filename, Category, SubCategory, Tags, Vulnerabilities, Technologies)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        const matchSubCat = item.subCategory.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchTags = item.tags.some(t => t.toLowerCase().includes(q));
        const matchVulns = item.vulnerabilities.some(v => v.toLowerCase().includes(q));
        const matchTechs = item.technologies.some(t => t.toLowerCase().includes(q));

        if (!matchName && !matchCat && !matchSubCat && !matchDesc && !matchTags && !matchVulns && !matchTechs) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      switch (currentSort) {
        case 'category-asc': {
          const indexA = WORDLISTS_DATA.indexOf(a);
          const indexB = WORDLISTS_DATA.indexOf(b);
          return indexA - indexB;
        }
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'lines-desc':
          return b.lines - a.lines;
        case 'downloads-desc':
          return b.downloads - a.downloads;
        case 'size-desc':
          return parseSizeInKB(b.size) - parseSizeInKB(a.size);
        default:
          return 0;
      }
    });
  }

  function parseSizeInKB(sizeStr) {
    const num = parseFloat(sizeStr);
    if (sizeStr.includes('MB')) return num * 1024;
    if (sizeStr.includes('KB')) return num;
    if (sizeStr.includes('GB')) return num * 1024 * 1024;
    return num;
  }

  // Category Icons Mapping
  const CATEGORY_ICONS = {
    "Attack Surface Discovery": "📁",
    "Content Discovery": "📂",
    "Cloud Security": "☁️",
    "Secrets & Exposures": "🔑",
    "API Testing": "🌐",
    "Mobile": "📱",
    "Vulnerability Specific": "💉",
    "AI & LLM Security": "🤖",
    "Bug Bounty Specific": "🏢",
    "Special Collections": "🎯"
  };

  // Render Table with Category & Subcategory Grouping
  function filterAndRenderTable() {
    const filtered = getFilteredData();
    resultsCount.innerHTML = `Showing <strong>${filtered.length}</strong> wordlists`;

    if (filtered.length === 0) {
      wordlistsTableBody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <div class="empty-icon">🔍</div>
              <h3>No matching wordlists found</h3>
              <p>Try searching for terms like <code>xss</code>, <code>laravel</code>, <code>subdomains</code>, or <code>s3</code></p>
            </div>
          </td>
        </tr>
      `;
      updateBatchActionBar();
      return;
    }

    let currentCategory = null;
    let currentSubCategory = null;
    let htmlContent = '';

    filtered.forEach(item => {
      // Inject Category or Subcategory Header Row when sorting by category-asc (default)
      if (currentSort === 'category-asc') {
        if (item.category !== currentCategory) {
          currentCategory = item.category;
          currentSubCategory = item.subCategory;
          const icon = CATEGORY_ICONS[item.category] || '📁';
          htmlContent += `
            <tr class="category-header-row">
              <td colspan="6">
                <div class="category-header-content">
                  <div class="cat-title-group">
                    <span class="cat-icon">${icon}</span>
                    <span>${item.category}</span>
                  </div>
                </div>
              </td>
            </tr>
            <tr class="subcategory-header-row">
              <td colspan="6">
                <div class="subcat-only-title">${item.subCategory}</div>
              </td>
            </tr>
          `;
        } else if (item.subCategory !== currentSubCategory) {
          currentSubCategory = item.subCategory;
          htmlContent += `
            <tr class="subcategory-header-row">
              <td colspan="6">
                <div class="subcat-only-title">${item.subCategory}</div>
              </td>
            </tr>
          `;
        }
      }

      // Render Clean File Row
      const isChecked = selectedWordlistIds.has(item.id);
      htmlContent += `
        <tr data-id="${item.id}">
          <td style="text-align: center;">
            <input type="checkbox" class="custom-checkbox row-checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''}>
          </td>
          <td class="filename-cell">
            <div class="filename-title">${item.name}</div>
          </td>
          <td class="line-count-cell">
            ${item.lines.toLocaleString()}
          </td>
          <td class="file-size-cell">
            ${item.size}
          </td>
          <td class="updated-cell">
            ${item.lastUpdated}
          </td>
          <td class="action-cell">
            <div class="action-buttons-group">
              <button class="btn-icon-action btn-copy-url" title="Copy Download URL" data-url="${item.downloadUrl}">
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </button>
              <a href="${item.downloadUrl}" target="_blank" class="btn-download btn-download-link" data-id="${item.id}">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Download
              </a>
            </div>
          </td>
        </tr>
      `;
    });

    wordlistsTableBody.innerHTML = htmlContent;

    // Attach Event Listeners to row checkboxes
    wordlistsTableBody.querySelectorAll('.row-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = chk.getAttribute('data-id');
        if (chk.checked) {
          selectedWordlistIds.add(id);
        } else {
          selectedWordlistIds.delete(id);
        }
        updateBatchActionBar();
      });
    });

    // Attach Event Listeners to item rows only (skipping header rows)
    wordlistsTableBody.querySelectorAll('tr[data-id]').forEach(row => {
      row.addEventListener('click', (e) => {
        // Prevent opening modal if download button, copy URL button, or checkbox was clicked
        if (e.target.closest('.btn-download-link') || e.target.closest('.btn-copy-url') || e.target.closest('.row-checkbox')) {
          return;
        }
        const id = row.getAttribute('data-id');
        openModal(id);
      });
    });

    wordlistsTableBody.querySelectorAll('.btn-copy-url').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = btn.getAttribute('data-url');
        copyToClipboard(`wget -q -nc ${url}`);
        showToast('wget download command copied to clipboard!');
      });
    });

    wordlistsTableBody.querySelectorAll('.btn-download-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showToast(`Starting download for file...`);
      });
    });
  }

  // Open Modal Inspector
  function openModal(id) {
    const item = WORDLISTS_DATA.find(i => i.id === id);
    if (!item) return;

    activeItemModal = item;

    modalFilename.textContent = item.name;
    modalCategory.textContent = `${item.category} / ${item.subCategory}`;
    modalLines.textContent = item.lines.toLocaleString();
    modalSize.textContent = item.size;
    modalUpdated.textContent = item.lastUpdated;
    modalDownloads.textContent = item.downloads.toLocaleString();
    modalDescription.textContent = item.description;
    modalSampleCode.textContent = item.sampleLines.join('\n');
    modalDownloadBtn.href = item.downloadUrl;

    renderCmdGenerator();

    modalOverlay.classList.add('active');
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
  }

  // Event Listeners
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    searchClearBtn.style.display = searchQuery ? 'block' : 'none';
    filterAndRenderTable();
  });

  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClearBtn.style.display = 'none';
    filterAndRenderTable();
  });

  // Custom Dropdown Event Listeners
  if (customSortTrigger) {
    customSortTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      customSortDropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (customSortDropdown && !customSortDropdown.contains(e.target)) {
        customSortDropdown.classList.remove('open');
      }
    });

    customSortMenu.querySelectorAll('.custom-dropdown-option').forEach(option => {
      option.addEventListener('click', () => {
        const val = option.getAttribute('data-value');
        const text = option.querySelector('span').textContent;

        currentSort = val;
        customSortSelectedText.textContent = text;

        customSortMenu.querySelectorAll('.custom-dropdown-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');

        customSortDropdown.classList.remove('open');
        filterAndRenderTable();
      });
    });
  }

  modalCloseBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  if (modalCopyUrlBtn) {
    modalCopyUrlBtn.addEventListener('click', () => {
      if (activeItemModal) {
        copyToClipboard(`wget -q -nc ${activeItemModal.downloadUrl}`);
        showToast('wget download command copied to clipboard!');
        const origHtml = modalCopyUrlBtn.innerHTML;
        modalCopyUrlBtn.innerHTML = '✓ Copied!';
        modalCopyUrlBtn.style.borderColor = '#10b981';
        modalCopyUrlBtn.style.color = '#10b981';
        setTimeout(() => {
          modalCopyUrlBtn.innerHTML = origHtml;
          modalCopyUrlBtn.style.borderColor = '';
          modalCopyUrlBtn.style.color = '';
        }, 1800);
      }
    });
  }

  // About Modal Handlers
  if (navAboutBtn && aboutModalOverlay) {
    navAboutBtn.addEventListener('click', () => {
      aboutModalOverlay.classList.add('active');
    });

    if (aboutModalCloseBtn) {
      aboutModalCloseBtn.addEventListener('click', () => {
        aboutModalOverlay.classList.remove('active');
      });
    }

    aboutModalOverlay.addEventListener('click', (e) => {
      if (e.target === aboutModalOverlay) {
        aboutModalOverlay.classList.remove('active');
      }
    });
  }

  // Update Batch Action Bar State
  function updateBatchActionBar() {
    const count = selectedWordlistIds.size;
    selectedCountText.textContent = count;

    if (count > 0) {
      batchActionBar.classList.add('active');
    } else {
      batchActionBar.classList.remove('active');
      selectAllCheckbox.checked = false;
    }

    // Check if all currently visible rows are checked
    const currentFiltered = getFilteredData();
    if (currentFiltered.length > 0 && currentFiltered.every(item => selectedWordlistIds.has(item.id))) {
      selectAllCheckbox.checked = true;
    } else {
      selectAllCheckbox.checked = false;
    }
  }

  // Select All Checkbox Handler
  selectAllCheckbox.addEventListener('change', (e) => {
    const visibleItems = getFilteredData();
    if (selectAllCheckbox.checked) {
      visibleItems.forEach(item => selectedWordlistIds.add(item.id));
    } else {
      visibleItems.forEach(item => selectedWordlistIds.delete(item.id));
    }
    filterAndRenderTable();
    updateBatchActionBar();
  });

  // Generate Bash Script Handler
  btnGenerateScript.addEventListener('click', () => {
    const selectedItems = WORDLISTS_DATA.filter(i => selectedWordlistIds.has(i.id));
    if (selectedItems.length === 0) return;

    const urls = selectedItems.map(i => `wget -q -nc ${i.downloadUrl}`).join('\n');
    const script = `#!/bin/bash
# KrazePlanet Wordlists - Batch Recon Download Script
# Selected Wordlists: ${selectedItems.length}

mkdir -p krazeplanet_wordlists && cd krazeplanet_wordlists
echo "⚡ Downloading ${selectedItems.length} wordlists to ./krazeplanet_wordlists..."

${urls}

echo "✅ Download complete! All wordlists saved."
`;

    batchScriptCode.textContent = script;
    batchScriptModalOverlay.classList.add('active');
  });

  btnCopyBatchScript.addEventListener('click', () => {
    copyToClipboard(batchScriptCode.textContent);
    showToast('Bash script copied to clipboard!');
  });

  batchScriptCloseBtn.addEventListener('click', () => {
    batchScriptModalOverlay.classList.remove('active');
  });

  batchScriptModalOverlay.addEventListener('click', (e) => {
    if (e.target === batchScriptModalOverlay) {
      batchScriptModalOverlay.classList.remove('active');
    }
  });

  // Utilities
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }

  function showToast(message) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
      ${message}
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // Keyboard Navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeModal();
    }
    const isEditingInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    if (e.key === '/' && !isEditingInput) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // Initialization
  renderCategoryPills();
  filterAndRenderTable();
});
