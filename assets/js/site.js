/* rochussen.xyz: interactions (no dependencies) */
(() => {
  const doc = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const firstUse = document.querySelector('use');
  const ICONS = ((firstUse && firstUse.getAttribute('href')) || 'assets/img/icons.svg#').split('#')[0];

  /* ---------- Theme ---------- */
  const themeMeta = $('meta[name="theme-color"]');
  const syncTheme = () => {
    const light = doc.dataset.theme === 'light';
    if (themeMeta) themeMeta.content = light ? '#f3ecdc' : '#0b0a08';
    $$('[data-theme-toggle]').forEach(btn => {
      btn.setAttribute('aria-pressed', String(light));
      btn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
      btn.title = light ? 'Dark theme' : 'Light theme';
    });
  };
  $$('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const next = doc.dataset.theme === 'light' ? 'dark' : 'light';
    const apply = () => { doc.dataset.theme = next; syncTheme(); };
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
    if (document.startViewTransition && !reduceMotion) document.startViewTransition(apply); else apply();
  }));
  syncTheme();

  /* ---------- Header state & progress ---------- */
  const header = $('.site-header');
  const progress = $('.scroll-progress');
  const cssProgress = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 12);
    if (progress && !cssProgress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const menu = $('#mobile-menu');
  const menuBtn = $('.menu-toggle');
  if (menu && menuBtn) {
    $$('li', menu).forEach((li, i) => li.style.setProperty('--i', i));
    const setOpen = open => {
      menu.classList.toggle('is-open', open);
      menu.inert = !open;
      menu.setAttribute('aria-hidden', String(!open));
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      $('use', menuBtn).setAttribute('href', `${ICONS}#${open ? 'i-close' : 'i-menu'}`);
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) { const first = $('a', menu); if (first) first.focus({ preventScroll: true }); }
    };
    menu.inert = true;
    menuBtn.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
    menu.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setOpen(false); menuBtn.focus(); }
    });
    window.matchMedia('(min-width: 961px)').addEventListener('change', e => { if (e.matches) setOpen(false); });
  }

  /* ---------- Hero entrance ---------- */
  requestAnimationFrame(() => requestAnimationFrame(() => doc.classList.add('is-loaded')));

  /* ---------- Scroll reveal ---------- */
  $$('[data-stagger]').forEach(group => {
    $$(':scope > [data-reveal]', group).forEach((el, i) => el.style.setProperty('--i', i));
  });
  const revealables = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(el => io.observe(el));
  } else {
    revealables.forEach(el => el.classList.add('is-in'));
  }

  /* ---------- Pointer glow on cards ---------- */
  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', e => {
      const card = e.target.closest && e.target.closest('.card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  /* ---------- Toast & copy ---------- */
  let toastEl, toastTimer;
  const toast = msg => {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = `<svg class="icon" aria-hidden="true"><use href="${ICONS}#i-check"></use></svg><span></span>`;
    toastEl.querySelector('span').textContent = msg;
    requestAnimationFrame(() => toastEl.classList.add('is-visible'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2600);
  };
  const copyText = async text => {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove(); return ok;
    }
  };
  document.addEventListener('click', async e => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    e.preventDefault();
    const ok = await copyText(btn.dataset.copy);
    toast(ok ? (btn.dataset.copyMsg || 'Copied to clipboard') : 'Copy failed. Please select the text manually.');
  });

  /* ---------- Publications filter & search ---------- */
  const pubList = $('[data-pub-list]');
  if (pubList) {
    const items = $$('.pub', pubList);
    const chips = $$('[data-filter]');
    const search = $('#pub-search');
    const count = $('#result-count');
    let active = 'all';
    chips.forEach(chip => {
      const f = chip.dataset.filter;
      const n = f === 'all' ? items.length : items.filter(it => it.dataset.tags.split(' ').includes(f)).length;
      const c = $('.count', chip); if (c) c.textContent = n;
    });
    const apply = () => {
      const q = (search && search.value || '').trim().toLowerCase();
      let shown = 0;
      items.forEach(it => {
        const tagOk = active === 'all' || it.dataset.tags.split(' ').includes(active);
        const textOk = !q || it.textContent.toLowerCase().includes(q);
        const show = tagOk && textOk;
        it.hidden = !show; if (show) shown++;
      });
      if (count) count.textContent = shown === items.length ? `Showing all ${shown} articles` : `Showing ${shown} of ${items.length} articles`;
    };
    chips.forEach(chip => chip.addEventListener('click', () => {
      active = chip.dataset.filter;
      chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
      apply();
    }));
    if (search) search.addEventListener('input', apply);
    apply();
  }

  /* ---------- CV scrollspy ---------- */
  const tocLinks = $$('.toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const map = new Map(tocLinks.map(a => [a.getAttribute('href').slice(1), a]));
    const sections = Array.from(map.keys()).map(id => document.getElementById(id)).filter(Boolean);
    const visible = new Set();
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) visible.add(en.target.id); else visible.delete(en.target.id); });
      const current = sections.find(s => visible.has(s.id));
      if (current) tocLinks.forEach(a => a.classList.toggle('is-active', a === map.get(current.id)));
    }, { rootMargin: `-${Math.round(window.innerHeight * 0.18)}px 0px -55% 0px` });
    sections.forEach(s => spy.observe(s));
  }
})();
