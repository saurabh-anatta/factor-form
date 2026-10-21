/**
 * Fair Harbor design refresh 2026: behaviour for the `fh-*` sections.
 * Each piece is a small custom element so it works again automatically
 * when the theme editor re-renders a section.
 */

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ */
/* <fh-announcements>: rotates announcement messages                   */
/* ------------------------------------------------------------------ */
class FhAnnouncements extends HTMLElement {
  connectedCallback() {
    this.slides = [...this.querySelectorAll('[data-slide]')];
    this.index = 0;
    this.querySelector('[data-prev]')?.addEventListener('click', () => this.go(this.index - 1, true));
    this.querySelector('[data-next]')?.addEventListener('click', () => this.go(this.index + 1, true));
    this.addEventListener('mouseenter', () => this.stop());
    this.addEventListener('mouseleave', () => this.start());
    this.addEventListener('focusin', () => this.stop());
    this.addEventListener('focusout', () => this.start());
    this.start();
  }
  disconnectedCallback() { this.stop(); }
  start() {
    this.stop();
    if (this.slides.length < 2 || reduceMotion()) return;
    const speed = Number(this.dataset.speed || 5) * 1000;
    this.timer = setInterval(() => this.go(this.index + 1), speed);
  }
  stop() { clearInterval(this.timer); }
  go(i, user = false) {
    if (!this.slides.length) return;
    this.index = (i + this.slides.length) % this.slides.length;
    this.slides.forEach((s, n) => {
      const active = n === this.index;
      s.toggleAttribute('data-active', active);
      s.setAttribute('aria-hidden', String(!active));
      s.querySelectorAll('a').forEach((a) => (active ? a.removeAttribute('tabindex') : a.setAttribute('tabindex', '-1')));
    });
    if (user) this.start();
  }
}

/* ------------------------------------------------------------------ */
/* <fh-carousel>: scroll-snap track with prev/next buttons             */
/* ------------------------------------------------------------------ */
class FhCarousel extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('[data-track]');
    if (!this.track) return;
    this.prev = this.querySelectorAll('[data-prev]');
    this.next = this.querySelectorAll('[data-next]');
    this.prev.forEach((b) => b.addEventListener('click', () => this.step(-1)));
    this.next.forEach((b) => b.addEventListener('click', () => this.step(1)));
    this.onScroll = () => requestAnimationFrame(() => this.update());
    this.track.addEventListener('scroll', this.onScroll, { passive: true });
    this.ro = new ResizeObserver(() => this.update());
    this.ro.observe(this.track);
    this.update();
  }
  disconnectedCallback() { this.ro?.disconnect(); }
  step(dir) {
    const first = this.track.firstElementChild;
    if (!first) return;
    const gap = parseFloat(getComputedStyle(this.track).columnGap) || 0;
    const item = first.getBoundingClientRect().width + gap;
    const perPage = Math.max(1, Math.floor((this.track.clientWidth + gap) / item));
    this.track.scrollBy({ left: dir * item * perPage, behavior: reduceMotion() ? 'auto' : 'smooth' });
  }
  update() {
    const max = this.track.scrollWidth - this.track.clientWidth - 2;
    const atStart = this.track.scrollLeft <= 2;
    const atEnd = this.track.scrollLeft >= max;
    this.prev.forEach((b) => (b.disabled = atStart));
    this.next.forEach((b) => (b.disabled = atEnd || max <= 0));
    this.toggleAttribute('data-scrollable', max > 0);
  }
}

/* ------------------------------------------------------------------ */
/* <fh-tabs>: tab buttons that show one panel at a time                */
/* ------------------------------------------------------------------ */
class FhTabs extends HTMLElement {
  connectedCallback() {
    this.tabs = [...this.querySelectorAll('[role="tab"]')];
    this.panels = [...this.querySelectorAll('[role="tabpanel"]')];
    this.tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => this.select(i));
      tab.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + this.tabs.length) % this.tabs.length;
        this.select(n);
        this.tabs[n].focus();
      });
    });
  }
  select(i) {
    this.tabs.forEach((t, n) => {
      t.setAttribute('aria-selected', String(n === i));
      t.tabIndex = n === i ? 0 : -1;
    });
    this.panels.forEach((p, n) => (p.hidden = n !== i));
    this.panels[i]?.querySelector('fh-carousel')?.update?.();
  }
}

/* ------------------------------------------------------------------ */
/* <fh-swatches>: swaps a product card's image and link per colour     */
/* ------------------------------------------------------------------ */
class FhSwatches extends HTMLElement {
  connectedCallback() {
    this.card = this.closest('[data-fh-card]');
    this.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-swatch]');
      if (!btn || !this.card) return;
      e.preventDefault();
      this.querySelectorAll('[data-swatch]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      const img = this.card.querySelector('[data-card-image]');
      if (img && btn.dataset.image) {
        img.src = btn.dataset.image;
        if (btn.dataset.srcset) img.srcset = btn.dataset.srcset;
      }
      const label = this.card.querySelector('[data-card-variant]');
      if (label) label.textContent = btn.dataset.label || '';
      if (btn.dataset.url) this.card.querySelectorAll('[data-card-link]').forEach((a) => (a.href = btn.dataset.url));
    });
  }
}

/* ------------------------------------------------------------------ */
/* <fh-counter>: counts up to a number once it scrolls into view       */
/* ------------------------------------------------------------------ */
class FhCounter extends HTMLElement {
  connectedCallback() {
    const target = Number(String(this.dataset.value || '0').replace(/[^\d]/g, ''));
    const out = this.querySelector('[data-counter-value]') || this;
    const format = (n) => n.toLocaleString('en-US');
    if (!target || reduceMotion() || !('IntersectionObserver' in window)) {
      out.textContent = format(target);
      return;
    }
    out.textContent = format(0);
    this.io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        this.io.disconnect();
        const duration = Number(this.dataset.duration || 2000);
        const t0 = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          out.textContent = format(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    this.io.observe(this);
  }
  disconnectedCallback() { this.io?.disconnect(); }
}

/* ------------------------------------------------------------------ */
/* <fh-header>: sticky shadow, mobile drawer, keyboard dropdowns       */
/* ------------------------------------------------------------------ */
class FhHeader extends HTMLElement {
  connectedCallback() {
    this.drawer = this.querySelector('[data-drawer]');
    this.querySelectorAll('[data-drawer-open]').forEach((b) => b.addEventListener('click', () => this.open()));
    this.querySelectorAll('[data-drawer-close]').forEach((b) => b.addEventListener('click', () => this.close()));
    this.drawer?.addEventListener('click', (e) => { if (e.target === this.drawer) this.close(); });
    this.drawer?.addEventListener('close', () => document.documentElement.classList.remove('fh-scroll-lock'));

    this.onScroll = () => this.toggleAttribute('data-scrolled', window.scrollY > 4);
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.onScroll();

    // Close open desktop dropdowns with Escape
    this.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const item = e.target.closest('[data-menu-item]');
      if (item) { item.querySelector('[data-menu-trigger]')?.focus(); item.removeAttribute('data-open'); }
    });
    this.querySelectorAll('[data-menu-trigger]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const item = btn.closest('[data-menu-item]');
        if (!item.querySelector('[data-menu-panel]')) return;
        if (!item.hasAttribute('data-open')) { e.preventDefault(); this.closeMenus(); item.setAttribute('data-open', ''); btn.setAttribute('aria-expanded', 'true'); }
      });
    });
    this.addEventListener('focusout', (e) => { if (!this.contains(e.relatedTarget)) this.closeMenus(); });
    this.addEventListener('mouseleave', () => this.closeMenus());
  }
  disconnectedCallback() { window.removeEventListener('scroll', this.onScroll); }
  closeMenus() {
    this.querySelectorAll('[data-menu-item][data-open]').forEach((i) => {
      i.removeAttribute('data-open');
      i.querySelector('[data-menu-trigger]')?.setAttribute('aria-expanded', 'false');
    });
  }
  open() { if (!this.drawer) return; this.drawer.showModal(); document.documentElement.classList.add('fh-scroll-lock'); }
  close() { this.drawer?.close(); }
}

/* ------------------------------------------------------------------ */
/* <fh-video-tile>: plays an inline video when the play button is used */
/* ------------------------------------------------------------------ */
class FhVideoTile extends HTMLElement {
  connectedCallback() {
    const video = this.querySelector('video');
    const btn = this.querySelector('[data-play]');
    if (!video || !btn) return;
    btn.addEventListener('click', () => {
      if (video.paused) { video.play(); this.setAttribute('data-playing', ''); btn.setAttribute('aria-pressed', 'true'); }
      else { video.pause(); this.removeAttribute('data-playing'); btn.setAttribute('aria-pressed', 'false'); }
    });
  }
}

const define = (name, cls) => { if (!customElements.get(name)) customElements.define(name, cls); };
define('fh-announcements', FhAnnouncements);
define('fh-carousel', FhCarousel);
define('fh-tabs', FhTabs);
define('fh-swatches', FhSwatches);
define('fh-counter', FhCounter);
define('fh-header', FhHeader);
define('fh-video-tile', FhVideoTile);
