// Main Blog Functionality
(function() {
    'use strict';

    // DOM Elements
    const postsGrid = document.getElementById('postsGrid');
    const searchInput = document.getElementById('searchInput');
    const filterTags = document.getElementById('filterTags');
    const navToggle = document.getElementById('navToggle');
    const navMobile = document.getElementById('navMobile');

    // State
    let currentFilter = 'all';
    let searchQuery = '';

    // List of available posts (IDs)
    const availablePosts = ['xss', 'xxe'];
    let postsData = [];

    // Initialize
    document.addEventListener('DOMContentLoaded', async () => {
        await loadPostsData();
        init();
    });

    // Load posts data from markdown files
    async function loadPostsData() {
        const posts = [];
        
        for (const postId of availablePosts) {
            try {
                const response = await fetch(`posts/${postId}.md`);
                if (!response.ok) continue;
                
                const markdown = await response.text();
                const parsed = parseFrontmatter(markdown);
                
                if (parsed && parsed.metadata) {
                    parsed.metadata.id = postId;
                    parsed.metadata.file = `posts/${postId}.md`;
                    posts.push(parsed.metadata);
                }
            } catch (error) {
                console.error(`Failed to load post ${postId}:`, error);
            }
        }
        
        postsData = posts;
    }

    function init() {
        renderPosts();
        setupEventListeners();
        setupThemeToggle();
        checkForPostView();
    }

    // Setup theme toggle
    function setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            themeToggle.textContent = '☀';
        }

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            themeToggle.textContent = isLight ? '☀' : '☾';
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
    }

    // Setup event listeners
    function setupEventListeners() {
        // Search
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.toLowerCase();
                renderPosts();
            });
        }

        // Filter tags
        if (filterTags) {
            filterTags.addEventListener('click', (e) => {
                if (e.target.classList.contains('tag')) {
                    document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
                    e.target.classList.add('active');
                    currentFilter = e.target.dataset.filter;
                    renderPosts();
                }
            });
        }

        // Mobile nav toggle
        if (navToggle && navMobile) {
            navToggle.addEventListener('click', () => {
                const isHidden = navMobile.getAttribute('aria-hidden') === 'true';
                navMobile.setAttribute('aria-hidden', !isHidden);
                navMobile.style.display = isHidden ? 'block' : 'none';
            });
        }
    }

    // Check if viewing a specific post
    function checkForPostView() {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#post=')) {
            const postId = hash.replace('#post=', '');
            loadPost(postId);
        }
    }

    // Render posts grid
    function renderPosts() {
        if (!postsGrid) return;

        const filteredPosts = postsData.filter(post => {
            const matchesFilter = currentFilter === 'all' || post.category === currentFilter;
            const matchesSearch = !searchQuery || 
                post.title.toLowerCase().includes(searchQuery) ||
                post.description.toLowerCase().includes(searchQuery) ||
                (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchQuery)));
            return matchesFilter && matchesSearch;
        });

        if (filteredPosts.length === 0) {
            postsGrid.innerHTML = `
                <div class="no-results" style="grid-column: 1 / -1;">
                    <h3>No posts found</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                </div>
            `;
            return;
        }

        postsGrid.innerHTML = filteredPosts.map(post => createPostCard(post)).join('');

        // Add click handlers
        document.querySelectorAll('.blog-card').forEach(card => {
            card.addEventListener('click', () => {
                const postId = card.dataset.postId;
                window.location.href = `templates/blog-post.html?id=${postId}`;
            });
        });
    }

    // Create post card HTML
    function createPostCard(post) {
        const authorAvatars = (post.authors || []).map((author, i) => 
            `<span class="author-avatar" style="z-index: ${post.authors.length - i}" title="${author.name}">${author.initials}</span>`
        ).join('');

        const published = post.published || '';
        const updated = post.updated || published;
        const dateText = published === updated 
            ? `Published ${formatDate(published)}`
            : `Published ${formatDate(published)} · Updated <span class="updated">${formatDate(updated)}</span>`;

        return `
            <article class="blog-card" data-post-id="${post.id}">
                <span class="blog-card__category">${post.categoryLabel}</span>
                <h2 class="blog-card__title">${post.title}</h2>
                <p class="blog-card__desc">${post.description}</p>
                <div class="blog-card__meta">
                    <div class="blog-card__authors">
                        ${authorAvatars}
                    </div>
                    <span class="blog-card__dates">${dateText}</span>
                </div>
            </article>
        `;
    }

    // Load and display a post
    function loadPost(postId) {
        const post = postsData.find(p => p.id === postId);
        if (!post) return;

        // This is handled in blog-post.html
    }

    // Parse frontmatter from markdown
    function parseFrontmatter(content) {
        const match = content.match(/^---\n([\s\S]*?)\n---\n/);
        if (!match) return null;

        const yaml = match[1];
        const markdownContent = content.replace(match[0], '');
        
        const metadata = {};
        const lines = yaml.split('\n');
        let i = 0;
        
        while (i < lines.length) {
            const line = lines[i];
            if (!line.trim()) { i++; continue; }
            
            const indent = line.search(/\S/);
            const trimmed = line.trim();
            
            if (indent === 0) {
                const colonIdx = trimmed.indexOf(':');
                if (colonIdx === -1) { i++; continue; }
                
                const key = trimmed.substring(0, colonIdx).trim();
                const value = trimmed.substring(colonIdx + 1).trim();
                
                if (value && !value.startsWith('[')) {
                    metadata[key] = value.replace(/^"|"$/g, '');
                    i++;
                } else if (value.startsWith('[')) {
                    metadata[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                    i++;
                } else {
                    const nextLine = lines[i + 1];
                    if (nextLine && nextLine.trim().startsWith('- ')) {
                        if (!nextLine.includes(':')) {
                            metadata[key] = [];
                            i++;
                            while (i < lines.length && lines[i].trim().startsWith('- ')) {
                                const item = lines[i].trim().slice(2).trim().replace(/^"|"$/g, '');
                                metadata[key].push(item);
                                i++;
                            }
                        } else {
                            metadata[key] = [];
                            i++;
                            while (i < lines.length && (lines[i].trim().startsWith('- ') || (lines[i].search(/\S/) >= 4 && lines[i].trim().includes(':')))) {
                                if (lines[i].trim().startsWith('- ')) {
                                    const obj = {};
                                    const firstLine = lines[i].trim().slice(2);
                                    if (firstLine.includes(':')) {
                                        const [k, v] = firstLine.split(':').map(s => s.trim());
                                        obj[k] = v.replace(/^"|"$/g, '');
                                    }
                                    metadata[key].push(obj);
                                    i++;
                                    
                                    while (i < lines.length && lines[i].search(/\S/) >= 4) {
                                        const nested = lines[i].trim();
                                        const nestedColon = nested.indexOf(':');
                                        if (nestedColon > -1) {
                                            const nestedKey = nested.substring(0, nestedColon).trim();
                                            const nestedVal = nested.substring(nestedColon + 1).trim();
                                            
                                            if (nestedVal === '') {
                                                obj[nestedKey] = {};
                                                i++;
                                                while (i < lines.length && lines[i].search(/\S/) >= 6) {
                                                    const deep = lines[i].trim();
                                                    const deepColon = deep.indexOf(':');
                                                    if (deepColon > -1) {
                                                        const deepKey = deep.substring(0, deepColon).trim();
                                                        const deepVal = deep.substring(deepColon + 1).trim().replace(/^"|"$/g, '');
                                                        obj[nestedKey][deepKey] = deepVal;
                                                    }
                                                    i++;
                                                }
                                            } else {
                                                obj[nestedKey] = nestedVal.replace(/^"|"$/g, '');
                                                i++;
                                            }
                                        } else {
                                            i++;
                                        }
                                    }
                                } else {
                                    i++;
                                }
                            }
                        }
                    } else {
                        metadata[key] = {};
                        i++;
                    }
                }
            } else {
                i++;
            }
        }
        
        return { metadata, content: markdownContent };
    }

    // Parse date to readable format
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    // Generate table of contents from markdown
    function generateTOC(content) {
        const headings = content.match(/^#{2,3}\s+.+$/gm) || [];
        return headings.map(heading => {
            const level = heading.match(/^#+/)[0].length;
            const text = heading.replace(/^#+\s+/, '');
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            return { level, text, id };
        });
    }

    // Export functions for blog-post.html
    window.blogUtils = {
        parseFrontmatter,
        generateTOC,
        formatDate
    };
})();
