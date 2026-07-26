// Simple theme toggle (light/dark)
const toggleBtn = document.getElementById('themeToggle');
let dark = true;

function setTheme(isDark) {
  dark = isDark;
  if (dark) {
    // Dark mode colors
    document.documentElement.style.setProperty('--bg', '#0c0f1a');
    document.documentElement.style.setProperty('--bg-card', 'rgba(255,255,255,0.04)');
    document.documentElement.style.setProperty('--bg-card-strong', 'rgba(255,255,255,0.08)');
    document.documentElement.style.setProperty('--text', '#eaf1ff');
    document.documentElement.style.setProperty('--muted', '#9fb0c9');
    document.documentElement.style.setProperty('--border', 'rgba(255,255,255,0.12)');
    document.documentElement.style.setProperty('--shadow', '0 24px 70px rgba(0,0,0,0.4)');
    document.documentElement.style.setProperty('--nav-bg', 'rgba(11,12,16,0.75)');
    document.documentElement.style.setProperty('--mobile-nav-bg', 'rgba(11, 12, 16, 0.98)');
    document.documentElement.style.setProperty('--footer-bg', 'rgba(0,0,0,0.4)');
    document.documentElement.style.setProperty('--scroll-progress-bg', 'rgba(255,255,255,0.04)');
    document.body.classList.remove('light-mode');
    toggleBtn.textContent = '☾';
  } else {
    // Light mode colors - improved contrast and readability
    document.documentElement.style.setProperty('--bg', '#ffffff');
    document.documentElement.style.setProperty('--bg-card', 'rgba(0,0,0,0.02)');
    document.documentElement.style.setProperty('--bg-card-strong', 'rgba(0,0,0,0.04)');
    document.documentElement.style.setProperty('--text', '#1a1f2e');
    document.documentElement.style.setProperty('--muted', '#64748b');
    document.documentElement.style.setProperty('--border', 'rgba(0,0,0,0.08)');
    document.documentElement.style.setProperty('--shadow', '0 24px 70px rgba(0,0,0,0.08)');
    document.documentElement.style.setProperty('--nav-bg', 'rgba(255,255,255,0.85)');
    document.documentElement.style.setProperty('--mobile-nav-bg', 'rgba(255, 255, 255, 0.98)');
    document.documentElement.style.setProperty('--footer-bg', 'rgba(248, 250, 252, 0.8)');
    document.documentElement.style.setProperty('--scroll-progress-bg', 'rgba(0,0,0,0.04)');
    document.body.classList.add('light-mode');
    toggleBtn.textContent = '☀';
  }
  document.body.style.background = dark
    ? 'radial-gradient(circle at 20% 20%, rgba(255, 123, 95, 0.2), transparent 26%), radial-gradient(circle at 80% 10%, rgba(106, 228, 255, 0.16), transparent 30%), radial-gradient(circle at 50% 80%, rgba(123, 97, 255, 0.12), transparent 35%), var(--bg)'
    : 'radial-gradient(circle at 20% 20%, rgba(255, 123, 95, 0.06), transparent 26%), radial-gradient(circle at 80% 10%, rgba(106, 228, 255, 0.05), transparent 30%), radial-gradient(circle at 50% 80%, rgba(123, 97, 255, 0.04), transparent 35%), var(--bg)';
}

if (toggleBtn) {
  toggleBtn.addEventListener('click', () => setTheme(!dark));
}

// Mobile Navigation Toggle
const navToggle = document.getElementById('navToggle');
const navMobile = document.getElementById('navMobile');

function toggleMobileMenu() {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', !isOpen);
  navMobile.setAttribute('aria-hidden', isOpen);
  document.body.classList.toggle('menu-open', !isOpen);
}

function closeMobileMenu() {
  navToggle.setAttribute('aria-expanded', 'false');
  navMobile.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('menu-open');
}

if (navToggle && navMobile) {
  navToggle.addEventListener('click', toggleMobileMenu);

  // Close menu when clicking on mobile menu links
  const mobileLinks = navMobile.querySelectorAll('a');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });

  // Close menu when clicking outside (on backdrop)
  navMobile.addEventListener('click', (e) => {
    if (e.target === navMobile) {
      closeMobileMenu();
    }
  });

  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
      closeMobileMenu();
    }
  });

  // Close menu on window resize if desktop size
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth >= 1024) {
        closeMobileMenu();
      }
    }, 100);
  });
}

// Smooth scroll for anchor links
const links = document.querySelectorAll('a[href^="#"]');
links.forEach(link => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href');
    if (!targetId || targetId === '#') return;
    const el = document.querySelector(targetId);
    if (el) {
      e.preventDefault();
      // Adjust header offset based on screen size (64px mobile, 70px desktop)
      const headerOffset = window.innerWidth < 768 ? 64 : 70;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Close mobile menu if open
      if (navMobile && navMobile.getAttribute('aria-hidden') === 'false') {
        closeMobileMenu();
      }
    }
  });
});

// Prefill contact buttons
const emailBtns = document.querySelectorAll('a[href^="mailto:"]');
emailBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const subject = encodeURIComponent('Collaboration with Ravindra');
    const body = encodeURIComponent('Hi Ravindra,\n\nI would like to discuss...');
    btn.href = `mailto:rix4uni@gmail.com?subject=${subject}&body=${body}`;
  });
});

// Initialize theme
setTheme(true);

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0, rootMargin: "0px 0px -100px 0px" });

revealEls.forEach(el => observer.observe(el));

// Scroll progress bar
const scrollBar = document.getElementById('scrollBar');
function updateScrollBar() {
  if (!scrollBar) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  scrollBar.style.width = `${progress}%`;
}
window.addEventListener('scroll', updateScrollBar, { passive: true });
updateScrollBar();

// Subtle 3D tilt on cards (only on devices with hover capability)
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  function attachTilt(selector, maxTilt = 8) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -maxTilt;
        const rotateY = ((x - centerX) / centerX) * maxTilt;
        el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  attachTilt('.hero__card', 10);
  attachTilt('.card', 6);
}

// Typewriter for hero title
const heroTitle = document.getElementById('heroTitle');
if (heroTitle) {
  const prefix = heroTitle.dataset.prefix || '';
  const name = heroTitle.dataset.name || '';
  const text = prefix + name;

  const escapeHtml = (str) =>
    str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const render = (count) => {
    const typedPrefix = escapeHtml(prefix.slice(0, Math.min(count, prefix.length)));
    const nameCount = Math.max(0, count - prefix.length);
    const typedName = escapeHtml(name.slice(0, Math.min(nameCount, name.length)));
    heroTitle.innerHTML = `${typedPrefix}<span class="highlight">${typedName}</span>`;
  };

  let i = 0;
  const tick = () => {
    render(i);
    if (i < text.length) {
      i += 1;
      setTimeout(tick, 55);
    }
  };
  tick();
}

// Make project cards clickable
document.querySelectorAll('.card').forEach(card => {
  const link = card.querySelector('a');
  if (link) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      // Ensure we don't trigger if the user clicked inside ANY actual link
      if (!e.target.closest('a')) {
        window.open(link.href, link.target || '_self');
      }
    });
  }
});
// Back to top & Scroll Spy
const backToTopBtn = document.getElementById('backToTop');
const progressCircle = document.querySelector('.progress-ring__circle');
const navLinksItems = document.querySelectorAll('.nav__links a, .nav__mobile-inner a');
const sections = document.querySelectorAll('section[id]');

if (progressCircle) {
  const radius = progressCircle.r.baseVal.value;
  const circumference = radius * 2 * Math.PI;
  progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
  progressCircle.style.strokeDashoffset = circumference;

  function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;
  }

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;

    if (scrollTop > 300) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }

    setProgress(scrollPercent);

    // Scroll Spy logic
    let currentId = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (scrollTop >= sectionTop - 100) {
        currentId = section.getAttribute('id');
      }
    });

    navLinksItems.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  }, { passive: true });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}
// Handle resize events
window.addEventListener('resize', () => {
  if (window.innerWidth >= 1024 && !navMobile.getAttribute('aria-hidden')) {
    closeMobileMenu();
  }
});

// Open-Source Security Tools Search & Filter System
const toolSearchInput = document.getElementById('toolSearchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const projectsSection = document.getElementById('projects');

if (projectsSection) {
  const projectGrid = projectsSection.querySelector('.grid');
  const toolCards = projectGrid ? projectGrid.querySelectorAll('.card') : [];
  const searchResultsMeta = document.getElementById('searchResultsMeta');
  const visibleToolsCount = document.getElementById('visibleToolsCount');
  const totalToolsCount = document.getElementById('totalToolsCount');

  // Count tools per language dynamically
  let countGo = 0;
  let countPython = 0;
  let countShell = 0;
  let totalCount = toolCards.length;

  toolCards.forEach(card => {
    const tag = card.querySelector('.tag');
    if (tag) {
      const text = tag.textContent.trim().toLowerCase();
      if (text.includes('go')) countGo++;
      else if (text.includes('python')) countPython++;
      else if (text.includes('shell')) countShell++;
    }
  });

  // Update pill counts dynamically
  const elAll = document.getElementById('countAll');
  const elGo = document.getElementById('countGo');
  const elPy = document.getElementById('countPython');
  const elSh = document.getElementById('countShell');

  if (elAll) elAll.textContent = `${totalCount}`;
  if (elGo) elGo.textContent = `${countGo}`;
  if (elPy) elPy.textContent = `${countPython}`;
  if (elSh) elSh.textContent = `${countShell}`;
  if (totalToolsCount) totalToolsCount.textContent = `${totalCount}`;

  let currentCategory = 'all';
  let currentSearchQuery = '';

  function filterTools() {
    let visibleCount = 0;

    toolCards.forEach(card => {
      const title = card.querySelector('h3') ? card.querySelector('h3').textContent.toLowerCase() : '';
      const desc = card.querySelector('ul') ? card.querySelector('ul').textContent.toLowerCase() : '';
      const sub = card.querySelector('.sub') ? card.querySelector('.sub').textContent.toLowerCase() : '';
      const tag = card.querySelector('.tag') ? card.querySelector('.tag').textContent.trim().toLowerCase() : '';

      const matchesSearch = !currentSearchQuery || 
        title.includes(currentSearchQuery) || 
        desc.includes(currentSearchQuery) || 
        sub.includes(currentSearchQuery);

      const matchesCategory = currentCategory === 'all' || tag.includes(currentCategory);

      if (matchesSearch && matchesCategory) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Update meta feedback
    if (currentSearchQuery || currentCategory !== 'all') {
      if (searchResultsMeta) {
        searchResultsMeta.style.display = 'block';
        if (visibleToolsCount) visibleToolsCount.textContent = visibleCount;
      }
    } else {
      if (searchResultsMeta) searchResultsMeta.style.display = 'none';
    }
  }

  // Search Input Event
  if (toolSearchInput) {
    toolSearchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.trim().toLowerCase();
      if (clearSearchBtn) {
        clearSearchBtn.style.display = currentSearchQuery ? 'block' : 'none';
      }
      filterTools();
    });
  }

  // Clear Search Button Event
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      toolSearchInput.value = '';
      currentSearchQuery = '';
      clearSearchBtn.style.display = 'none';
      filterTools();
      toolSearchInput.focus();
    });
  }

  // Category Filter Buttons Event
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-filter') || 'all';
      filterTools();
    });
  });
}

// Interactive Cyber Terminal CLI Shell (kraze-cli)
const cliTerminalToggle = document.getElementById('cliTerminalToggle');
const cliModal = document.getElementById('cliModal');
const cliOverlay = document.getElementById('cliOverlay');
const closeCliBtn = document.getElementById('closeCliBtn');
const closeCliDot = document.getElementById('closeCliDot');
const cliInput = document.getElementById('cliInput');
const cliOutput = document.getElementById('cliOutput');

if (cliModal && cliInput && cliOutput) {
  function openCli() {
    cliModal.classList.add('open');
    cliModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => cliInput.focus(), 100);
  }

  function closeCli() {
    cliModal.classList.remove('open');
    cliModal.setAttribute('aria-hidden', 'true');
  }

  if (cliTerminalToggle) cliTerminalToggle.addEventListener('click', openCli);
  if (closeCliBtn) closeCliBtn.addEventListener('click', closeCli);
  if (closeCliDot) closeCliDot.addEventListener('click', closeCli);
  if (cliOverlay) cliOverlay.addEventListener('click', closeCli);

  // Keyboard shortcut: Press `~` or Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === '`' || e.key === '~') {
      e.preventDefault();
      if (cliModal.classList.contains('open')) {
        closeCli();
      } else {
        openCli();
      }
    } else if (e.key === 'Escape' && cliModal.classList.contains('open')) {
      closeCli();
    }
  });

  // Command Commands Dictionary
  const cliCommands = {
    help: `
<span class="cli-text-cyan">Available Security Commands:</span>
-------------------------------------------------------------
<span class="cmd-highlight">whoami</span>       - Display researcher profile & bio summary
<span class="cmd-highlight">skills</span>       - View security tools, languages & methodologies
<span class="cmd-highlight">tools</span>        - List top open-source security tools (149+)
<span class="cmd-highlight">services</span>     - List KrazePlanet web platform subdomains
<span class="cmd-highlight">certs</span>        - View verified security certifications
<span class="cmd-highlight">halloffame</span>   - View Bugcrowd & company Hall of Fame features
<span class="cmd-highlight">contact</span>      - Display email, phone, and social profile links
<span class="cmd-highlight">clear</span> / <span class="cmd-highlight">cls</span>  - Clear terminal screen
<span class="cmd-highlight">exit</span> / <span class="cmd-highlight">quit</span>  - Close CLI shell
`,
    whoami: `
<span class="cli-text-success">BHAGIRATH SAXENA (@rix4uni)</span>
Founder & Security Researcher @ KrazePlanet
-------------------------------------------------------------
• 150+ Valid Bug Bounty Reports (NASA, Dell, PayPal, Shopify)
• Founder of KrazePlanet (13+ Web Security Services & CTF Platform)
• Author of 149+ Open-Source Security Tools
• Specialized in Offensive Security, Web VAPT & Recon Automation
`,
    skills: `
<span class="cli-text-cyan">SECURITY EXPERTISE & TOOLING:</span>
-------------------------------------------------------------
<span class="cli-text-accent">Languages:</span>     Go (Golang), Python, Bash/Shell, JavaScript, PHP
<span class="cli-text-accent">Security Tools:</span> Burp Suite, Nmap, Metasploit, SQLMap, Nuclei, Subfinder, Shodan, ffuf, httpx
<span class="cli-text-accent">Methodologies:</span>  OWASP Top 10, VAPT, Web App Pen Testing, Network Pen Testing
<span class="cli-text-accent">Infrastructure:</span> Linux, AWS, DigitalOcean, Docker, GitHub Actions
`,
    tools: `
<span class="cli-text-success">TOP OPEN-SOURCE SECURITY TOOLS (149+ Repos):</span>
-------------------------------------------------------------
1. <span class="cli-text-cyan">GarudRecon</span>     [Shell]  - Automated domain recon & vulnerability scanner
2. <span class="cli-text-cyan">VulneraXSS</span>     [Go]     - High-speed XSS scanner (37,000+ payloads)
3. <span class="cli-text-cyan">gitxpose</span>       [Go]     - Secret leak & hidden repo hunter
4. <span class="cli-text-cyan">stoppiracy</span>     [Go]     - Unified keyword recon & email extractor
5. <span class="cli-text-cyan">originiphunter</span> [Go]     - Origin IP hunter via Favicon hash & Shodan
6. <span class="cli-text-cyan">cvemapping</span>     [Python] - CVE exploit PoC aggregator (1999-2026)
... Explore all 149+ repositories at <a href="https://github.com/rix4uni" target="_blank" style="color:#38bdf8;text-decoration:underline;">github.com/rix4uni</a>
`,
    projects: `
<span class="cli-text-success">TOP OPEN-SOURCE SECURITY TOOLS (149+ Repos):</span>
-------------------------------------------------------------
1. <span class="cli-text-cyan">GarudRecon</span>     [Shell]  - Automated domain recon & vulnerability scanner
2. <span class="cli-text-cyan">VulneraXSS</span>     [Go]     - High-speed XSS scanner (37,000+ payloads)
3. <span class="cli-text-cyan">gitxpose</span>       [Go]     - Secret leak & hidden repo hunter
4. <span class="cli-text-cyan">stoppiracy</span>     [Go]     - Unified keyword recon & email extractor
5. <span class="cli-text-cyan">originiphunter</span> [Go]     - Origin IP hunter via Favicon hash & Shodan
6. <span class="cli-text-cyan">cvemapping</span>     [Python] - CVE exploit PoC aggregator (1999-2026)
... Explore all 149+ repositories at <a href="https://github.com/rix4uni" target="_blank" style="color:#38bdf8;text-decoration:underline;">github.com/rix4uni</a>
`,
    services: `
<span class="cli-text-cyan">KRAZEPLANET PLATFORM SERVICES (13+ Web Services):</span>
-------------------------------------------------------------
• https://krazeplanet.com          - Main VAPT & Security Company
• https://academy.krazeplanet.com  - Cybersecurity Training Academy
• https://store.krazeplanet.com    - VulneraXSS Store
• https://labs.krazeplanet.com     - Interactive Web Security Labs
• https://programs.krazeplanet.com - Bug Bounty Programs Aggregator
• https://dorks.krazeplanet.com    - Multi-engine Google Dorking
• https://cvemapping.krazeplanet.com - CVE Exploit Mapping
• https://subdominator.krazeplanet.com - Subdomain Enumeration
• https://blog.krazeplanet.com     - Cybersecurity Blogs
• https://csrf.krazeplanet.com     - Burp Pro CSRF Generator
• https://ctf.krazeplanet.com      - Security CTF Platform
• https://checklist.krazeplanet.com  - Bug Bounty Methodology
• https://stoppiracy.krazeplanet.com - Piracy Scanner
• https://tools.krazeplanet.com    - Web Utility Hub
`,
    subdomains: `
<span class="cli-text-cyan">KRAZEPLANET PLATFORM SERVICES (13+ Web Services):</span>
-------------------------------------------------------------
• https://krazeplanet.com          - Main VAPT & Security Company
• https://academy.krazeplanet.com  - Cybersecurity Training Academy
• https://store.krazeplanet.com    - VulneraXSS Store
• https://labs.krazeplanet.com     - Interactive Web Security Labs
• https://programs.krazeplanet.com - Bug Bounty Programs Aggregator
• https://dorks.krazeplanet.com    - Multi-engine Google Dorking
• https://cvemapping.krazeplanet.com - CVE Exploit Mapping
• https://subdominator.krazeplanet.com - Subdomain Enumeration
• https://blog.krazeplanet.com     - Cybersecurity Blogs
• https://csrf.krazeplanet.com     - Burp Pro CSRF Generator
• https://ctf.krazeplanet.com      - Security CTF Platform
• https://checklist.krazeplanet.com  - Bug Bounty Methodology
• https://stoppiracy.krazeplanet.com - Piracy Scanner
• https://tools.krazeplanet.com    - Web Utility Hub
`,
    certs: `
<span class="cli-text-success">VERIFIED CERTIFICATIONS:</span>
-------------------------------------------------------------
1. Programming for Everybody (Python) - University of Michigan
2. Introduction to Cybersecurity     - Cisco Networking Academy
3. Data Analysis Using Python        - IBM
4. Introduction to Packet Tracer       - Cisco
5. HTML Workshop & Front-End         - GeeksforGeeks
6. Oracle Cloud Infrastructure 2021  - Oracle
`,
    halloffame: `
<span class="cli-text-warn">HALL OF FAME ACKNOWLEDGMENTS:</span>
-------------------------------------------------------------
• NASA (National Aeronautics and Space Administration)
• Gap Inc. Bug Bounty Program
• Arrow Electronics Vulnerability Disclosure
• Web.com Security Hall of Fame
• Bluehost India VDP
• Kingfisher Security VDP
• Skybriz Security Hall of Fame
`,
    contact: `
<span class="cli-text-cyan">CONTACT & SOCIAL PROFILES:</span>
-------------------------------------------------------------
Email:     <a href="mailto:rix4uni@gmail.com" style="color:#38bdf8;">rix4uni@gmail.com</a>
Phone:     +91 8527310670
Website:   <a href="https://krazeplanet.com" target="_blank" style="color:#38bdf8;">https://krazeplanet.com</a>
GitHub:    <a href="https://github.com/rix4uni" target="_blank" style="color:#38bdf8;">https://github.com/rix4uni</a>
LinkedIn:  <a href="https://in.linkedin.com/in/rix4uni" target="_blank" style="color:#38bdf8;">https://in.linkedin.com/in/rix4uni</a>
Twitter:   <a href="https://x.com/rix4uni" target="_blank" style="color:#38bdf8;">https://x.com/rix4uni</a>
HackerOne: <a href="https://hackerone.com/rix4uni?type=user" target="_blank" style="color:#ff4d4d;">https://hackerone.com/rix4uni</a>
Bugcrowd:  <a href="https://bugcrowd.com/h/rix4uni" target="_blank" style="color:#ff8c42;">https://bugcrowd.com/h/rix4uni</a>
`
  };

  cliInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const rawCmd = cliInput.value.trim();
      const cmd = rawCmd.toLowerCase();
      cliInput.value = '';

      if (!cmd) return;

      const outputBlock = document.createElement('div');
      outputBlock.className = 'cli-output-block';

      const cmdHeader = document.createElement('div');
      cmdHeader.className = 'cli-output-cmd';
      cmdHeader.innerHTML = `<span class="cli-prompt"><span class="user">rix4uni</span><span class="at">@</span><span class="host">krazeplanet</span>:<span class="path">~</span>$</span> ${escapeHTML(rawCmd)}`;
      outputBlock.appendChild(cmdHeader);

      const content = document.createElement('div');
      content.className = 'cli-output-content';

      if (cmd === 'clear' || cmd === 'cls') {
        cliOutput.innerHTML = '';
        return;
      } else if (cmd === 'exit' || cmd === 'quit') {
        closeCli();
        return;
      } else if (cliCommands[cmd]) {
        content.innerHTML = cliCommands[cmd];
      } else {
        content.innerHTML = `<span class="cli-text-warn">Command not found: '${escapeHTML(rawCmd)}'.</span> Type <span class="cmd-highlight">help</span> to view available security commands.`;
      }

      outputBlock.appendChild(content);
      cliOutput.appendChild(outputBlock);
      cliOutput.scrollTop = cliOutput.scrollHeight;
    }
  });

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

// KrazePlanet Ecosystem Hub Category Filtering
const ecoFilterBtns = document.querySelectorAll('.eco-filter-btn');
const ecoCards = document.querySelectorAll('.eco-card');

if (ecoFilterBtns.length > 0 && ecoCards.length > 0) {
  ecoFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      ecoFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-eco-filter');

      ecoCards.forEach(card => {
        const cardCat = card.getAttribute('data-eco-cat');
        if (cat === 'all' || cardCat === cat) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// Animated Counter for Impact Metrics Dashboard
const impactNumbers = document.querySelectorAll('.impact-number');

if (impactNumbers.length > 0) {
  let animated = false;

  function animateCounters() {
    impactNumbers.forEach(numEl => {
      const target = parseInt(numEl.getAttribute('data-target'), 10) || 0;
      const suffix = numEl.getAttribute('data-suffix') || '';
      const duration = 1500; // ms
      const startTime = performance.now();

      function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing function (easeOutExpo)
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const currentVal = Math.floor(easeProgress * target);

        numEl.textContent = `${currentVal}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          numEl.textContent = `${target}${suffix}`;
        }
      }

      requestAnimationFrame(update);
    });
  }

  const impactSection = document.getElementById('impact');
  if (impactSection) {
    const impactObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animated) {
          animated = true;
          animateCounters();
          impactObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    impactObserver.observe(impactSection);
  } else {
    animateCounters();
  }
}
