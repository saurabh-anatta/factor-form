class CustomIngredientsCarousel extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('.custom-ingredients__track');
    this.prevButton = this.querySelector('.custom-ingredients__arrow--prev');
    this.nextButton = this.querySelector('.custom-ingredients__arrow--next');

    if (!this.track) return;

    const scrollAmount = 256 + 32;

    if (this.prevButton) {
      this.prevButton.addEventListener('click', () => {
        this.track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      });
    }

    if (this.nextButton) {
      this.nextButton.addEventListener('click', () => {
        this.track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      });
    }
  }
}

customElements.define('custom-ingredients-carousel', CustomIngredientsCarousel);
