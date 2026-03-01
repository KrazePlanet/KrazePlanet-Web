// Blog Post Renderer - Handles loading and rendering markdown posts
(function() {
    'use strict';

    // Get post ID from URL
    function getPostId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    // Parse YAML frontmatter from markdown
    function parseFrontmatter(markdown) {
        const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
        if (!match) return null;
        
        const yaml = match[1];
        const content = markdown.replace(match[0], '');
        
        const metadata = {};
        const lines = yaml.split('\n');
        let i = 0;
        
        while (i < lines.length) {
            const line = lines[i];
            if (!line.trim()) { i++; continue; }
            
            const indent = line.search(/\S/);
            const trimmed = line.trim();
            
            // Root level key
            if (indent === 0) {
                const colonIdx = trimmed.indexOf(':');
                if (colonIdx === -1) { i++; continue; }
                
                const key = trimmed.substring(0, colonIdx).trim();
                const value = trimmed.substring(colonIdx + 1).trim();
                
                // Simple string value
                if (value && !value.startsWith('[')) {
                    metadata[key] = value.replace(/^"|"$/g, '');
                    i++;
                }
                // Inline array [a, b, c]
                else if (value.startsWith('[')) {
                    metadata[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                    i++;
                }
                // Multi-line array or object - peek ahead
                else {
                    const nextLine = lines[i + 1];
                    if (nextLine && nextLine.trim().startsWith('- ')) {
                        // Array of strings
                        if (!nextLine.includes(':')) {
                            metadata[key] = [];
                            i++;
                            while (i < lines.length && lines[i].trim().startsWith('- ')) {
                                const item = lines[i].trim().slice(2).trim().replace(/^"|"$/g, '');
                                metadata[key].push(item);
                                i++;
                            }
                        }
                        // Array of objects (authors)
                        else {
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
                                    
                                    // Read nested properties
                                    while (i < lines.length && lines[i].search(/\S/) >= 4) {
                                        const nested = lines[i].trim();
                                        const nestedColon = nested.indexOf(':');
                                        if (nestedColon > -1) {
                                            const nestedKey = nested.substring(0, nestedColon).trim();
                                            const nestedVal = nested.substring(nestedColon + 1).trim();
                                            
                                            if (nestedVal === '') {
                                                // Nested object (like social:)
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
        
        return { metadata, content };
    }

    // Mobile nav toggle
    const navToggle = document.getElementById('navToggle');
    const navMobile = document.getElementById('navMobile');
    
    if (navToggle && navMobile) {
        navToggle.addEventListener('click', () => {
            const isHidden = navMobile.getAttribute('aria-hidden') === 'true';
            navMobile.setAttribute('aria-hidden', !isHidden);
            navMobile.style.display = isHidden ? 'block' : 'none';
        });
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
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

    // Sidebar toggle for mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const docsSidebar = document.getElementById('docsSidebar');
    
    if (sidebarToggle && docsSidebar) {
        sidebarToggle.addEventListener('click', () => {
            docsSidebar.classList.toggle('open');
            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle('open');
            }
            document.body.style.overflow = docsSidebar.classList.contains('open') ? 'hidden' : '';
        });
    }
    
    if (sidebarOverlay && docsSidebar) {
        sidebarOverlay.addEventListener('click', () => {
            docsSidebar.classList.remove('open');
            sidebarOverlay.classList.remove('open');
            document.body.style.overflow = '';
        });
    }
    
    // Close sidebar on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && docsSidebar && docsSidebar.classList.contains('open')) {
            docsSidebar.classList.remove('open');
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('open');
            }
            document.body.style.overflow = '';
        }
    });

    // Parse date to readable format
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    // Load and render post
    async function loadPost() {
        const postId = getPostId();
        if (!postId) {
            showError('No post specified');
            return;
        }

        try {
            const postId = getPostId();
            console.log('Loading post:', postId);
            
            if (!postId) {
                showError('No post specified');
                return;
            }

            // Fetch markdown content directly
            const fetchUrl = '../posts/' + postId + '.md';
            console.log('Fetching from:', fetchUrl);
            
            const response = await fetch(fetchUrl);
            console.log('Response status:', response.status);
            
            if (!response.ok) throw new Error('Failed to load post: ' + response.status);
            
            const markdown = await response.text();
            console.log('Loaded markdown, first 200 chars:', markdown.substring(0, 200));
            
            // Parse frontmatter
            const parsed = parseFrontmatter(markdown);
            console.log('Parsed result:', parsed);
            
            if (!parsed) {
                showError('Invalid post format - missing frontmatter');
                return;
            }
            
            if (!parsed.metadata) {
                showError('Failed to parse metadata');
                return;
            }
            
            const post = parsed.metadata;
            const content = parsed.content;
            
            // Ensure authors is an array
            if (!post.authors) post.authors = [];
            if (!post.tags) post.tags = [];
            if (!post.sections) post.sections = [];
            
            // Add computed properties
            post.file = 'posts/' + postId + '.md';
            post.id = postId;
            
            console.log('Rendering post:', post.title);
            renderPost(post, content);
            
            // Setup sidebar after content is rendered
            setupSidebarNavigation(post, content);
        } catch (error) {
            console.error('Error loading post:', error);
            showError('Failed to load post content: ' + error.message);
        }
    }

    // Setup sidebar navigation
    function setupSidebarNavigation(post, markdown) {
        const sidebarNav = document.getElementById('sidebarNav');
        if (!sidebarNav) return;

        // Group sections by main category
        const sections = post.sections || [];
        const toc = generateTOC(markdown);
        
        // Build sidebar HTML with collapsible sections
        let sidebarHtml = '';
        let currentSection = null;
        let sectionLinks = [];
        
        toc.forEach((item, index) => {
            if (item.level === 2) {
                // Close previous section if exists
                if (currentSection) {
                    sidebarHtml += buildSectionHtml(currentSection, sectionLinks);
                }
                // Start new section
                currentSection = item;
                sectionLinks = [];
            } else if (item.level === 3 && currentSection) {
                sectionLinks.push(item);
            }
        });
        
        // Close last section
        if (currentSection) {
            sidebarHtml += buildSectionHtml(currentSection, sectionLinks);
        }

        sidebarNav.innerHTML = sidebarHtml;
        
        // Add event listeners
        setupSidebarInteractions();
        setupScrollSpy();
        setupTocFilter();
    }

    // Build section HTML
    function buildSectionHtml(section, links) {
        const hasLinks = links.length > 0;
        const sectionClass = hasLinks ? 'sidebar-section expanded' : 'sidebar-section';
        
        let html = `
            <div class="${sectionClass}" data-section="${section.id}">
                <div class="sidebar-section__header" data-target="${section.id}">
                    ${section.text}
                </div>
        `;
        
        if (hasLinks) {
            html += '<div class="sidebar-section__links">';
            links.forEach(link => {
                html += `<a href="#${link.id}" data-target="${link.id}">${link.text}</a>`;
            });
            html += '</div>';
        }
        
        html += '</div>';
        return html;
    }

    // Setup sidebar interactions
    function setupSidebarInteractions() {
        const sidebarNav = document.getElementById('sidebarNav');
        if (!sidebarNav) return;

        // Toggle section expansion
        sidebarNav.querySelectorAll('.sidebar-section__header').forEach(header => {
            header.addEventListener('click', (e) => {
                const section = header.closest('.sidebar-section');
                if (section.querySelector('.sidebar-section__links')) {
                    section.classList.toggle('expanded');
                }
                
                // Navigate to section
                const targetId = header.dataset.target;
                const target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Link clicks
        sidebarNav.querySelectorAll('.sidebar-section__links a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').slice(1);
                const target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    // Setup scroll spy for active section highlighting
    function setupScrollSpy() {
        const headings = document.querySelectorAll('.markdown-content h2, .markdown-content h3');
        const sidebarLinks = document.querySelectorAll('.sidebar-section__links a');
        
        if (headings.length === 0 || sidebarLinks.length === 0) return;

        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -80% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    
                    // Remove active from all
                    sidebarLinks.forEach(link => link.classList.remove('active'));
                    
                    // Add active to current
                    const activeLink = document.querySelector(`.sidebar-section__links a[href="#${id}"]`);
                    if (activeLink) {
                        activeLink.classList.add('active');
                        
                        // Expand parent section
                        const section = activeLink.closest('.sidebar-section');
                        if (section) {
                            section.classList.add('expanded');
                        }
                    }
                }
            });
        }, observerOptions);

        headings.forEach(heading => observer.observe(heading));
    }

    // Setup TOC filter
    function setupTocFilter() {
        const filterInput = document.getElementById('tocFilter');
        if (!filterInput) return;

        filterInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const sections = document.querySelectorAll('.sidebar-section');
            
            sections.forEach(section => {
                const headerText = section.querySelector('.sidebar-section__header').textContent.toLowerCase();
                const links = section.querySelectorAll('.sidebar-section__links a');
                let hasMatch = headerText.includes(query);
                
                links.forEach(link => {
                    const linkText = link.textContent.toLowerCase();
                    const isMatch = linkText.includes(query);
                    link.style.display = isMatch || query === '' ? 'block' : 'none';
                    if (isMatch) hasMatch = true;
                });
                
                section.style.display = hasMatch ? 'block' : 'none';
                if (hasMatch && query !== '') {
                    section.classList.add('expanded');
                }
            });
        });
    }

    // Render post content
    function renderPost(post, markdown) {
        // Render header
        renderHeader(post);
        
        // Generate and render TOC
        const toc = generateTOC(markdown);
        renderTOC(toc);
        
        // Render markdown content
        renderMarkdown(markdown);
        
        // Render tags
        renderTags(post.tags);
        
        // Apply syntax highlighting
        if (window.hljs) {
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
    }

    // Render post header with authors and dates
    function renderHeader(post) {
        const header = document.getElementById('postHeader');
        
        const authorsHtml = post.authors.map(author => `
            <div class="post-author">
                <div class="post-author__avatar">${author.initials}</div>
                <div class="post-author__info">
                    <span class="post-author__name">${author.name}</span>
                    <span class="post-author__social">${author.social}</span>
                </div>
            </div>
        `).join('');

        const datesHtml = `
            <div class="post-dates">
                <span>
                    <span class="label">Published:</span>
                    <span class="value">${formatDate(post.published)}</span>
                </span>
                ${post.updated !== post.published ? `
                <span>
                    <span class="label">Updated:</span>
                    <span class="value">${formatDate(post.updated)}</span>
                </span>
                ` : ''}
            </div>
        `;

        header.innerHTML = `
            <span class="post-header__category">${post.categoryLabel}</span>
            <h1 class="post-header__title">${post.title}</h1>
            <p class="post-header__desc">${post.description}</p>
            <div class="post-authors">
                ${authorsHtml}
            </div>
            ${datesHtml}
        `;
    }

    // Generate table of contents from markdown headings
    function generateTOC(markdown) {
        const headings = [];
        const lines = markdown.split('\n');
        
        lines.forEach(line => {
            const match = line.match(/^(#{2,3})\s+(.+)$/);
            if (match) {
                const level = match[1].length;
                const text = match[2].replace(/\*\*/g, ''); // Remove bold markers
                const id = text.toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-');
                headings.push({ level, text, id });
            }
        });
        
        return headings;
    }

    // Render table of contents
    function renderTOC(toc) {
        const tocList = document.getElementById('tocList');
        if (!tocList) return;

        if (toc.length === 0) {
            document.getElementById('tableOfContents').style.display = 'none';
            return;
        }

        tocList.innerHTML = toc.map(item => `
            <li>
                <a href="#${item.id}" class="h${item.level}">${item.text}</a>
            </li>
        `).join('');

        // Add smooth scroll for TOC links
        tocList.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.getElementById(link.getAttribute('href').slice(1));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    // Process markdown to add IDs to headings
    function processMarkdownForAnchors(markdown) {
        return markdown.replace(/^(#{2,3})\s+(.+)$/gm, (match, hashes, text) => {
            const cleanText = text.replace(/\*\*/g, '');
            const id = cleanText.toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-');
            return `${hashes} ${text} {#${id}}`;
        });
    }

    // Custom renderer for marked to handle code block labels
    function createCustomRenderer() {
        const renderer = new marked.Renderer();
        
        // Override code block rendering
        renderer.code = function(code, language) {
            const validLanguage = language && hljs.getLanguage(language) ? language : 'plaintext';
            
            // Check for special labels in language string (e.g., "php:vulnerable")
            let label = null;
            let actualLanguage = validLanguage;
            
            if (language && language.includes(':')) {
                const parts = language.split(':');
                actualLanguage = parts[0];
                label = parts[1]; // 'vulnerable' or 'secure'
            }
            
            const highlighted = hljs.highlight(code, { language: actualLanguage }).value;
            
            let labelHtml = '';
            if (label === 'vulnerable') {
                labelHtml = '<span class="code-label vulnerable">Vulnerable</span>';
            } else if (label === 'secure') {
                labelHtml = '<span class="code-label secure">Secure</span>';
            } else if (actualLanguage && actualLanguage !== 'plaintext') {
                labelHtml = `<span class="code-label language">${actualLanguage}</span>`;
            }
            
            return `<div class="code-block-wrapper">${labelHtml}<pre><code class="language-${actualLanguage}">${highlighted}</code></pre></div>`;
        };

        // Override heading rendering to add IDs
        renderer.heading = function(text, level) {
            if (level >= 2) {
                const id = text.toLowerCase()
                    .replace(/<[^>]*>/g, '') // Remove HTML tags
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-');
                return `<h${level} id="${id}">${text}</h${level}>`;
            }
            return `<h${level}>${text}</h${level}>`;
        };
        
        return renderer;
    }

    // Render markdown content
    function renderMarkdown(markdown) {
        const content = document.getElementById('markdownContent');
        if (!content) return;

        // Configure marked options
        marked.setOptions({
            renderer: createCustomRenderer(),
            gfm: true,
            breaks: true,
            headerIds: true
        });

        // Render markdown
        content.innerHTML = marked.parse(markdown);
    }

    // Render tags
    function renderTags(tags) {
        const container = document.getElementById('contentTags');
        if (!container || !tags) return;

        container.innerHTML = tags.map(tag => `
            <span class="content-tag">#${tag}</span>
        `).join('');
    }

    // Show error message
    function showError(message) {
        const content = document.getElementById('markdownContent');
        if (content) {
            content.innerHTML = `
                <div class="no-results">
                    <h3>Error</h3>
                    <p>${message}</p>
                    <a href="../index.html" class="back-button" style="margin-top: 20px;">← Back to all posts</a>
                </div>
            `;
        }
    }

    // Initialize
    loadPost();
})();
