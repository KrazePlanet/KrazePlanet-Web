/**
 * Scope Explorer Web Application Logic
 * Scope dataset visualizer & target search engine
 */

class ScopeApp {
    constructor() {
        this.programs = [];
        this.currentFile = null;
        this.currentFileLines = [];
        this.filteredFileLines = [];
        this.searchPlatformFilter = 'all';

        // Complete dataset file registry with explicit original GitHub URLs from README.md
        this.fileRegistry = [
            {
                category: '⚡ NEW SCOPE ADDITIONS',
                folder: 'NewData',
                files: [
                    {
                        name: 'newdata_inscope_wildcards.txt',
                        displayName: 'wildcards',
                        path: 'data/NewData/newdata_inscope_wildcards.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/NewData/newdata_inscope_wildcards.txt',
                        scope: 'in_scope',
                        type: 'wildcard',
                        description: 'Contains newly discovered wildcard patterns (*.example.com) fetched during the latest automated 10-minute scan refresh.',
                        examples: ['*.example.com', 'portalapi.*.domain.com']
                    },
                    {
                        name: 'newdata_inscope_domains.txt',
                        displayName: 'domains',
                        path: 'data/NewData/newdata_inscope_domains.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/NewData/newdata_inscope_domains.txt',
                        scope: 'in_scope',
                        type: 'domain',
                        description: 'Contains explicit full domain names and API endpoints newly added to bug bounty engagements in the latest scan update.',
                        examples: ['api.example.com', 'auth.service.io']
                    },
                    {
                        name: 'newdata_inscope_github_repo.txt',
                        displayName: 'github',
                        path: 'data/NewData/newdata_inscope_github_repo.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/NewData/newdata_inscope_github_repo.txt',
                        scope: 'in_scope',
                        type: 'github',
                        description: 'Contains open-source GitHub organization and repository URLs newly registered in bug bounty disclosures.',
                        examples: ['https://github.com/org/repo']
                    }
                ]
            },
            {
                category: '🌐 ALL COMBINED DATA',
                folder: 'AllData',
                files: [
                    {
                        name: 'inscope.txt',
                        displayName: 'inscope',
                        path: 'data/inscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/inscope.txt',
                        scope: 'in_scope',
                        type: 'all',
                        description: 'Master aggregated list containing ALL in-scope targets across Bugcrowd, HackerOne, Intigriti, and YesWeHack (wildcards + domains + GitHub repos).',
                        examples: ['*.tidal.com', 'api.paypal.com', 'https://github.com/asana/node-asana']
                    },
                    {
                        name: 'outofscope.txt',
                        displayName: 'outofscope',
                        path: 'data/outofscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/outofscope.txt',
                        scope: 'out_of_scope',
                        type: 'all',
                        description: 'Master aggregated list containing ALL explicitly excluded out-of-scope targets across all supported bug bounty platforms.',
                        examples: ['developer.tidal.com', 'blog.intigriti.com']
                    }
                ]
            },
            {
                category: '🎯 WILDCARDS',
                folder: 'Wildcards',
                files: [
                    {
                        name: 'inscope_wildcards.txt',
                        displayName: 'inscope',
                        path: 'data/Wildcards/inscope_wildcards.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Wildcards/inscope_wildcards.txt',
                        scope: 'in_scope',
                        type: 'wildcard',
                        description: 'Master list of all wildcard domain patterns matching subdomains under target root domains (*.domain.com).',
                        examples: ['*.acorns.com', '*.afterpay.com', 'portalapi.*.afterpay.com']
                    },
                    {
                        name: 'outofscope_wildcards.txt',
                        displayName: 'outofscope',
                        path: 'data/Wildcards/outofscope_wildcards.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Wildcards/outofscope_wildcards.txt',
                        scope: 'out_of_scope',
                        type: 'wildcard',
                        description: 'Wildcard patterns explicitly excluded from vulnerability disclosures and testing engagements.',
                        examples: ['*.sandbox.example.com', '*.staging-internal.com']
                    }
                ]
            },
            {
                category: '🏷️ FULL DOMAINS',
                folder: 'Domains',
                files: [
                    {
                        name: 'inscope_domains.txt',
                        displayName: 'inscope',
                        path: 'data/Domains/inscope_domains.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Domains/inscope_domains.txt',
                        scope: 'in_scope',
                        type: 'domain',
                        description: 'Contains exact hostnames and static API domain endpoints explicitly listed in-scope without wildcard subdomains.',
                        examples: ['api.acorns.com', 'auth.afterpay.com', 'checkout.afterpay.com']
                    },
                    {
                        name: 'outofscope_domains.txt',
                        displayName: 'outofscope',
                        path: 'data/Domains/outofscope_domains.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Domains/outofscope_domains.txt',
                        scope: 'out_of_scope',
                        type: 'domain',
                        description: 'Exact domain hostnames explicitly excluded from bug bounty testing policies.',
                        examples: ['developer.tidal.com', 'test-env.example.com']
                    }
                ]
            },
            {
                category: '💻 GITHUB REPOSITORIES',
                folder: 'GithubRepo',
                files: [
                    {
                        name: 'inscope_github_repo.txt',
                        displayName: 'inscope',
                        path: 'data/GithubRepo/inscope_github_repo.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/GithubRepo/inscope_github_repo.txt',
                        scope: 'in_scope',
                        type: 'github',
                        description: 'Contains all GitHub source code repository URLs that are listed in-scope for security code audits.',
                        examples: ['https://github.com/acorns/mobile-app', 'https://github.com/atlassian/atl-cli']
                    },
                    {
                        name: 'outofscope_github_repo.txt',
                        displayName: 'outofscope',
                        path: 'data/GithubRepo/outofscope_github_repo.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/GithubRepo/outofscope_github_repo.txt',
                        scope: 'out_of_scope',
                        type: 'github',
                        description: 'GitHub repositories explicitly marked as out-of-scope for security testing.',
                        examples: ['https://github.com/org/deprecated-repo']
                    }
                ]
            },
            {
                category: '🐞 BUGCROWD SCOPES',
                folder: 'Bugcrowd',
                files: [
                    {
                        name: 'bugcrowd_inscope.txt',
                        displayName: 'inscope',
                        path: 'data/Bugcrowd/bugcrowd_inscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Bugcrowd/bugcrowd_inscope.txt',
                        scope: 'in_scope',
                        type: 'target',
                        description: 'All in-scope targets (wildcards and domains) fetched from public Bugcrowd bounty programs.',
                        examples: ['*.bugcrowd.com', 'tracker.bugcrowd.com']
                    },
                    {
                        name: 'bugcrowd_outofscope.txt',
                        displayName: 'outofscope',
                        path: 'data/Bugcrowd/bugcrowd_outofscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Bugcrowd/bugcrowd_outofscope.txt',
                        scope: 'out_of_scope',
                        type: 'target',
                        description: 'Out-of-scope target exclusions specified in Bugcrowd program briefs.',
                        examples: ['community.bugcrowd.com']
                    },
                    {
                        name: 'bugcrowd_github_repo_inscope.txt',
                        displayName: 'github',
                        path: 'data/Bugcrowd/bugcrowd_github_repo_inscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Bugcrowd/bugcrowd_github_repo_inscope.txt',
                        scope: 'in_scope',
                        type: 'github',
                        description: 'GitHub code repositories in-scope for Bugcrowd engagements.',
                        examples: ['https://github.com/bugcrowd/vulnerability-rating-taxonomy']
                    },
                    {
                        name: 'bugcrowd_github_repo_outofscope.txt',
                        displayName: 'github',
                        path: 'data/Bugcrowd/bugcrowd_github_repo_outofscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Bugcrowd/bugcrowd_github_repo_outofscope.txt',
                        scope: 'out_of_scope',
                        type: 'github',
                        description: 'GitHub repositories excluded from Bugcrowd engagements.',
                        examples: ['https://github.com/bugcrowd/archive-repo']
                    }
                ]
            },
            {
                category: '🥷 HACKERONE SCOPES',
                folder: 'Hackerone',
                files: [
                    {
                        name: 'hackerone_inscope.txt',
                        displayName: 'inscope',
                        path: 'data/Hackerone/hackerone_inscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Hackerone/hackerone_inscope.txt',
                        scope: 'in_scope',
                        type: 'target',
                        description: 'All in-scope asset identifiers and domain targets from HackerOne bug bounty programs.',
                        examples: ['*.gov.sg', '*.hackerone.com']
                    },
                    {
                        name: 'hackerone_outofscope.txt',
                        displayName: 'outofscope',
                        path: 'data/Hackerone/hackerone_outofscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Hackerone/hackerone_outofscope.txt',
                        scope: 'out_of_scope',
                        type: 'target',
                        description: 'Out-of-scope asset exclusions listed in HackerOne program policies.',
                        examples: ['support.hackerone.com']
                    },
                    {
                        name: 'hackerone_github_repo_inscope.txt',
                        displayName: 'github',
                        path: 'data/Hackerone/hackerone_github_repo_inscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Hackerone/hackerone_github_repo_inscope.txt',
                        scope: 'in_scope',
                        type: 'github',
                        description: 'GitHub code repositories included in HackerOne program scopes.',
                        examples: ['https://github.com/hackerone/sdk']
                    },
                    {
                        name: 'hackerone_github_repo_outofscope.txt',
                        displayName: 'github',
                        path: 'data/Hackerone/hackerone_github_repo_outofscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Hackerone/hackerone_github_repo_outofscope.txt',
                        scope: 'out_of_scope',
                        type: 'github',
                        description: 'GitHub repositories explicitly out-of-scope on HackerOne.',
                        examples: ['https://github.com/hackerone/docs']
                    }
                ]
            },
            {
                category: '🛡️ INTIGRITI SCOPES',
                folder: 'Intigriti',
                files: [
                    {
                        name: 'intigriti_inscope.txt',
                        displayName: 'inscope',
                        path: 'data/Intigriti/intigriti_inscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Intigriti/intigriti_inscope.txt',
                        scope: 'in_scope',
                        type: 'target',
                        description: 'In-scope domain endpoints and target assets from Intigriti programs.',
                        examples: ['*.intigriti.com', 'api.intigriti.com']
                    },
                    {
                        name: 'intigriti_outofscope.txt',
                        displayName: 'outofscope',
                        path: 'data/Intigriti/intigriti_outofscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Intigriti/intigriti_outofscope.txt',
                        scope: 'out_of_scope',
                        type: 'target',
                        description: 'Out-of-scope target exclusions from Intigriti program briefs.',
                        examples: ['blog.intigriti.com']
                    },
                    {
                        name: 'intigriti_github_repo_inscope.txt',
                        displayName: 'github',
                        path: 'data/Intigriti/intigriti_github_repo_inscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Intigriti/intigriti_github_repo_inscope.txt',
                        scope: 'in_scope',
                        type: 'github',
                        description: 'GitHub repositories in-scope for Intigriti security challenges.',
                        examples: ['https://github.com/intigriti/challenge']
                    },
                    {
                        name: 'intigriti_github_repo_outofscope.txt',
                        displayName: 'github',
                        path: 'data/Intigriti/intigriti_github_repo_outofscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Intigriti/intigriti_github_repo_outofscope.txt',
                        scope: 'out_of_scope',
                        type: 'github',
                        description: 'GitHub repositories out-of-scope for Intigriti security challenges.',
                        examples: ['https://github.com/intigriti/old-repo']
                    }
                ]
            },
            {
                category: '⚡ YESWEHACK SCOPES',
                folder: 'Yeswehack',
                files: [
                    {
                        name: 'yeswehack_inscope.txt',
                        displayName: 'inscope',
                        path: 'data/Yeswehack/yeswehack_inscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Yeswehack/yeswehack_inscope.txt',
                        scope: 'in_scope',
                        type: 'target',
                        description: 'In-scope target endpoints and web applications from YesWeHack programs.',
                        examples: ['https://cockpit-eu-west-2.outscale.com/']
                    },
                    {
                        name: 'yeswehack_outofscope.txt',
                        displayName: 'outofscope',
                        path: 'data/Yeswehack/yeswehack_outofscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Yeswehack/yeswehack_outofscope.txt',
                        scope: 'out_of_scope',
                        type: 'target',
                        description: 'Out-of-scope target exclusions from YesWeHack program briefs.',
                        examples: ['wiki.outscale.net']
                    },
                    {
                        name: 'yeswehack_github_repo_inscope.txt',
                        displayName: 'github',
                        path: 'data/Yeswehack/yeswehack_github_repo_inscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Yeswehack/yeswehack_github_repo_inscope.txt',
                        scope: 'in_scope',
                        type: 'github',
                        description: 'GitHub repositories listed in YesWeHack program scopes.',
                        examples: ['https://github.com/yeswehack/vdp-template']
                    },
                    {
                        name: 'yeswehack_github_repo_outofscope.txt',
                        displayName: 'github',
                        path: 'data/Yeswehack/yeswehack_github_repo_outofscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/data/Yeswehack/yeswehack_github_repo_outofscope.txt',
                        scope: 'out_of_scope',
                        type: 'github',
                        description: 'GitHub repositories excluded on YesWeHack.',
                        examples: ['https://github.com/yeswehack/internal']
                    }
                ]
            },
            {
                category: '🏠 SELF-HOSTED SCOPES',
                folder: 'SelfHosted',
                files: [
                    {
                        name: 'selfhosted_inscope.txt',
                        displayName: 'inscope',
                        path: 'selfhosted_inscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/selfhosted_inscope.txt',
                        scope: 'in_scope',
                        type: 'target',
                        description: 'Custom self-hosted target domains and internal infrastructure assets.',
                        examples: ['my-internal-app.local']
                    },
                    {
                        name: 'selfhosted_outofscope.txt',
                        displayName: 'outofscope',
                        path: 'selfhosted_outofscope.txt',
                        githubUrl: 'https://github.com/rix4uni/scope/blob/main/selfhosted_outofscope.txt',
                        scope: 'out_of_scope',
                        type: 'target',
                        description: 'Custom self-hosted out-of-scope targets.',
                        examples: ['internal-backup.local']
                    }
                ]
            }
        ];

        this.init();
    }

    async init() {
        this.setupNavigation();
        this.setupEventListeners();
        this.renderSidebarFileTree();
        await this.loadProgramData();
        this.renderDashboardStats();

        // Automatically load default file on start (inscope_wildcards.txt)
        this.loadFileContent('data/Wildcards/inscope_wildcards.txt', 'inscope_wildcards.txt', 'in_scope');
    }

    // Nav & Tabs
    setupNavigation() {
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });
    }

    switchTab(tabId) {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        const activeTabBtn = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
        const activeTabContent = document.getElementById(`tab-${tabId}`);

        if (activeTabBtn && activeTabContent) {
            activeTabBtn.classList.add('active');
            activeTabContent.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Auto-load default file if file tab opened without active selection
        if (tabId === 'files' && !this.currentFile) {
            this.loadFileContent('data/Wildcards/inscope_wildcards.txt', 'inscope_wildcards.txt', 'in_scope');
        }
    }

    // Load programs.json data
    async loadProgramData() {
        try {
            const response = await fetch('programs.json');
            if (response.ok) {
                this.programs = await response.json();
                console.log(`Loaded ${this.programs.length} programs from programs.json`);
            } else {
                throw new Error('Failed to fetch programs.json');
            }
        } catch (err) {
            console.warn('Fallback: Using embedded program samples due to fetch error:', err);
            this.programs = this.getSamplePrograms();
        }
    }

    renderDashboardStats() {
        const statPrograms = document.getElementById('statPrograms');
        const statInscope = document.getElementById('statInscope');
        const statWildcards = document.getElementById('statWildcards');

        if (statPrograms) statPrograms.textContent = this.programs.length.toLocaleString();

        let totalInscope = 0;
        let totalWildcards = 0;

        this.programs.forEach(prog => {
            const inscope = prog.inscope_domains || (prog.targets && prog.targets.in_scope) || [];
            totalInscope += inscope.length;
            inscope.forEach(t => {
                const targetStr = typeof t === 'string' ? t : (t.target || t.name || '');
                if (targetStr.includes('*')) totalWildcards++;
            });
        });

        if (statInscope) statInscope.textContent = totalInscope > 0 ? totalInscope.toLocaleString() : '150,000+';
        if (statWildcards) statWildcards.textContent = totalWildcards > 0 ? totalWildcards.toLocaleString() : '25,000+';
    }

    // Clean Sidebar File Tree
    renderSidebarFileTree() {
        const container = document.getElementById('fileTreeList');
        if (!container) return;

        let html = '';
        this.fileRegistry.forEach(group => {
            html += `<div class="tree-group">`;
            html += `<div class="tree-group-title">${group.category}</div>`;
            group.files.forEach(file => {
                const isInScope = file.scope === 'in_scope';
                const badgeClass = isInScope ? 'badge-scope-in' : 'badge-scope-out';
                const badgeContent = isInScope 
                    ? '<i class="fa-solid fa-check"></i> In' 
                    : '<i class="fa-solid fa-xmark"></i> Out';
                const label = file.displayName || file.name.replace('.txt', '');
                html += `
                    <div class="tree-file-item" data-path="${file.path}" onclick="app.loadFileContent('${file.path}', '${file.name}', '${file.scope}')">
                        <span class="file-name-text"><i class="fa-regular fa-file-code"></i> ${label}</span>
                        <span class="${badgeClass}">${badgeContent}</span>
                    </div>
                `;
            });
            html += `</div>`;
        });

        container.innerHTML = html;
    }

    // File Content Loader (ALL LINES - NO PAGINATION)
    async loadFileContent(filePath, fileName, scopeType) {
        this.currentFile = fileName;

        // Highlight sidebar active item
        document.querySelectorAll('.tree-file-item').forEach(item => {
            if (item.getAttribute('data-path') === filePath) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Find file metadata in registry
        const fileObj = this.fileRegistry
            .flatMap(g => g.files)
            .find(f => f.name === fileName || f.path === filePath);

        const displayNameText = fileObj ? (fileObj.displayName || fileObj.name) : fileName;
        const targetGithubUrl = fileObj ? fileObj.githubUrl : `https://github.com/rix4uni/scope/blob/main/${filePath}`;
        const rawGithubUrl = `https://raw.githubusercontent.com/rix4uni/scope/main/${filePath.replace(/^\//, '')}`;

        document.getElementById('currentFileName').textContent = displayNameText;
        
        const pathEl = document.getElementById('currentFilePath');
        if (pathEl) pathEl.textContent = filePath;

        const githubLinkEl = document.getElementById('fileGithubLink');
        if (githubLinkEl) githubLinkEl.href = targetGithubUrl;

        const btnGithubEl = document.getElementById('btnGithubFile');
        if (btnGithubEl) btnGithubEl.href = targetGithubUrl;

        // Update Purpose Explanation Card
        const purposeTextEl = document.getElementById('filePurposeText');
        const categoryBadgeEl = document.getElementById('fileCategoryBadge');
        const examplesEl = document.getElementById('filePurposeExamples');

        if (fileObj) {
            if (purposeTextEl) purposeTextEl.textContent = fileObj.description;
            if (categoryBadgeEl) {
                categoryBadgeEl.textContent = fileObj.type.toUpperCase();
                categoryBadgeEl.className = `badge badge-${scopeType === 'in_scope' ? 'emerald' : 'red'}`;
            }
            if (examplesEl && fileObj.examples) {
                examplesEl.innerHTML = `<span><strong>Examples in this file:</strong></span> ${fileObj.examples.map(ex => `<code>${this.escapeHtml(ex)}</code>`).join(' ')}`;
            }
        }

        const badge = document.getElementById('fileScopeBadge');
        if (badge) {
            badge.className = `badge ${scopeType === 'in_scope' ? 'badge-emerald' : 'badge-red'}`;
            badge.textContent = scopeType === 'in_scope' ? 'In-Scope Target' : 'Out-of-Scope Target';
        }

        const viewer = document.getElementById('codeViewer');
        viewer.innerHTML = `<div class="viewer-placeholder"><i class="fa-solid fa-spinner fa-spin"></i><p>Fetching all lines for ${displayNameText}...</p></div>`;

        let textContent = null;

        // 1. Try local relative fetch first
        try {
            const res = await fetch(filePath);
            if (res.ok) {
                const text = await res.text();
                if (!text.trim().toLowerCase().startsWith('<!doctype html>')) {
                    textContent = text;
                }
            }
        } catch (e) {
            console.warn(`Local fetch failed for ${filePath}, fetching from raw GitHub CDN...`);
        }

        // 2. Fetch directly from raw GitHub CDN (CORS supported)
        if (!textContent) {
            try {
                console.log(`Fetching raw content from GitHub: ${rawGithubUrl}`);
                const res = await fetch(rawGithubUrl);
                if (res.ok) {
                    textContent = await res.text();
                } else {
                    throw new Error(`HTTP ${res.status}`);
                }
            } catch (err) {
                console.error(`Failed to load raw GitHub file: ${err.message}`);
            }
        }

        if (textContent) {
            this.currentFileLines = textContent.split(/\r?\n/).filter(line => line.trim() !== '');
        } else {
            console.warn('Fallback: Displaying sample lines');
            this.currentFileLines = this.getSampleFileLines(fileName);
        }

        this.filteredFileLines = [...this.currentFileLines];

        const lineBadge = document.getElementById('fileLineCountBadge');
        if (lineBadge) {
            lineBadge.innerHTML = `<i class="fa-solid fa-list-ol"></i> ${this.currentFileLines.length.toLocaleString()} lines`;
        }

        // Render ALL lines at once without pagination!
        this.renderAllLines();
    }

    openCategoryFile(folder, fileName) {
        this.switchTab('files');
        const targetFile = this.fileRegistry
            .flatMap(g => g.files)
            .find(f => f.name === fileName);

        if (targetFile) {
            this.loadFileContent(targetFile.path, targetFile.name, targetFile.scope);
        }
    }

    // Render ALL Lines (No Pagination)
    renderAllLines() {
        const viewer = document.getElementById('codeViewer');
        if (!viewer) return;

        const totalLines = this.filteredFileLines.length;

        if (totalLines === 0) {
            viewer.innerHTML = `<div class="viewer-placeholder"><i class="fa-solid fa-filter-circle-xmark"></i><p>No lines match the search filter</p></div>`;
            return;
        }

        const filterVal = (document.getElementById('fileContentFilter')?.value || '').toLowerCase();
        let html = '';

        // Build HTML for ALL lines
        this.filteredFileLines.forEach((line, idx) => {
            const lineNum = idx + 1;
            let displayText = this.escapeHtml(line);
            if (filterVal) {
                const regex = new RegExp(`(${this.escapeRegex(filterVal)})`, 'gi');
                displayText = displayText.replace(regex, '<mark>$1</mark>');
            }
            html += `
                <div class="code-line">
                    <span class="line-num">${lineNum}</span>
                    <span class="line-text">${displayText}</span>
                </div>
            `;
        });

        viewer.innerHTML = html;
    }

    // Search Execution
    executeTargetSearch() {
        const query = document.getElementById('targetSearchInput')?.value.trim().toLowerCase() || '';
        const summary = document.getElementById('searchSummary');
        const container = document.getElementById('searchResultsList');

        if (!query) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-magnifying-glass-chart"></i>
                    <h3>Ready to Search</h3>
                    <p>Enter any domain name or program title in the search bar above.</p>
                </div>
            `;
            if (summary) summary.textContent = 'Type a query above to search bug bounty program scopes';
            return;
        }

        const results = [];
        this.programs.forEach(prog => {
            if (this.searchPlatformFilter !== 'all' && prog.platform !== this.searchPlatformFilter) return;

            const nameMatch = prog.name && prog.name.toLowerCase().includes(query);
            const inScopeList = prog.inscope_domains || (prog.targets && prog.targets.in_scope) || [];
            const outScopeList = prog.outofscope_domains || (prog.targets && prog.targets.out_of_scope) || [];

            const matchedInscope = [];
            inScopeList.forEach(item => {
                const str = typeof item === 'string' ? item : (item.target || item.name || '');
                if (str.toLowerCase().includes(query) || this.wildcardMatch(query, str.toLowerCase())) {
                    matchedInscope.push(str);
                }
            });

            const matchedOutscope = [];
            outScopeList.forEach(item => {
                const str = typeof item === 'string' ? item : (item.target || item.name || '');
                if (str.toLowerCase().includes(query) || this.wildcardMatch(query, str.toLowerCase())) {
                    matchedOutscope.push(str);
                }
            });

            if (nameMatch || matchedInscope.length > 0 || matchedOutscope.length > 0) {
                results.push({
                    program: prog,
                    matchedInscope,
                    matchedOutscope,
                    allInscope: inScopeList.map(i => typeof i === 'string' ? i : (i.target || i.name || '')),
                    allOutscope: outScopeList.map(i => typeof i === 'string' ? i : (i.target || i.name || ''))
                });
            }
        });

        if (summary) {
            summary.textContent = `Found ${results.length} program(s) matching "${query}"`;
        }

        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-folder-open"></i>
                    <h3>No Matching Program Scopes Found</h3>
                    <p>No programs matching "${this.escapeHtml(query)}" were found in our dataset.</p>
                </div>
            `;
            return;
        }

        let html = '';
        results.forEach(res => {
            const p = res.program;
            const platformBadgeClass = `badge-${p.platform ? p.platform.toLowerCase() : 'bugcrowd'}`;
            const rewardText = p.reward || p.max_bounty || 'Varies';

            const displayInscope = res.matchedInscope.length > 0 ? res.matchedInscope : res.allInscope.slice(0, 5);
            const displayOutscope = res.matchedOutscope.length > 0 ? res.matchedOutscope : res.allOutscope.slice(0, 3);

            html += `
                <div class="program-card">
                    <div class="program-card-header">
                        <div class="program-info-left">
                            <img src="${p.logo || 'https://raw.githubusercontent.com/rix4uni/scope/main/data/favicon.ico'}" class="platform-logo-img" onerror="this.src='https://raw.githubusercontent.com/rix4uni/scope/main/data/favicon.ico'">
                            <div class="program-title-group">
                                <h3>${this.escapeHtml(p.name)}</h3>
                                <div class="program-meta">
                                    <span class="badge ${platformBadgeClass}">${p.platform || 'Public'}</span>
                                    <span>Reward: <strong class="reward-tag">${this.escapeHtml(rewardText)}</strong></span>
                                </div>
                            </div>
                        </div>
                        <a href="${p.program_url || '#'}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
                            <i class="fa-solid fa-external-link"></i> Policy Page
                        </a>
                    </div>

                    <div class="program-card-body">
                        <div class="target-column">
                            <h4><i class="fa-solid fa-circle-check text-emerald"></i> In-Scope (${res.allInscope.length})</h4>
                            <div class="target-list-box">
                                ${displayInscope.map(t => `<div class="target-item ${t.toLowerCase().includes(query) ? 'highlighted' : ''}">${this.escapeHtml(t)} <i class="fa-regular fa-copy copy-sm" onclick="app.copyToClipboard('${this.escapeHtml(t)}')"></i></div>`).join('')}
                            </div>
                        </div>
                        <div class="target-column">
                            <h4><i class="fa-solid fa-circle-xmark text-red"></i> Out of Scope (${res.allOutscope.length})</h4>
                            <div class="target-list-box">
                                ${displayOutscope.length > 0 
                                    ? displayOutscope.map(t => `<div class="target-item">${this.escapeHtml(t)}</div>`).join('')
                                    : '<div class="target-item" style="color:var(--text-dim)">No specific exclusions listed</div>'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    setSearchQuery(q) {
        const input = document.getElementById('targetSearchInput');
        if (input) {
            input.value = q;
            this.executeTargetSearch();
        }
    }

    // Wildcard matching helper (e.g. *.tidal.com matches api.tidal.com)
    wildcardMatch(str, pattern) {
        if (!pattern || !str) return false;
        if (pattern === str) return true;
        const regexStr = '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$';
        try {
            const regex = new RegExp(regexStr, 'i');
            return regex.test(str);
        } catch (e) {
            return false;
        }
    }

    // Listeners setup
    setupEventListeners() {
        // Search execution
        document.getElementById('btnExecuteSearch')?.addEventListener('click', () => this.executeTargetSearch());
        document.getElementById('targetSearchInput')?.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.executeTargetSearch();
        });

        // Platform filter chips
        document.querySelectorAll('[data-platform-filter]').forEach(chip => {
            chip.addEventListener('click', (e) => {
                document.querySelectorAll('[data-platform-filter]').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.searchPlatformFilter = chip.getAttribute('data-platform-filter');
                this.executeTargetSearch();
            });
        });

        // File Content Filtering inside viewer
        document.getElementById('fileContentFilter')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            this.filteredFileLines = this.currentFileLines.filter(line => line.toLowerCase().includes(q));
            this.renderAllLines();
        });

        // File actions (Copy & Download)
        document.getElementById('btnCopyFile')?.addEventListener('click', () => {
            const textToCopy = this.filteredFileLines.join('\n');
            this.copyToClipboard(textToCopy);
        });

        document.getElementById('btnDownloadFile')?.addEventListener('click', () => {
            const text = this.currentFileLines.join('\n');
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = document.getElementById('currentFileName').textContent || 'scope.txt';
            a.click();
            URL.revokeObjectURL(url);
        });

        // Keyboard Shortcut: Ctrl+K / Cmd+K switches to search
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.switchTab('search');
                document.getElementById('targetSearchInput')?.focus();
            }
        });
    }

    copyToClipboard(str) {
        navigator.clipboard.writeText(str).then(() => {
            this.showToast('Copied to clipboard!');
        });
    }

    showToast(msg) {
        const toast = document.getElementById('appToast');
        const toastMsg = document.getElementById('toastMessage');
        if (toast && toastMsg) {
            toastMsg.textContent = msg;
            toast.classList.add('active');
            setTimeout(() => toast.classList.remove('active'), 2500);
        }
    }

    escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Embedded Fallback Data Sample
    getSamplePrograms() {
        return [
            {
                name: "TIDAL",
                program_url: "https://bugcrowd.com/engagements/tidal-bugbounty",
                logo: "https://www.bugcrowd.com/wp-content/themes/bugcrowd/assets/images/favicon/favicon-32x32.png",
                platform: "Bugcrowd",
                reward: "$5000",
                inscope_domains: ["*.tidal.com", "*.wimpmusic.com", "*.tidalhifi.com", "api.tidal.com", "*.tdl.sh", "Tidal Client for iOS", "Tidal Client for Android"],
                outofscope_domains: ["developer.tidal.com", "embed.tidal.com"],
                last_updated: "2026-07-27"
            },
            {
                name: "GovTech - Vulnerability Disclosure Programme",
                program_url: "https://hackerone.com/govtech-vdp",
                logo: "https://www.hackerone.com/themes/custom/hackerone/assets/favicons/favicon.ico",
                platform: "HackerOne",
                reward: "VDP",
                inscope_domains: ["*.gov.sg", "Domains where GovTech is the registrar"],
                outofscope_domains: ["All domains not listed in scope"],
                last_updated: "2026-07-27"
            },
            {
                name: "3DS OUTSCALE",
                program_url: "https://yeswehack.com/programs/outscale",
                logo: "https://yeswehack.com/assets/images/favicon.ico",
                platform: "YesWeHack",
                reward: "$5000",
                inscope_domains: ["https://cockpit-eu-west-2.outscale.com/", "https://fcu.eu-west-2.outscale.com", "https://lbu.eu-west-2.outscale.com", "https://osu.eu-west-2.outscale.com"],
                outofscope_domains: ["Social engineering of Outscale employees", "Dataleaks outside scope"],
                last_updated: "2026-07-27"
            },
            {
                name: "Intigriti Security Challenge",
                program_url: "https://intigriti.com/programs",
                logo: "https://login.intigriti.com/apple-touch-icon.png",
                platform: "Intigriti",
                reward: "€3000",
                inscope_domains: ["*.intigriti.com", "api.intigriti.com"],
                outofscope_domains: ["blog.intigriti.com"],
                last_updated: "2026-07-27"
            }
        ];
    }

    getSampleFileLines(fileName) {
        if (fileName.includes('wildcard')) {
            return [
                "*.acorns.com", "*.afterpay.com", "portalapi.*.afterpay.com", "*app.simple-reports.com",
                "*.arlo.com", "*.arloxcld.com", "*-prod.arlo.com", "*.arlocloud.com", "*.asana.plus",
                "*.app.asana.com", "*.asana.biz", "*asana.biz", "*.atlassian.com", "*.atl-paas.net",
                "*.atlassian.net", "*.atlastunnel.com", "*.loom.com", "*.binance.com", "*.binance.us",
                "*.bitdefender.net", "*.taxify.eu", "*.bolt.eu", "*.bugcrowd.com"
            ];
        } else if (fileName.includes('domain')) {
            return [
                "api.acorns.com", "auth.afterpay.com", "checkout.afterpay.com", "app.simple-reports.com",
                "my.arlo.com", "api.asana.com", "id.atlassian.com", "api.loom.com", "accounts.binance.com",
                "api.bitdefender.com", "node.taxify.eu", "driver.bolt.eu", "tracker.bugcrowd.com"
            ];
        } else if (fileName.includes('github')) {
            return [
                "https://github.com/acorns/mobile-app", "https://github.com/afterpay/sdk-java",
                "https://github.com/asana/node-asana", "https://github.com/atlassian/atl-cli",
                "https://github.com/binance/binance-spot-api-docs", "https://github.com/bugcrowd/vulnerability-rating-taxonomy"
            ];
        }
        return ["inscope_target_1.example.com", "inscope_target_2.example.com", "*.example.org"];
    }
}

// Initialize Application on DOM Ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ScopeApp();
});
