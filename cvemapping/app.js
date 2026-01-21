// CVE Mapping Application
class CVEMapper {
    constructor() {
        this.allData = [];
        this.filteredData = [];
        this.currentYear = 'all';
        this.sortBy = 'updated';
        this.searchQuery = '';
        this.cveListEl = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadAllData();
        this.populateYearFilter();
        this.applyFilters();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const yearFilter = document.getElementById('yearFilter');
        const sortBy = document.getElementById('sortBy');
        const copyButton = document.getElementById('copyButton');
        this.cveListEl = document.getElementById('cveList');

        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.applyFilters();
        });

        yearFilter.addEventListener('change', (e) => {
            this.currentYear = e.target.value;
            this.applyFilters();
        });

        sortBy.addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.applyFilters();
        });

        if (copyButton) {
            copyButton.addEventListener('click', () => this.copyVisibleCVEs());
        }

        if (this.cveListEl) {
            this.cveListEl.addEventListener('click', (e) => this.handleCveToggle(e));
        }
    }

    populateYearFilter() {
        const yearFilter = document.getElementById('yearFilter');
        const years = new Set();
        
        this.allData.forEach(cve => {
            const match = cve.cve_id.match(/CVE-(\d{4})-/);
            if (match) {
                years.add(match[1]);
            }
        });

        const sortedYears = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
        
        sortedYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === new Date().getFullYear().toString()) {
                option.selected = true;
                this.currentYear = year;
            }
            yearFilter.appendChild(option);
        });
    }

    async loadAllData() {
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const stats = document.getElementById('stats');
        
        loading.style.display = 'block';
        error.style.display = 'none';
        stats.style.display = 'none';

        try {
            // Try to load data from all years (1999-2026)
            const years = [];
            for (let year = 1999; year <= 2026; year++) {
                years.push(year);
            }

            const dataPromises = years.map(year => 
                this.loadYearData(year).catch(() => null)
            );

            const results = await Promise.all(dataPromises);
            this.allData = [];

            results.forEach((yearData, index) => {
                if (yearData && yearData.cves) {
                    this.allData.push(...yearData.cves);
                }
            });

            if (this.allData.length === 0) {
                throw new Error('No CVE data found. Please ensure JSON files are in the data/ directory.');
            }

            loading.style.display = 'none';
            this.updateStats();
            this.updateTrendingCVEs();
            
        } catch (err) {
            loading.style.display = 'none';
            error.style.display = 'block';
            error.textContent = `Error loading data: ${err.message}`;
            console.error('Error loading data:', err);
        }
    }

    async loadYearData(year) {
        try {
            const response = await fetch(`https://raw.githubusercontent.com/rix4uni/cvemapping/refs/heads/main/data/${year}.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (err) {
            // File doesn't exist or can't be loaded - skip it
            return null;
        }
    }

    updateStats() {
        const stats = document.getElementById('stats');
        const totalCVEs = this.allData.length;
        const totalRepos = this.allData.reduce((sum, cve) => sum + cve.repositories.length, 0);
        
        stats.style.display = 'block';
        stats.textContent = `Showing ${totalCVEs.toLocaleString()} CVEs with ${totalRepos.toLocaleString()} repositories`;
    }

    applyFilters() {
        this.filteredData = [...this.allData];

        // Filter by year
        if (this.currentYear !== 'all') {
            this.filteredData = this.filteredData.filter(cve => {
                const match = cve.cve_id.match(/CVE-(\d{4})-/);
                return match && match[1] === this.currentYear;
            });
        }

        // Filter by search query
        if (this.searchQuery) {
            this.filteredData = this.filteredData.filter(cve => {
                const cveMatch = cve.cve_id.toLowerCase().includes(this.searchQuery);
                const repoMatch = cve.repositories.some(repo => 
                    repo.name.toLowerCase().includes(this.searchQuery) ||
                    repo.full_name.toLowerCase().includes(this.searchQuery) ||
                    (repo.description && repo.description.toLowerCase().includes(this.searchQuery))
                );
                return cveMatch || repoMatch;
            });
        }

        // Sort data
        this.sortData();

        this.render();
    }

    sortData() {
        switch (this.sortBy) {
            case 'updated':
                this.filteredData.forEach(cve => {
                    cve.repositories.sort((a, b) => 
                        new Date(b.updated_at) - new Date(a.updated_at)
                    );
                });
                this.filteredData.sort((a, b) => {
                    const aLatest = a.repositories[0]?.updated_at || '';
                    const bLatest = b.repositories[0]?.updated_at || '';
                    return new Date(bLatest) - new Date(aLatest);
                });
                break;
            case 'stars':
                this.filteredData.forEach(cve => {
                    cve.repositories.sort((a, b) => b.stargazers_count - a.stargazers_count);
                });
                this.filteredData.sort((a, b) => {
                    const aMax = Math.max(...a.repositories.map(r => r.stargazers_count));
                    const bMax = Math.max(...b.repositories.map(r => r.stargazers_count));
                    return bMax - aMax;
                });
                break;
            case 'forks':
                this.filteredData.forEach(cve => {
                    cve.repositories.sort((a, b) => b.forks_count - a.forks_count);
                });
                this.filteredData.sort((a, b) => {
                    const aMax = Math.max(...a.repositories.map(r => r.forks_count));
                    const bMax = Math.max(...b.repositories.map(r => r.forks_count));
                    return bMax - aMax;
                });
                break;
            case 'repos':
                this.filteredData.sort((a, b) => b.repositories.length - a.repositories.length);
                break;
            case 'cve':
                this.filteredData.sort((a, b) => a.cve_id.localeCompare(b.cve_id));
                break;
        }
    }

    render() {
        const container = this.cveListEl || document.getElementById('cveList');
        const stats = document.getElementById('stats');
        
        if (this.filteredData.length === 0) {
            container.innerHTML = '<div class="error">No CVEs found matching your criteria.</div>';
            stats.textContent = 'No results found';
            return;
        }

        stats.textContent = `Showing ${this.filteredData.length.toLocaleString()} of ${this.allData.length.toLocaleString()} CVEs`;

        container.innerHTML = this.filteredData.map(cve => this.renderCVE(cve)).join('');
    }

    renderCVE(cve) {
        const safeId = this.getSafeId(cve.cve_id);
        const repositories = cve.repositories.map(repo => this.renderRepository(repo)).join('');
        
        return `
            <div class="cve-card" data-cve-id="${cve.cve_id}">
                <div class="cve-header">
                    <button class="cve-toggle" aria-expanded="false" aria-controls="repos-${safeId}" title="Expand repositories">
                        <span class="chevron"></span>
                    </button>
                    <a href="https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cve.cve_id}" 
                       target="_blank" 
                       class="cve-title">
                        ${cve.cve_id}
                    </a>
                    <div class="cve-meta">
                        <span>${cve.repositories.length} ${cve.repositories.length === 1 ? 'repository' : 'repositories'}</span>
                    </div>
                </div>
                <div class="repositories is-collapsed" id="repos-${safeId}">
                    ${repositories}
                </div>
            </div>
        `;
    }

    renderRepository(repo) {
        const language = repo.language ? `<span class="badge language">${repo.language}</span>` : '';
        const updated = this.formatDate(repo.updated_at);
        const created = this.formatDate(repo.created_at);
        
        return `
            <div class="repo-item">
                <div class="repo-header">
                    <div class="repo-name">
                        <a href="${repo.html_url}" target="_blank">${repo.full_name}</a>
                        ${language}
                    </div>
                    <div class="repo-stats">
                        <span title="Stars">⭐ ${repo.stargazers_count.toLocaleString()}</span>
                        <span title="Forks">🍴 ${repo.forks_count.toLocaleString()}</span>
                    </div>
                </div>
                ${repo.description ? `<div class="repo-description">${this.escapeHtml(repo.description)}</div>` : ''}
                <div class="repo-meta">
                    <span>Owner: <a href="${repo.owner.html_url}" target="_blank" class="repo-owner">${repo.owner.login}</a></span>
                    <span>Updated: ${updated}</span>
                    <span>Created: ${created}</span>
                    ${repo.topics && repo.topics.length > 0 ? 
                        `<span>Topics: ${repo.topics.slice(0, 5).join(', ')}</span>` : ''}
                </div>
            </div>
        `;
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    getSafeId(value) {
        return value.replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    handleCveToggle(event) {
        const toggleBtn = event.target.closest('.cve-toggle');
        if (!toggleBtn) return;

        const card = toggleBtn.closest('.cve-card');
        if (!card) return;

        const repos = card.querySelector('.repositories');
        if (!repos) return;

        const isOpen = card.classList.toggle('is-open');
        repos.classList.toggle('is-collapsed', !isOpen);
        toggleBtn.setAttribute('aria-expanded', String(isOpen));
    }

    async copyVisibleCVEs() {
        if (this.filteredData.length === 0) {
            return;
        }

        const lines = this.filteredData.map(cve => {
            const repoCount = cve.repositories.length;
            const repoText = repoCount === 1 ? 'repository' : 'repositories';
            return `${cve.cve_id}: ${repoCount} ${repoText}`;
        });

        const textToCopy = lines.join('\n');

        try {
            await navigator.clipboard.writeText(textToCopy);
            this.showCopyFeedback();
        } catch (err) {
            console.error('Failed to copy text:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = textToCopy;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                this.showCopyFeedback();
            } catch (fallbackErr) {
                console.error('Fallback copy failed:', fallbackErr);
            }
            document.body.removeChild(textArea);
        }
    }

    showCopyFeedback() {
        const copyButton = document.getElementById('copyButton');
        if (!copyButton) return;

        const copyText = copyButton.querySelector('.copy-text');
        const originalText = copyText ? copyText.textContent : 'Copy';
        
        if (copyText) {
            copyText.textContent = 'Copied!';
            copyButton.classList.add('copied');
        }

        setTimeout(() => {
            if (copyText) {
                copyText.textContent = originalText;
            }
            copyButton.classList.remove('copied');
        }, 2000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    calculateTrendingCVEs() {
        const now = new Date();
        const hours24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const days7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const trending24h = this.calculateTrendingForPeriod(hours24, now);
        const trending7d = this.calculateTrendingForPeriod(days7, now);

        return { trending24h, trending7d };
    }

    calculateTrendingForPeriod(startDate, endDate) {
        const cveActivity = {};

        // Iterate through all CVEs
        this.allData.forEach(cve => {
            let newRepos = 0;
            let updatedRepos = 0;
            let totalStars = 0;
            let totalForks = 0;

            cve.repositories.forEach(repo => {
                const createdDate = new Date(repo.created_at);
                const updatedDate = new Date(repo.updated_at);

                // Check if repository was created in the period
                if (createdDate >= startDate && createdDate <= endDate) {
                    newRepos++;
                }

                // Check if repository was updated in the period
                if (updatedDate >= startDate && updatedDate <= endDate) {
                    updatedRepos++;
                    totalStars += repo.stargazers_count || 0;
                    totalForks += repo.forks_count || 0;
                }
            });

            // Calculate activity score (weighted: new repos worth more, updated repos worth less)
            const activityScore = (newRepos * 3) + updatedRepos + (totalStars / 100) + (totalForks / 50);

            if (newRepos > 0 || updatedRepos > 0) {
                cveActivity[cve.cve_id] = {
                    cve: cve,
                    newRepos,
                    updatedRepos,
                    totalStars,
                    totalForks,
                    activityScore
                };
            }
        });

        // Sort by activity score and return top 3
        return Object.values(cveActivity)
            .sort((a, b) => b.activityScore - a.activityScore)
            .slice(0, 3);
    }

    updateTrendingCVEs() {
        const { trending24h, trending7d } = this.calculateTrendingCVEs();
        const trendingSection = document.getElementById('trendingSection');

        if (trending24h.length === 0 && trending7d.length === 0) {
            trendingSection.style.display = 'none';
            return;
        }

        trendingSection.style.display = 'block';
        this.renderTrendingCVEs('trending24h', trending24h);
        this.renderTrendingCVEs('trending7d', trending7d);
    }

    renderTrendingCVEs(containerId, trendingData) {
        const container = document.getElementById(containerId);
        
        if (trendingData.length === 0) {
            container.innerHTML = '<div class="trending-empty">No trending CVEs in this period</div>';
            return;
        }

        container.innerHTML = trendingData.map((item, index) => {
            const cve = item.cve;
            const rank = index + 1;
            const rankEmoji = ['🥇', '🥈', '🥉'][index] || `${rank}.`;

            return `
                <div class="trending-card">
                    <div class="trending-rank">${rankEmoji}</div>
                    <div class="trending-content">
                        <a href="https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cve.cve_id}" 
                           target="_blank" 
                           class="trending-cve-id">
                            ${cve.cve_id}
                        </a>
                        <div class="trending-metrics">
                            ${item.newRepos > 0 ? `<span class="metric new">🆕 ${item.newRepos} new</span>` : ''}
                            ${item.updatedRepos > 0 ? `<span class="metric updated">🔄 ${item.updatedRepos} updated</span>` : ''}
                            ${item.totalStars > 0 ? `<span class="metric stars">⭐ ${item.totalStars.toLocaleString()}</span>` : ''}
                            ${item.totalForks > 0 ? `<span class="metric forks">🍴 ${item.totalForks.toLocaleString()}</span>` : ''}
                            <span class="metric total">📦 ${cve.repositories.length} repos</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new CVEMapper();
    });
} else {
    new CVEMapper();
}
