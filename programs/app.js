// Global State
let allPrograms = [];
let filteredPrograms = [];
let currentPage = 1;
let selectedPlatforms = [];
let searchQuery = '';
let sortOption = 'date-newest';
let viewMode = 'grid';
const PAGE_SIZE = 24;

// Platform data
const PLATFORMS = [
    'HackerOne',
    'Bugcrowd',
    'Intigriti',
    'YesWeHack',
    'HackenProof',
    'BugBounty Switzerland',
    'OpenBugBounty',
    'SelfHosted'
];

// Reward Type data
const REWARD_TYPES = [
    'VDP',
    'BBP',
    'Swags',
    'Gift',
    'Certificate',
    'Hall Of Fame'
];

// Global State for Reward Types
let selectedRewardTypes = [];
let showBookmarksOnly = false;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const platformFilterBtn = document.getElementById('platformFilterBtn');
const platformDropdown = document.getElementById('platformDropdown');
const platformSearch = document.getElementById('platformSearch');
const platformList = document.getElementById('platformList');
const platformCount = document.getElementById('platformCount');
const rewardFilterBtn = document.getElementById('rewardFilterBtn');
const rewardDropdown = document.getElementById('rewardDropdown');
const rewardList = document.getElementById('rewardList');
const rewardCount = document.getElementById('rewardCount');
const bookmarksToggle = document.getElementById('bookmarksToggle');
const sortFilterBtn = document.getElementById('sortFilterBtn');
const sortDropdown = document.getElementById('sortDropdown');
const currentSortLabel = document.getElementById('currentSortLabel');
const sortItems = document.querySelectorAll('.sort-item');
const gridViewBtn = document.getElementById('gridViewBtn');
const listViewBtn = document.getElementById('listViewBtn');
const gridView = document.getElementById('gridView');
const listView = document.getElementById('listView');
const tableBody = document.getElementById('tableBody');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const rangeStart = document.getElementById('rangeStart');
const rangeEnd = document.getElementById('rangeEnd');
const totalCount = document.getElementById('totalCount');
const currentPageEl = document.getElementById('currentPage');
const totalPagesEl = document.getElementById('totalPages');

// Utility Functions
function formatDate(isoDate) {
    const date = new Date(isoDate);
    const options = { year: 'numeric', month: 'short', day: '2-digit' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
}

function getTodayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function rewardToNumber(reward) {
    const nums = (reward.match(/[\d,]+/g) || []).map(n => parseInt(n.replace(/,/g, ''), 10));
    if (nums.length === 0) return -1;
    return Math.max(...nums);
}

// LocalStorage Helpers for Bookmarks
function getBookmarkedPrograms() {
    try {
        return JSON.parse(localStorage.getItem('krazeplanet_bookmarks') || '[]');
    } catch {
        return [];
    }
}

function setBookmarkedPrograms(bookmarks) {
    localStorage.setItem('krazeplanet_bookmarks', JSON.stringify(bookmarks));
}

function isBookmarked(programName) {
    return getBookmarkedPrograms().includes(programName);
}

function toggleBookmark(programName) {
    const bookmarks = getBookmarkedPrograms();
    const idx = bookmarks.indexOf(programName);
    if (idx === -1) {
        bookmarks.push(programName);
    } else {
        bookmarks.splice(idx, 1);
    }
    setBookmarkedPrograms(bookmarks);
    return idx === -1; // returns true if added
}

// Check if program is new (added within last 7 days)
function isNewProgram(lastUpdated) {
    const programDate = new Date(lastUpdated);
    const today = new Date();
    const diffTime = today - programDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
}

// Initialize Platform Filter
function initPlatformFilter() {
    platformList.innerHTML = '';
    PLATFORMS.forEach(platform => {
        const item = document.createElement('div');
        item.className = 'platform-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `platform-${platform.replace(/\s+/g, '-')}`;
        checkbox.value = platform;
        checkbox.addEventListener('change', handlePlatformChange);

        const label = document.createElement('label');
        label.htmlFor = `platform-${platform.replace(/\s+/g, '-')}`;
        label.textContent = platform;
        label.addEventListener('click', (e) => {
            e.preventDefault();
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        });

        item.appendChild(checkbox);
        item.appendChild(label);
        platformList.appendChild(item);
    });
    console.log('Platform filter initialized with', PLATFORMS.length, 'platforms');
}

// Get reward category from program reward field
function getRewardCategory(reward) {
    if (!reward || reward === '-') return 'VDP';
    const lower = reward.toLowerCase();
    if (lower === 'swags') return 'Swags';
    if (lower === 'gift') return 'Gift';
    if (lower === 'certificate') return 'Certificate';
    if (lower === 'halloffame') return 'Hall Of Fame';
    // BBP: contains currency symbols or numbers
    if (/[$€£\d]/.test(reward)) return 'BBP';
    return 'VDP';
}

// Initialize Reward Type Filter
function initRewardTypeFilter() {
    rewardList.innerHTML = '';
    REWARD_TYPES.forEach(rewardType => {
        const item = document.createElement('div');
        item.className = 'reward-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `reward-${rewardType.replace(/\s+/g, '-')}`;
        checkbox.value = rewardType;
        checkbox.addEventListener('change', handleRewardTypeChange);

        const label = document.createElement('label');
        label.htmlFor = `reward-${rewardType.replace(/\s+/g, '-')}`;
        label.textContent = rewardType;
        label.addEventListener('click', (e) => {
            e.preventDefault();
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        });

        item.appendChild(checkbox);
        item.appendChild(label);
        rewardList.appendChild(item);
    });
    console.log('Reward type filter initialized with', REWARD_TYPES.length, 'types');
}

// Filter Programs
function filterPrograms() {
    let result = allPrograms;

    // Filter by search query
    if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        result = result.filter(p => {
            const nameMatch = p.name.toLowerCase().includes(query);
            const inScopeMatch = p.inscope_domains && p.inscope_domains.some(d => d.toLowerCase().includes(query));
            const outScopeMatch = p.outofscope_domains && p.outofscope_domains.some(d => d.toLowerCase().includes(query));
            return nameMatch || inScopeMatch || outScopeMatch;
        });
    }

    // Filter by selected platforms
    if (selectedPlatforms.length > 0) {
        result = result.filter(p => selectedPlatforms.includes(p.platform));
    }

    // Filter by selected reward types
    if (selectedRewardTypes.length > 0) {
        result = result.filter(p => selectedRewardTypes.includes(getRewardCategory(p.reward)));
    }

    // Filter by bookmarks only
    if (showBookmarksOnly) {
        const bookmarks = getBookmarkedPrograms();
        result = result.filter(p => bookmarks.includes(p.name));
    }

    filteredPrograms = result;
}

// Sort Programs
function sortPrograms() {
    const sorted = [...filteredPrograms];

    switch (sortOption) {
        case 'date-newest':
            sorted.sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated));
            break;
        case 'date-oldest':
            sorted.sort((a, b) => new Date(a.last_updated) - new Date(b.last_updated));
            break;
        case 'name-az':
            sorted.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
            break;
        case 'name-za':
            sorted.sort((a, b) => b.name.toLowerCase().localeCompare(a.name.toLowerCase()));
            break;
        case 'bounty-high':
            sorted.sort((a, b) => rewardToNumber(b.reward) - rewardToNumber(a.reward));
            break;
        case 'bounty-low':
            sorted.sort((a, b) => rewardToNumber(a.reward) - rewardToNumber(b.reward));
            break;
    }

    filteredPrograms = sorted;
}

// Pagination
function getPaginatedPrograms() {
    const total = filteredPrograms.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, total);

    return {
        items: filteredPrograms.slice(start, end),
        start,
        end,
        total,
        totalPages
    };
}

// Render Grid View
function renderGridView(programs) {
    gridView.innerHTML = '';

    if (programs.length === 0) {
        gridView.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p class="empty-title">No programs found.</p>
                <p class="empty-description">Try adjusting your search query.</p>
            </div>
        `;
        return;
    }

    programs.forEach((program, idx) => {
        const isNew = isNewProgram(program.last_updated);
        const bookmarked = isBookmarked(program.name);

        const card = document.createElement('div');
        card.className = 'program-card';
        card.style.animationDelay = `${idx * 30}ms`;

        card.innerHTML = `
            <div class="card-header">
                <time datetime="${program.last_updated}" class="card-date">
                    ${formatDate(program.last_updated)}
                </time>
                <div class="header-badges">
                    ${isNew ? '<span class="new-badge">New</span>' : ''}
                    ${program.scamhit ? `<span class="scamhit-badge">⚠️ Scam</span>` : ''}
                    <button class="bookmark-btn ${bookmarked ? 'bookmarked' : ''}" data-name="${program.name}" aria-label="${bookmarked ? 'Remove bookmark' : 'Add bookmark'}">
                        <svg class="icon" viewBox="0 0 24 24" fill="${bookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="card-logo-name">
                <div class="card-logo-wrapper">
                    <img src="${program.logo || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23333\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23999\' font-size=\'20\'%3E?%3C/text%3E%3C/svg%3E'}"
                         alt="${program.name} logo"
                         class="card-logo"
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23333\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23999\' font-size=\'20\'%3E?%3C/text%3E%3C/svg%3E'">
                </div>
                <h3 class="card-name">${program.name}</h3>
            </div>

            <div class="card-platform">
                <span class="platform-badge">${program.platform}</span>
            </div>

            <div class="card-reward">
                <div class="reward-label">Reward Range</div>
                <div class="reward-amount">${program.reward}</div>
            </div>
            
            <div class="card-buttons">
                <a href="programs.html?name=${encodeURIComponent(program.name)}" 
                   class="card-btn card-btn-info"
                   aria-label="View info for ${program.name}">
                    <span>View Info</span>
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                </a>
                <a href="${program.program_url}" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="card-btn card-btn-visit"
                   aria-label="Visit ${program.name}">
                    <span>Visit Program</span>
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                </a>
            </div>
        `;

        gridView.appendChild(card);
    });
}

function renderListView(programs) {
    tableBody.innerHTML = '';

    if (programs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <p class="empty-title">No programs found.</p>
                        <p class="empty-description">Try adjusting your search query.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    programs.forEach((program, idx) => {
        const isNew = isNewProgram(program.last_updated);
        const bookmarked = isBookmarked(program.name);

        const row = document.createElement('tr');
        row.style.animationDelay = `${idx * 30}ms`;

        row.innerHTML = `
            <td>
                <button class="table-bookmark-btn ${bookmarked ? 'bookmarked' : ''}" data-name="${program.name}" aria-label="${bookmarked ? 'Remove bookmark' : 'Add bookmark'}">
                    <svg class="icon" viewBox="0 0 24 24" fill="${bookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                </button>
            </td>
            <td>
                <time datetime="${program.last_updated}" class="table-date">
                    ${formatDate(program.last_updated)}
                </time>
            </td>
            <td>
                <div class="table-name-wrapper">
                    <div class="table-logo-wrapper">
                        <img src="${program.logo || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'%3E%3Crect width=\'32\' height=\'32\' fill=\'%23333\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23999\' font-size=\'14\'%3E?%3C/text%3E%3C/svg%3E'}"
                             alt="${program.name} logo"
                             class="table-logo"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'%3E%3Crect width=\'32\' height=\'32\' fill=\'%23333\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23999\' font-size=\'14\'%3E?%3C/text%3E%3C/svg%3E'">
                    </div>
                    <span class="table-name">${program.name}</span>
                    ${isNew ? '<span class="table-new-badge-inline">New</span>' : ''}
                </div>
            </td>
            <td>
                <span class="platform-badge">${program.platform}</span>
            </td>
            <td>
                ${program.scamhit ? `<span class="scamhit-badge">⚠️ Scam</span>` : '<span style="color: var(--muted-foreground);">-</span>'}
            </td>
            <td class="table-reward">${program.reward}</td>
            <td class="table-link-cell">
                <div class="table-actions">
                    <a href="programs.html?name=${encodeURIComponent(program.name)}"
                       class="table-link table-link-info"
                       aria-label="View info for ${program.name}">
                        <span>Info</span>
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="16" x2="12" y2="12"/>
                            <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                    </a>
                    <a href="${program.program_url}"
                       target="_blank"
                       rel="noopener noreferrer"
                       class="table-link"
                       aria-label="Visit ${program.name}">
                        <span>Visit</span>
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                    </a>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Update UI
function updateUI() {
    filterPrograms();
    sortPrograms();

    const { items, start, end, total, totalPages } = getPaginatedPrograms();

    // Render based on view mode
    if (viewMode === 'grid') {
        renderGridView(items);
    } else {
        renderListView(items);
    }

    // Update stats
    rangeStart.textContent = total === 0 ? 0 : start + 1;
    rangeEnd.textContent = end;
    totalCount.textContent = total;
    currentPageEl.textContent = currentPage;
    totalPagesEl.textContent = totalPages;

    // Update pagination buttons
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;

    // Update URL
    const params = new URLSearchParams(window.location.search);
    params.set('page', currentPage);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);

    // Attach bookmark event listeners after render
    attachBookmarkListeners();
}

// Attach bookmark button event listeners
function attachBookmarkListeners() {
    const bookmarkBtns = document.querySelectorAll('.bookmark-btn, .table-bookmark-btn');
    bookmarkBtns.forEach(btn => {
        btn.addEventListener('click', handleBookmarkClick);
    });
}

// Handle bookmark button click
function handleBookmarkClick(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const programName = btn.dataset.name;
    const isNowBookmarked = toggleBookmark(programName);

    // Update button appearance
    btn.classList.toggle('bookmarked', isNowBookmarked);
    btn.setAttribute('aria-label', isNowBookmarked ? 'Remove bookmark' : 'Add bookmark');

    // Update SVG fill
    const svg = btn.querySelector('svg');
    if (svg) {
        svg.setAttribute('fill', isNowBookmarked ? 'currentColor' : 'none');
    }

    // If My Bookmarks filter is active and we're removing a bookmark,
    // refresh the UI to remove the program from the list
    if (showBookmarksOnly && !isNowBookmarked) {
        updateUI();
    }
}

// Event Handlers
function handleSearch(e) {
    searchQuery = e.target.value;
    currentPage = 1;
    updateUI();
}

function handlePlatformChange(e) {
    const platform = e.target.value;
    if (e.target.checked) {
        selectedPlatforms.push(platform);
    } else {
        selectedPlatforms = selectedPlatforms.filter(p => p !== platform);
    }

    // Update platform count badge
    if (selectedPlatforms.length > 0) {
        platformCount.textContent = selectedPlatforms.length;
        platformCount.classList.remove('hidden');
    } else {
        platformCount.classList.add('hidden');
    }

    currentPage = 1;
    updateUI();
}

function handleRewardTypeChange(e) {
    const rewardType = e.target.value;
    if (e.target.checked) {
        selectedRewardTypes.push(rewardType);
    } else {
        selectedRewardTypes = selectedRewardTypes.filter(r => r !== rewardType);
    }

    // Update reward count badge
    if (selectedRewardTypes.length > 0) {
        rewardCount.textContent = selectedRewardTypes.length;
        rewardCount.classList.remove('hidden');
    } else {
        rewardCount.classList.add('hidden');
    }

    currentPage = 1;
    updateUI();
}

function handlePlatformSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    const items = platformList.querySelectorAll('.platform-item');

    items.forEach(item => {
        const label = item.querySelector('label');
        const text = label.textContent.toLowerCase();
        if (text.includes(query)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function handleSortItemClick(e) {
    const target = e.currentTarget;
    const value = target.dataset.value;
    const label = target.textContent;

    // Update state
    sortOption = value;

    // Update UI text
    currentSortLabel.textContent = label;

    // Update active class
    sortItems.forEach(item => item.classList.remove('active'));
    target.classList.add('active');

    // Close dropdown
    sortDropdown.classList.add('hidden');

    // Refresh list
    updateUI();
}

function toggleViewMode(mode) {
    viewMode = mode;

    if (mode === 'grid') {
        gridView.classList.remove('hidden');
        listView.classList.add('hidden');
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
    } else {
        gridView.classList.add('hidden');
        listView.classList.remove('hidden');
        gridViewBtn.classList.remove('active');
        listViewBtn.classList.add('active');
    }

    updateUI();
}

function handlePrevPage() {
    if (currentPage > 1) {
        currentPage--;
        updateUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function handleNextPage() {
    const { totalPages } = getPaginatedPrograms();
    if (currentPage < totalPages) {
        currentPage++;
        updateUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Toggle platform dropdown
function togglePlatformDropdown() {
    platformDropdown.classList.toggle('hidden');
}

// Toggle sort dropdown
function toggleSortDropdown() {
    sortDropdown.classList.toggle('hidden');
}

// Toggle reward type dropdown
function toggleRewardDropdown() {
    rewardDropdown.classList.toggle('hidden');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!platformFilterBtn.contains(e.target) && !platformDropdown.contains(e.target)) {
        platformDropdown.classList.add('hidden');
    }
    if (!rewardFilterBtn.contains(e.target) && !rewardDropdown.contains(e.target)) {
        rewardDropdown.classList.add('hidden');
    }
    if (!sortFilterBtn.contains(e.target) && !sortDropdown.contains(e.target)) {
        sortDropdown.classList.add('hidden');
    }
});

// Event Listeners
searchInput.addEventListener('input', handleSearch);
platformFilterBtn.addEventListener('click', (e) => {
    togglePlatformDropdown();
});
platformSearch.addEventListener('input', handlePlatformSearch);
rewardFilterBtn.addEventListener('click', (e) => {
    toggleRewardDropdown();
});
sortFilterBtn.addEventListener('click', (e) => {
    toggleSortDropdown();
});
sortItems.forEach(item => {
    item.addEventListener('click', handleSortItemClick);
});
gridViewBtn.addEventListener('click', () => toggleViewMode('grid'));
listViewBtn.addEventListener('click', () => toggleViewMode('list'));
prevBtn.addEventListener('click', handlePrevPage);
nextBtn.addEventListener('click', handleNextPage);
bookmarksToggle.addEventListener('click', handleBookmarksToggle);

// Handle bookmarks toggle
function handleBookmarksToggle() {
    showBookmarksOnly = !showBookmarksOnly;
    bookmarksToggle.classList.toggle('active', showBookmarksOnly);
    currentPage = 1;
    updateUI();
}

// Load Programs
async function loadPrograms() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/rix4uni/scope/refs/heads/main/programs.json');
        if (!response.ok) {
            throw new Error('Failed to load programs');
        }
        allPrograms = await response.json();
        filteredPrograms = allPrograms;

        // Get URL params
        const params = new URLSearchParams(window.location.search);
        const pageParam = params.get('page');
        const platformParam = params.get('platform');
        
        // Handle platform filter from URL
        if (platformParam) {
            selectedPlatforms = [platformParam];
            // Update checkbox in dropdown if it exists
            const checkbox = document.getElementById(`platform-${platformParam.replace(/\s+/g, '-')}`);
            if (checkbox) checkbox.checked = true;
            // Update platform count badge
            platformCount.textContent = '1';
            platformCount.classList.remove('hidden');
        }
        
        if (pageParam) {
            currentPage = parseInt(pageParam, 10) || 1;
        }

        // Initialize and render
        initPlatformFilter();
        initRewardTypeFilter();
        updateUI();
    } catch (error) {
        console.error('Error loading programs:', error);
        gridView.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p class="empty-title">Failed to load programs</p>
                <p class="empty-description">Please try refreshing the page.</p>
            </div>
        `;
    }
}

// Initialize
loadPrograms();
