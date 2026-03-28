class CustomReviewsCarousel extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('[data-reviews-track]');
    this.dots = this.querySelectorAll('[data-reviews-dot]');
    this.items = this.querySelectorAll('[data-reviews-item]');
    this.dialog = this.querySelector('[data-reviews-dialog]');
    this.dialogClose = this.querySelector('[data-reviews-dialog-close]');
    this.dialogVideo = this.querySelector('[data-reviews-dialog-video]');

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

    // Video popup handling
    const playButtons = this.querySelectorAll('.custom-reviews__play[data-video-url]');

    for (const button of playButtons) {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const videoUrl = button.dataset.videoUrl;
        this.openVideoPopup(videoUrl);
      });
    }

    if (this.dialogClose) {
      this.dialogClose.addEventListener('click', () => {
        this.closeVideoPopup();
      });
    }

    if (this.dialog) {
      this.dialog.addEventListener('click', (event) => {
        if (event.target === this.dialog) {
          this.closeVideoPopup();
        }
      });

      this.dialog.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          this.closeVideoPopup();
        }
      });
    }
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

  /**
   * Extract YouTube video ID from various URL formats
   * @param {string} url - YouTube URL
   * @returns {string|null}
   */
  getYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  openVideoPopup(videoUrl) {
    if (!this.dialog || !this.dialogVideo) return;

    const videoId = this.getYouTubeId(videoUrl);
    if (!videoId) return;

    this.dialogVideo.innerHTML = `<iframe
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1"
      allow="autoplay; encrypted-media"
      allowfullscreen
      title="Review video"
    ></iframe>`;

    this.dialog.showModal();
    this.activePlayButton = document.activeElement;
  }

  closeVideoPopup() {
    if (!this.dialog) return;

    this.dialogVideo.innerHTML = '';
    this.dialog.close();

    if (this.activePlayButton) {
      this.activePlayButton.focus();
      this.activePlayButton = null;
    }
  }
}

customElements.define('custom-reviews-carousel', CustomReviewsCarousel);
