import { Component } from '@theme/component';

/**
 * Shop bestsellers: tabbed product carousel (Design refresh 2026).
 *
 * @typedef {Object} FhBestsellersRefs
 * @property {HTMLButtonElement} prevButton
 * @property {HTMLButtonElement} nextButton
 * @property {HTMLButtonElement[]} [tabs]
 * @property {HTMLElement[]} panels
 * @property {HTMLElement[]} tracks
 *
 * @extends {Component<FhBestsellersRefs>}
 */
class FhBestsellers extends Component {
  requiredRefs = ['prevButton', 'nextButton'];

  /** @type {AbortController | undefined} */
  #abortController;

  connectedCallback() {
    super.connectedCallback();
    this.#bindTracks();
    this.updateArrows();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController?.abort();
  }

  /** @returns {HTMLElement | undefined} */
  get activeTrack() {
    const panels = this.refs.panels || [];
    const index = panels.findIndex((panel) => !panel.hidden);

    return this.refs.tracks?.[index === -1 ? 0 : index];
  }

  #bindTracks() {
    this.#abortController?.abort();
    this.#abortController = new AbortController();
    const { signal } = this.#abortController;

    for (const track of this.refs.tracks || []) {
      track.addEventListener('scroll', () => this.updateArrows(), { passive: true, signal });
    }

    window.addEventListener('resize', () => this.updateArrows(), { passive: true, signal });
  }

  /** Distance of one card plus gap */
  #step() {
    const track = this.activeTrack;
    const slide = track?.querySelector('.fh-bestsellers__slide');

    if (!track || !slide) return 0;

    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;

    return slide.getBoundingClientRect().width + gap;
  }

  scrollPrev() {
    this.activeTrack?.scrollBy({ left: -this.#step(), behavior: this.#behavior() });
  }

  scrollNext() {
    this.activeTrack?.scrollBy({ left: this.#step(), behavior: this.#behavior() });
  }

  /** @returns {ScrollBehavior} */
  #behavior() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }

  updateArrows() {
    const track = this.activeTrack;
    const { prevButton, nextButton } = this.refs;

    if (!track || !prevButton || !nextButton) return;

    const maxScroll = track.scrollWidth - track.clientWidth - 1;

    prevButton.disabled = track.scrollLeft <= 1;
    nextButton.disabled = track.scrollLeft >= maxScroll;
  }

  /**
   * @param {MouseEvent} event
   */
  selectTab(event) {
    const tab = /** @type {HTMLElement} */ (event.target).closest('[role="tab"]');

    if (!(tab instanceof HTMLButtonElement)) return;

    this.#activate(tab);
  }

  /**
   * Arrow / Home / End keyboard support for the tablist.
   * @param {KeyboardEvent} event
   */
  onTabKeydown(event) {
    const tabs = this.refs.tabs || [];
    const current = tabs.indexOf(/** @type {HTMLButtonElement} */ (event.target));

    if (current === -1) return;

    /** @type {Record<string, number>} */
    const moves = {
      ArrowRight: (current + 1) % tabs.length,
      ArrowLeft: (current - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    const next = moves[event.key];

    if (next === undefined) return;

    event.preventDefault();
    const target = tabs[next];

    if (!target) return;

    this.#activate(target);
    target.focus();
  }

  /**
   * @param {HTMLButtonElement} tab
   */
  #activate(tab) {
    const tabs = this.refs.tabs || [];
    const panels = this.refs.panels || [];
    const panelId = tab.getAttribute('aria-controls');

    for (const item of tabs) {
      const selected = item === tab;

      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    }

    for (const panel of panels) {
      panel.hidden = panel.id !== panelId;
    }

    const track = this.activeTrack;

    if (track) track.scrollLeft = 0;

    this.updateArrows();
  }
}

if (!customElements.get('fh-bestsellers')) {
  customElements.define('fh-bestsellers', FhBestsellers);
}
