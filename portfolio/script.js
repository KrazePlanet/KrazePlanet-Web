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
