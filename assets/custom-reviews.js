class CustomReviewsCarousel extends HTMLElement {
  static AUTOPLAY_DURATION = 5000;

  connectedCallback() {
    this.track = this.querySelector('[data-reviews-track]');
    this.dots = this.querySelectorAll('[data-reviews-dot]');
    this.items = this.querySelectorAll('[data-reviews-item]');
    this.dialog = this.querySelector('[data-reviews-dialog]');
    this.dialogClose = this.querySelector('[data-reviews-dialog-close]');
    this.dialogVideo = this.querySelector('[data-reviews-dialog-video]');

    if (!this.track || this.dots.length === 0 || this.items.length === 0) return;

    this.activeIndex = 0;
    this.autoplayTimer = null;
    this.scrollTimeout = null;
    this.isUserScrolling = false;

    this.handleScroll = this.handleScroll.bind(this);
    this.track.addEventListener('scroll', this.handleScroll, { passive: true });

    // Dot click navigation
    for (const dot of this.dots) {
      dot.addEventListener('click', (event) => {
        const index = parseInt(event.currentTarget.dataset.reviewsDot, 10);
        this.goToSlide(index);
      });
    }

    // Touch interaction pauses then restarts autoplay
    this.track.addEventListener('touchstart', () => {
      this.isUserScrolling = true;
      this.stopAutoplay();
    }, { passive: true });

    this.track.addEventListener('touchend', () => {
      this.isUserScrolling = false;
      this.startAutoplay();
    }, { passive: true });

    this.updateActiveDot(0);
    this.startAutoplay();

    // Pause when not visible
    this.intersectionObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.startAutoplay();
      } else {
        this.stopAutoplay();
      }
    }, { threshold: 0.3 });
    this.intersectionObserver.observe(this);

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

    this.stopAutoplay();

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  goToSlide(index) {
    const targetItem = this.items[index];
    if (!targetItem) return;

    this.track.scrollTo({
      left: targetItem.offsetLeft - this.track.offsetLeft,
      behavior: 'smooth'
    });
  }

  startAutoplay() {
    this.stopAutoplay();

    this.autoplayTimer = setTimeout(() => {
      const nextIndex = (this.activeIndex + 1) % this.items.length;
      this.goToSlide(nextIndex);
      this.updateActiveDot(nextIndex);
      this.startAutoplay();
    }, CustomReviewsCarousel.AUTOPLAY_DURATION);
  }

  stopAutoplay() {
    if (this.autoplayTimer) {
      clearTimeout(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  handleScroll() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      this.updateActiveDotFromScroll();
    }, 50);
  }

  updateActiveDotFromScroll() {
    if (!this.track || this.items.length === 0) return;

    const scrollLeft = this.track.scrollLeft;
    const trackWidth = this.track.offsetWidth;
    let newIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const itemCenter = item.offsetLeft - this.track.offsetLeft + item.offsetWidth / 2;
      const trackCenter = scrollLeft + trackWidth / 2;
      const distance = Math.abs(itemCenter - trackCenter);

      if (distance < minDistance) {
        minDistance = distance;
        newIndex = i;
      }
    }

    if (newIndex !== this.activeIndex) {
      this.updateActiveDot(newIndex);
      this.startAutoplay();
    }
  }

  updateActiveDot(index) {
    this.activeIndex = index;

    for (const dot of this.dots) {
      const dotIndex = parseInt(dot.dataset.reviewsDot, 10);
      const isActive = dotIndex === index;
      dot.classList.toggle('custom-reviews__dot--active', isActive);
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');

      // Restart animation by forcing reflow on the indicator
      if (isActive) {
        const indicator = dot.querySelector('.custom-reviews__dot-indicator');
        if (indicator) {
          indicator.style.animation = 'none';
          indicator.offsetHeight; // force reflow
          indicator.style.animation = '';
        }
      }
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

    this.stopAutoplay();

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

    this.startAutoplay();
  }
}

customElements.define('custom-reviews-carousel', CustomReviewsCarousel);
