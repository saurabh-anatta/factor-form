class CustomProductCarousel extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('[data-carousel-track]');
    this.prevButton = this.querySelector('[data-carousel-prev]');
    this.nextButton = this.querySelector('[data-carousel-next]');
    this.tabs = this.querySelectorAll('[data-carousel-tab]');

    if (!this.track) return;

    this.handlePrev = this.handlePrev.bind(this);
    this.handleNext = this.handleNext.bind(this);

    if (this.prevButton) {
      this.prevButton.addEventListener('click', this.handlePrev);
    }

    if (this.nextButton) {
      this.nextButton.addEventListener('click', this.handleNext);
    }

    for (const tab of this.tabs) {
      tab.addEventListener('click', (event) => {
        this.setActiveTab(event.currentTarget);
      });
    }

  }

  disconnectedCallback() {
    if (this.prevButton) {
      this.prevButton.removeEventListener('click', this.handlePrev);
    }

    if (this.nextButton) {
      this.nextButton.removeEventListener('click', this.handleNext);
    }
  }

  handlePrev() {
    if (!this.track) return;

    const card = this.track.querySelector('.cpc__card');
    if (!card) return;

    const gap = parseInt(getComputedStyle(this.track).gap) || 32;
    const scrollAmount = card.offsetWidth + gap;

    this.track.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });
  }

  handleNext() {
    if (!this.track) return;

    const card = this.track.querySelector('.cpc__card');
    if (!card) return;

    const gap = parseInt(getComputedStyle(this.track).gap) || 32;
    const scrollAmount = card.offsetWidth + gap;

    this.track.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  }

  setActiveTab(activeTab) {
    for (const tab of this.tabs) {
      const isActive = tab === activeTab;
      tab.classList.toggle('cpc__tab--active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    }
  }

}

customElements.define('custom-product-carousel', CustomProductCarousel);
