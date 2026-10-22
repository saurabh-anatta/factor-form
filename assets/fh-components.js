/**
 * Fair Harbor 2026 home page components.
 * Small, dependency-free custom elements shared by the `fh-*` sections.
 */

/**
 * <fh-carousel>: wires [data-fh-prev]/[data-fh-next] buttons to a [data-fh-track]
 * scroll-snap container. Buttons are disabled at either end (Figma shows 40% opacity).
 */
class FhCarousel extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('[data-fh-track]');
    if (!this.track) return;
    this.prev = this.querySelector('[data-fh-prev]');
    this.next = this.querySelector('[data-fh-next]');
    this.onPrev = () => this.go(-1);
    this.onNext = () => this.go(1);
    this.update = this.update.bind(this);
    this.prev?.addEventListener('click', this.onPrev);
    this.next?.addEventListener('click', this.onNext);
    this.track.addEventListener('scroll', this.update, { passive: true });
    this.resizeObserver = new ResizeObserver(this.update);
    this.resizeObserver.observe(this.track);
    this.update();
  }

  disconnectedCallback() {
    this.prev?.removeEventListener('click', this.onPrev);
    this.next?.removeEventListener('click', this.onNext);
    this.track?.removeEventListener('scroll', this.update);
    this.resizeObserver?.disconnect();
  }

  /** Scroll by the width of the visible slides, snapping to whole slides. */
  go(direction) {
    const slide = [...this.track.children].find((el) => el.offsetParent !== null);
    const step = slide ? slide.getBoundingClientRect().width : this.track.clientWidth;
    const perView = Math.max(1, Math.floor((this.track.clientWidth + 1) / step));
    this.track.scrollBy({ left: direction * step * perView, behavior: 'smooth' });
  }

  update() {
    const { scrollLeft, scrollWidth, clientWidth } = this.track;
    const atStart = scrollLeft <= 2;
    const atEnd = scrollLeft + clientWidth >= scrollWidth - 2;
    if (this.prev) this.prev.disabled = atStart;
    if (this.next) this.next.disabled = atEnd;
  }
}

/**
 * <fh-tabs>: [data-fh-tab="key"] buttons filter [data-fh-panel-item] elements whose
 * data-fh-tabs attribute contains the key (comma separated list).
 */
class FhTabs extends HTMLElement {
  connectedCallback() {
    this.tabs = [...this.querySelectorAll('[data-fh-tab]')];
    this.tabs.forEach((tab) => tab.addEventListener('click', () => this.select(tab.dataset.fhTab)));
    const active = this.tabs.find((t) => t.getAttribute('aria-selected') === 'true') || this.tabs[0];
    if (active) this.select(active.dataset.fhTab);
  }

  select(key) {
    this.tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.fhTab === key)));
    this.querySelectorAll('[data-fh-panel-item]').forEach((item) => {
      const keys = (item.dataset.fhTabs || '').split(',').map((k) => k.trim());
      item.hidden = !keys.includes(key);
    });
    const track = this.querySelector('[data-fh-track]');
    if (track) {
      track.scrollLeft = 0;
      track.dispatchEvent(new Event('scroll'));
    }
  }
}

/**
 * <fh-rotator>: rotates its [data-fh-slide] children every `data-interval` seconds,
 * with optional [data-fh-prev]/[data-fh-next] controls.
 */
class FhRotator extends HTMLElement {
  connectedCallback() {
    this.slides = [...this.querySelectorAll('[data-fh-slide]')];
    if (this.slides.length < 2) return;
    this.index = 0;
    this.interval = Number(this.dataset.interval || 5) * 1000;
    this.querySelector('[data-fh-prev]')?.addEventListener('click', () => this.show(this.index - 1, true));
    this.querySelector('[data-fh-next]')?.addEventListener('click', () => this.show(this.index + 1, true));
    this.addEventListener('mouseenter', () => this.stop());
    this.addEventListener('mouseleave', () => this.start());
    this.start();
  }

  disconnectedCallback() {
    this.stop();
  }

  start() {
    this.stop();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.timer = setInterval(() => this.show(this.index + 1), this.interval);
  }

  stop() {
    clearInterval(this.timer);
  }

  show(i, restart = false) {
    this.index = (i + this.slides.length) % this.slides.length;
    this.slides.forEach((s, n) => {
      s.toggleAttribute('data-active', n === this.index);
      s.setAttribute('aria-hidden', String(n !== this.index));
    });
    if (restart) this.start();
  }
}

/**
 * <fh-counter data-value="37628496">: odometer-style count-up when scrolled into view.
 */
class FhCounter extends HTMLElement {
  connectedCallback() {
    const target = Number(String(this.dataset.value || '0').replace(/[^\d]/g, ''));
    const output = this.querySelector('[data-fh-count]') || this;
    const format = (n) => n.toLocaleString('en-US');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      output.textContent = format(target);
      return;
    }
    const start = Math.round(target * 0.97);
    output.textContent = format(start);
    this.observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      this.observer.disconnect();
      const duration = 1800;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        output.textContent = format(Math.round(start + (target - start) * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    this.observer.observe(this);
  }

  disconnectedCallback() {
    this.observer?.disconnect();
  }
}

const define = (name, ctor) => {
  if (!customElements.get(name)) customElements.define(name, ctor);
};
define('fh-carousel', FhCarousel);
define('fh-tabs', FhTabs);
define('fh-rotator', FhRotator);
define('fh-counter', FhCounter);
