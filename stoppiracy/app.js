// Global State
let allPrograms = [];
let filteredPrograms = [];
let currentPage = 1;
let searchQuery = '';
let sortOption = 'date-newest';
const PAGE_SIZE = 24;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const sortFilterBtn = document.getElementById('sortFilterBtn');
const sortDropdown = document.getElementById('sortDropdown');
const currentSortLabel = document.getElementById('currentSortLabel');
const sortItems = document.querySelectorAll('.sort-item');
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

function stripProtocol(url) {
    return url.replace(/^https?:\/\/(www\.)?/i, '');
}

// Filter Programs
function filterPrograms() {
    let result = allPrograms;

    // Filter by search query
    if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        result = result.filter(p => {
            const nameMatch = p.name.toLowerCase().includes(query);
            const emailMatch = p.email && Array.isArray(p.email) && p.email.some(e => e && e !== '-' && e.toLowerCase().includes(query));
            const matchedMatch = p.matched && p.matched.some(m => m.toLowerCase().includes(query));
            return nameMatch || emailMatch || matchedMatch;
        });
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

// Render List View
function renderListView(programs) {
    const today = getTodayDate();
    tableBody.innerHTML = '';

    if (programs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <p class="empty-title">No websites found.</p>
                        <p class="empty-description">Try adjusting your search query.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    programs.forEach((program, idx) => {
        const isNew = program.last_updated === today;
        const programUrl = program.name;

        // Create matched badges HTML
        let matchedBadgesHTML = '';
        if (program.matched && program.matched.length > 0) {
            matchedBadgesHTML = '<div class="matched-badges-container">';
            program.matched.forEach(matchedItem => {
                matchedBadgesHTML += `<span class="matched-badge">${matchedItem}</span>`;
            });
            matchedBadgesHTML += '</div>';
        } else {
            matchedBadgesHTML = '<span style="color: var(--muted-foreground);">-</span>';
        }

        // Create email badges HTML
        let emailBadgesHTML = '';
        if (program.email && Array.isArray(program.email) && program.email.length > 0) {
            const validEmails = program.email.filter(email => email && email !== '-');
            if (validEmails.length > 0) {
                emailBadgesHTML = '<div class="matched-badges-container">';
                validEmails.forEach(emailItem => {
                    emailBadgesHTML += `<span class="email-badge">${emailItem}</span>`;
                });
                emailBadgesHTML += '</div>';
            } else {
                emailBadgesHTML = '<span style="color: var(--muted-foreground);">-</span>';
            }
        } else {
            emailBadgesHTML = '<span style="color: var(--muted-foreground);">-</span>';
        }

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
                    <a href="${programUrl}" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="table-name-link">
                        <span class="table-name">${stripProtocol(program.name)}</span>
                    </a>
                    ${isNew ? `
                        <span class="table-new-badge">New</span>
                    ` : ''}
                </div>
            </td>
            <td>
                ${emailBadgesHTML}
            </td>
            <td class="table-matched">
                ${matchedBadgesHTML}
            </td>
            <td class="table-link-cell">
                <a href="${programUrl}" 
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

    // Always render list view
    renderListView(items);

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

// Toggle sort dropdown
function toggleSortDropdown() {
    sortDropdown.classList.toggle('hidden');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!sortFilterBtn.contains(e.target) && !sortDropdown.contains(e.target)) {
        sortDropdown.classList.add('hidden');
    }
});

// Event Listeners
searchInput.addEventListener('input', handleSearch);
sortFilterBtn.addEventListener('click', (e) => {
    toggleSortDropdown();
});
sortItems.forEach(item => {
    item.addEventListener('click', handleSortItemClick);
});
prevBtn.addEventListener('click', handlePrevPage);
nextBtn.addEventListener('click', handleNextPage);

// Load Programs
async function loadPrograms() {
    try {
        const response = await fetch('programs.json');
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
        updateUI();
    } catch (error) {
        console.error('Error loading programs:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="empty-icon">⚠️</div>
                        <p class="empty-title">Failed to load websites</p>
                        <p class="empty-description">Please try refreshing the page.</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Initialize
loadPrograms();

