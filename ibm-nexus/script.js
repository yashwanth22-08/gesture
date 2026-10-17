/* ═══════════════════════════════════════════════════
   IBM NEXUS — Cybersecurity Club Website
   Interactive Features & Animations
   ═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ── 1. NAVBAR SCROLL EFFECT ──
  const navbar = document.getElementById('navbar');
  const sections = document.querySelectorAll('.section, .hero');

  const handleNavScroll = () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleNavScroll, { passive: true });

  // Active link highlighting
  const navLinks = document.querySelectorAll('.nav-link');

  const activeLinkObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
  );

  sections.forEach((section) => activeLinkObserver.observe(section));

  // ── 2. MOBILE HAMBURGER MENU ──
  const hamburger = document.getElementById('hamburger');
  const navLinksContainer = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinksContainer.classList.toggle('active');
  });

  // Close menu on link click
  navLinksContainer.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinksContainer.classList.remove('active');
    });
  });

  // ── 3. SMOOTH SCROLL FOR ANCHOR LINKS ──
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();
      const navHeight = navbar.offsetHeight;
      const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    });
  });

  // ── 4. HERO TYPING ANIMATION ──
  const typingTextEl = document.getElementById('typingText');
  const phrases = [
    'Hackathons',
    'CTF Challenges',
    'Cyber Labs',
    'Bug Bounties',
    'Security Research',
    'Reverse Engineering',
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  const typeSpeed = 80;
  const deleteSpeed = 40;
  const pauseAfterType = 2000;
  const pauseAfterDelete = 500;

  function typeEffect() {
    const currentPhrase = phrases[phraseIndex];

    if (!isDeleting) {
      // Typing
      typingTextEl.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;

      if (charIndex === currentPhrase.length) {
        isDeleting = true;
        setTimeout(typeEffect, pauseAfterType);
        return;
      }

      setTimeout(typeEffect, typeSpeed);
    } else {
      // Deleting
      typingTextEl.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;

      if (charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(typeEffect, pauseAfterDelete);
        return;
      }

      setTimeout(typeEffect, deleteSpeed);
    }
  }

  // Start typing after a short delay
  setTimeout(typeEffect, 1000);

  // ── 5. HERO PARTICLES ──
  const particlesContainer = document.getElementById('heroParticles');

  function createParticles(count = 50) {
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');

      const size = Math.random() * 3 + 1; // 1-4px
      const left = Math.random() * 100;
      const duration = Math.random() * 30 + 15; // 15-45s
      const delay = Math.random() * duration;
      const opacity = Math.random() * 0.4 + 0.1;
      const drift = (Math.random() - 0.5) * 100; // -50 to 50px

      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${left}%;
        opacity: ${opacity};
        animation-duration: ${duration}s;
        animation-delay: -${delay}s;
        --drift: ${drift}px;
      `;

      particlesContainer.appendChild(particle);
    }
  }

  createParticles();

  // ── 6. SCROLL REVEAL ANIMATIONS ──
  const animateElements = document.querySelectorAll('[data-animate]');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');

          // Stagger children
          const children = entry.target.children;
          Array.from(children).forEach((child, index) => {
            child.style.transitionDelay = `${index * 0.08}s`;
          });

          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  animateElements.forEach((el) => revealObserver.observe(el));

  // ── 7. STATS COUNTER ANIMATION ──
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  let statsAnimated = false;

  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !statsAnimated) {
          statsAnimated = true;
          animateCounters();
          statsObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  const statsRow = document.querySelector('.stats-row');
  if (statsRow) statsObserver.observe(statsRow);

  function animateCounters() {
    statNumbers.forEach((el) => {
      const target = parseInt(el.dataset.target, 10);
      const duration = 2000;
      const startTime = performance.now();

      function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);

        el.textContent = current;

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          el.textContent = target + '+';
        }
      }

      requestAnimationFrame(updateCounter);
    });
  }

  // ── 8. EVENT FILTERS ──
  const filterBtns = document.querySelectorAll('.filter-btn');
  const eventCards = document.querySelectorAll('.event-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Update active button
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter cards
      eventCards.forEach((card) => {
        const category = card.dataset.category;

        if (filter === 'all' || category === filter) {
          card.classList.remove('hidden');
          card.style.animation = 'fadeInUp 0.4s ease-out forwards';
        } else {
          card.classList.add('hidden');
          card.style.animation = '';
        }
      });
    });
  });

  // ── 9. COUNTDOWN TIMERS ──
  const countdowns = document.querySelectorAll('.event-countdown[data-date]');

  function updateCountdowns() {
    countdowns.forEach((countdown) => {
      const targetDate = new Date(countdown.dataset.date).getTime();
      const now = Date.now();
      const diff = targetDate - now;

      const daysEl = countdown.querySelector('[data-days]');
      const hoursEl = countdown.querySelector('[data-hours]');
      const minutesEl = countdown.querySelector('[data-minutes]');
      const secondsEl = countdown.querySelector('[data-seconds]');

      if (diff <= 0) {
        if (daysEl) daysEl.textContent = '00';
        if (hoursEl) hoursEl.textContent = '00';
        if (minutesEl) minutesEl.textContent = '00';
        if (secondsEl) secondsEl.textContent = '00';
        countdown.classList.add('expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
      if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
    });
  }

  updateCountdowns();
  setInterval(updateCountdowns, 1000);

  // ── 10. LEADERBOARD ROW ANIMATION ──
  const leaderboardTable = document.querySelector('.leaderboard-table');

  if (leaderboardTable) {
    const leaderboardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const rows = leaderboardTable.querySelectorAll('tbody tr');
            rows.forEach((row, index) => {
              setTimeout(() => {
                row.classList.add('row-visible');
              }, index * 100);
            });
            leaderboardObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    leaderboardObserver.observe(leaderboardTable);
  }

  // ── 11. JOIN FORM HANDLING ──
  const joinForm = document.getElementById('joinForm');
  const toast = document.getElementById('toast');

  if (joinForm) {
    joinForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Get form data
      const formData = new FormData(joinForm);
      const data = Object.fromEntries(formData.entries());

      // Validate
      const requiredFields = ['fullName', 'email', 'department', 'year', 'interest'];
      const allFilled = requiredFields.every((field) => data[field] && data[field].trim());

      if (!allFilled) {
        return;
      }

      // Submit button feedback
      const submitBtn = joinForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Submitting...';
      submitBtn.disabled = true;

      // Simulate submission delay
      setTimeout(() => {
        // Show toast
        toast.classList.add('show');

        // Reset form
        joinForm.reset();

        // Restore button
        submitBtn.innerHTML = '<span class="btn-icon">✅</span> Submitted!';

        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }, 2000);

        // Hide toast
        setTimeout(() => {
          toast.classList.remove('show');
        }, 4000);
      }, 800);
    });
  }

  // ── 12. PARALLAX EFFECT (subtle) ──
  const heroGridBg = document.querySelector('.hero-grid-bg');

  let ticking = false;

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (heroGridBg) {
            const scrolled = window.scrollY;
            heroGridBg.style.transform = `translateY(${scrolled * 0.1}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );

  // ── 13. KEYBOARD ACCESSIBILITY ──
  // Allow Enter/Space to activate filter buttons
  filterBtns.forEach((btn) => {
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });

  console.log(
    '%c[IBM NEXUS] %cHack. Defend. Innovate.',
    'color: #00d4ff; font-weight: bold; font-size: 16px;',
    'color: #39ff14; font-size: 14px;'
  );
});
