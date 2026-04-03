class CustomMarquee extends HTMLElement {
  connectedCallback() {
    this.tickerContent = this.querySelector('[data-ticker-content]');

    if (!this.tickerContent) return;

    this.initTicker();
    this.respectReducedMotion();
  }

  disconnectedCallback() {
    if (this.motionQuery) {
      this.motionQuery.removeEventListener('change', this.applyMotionPreference);
    }
  }

  initTicker() {
    if (!this.tickerContent) return;

    const clone = this.tickerContent.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    this.tickerContent.parentNode.appendChild(clone);
  }

  respectReducedMotion() {
    const tickerTrack = this.querySelector('[data-ticker-track]');

    if (!tickerTrack) return;

    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    this.applyMotionPreference = (e) => {
      if (e.matches) {
        tickerTrack.style.animationPlayState = 'paused';
      } else {
        tickerTrack.style.animationPlayState = 'running';
      }
    };

    this.applyMotionPreference(this.motionQuery);
    this.motionQuery.addEventListener('change', this.applyMotionPreference);
  }
}

customElements.define('custom-marquee', CustomMarquee);
