class CustomReviewsCarousel extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('[data-reviews-track]');
    this.dots = this.querySelectorAll('[data-reviews-dot]');
    this.items = this.querySelectorAll('[data-reviews-item]');

    if (!this.track || this.dots.length === 0 || this.items.length === 0) return;

    this.scrollTimeout = null;
    this.handleScroll = this.handleScroll.bind(this);
    this.track.addEventListener('scroll', this.handleScroll, { passive: true });

    for (const dot of this.dots) {
      dot.addEventListener('click', (event) => {
        const index = parseInt(event.currentTarget.dataset.reviewsDot, 10);
        const targetItem = this.items[index];

        if (targetItem) {
          this.track.scrollTo({
            left: targetItem.offsetLeft - this.track.offsetLeft,
            behavior: 'smooth'
          });
        }
      });
    }

    this.updateActiveDot();
  }

  disconnectedCallback() {
    if (this.track) {
      this.track.removeEventListener('scroll', this.handleScroll);
    }

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  handleScroll() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      this.updateActiveDot();
    }, 50);
  }

  updateActiveDot() {
    if (!this.track || this.items.length === 0) return;

    const scrollLeft = this.track.scrollLeft;
    const trackWidth = this.track.offsetWidth;
    let activeIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const itemCenter = item.offsetLeft - this.track.offsetLeft + item.offsetWidth / 2;
      const trackCenter = scrollLeft + trackWidth / 2;
      const distance = Math.abs(itemCenter - trackCenter);

      if (distance < minDistance) {
        minDistance = distance;
        activeIndex = i;
      }
    }

    for (const dot of this.dots) {
      const dotIndex = parseInt(dot.dataset.reviewsDot, 10);
      dot.classList.toggle('custom-reviews__dot--active', dotIndex === activeIndex);
      dot.setAttribute('aria-current', dotIndex === activeIndex ? 'true' : 'false');
    }
  }
}

customElements.define('custom-reviews-carousel', CustomReviewsCarousel);
