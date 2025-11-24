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

// DOM Elements
const searchInput = document.getElementById('searchInput');
const platformFilterBtn = document.getElementById('platformFilterBtn');
const platformDropdown = document.getElementById('platformDropdown');
const platformSearch = document.getElementById('platformSearch');
const platformList = document.getElementById('platformList');
const platformCount = document.getElementById('platformCount');
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
    const today = getTodayDate();
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
        const isNew = program.last_updated === today;

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
                    ${program.scamhit ? `<span class="scamhit-badge">Scam Hit: ${program.scamhit}</span>` : ''}
                </div>
            </div>
            
            <div class="card-logo-name">
                <div class="card-logo-wrapper">
                    <img src="${program.logo || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23333\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23999\' font-size=\'20\'%3E?%3C/text%3E%3C/svg%3E'}" 
                         alt="${program.name} logo" 
                         class="card-logo"
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'48\\' height=\\'48\\'%3E%3Crect width=\\'48\\' height=\\'48\\' fill=\\'%23333\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%23999\\' font-size=\\'20\\'%3E?%3C/text%3E%3C/svg%3E'">
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
            
            <a href="${program.program_url}" 
               target="_blank" 
               rel="noopener noreferrer" 
               class="card-link"
               aria-label="Visit ${program.name}">
                <span>Visit Program</span>
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
            </a>
        `;

        gridView.appendChild(card);
    });
}

// Render List View
function renderListView(programs) {
    const today = getTodayDate();
    tableBody.innerHTML = '';

    if (programs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
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
        const isNew = program.last_updated === today;

        const row = document.createElement('tr');
        row.style.animationDelay = `${idx * 30}ms`;

        row.innerHTML = `
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
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'32\\' height=\\'32\\'%3E%3Crect width=\\'32\\' height=\\'32\\' fill=\\'%23333\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%23999\\' font-size=\\'14\\'%3E?%3C/text%3E%3C/svg%3E'">
                    </div>
                    <span class="table-name">${program.name}</span>
                </div>
            </td>
            <td class="table-new-cell">
                ${isNew ? `
                    <span class="table-new-badge">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span>New</span>
                    </span>
                ` : '<span style="color: var(--muted-foreground);">—</span>'}
            </td>
            <td>
                <span class="platform-badge">${program.platform}</span>
            </td>
            <td>
                ${program.scamhit ? `<span class="scamhit-badge">Scam Hit: ${program.scamhit}</span>` : '<span style="color: var(--muted-foreground);">-</span>'}
            </td>
            <td class="table-reward">${program.reward}</td>
            <td class="table-link-cell">
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

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!platformFilterBtn.contains(e.target) && !platformDropdown.contains(e.target)) {
        platformDropdown.classList.add('hidden');
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

// Load Programs
async function loadPrograms() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/KrazePlanet/KrazePlanetPrograms/refs/heads/main/programs.json');
        if (!response.ok) {
            throw new Error('Failed to load programs');
        }
        allPrograms = await response.json();
        filteredPrograms = allPrograms;

        // Get page from URL
        const params = new URLSearchParams(window.location.search);
        const pageParam = params.get('page');
        if (pageParam) {
            currentPage = parseInt(pageParam, 10) || 1;
        }

        // Initialize and render
        initPlatformFilter();
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
