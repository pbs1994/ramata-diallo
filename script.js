const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Each feature runs in its own try/catch: a failure in one interactive
// enhancement (e.g. an unexpected DOM shape) must never stop the rest
// of the script — especially the scroll-reveal system — from running.
function safe(label, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`[ramata-diallo] "${label}" failed:`, err);
  }
}

// ------------------------------------------------------------------
// Mobile nav toggle
// ------------------------------------------------------------------
safe('nav-toggle', () => {
  const navToggle = document.getElementById('navToggle');
  const primaryNav = document.getElementById('primaryNav');
  if (!navToggle || !primaryNav) return;

  navToggle.addEventListener('click', () => {
    const isOpen = primaryNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  primaryNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      primaryNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
});

// ------------------------------------------------------------------
// FAQ accordion — one open at a time
// ------------------------------------------------------------------
safe('faq-accordion', () => {
  const faqButtons = document.querySelectorAll('.faq-q');
  faqButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const isOpen = button.getAttribute('aria-expanded') === 'true';
      faqButtons.forEach((other) => other.setAttribute('aria-expanded', 'false'));
      if (!isOpen) button.setAttribute('aria-expanded', 'true');
    });
  });
});

// ------------------------------------------------------------------
// Scroll progress rail
// ------------------------------------------------------------------
const progressFill = document.getElementById('scrollProgressFill');

function updateScrollProgress() {
  if (!progressFill) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressFill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
}

// ------------------------------------------------------------------
// Scroll-reveal system
// ------------------------------------------------------------------
safe('scroll-reveal', () => {
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (!revealEls.length) return;

  if (!('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    // Positive bottom margin expands the trigger zone below the actual
    // viewport, so content starts revealing just before it scrolls into
    // view instead of after — no "dead space" flash while it animates in.
    { threshold: 0, rootMargin: '0px 0px 15% 0px' }
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  // Safety net: if, for whatever reason, an element never gets flagged
  // (a missed observation, a mid-transition layout shift, etc.), don't
  // let it stay invisible forever — reveal anything left after a few
  // seconds so content is never permanently hidden.
  window.setTimeout(() => {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }, 4000);
});

// ------------------------------------------------------------------
// Animated stat counters
// ------------------------------------------------------------------
safe('stat-counters', () => {
  const counters = document.querySelectorAll('.count');
  if (!counters.length) return;

  function animateCount(el) {
    const target = parseInt(el.dataset.target, 10) || 0;
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = value.toLocaleString('fr-FR') + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    counters.forEach((el) => {
      const target = parseInt(el.dataset.target, 10) || 0;
      el.textContent = target.toLocaleString('fr-FR') + (el.dataset.suffix || '');
    });
    return;
  }

  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach((el) => countObserver.observe(el));

  // Safety net, same reasoning as the reveal system above.
  window.setTimeout(() => {
    counters.forEach((el) => {
      if (el.textContent === '0') {
        const target = parseInt(el.dataset.target, 10) || 0;
        el.textContent = target.toLocaleString('fr-FR') + (el.dataset.suffix || '');
      }
    });
  }, 4000);
});

// ------------------------------------------------------------------
// Hero cursor-reactive spotlight
// ------------------------------------------------------------------
safe('hero-spotlight', () => {
  const hero = document.getElementById('hero');
  const heroSpotlight = document.getElementById('heroSpotlight');
  if (!hero || !heroSpotlight || !hasFinePointer || prefersReducedMotion) return;

  hero.addEventListener('pointermove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    heroSpotlight.style.setProperty('--mx', `${x}%`);
    heroSpotlight.style.setProperty('--my', `${y}%`);
  });
});

// ------------------------------------------------------------------
// Scroll cue — jump to the next section
// ------------------------------------------------------------------
safe('scroll-cue', () => {
  const scrollCue = document.getElementById('scrollCue');
  const aboutSection = document.getElementById('about');
  if (!scrollCue || !aboutSection) return;

  scrollCue.addEventListener('click', () => {
    aboutSection.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
});

// ------------------------------------------------------------------
// Magnetic buttons
// ------------------------------------------------------------------
safe('magnetic-buttons', () => {
  if (!hasFinePointer || prefersReducedMotion) return;
  document.querySelectorAll('.magnetic').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transform = '';
    });
  });
});

// ------------------------------------------------------------------
// Portrait tilt
// ------------------------------------------------------------------
safe('portrait-tilt', () => {
  const tiltCard = document.getElementById('tiltCard');
  if (!tiltCard || !hasFinePointer || prefersReducedMotion) return;
  const tiltImg = tiltCard.querySelector('img');
  if (!tiltImg) return;

  tiltCard.addEventListener('pointermove', (e) => {
    const rect = tiltCard.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    tiltImg.style.setProperty('--ry', `${x * 10}deg`);
    tiltImg.style.setProperty('--rx', `${y * -10}deg`);
  });
  tiltCard.addEventListener('pointerleave', () => {
    tiltImg.style.setProperty('--rx', '0deg');
    tiltImg.style.setProperty('--ry', '0deg');
  });
});

// ------------------------------------------------------------------
// Coaching card spotlight
// ------------------------------------------------------------------
safe('coaching-spotlight', () => {
  if (!hasFinePointer || prefersReducedMotion) return;
  document.querySelectorAll('.coaching-card.spotlight').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', `${x}%`);
      card.style.setProperty('--my', `${y}%`);
    });
  });
});

// ------------------------------------------------------------------
// Banner parallax + scroll progress (shared scroll listener, rAF-throttled)
// ------------------------------------------------------------------
safe('scroll-effects', () => {
  const bannerImg = document.getElementById('bannerImg');
  const bannerFrame = bannerImg ? bannerImg.closest('.banner-frame') : null;
  let ticking = false;

  function onScroll() {
    updateScrollProgress();

    if (bannerImg && bannerFrame && !prefersReducedMotion) {
      const rect = bannerFrame.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom > 0 && rect.top < vh) {
        const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
        const offset = Math.max(-40, Math.min(40, progress * 60));
        bannerImg.style.setProperty('--py', `${offset}px`);
      }
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });

  updateScrollProgress();
});
