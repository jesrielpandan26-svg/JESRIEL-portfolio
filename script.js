document.addEventListener("DOMContentLoaded", () => {
  const spider = document.getElementById('spider');

  // set CSS header-height variable so sections that use it are correct
  const headerEl = document.querySelector('header');
  if (headerEl) {
    document.documentElement.style.setProperty('--header-height', `${headerEl.offsetHeight}px`);
  }

  // Make header clickable: clicking anywhere in the header (except nav links/buttons) scrolls to home
  if (headerEl) {
    headerEl.addEventListener('click', (e) => {
      // if clicked a link/button inside header, ignore here (nav links should act normally)
      if (e.target.closest('a, button, nav')) return;
      const home = document.getElementById('home');
      if (home) home.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Build white spider structure
  spider.innerHTML = `
    <div class="wrapper">
      <div class="body"></div>
      <div class="head">
        <div class="eye left"></div>
        <div class="eye right"></div>
      </div>
      <div class="leg"></div><div class="leg"></div>
      <div class="leg"></div><div class="leg"></div>
      <div class="leg"></div><div class="leg"></div>
      <div class="leg"></div><div class="leg"></div>
    </div>
  `;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let spiderX = mouseX;
  let spiderY = mouseY;
  const speed = 0.1;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateSpider() {
    spiderX += (mouseX - spiderX) * speed;
    spiderY += (mouseY - spiderY) * speed;

    const dx = mouseX - spiderX;
    const dy = mouseY - spiderY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    spider.style.transform = `translate(${spiderX - 40}px, ${spiderY - 40}px) rotate(${angle}deg)`;
    requestAnimationFrame(animateSpider);
  }

  animateSpider();

  // Hide page loader once window fully loads
  window.addEventListener('load', () => {
    const loader = document.getElementById('page-loader');
    if (!loader) return;
    // fade out then remove pointer events
    setTimeout(() => {
      loader.classList.add('hide');
      setTimeout(() => { if (loader && loader.parentNode) loader.style.display = 'none'; }, 520);
    }, 360);
  });

  // Skills progress animation when visible
  const skillsContainer = document.querySelector('.skills-container');
  const skills = document.querySelectorAll('progress.skill-progress, .radial-progress');

  function animateProgressBar(progressEl, target) {
    target = Number(target);
    const start = Number(progressEl.value) || 0;
    const duration = 800; // ms
    const startTime = performance.now();

    function frame(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const current = Math.round(start + (target - start) * t);
      progressEl.value = current;
      const percentEl = progressEl.parentElement.querySelector('.skill-percent');
      if (percentEl) percentEl.textContent = `${current}%`;
      progressEl.setAttribute('aria-valuenow', current);
      if (t < 1) {
        requestAnimationFrame(frame);
      }
    }
    requestAnimationFrame(frame);
  }

  // Animate an SVG circle (.radial-progress) from 0 -> target percent
  function animateCircle(circleEl, target, duration = 900) {
    target = Number(target);
    const r = Number(circleEl.getAttribute('r')) || 0;
    const circumference = 2 * Math.PI * r;
    // ensure dasharray set
    circleEl.setAttribute('stroke-dasharray', String(circumference));
    const startOffset = Number(circleEl.getAttribute('stroke-dashoffset')) || circumference;
    const targetOffset = circumference * (1 - target / 100);
    const startTime = performance.now();

    const card = circleEl.closest('.skill-card');
    const percentEl = card ? card.querySelector('.skill-percent') : null;

    function frame(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const currentOffset = startOffset + (targetOffset - startOffset) * eased;
      circleEl.setAttribute('stroke-dashoffset', String(currentOffset));
      if (percentEl) {
        const visibleProgress = Math.round((1 - currentOffset / circumference) * 100);
        percentEl.textContent = `${visibleProgress}%`;
      }
      if (t < 1) requestAnimationFrame(frame);
      else {
        // ensure final state
        circleEl.setAttribute('stroke-dashoffset', String(targetOffset));
        if (percentEl) percentEl.textContent = `${Math.round(target)}%`;
      }
    }

    requestAnimationFrame(frame);
  }

  if (skillsContainer && skills.length) {
    const skillCards = skillsContainer.querySelectorAll('.skill-card');
    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          skillsContainer.classList.add('show');
          // Add reveal animation to skill cards with stagger
          const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          skillCards.forEach((card, idx) => {
            const delay = idx * 120; // ms
            if (prefersReduced) {
              card.classList.add('show');
            } else {
              setTimeout(() => card.classList.add('show'), delay);
            }
          });

          skills.forEach(el => {
            const level = el.dataset.level || el.getAttribute('data-level') || el.max || 0;
            // Animate to target (respect prefers-reduced-motion)
            if (prefersReduced) {
              if (el.tagName === 'PROGRESS') {
                el.value = level;
                const percentEl = el.parentElement.querySelector('.skill-percent');
                if (percentEl) percentEl.textContent = `${level}%`;
                el.setAttribute('aria-valuenow', level);
              } else {
                // radial circle
                const card = el.closest('.skill-card');
                if (card) {
                  const percentEl = card.querySelector('.skill-percent');
                  if (percentEl) percentEl.textContent = `${level}%`;
                  el.setAttribute('stroke-dashoffset', String((1 - level / 100) * (2 * Math.PI * Number(el.getAttribute('r') || 0))));
                }
              }
            } else {
              if (el.tagName === 'PROGRESS') animateProgressBar(el, level);
              else animateCircle(el, level);
            }
          });
          observer.unobserve(skillsContainer);
        }
      });
    }, { threshold: 0.25 });
    obs.observe(skillsContainer);
  }

  // Make skill cards interactive: click or Enter/Space toggles details and animates progress
  const skillCards = document.querySelectorAll('.skill-card');
  if (skillCards.length) {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches;
    skillCards.forEach(card => {
      const linearEl = card.querySelector('progress.skill-progress');
      const radialEl = card.querySelector('.radial-progress');
      const percentEl = card.querySelector('.skill-percent');
      const detailsEl = card.querySelector('.skill-details');

      function animateToLevel() {
        if (radialEl) {
          const level = Number(radialEl.dataset.level || radialEl.getAttribute('data-level') || 0);
          animateCircle(radialEl, level);
          return;
        }
        if (linearEl) {
          const level = Number(linearEl.dataset.level || linearEl.getAttribute('data-level') || linearEl.max || 0);
          const current = Number(linearEl.value) || 0;
          if (current >= level) return; // already at or above
          animateProgressBar(linearEl, level);
        }
      }

      // For linear progress, update percent via MutationObserver; radial updates percent during its animation
      if (linearEl && percentEl) {
        const obsProg = new MutationObserver(() => {
          percentEl.textContent = `${Math.round(linearEl.value)}%`;
        });
        obsProg.observe(linearEl, { attributes: true, attributeFilter: ['value'] });
        // set initial percent if reduced-motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          const lvl = Number(linearEl.dataset.level || linearEl.getAttribute('data-level') || linearEl.max || 0);
          linearEl.value = lvl;
          percentEl.textContent = `${lvl}%`;
        }
      }
      // If radial and reduced-motion, set final value immediately
      if (radialEl && percentEl && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const lvl = Number(radialEl.dataset.level || radialEl.getAttribute('data-level') || 0);
        const r = Number(radialEl.getAttribute('r')) || 0;
        const circ = 2 * Math.PI * r;
        radialEl.setAttribute('stroke-dasharray', String(circ));
        radialEl.setAttribute('stroke-dashoffset', String((1 - lvl / 100) * circ));
        percentEl.textContent = `${lvl}%`;
      }

      function toggleCard(doOpen) {
        const isOpen = card.classList.contains('active');
        const open = typeof doOpen === 'boolean' ? doOpen : !isOpen;
        if (open) {
          card.classList.add('active');
          card.setAttribute('aria-pressed', 'true');
          if (detailsEl) detailsEl.hidden = false;
          animateToLevel();
        } else {
          card.classList.remove('active');
          card.setAttribute('aria-pressed', 'false');
          if (detailsEl) detailsEl.hidden = true;
        }
      }

      card.addEventListener('click', (e) => {
        // avoid clicks on inner links if any
        if (e.target.closest('a')) return;
        toggleCard();
        // clicking pins the card open so hover won't auto-close it
        if (card.classList.contains('active')) card.dataset.pinned = 'true';
        else delete card.dataset.pinned;
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleCard();
          if (card.classList.contains('active')) card.dataset.pinned = 'true';
          else delete card.dataset.pinned;
        }
      });

      // Auto-open on mouse enter, auto-close on leave — skip hover behavior on touch devices
      if (!isTouch) {
        card.addEventListener('mouseenter', () => {
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
          // if already active or pinned, do nothing
          if (card.classList.contains('active') || card.dataset.pinned === 'true') return;
          toggleCard(true);
          card.dataset.hoverOpen = 'true';
        });

        card.addEventListener('mouseleave', () => {
          if (card.dataset.hoverOpen === 'true') {
            // only close when it was opened by hover and not pinned by click
            if (card.dataset.pinned !== 'true') toggleCard(false);
            delete card.dataset.hoverOpen;
          }
        });
      }
    });
  }

  // Copy run command buttons in Projects
  const copyButtons = document.querySelectorAll('.copy-btn');
  if (copyButtons.length) {
    copyButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const cmd = btn.dataset.command || '';
        if (!cmd) return;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(cmd);
          } else {
            // fallback
            const textarea = document.createElement('textarea');
            textarea.value = cmd;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
          }
          const old = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = old; }, 1400);
        } catch (err) {
          console.error('Copy failed', err);
        }
      });
    });
  }

  // Reveal project cards and add stagger animation similar to skills
  const projectsContainer = document.querySelector('.projects-container');
  const projectCards = projectsContainer ? projectsContainer.querySelectorAll('.project-card') : [];
  if (projectsContainer && projectCards.length) {
    const obsP = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          projectsContainer.classList.add('show');
          const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          projectCards.forEach((card, idx) => {
            const delay = idx * 120;
            if (prefersReduced) card.classList.add('show');
            else setTimeout(() => card.classList.add('show'), delay);
          });
          observer.unobserve(projectsContainer);
        }
      });
    }, { threshold: 0.25 });
    obsP.observe(projectsContainer);
  }

  // Cursor-following shine for hero image (only for non-touch devices)
  try {
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches;
    const idCard = document.querySelector('.id-card');
    if (idCard && !isTouchDevice) {
      idCard.style.setProperty('--x', '50%');
      idCard.style.setProperty('--y', '50%');
      idCard.addEventListener('mousemove', (e) => {
        const rect = idCard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        idCard.style.setProperty('--x', `${x}px`);
        idCard.style.setProperty('--y', `${y}px`);
      });
      idCard.addEventListener('mouseenter', () => idCard.classList.add('pointer-shine'));
      idCard.addEventListener('mouseleave', () => idCard.classList.remove('pointer-shine'));
    }
  } catch (err) {
    console.error('Shine handler failed', err);
  }
});

