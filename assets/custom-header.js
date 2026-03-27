class CustomHeaderComponent extends HTMLElement {
  constructor() {
    super();
    this.drawer = null;
    this.hamburgerButton = null;
    this.closeButton = null;
    this.overlay = null;

    this.handleHamburgerClick = this.handleHamburgerClick.bind(this);
    this.handleCloseClick = this.handleCloseClick.bind(this);
    this.handleOverlayClick = this.handleOverlayClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  connectedCallback() {
    this.drawer = this.querySelector('#custom-header-drawer');
    this.hamburgerButton = this.querySelector('[data-hamburger]');
    this.closeButton = this.drawer?.querySelector('[data-drawer-close]');
    this.overlay = this.drawer?.querySelector('[data-drawer-overlay]');

    this.hamburgerButton?.addEventListener('click', this.handleHamburgerClick);
    this.closeButton?.addEventListener('click', this.handleCloseClick);
    this.overlay?.addEventListener('click', this.handleOverlayClick);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  disconnectedCallback() {
    this.hamburgerButton?.removeEventListener('click', this.handleHamburgerClick);
    this.closeButton?.removeEventListener('click', this.handleCloseClick);
    this.overlay?.removeEventListener('click', this.handleOverlayClick);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleHamburgerClick() {
    this.openDrawer();
  }

  handleCloseClick() {
    this.closeDrawer();
  }

  handleOverlayClick() {
    this.closeDrawer();
  }

  handleKeyDown(event) {
    if (event.key === 'Escape' && this.isOpen()) {
      this.closeDrawer();
    }
  }

  isOpen() {
    return this.drawer?.classList.contains('is-open') ?? false;
  }

  openDrawer() {
    if (!this.drawer) return;
    this.drawer.classList.add('is-open');
    document.body.classList.add('overflow-hidden');
    this.closeButton?.focus();
  }

  closeDrawer() {
    if (!this.drawer) return;
    this.drawer.classList.remove('is-open');
    document.body.classList.remove('overflow-hidden');
    this.hamburgerButton?.focus();
  }
}

customElements.define('custom-header-component', CustomHeaderComponent);
