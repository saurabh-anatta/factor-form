/**
 * Custom PLP Section Web Component
 * Handles tab navigation (smooth scroll + scroll spy) and
 * horizontal row scroll arrows for category product rows.
 */
class CustomPlpSection extends HTMLElement {
  connectedCallback() {
    this.tabs = this.querySelectorAll('[data-plp-tab]');
    this.groups = this.querySelectorAll('[data-plp-group]');
    this.rowContainers = this.querySelectorAll('.plp__products--row');

    this.initTabs();
    this.initScrollSpy();
    this.initRowScrollControls();
  }

  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
    }

    for (const container of this.rowContainers) {
      container.removeEventListener('scroll', container._scrollHandler);
    }
  }

  initTabs() {
    for (const tab of this.tabs) {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = tab.getAttribute('data-plp-target');
        const targetEl = this.querySelector(`#${targetId}`);

        if (!targetEl) return;

        const tabBar = this.querySelector('.plp__tabs');
        const tabBarHeight = tabBar ? tabBar.offsetHeight : 0;
        const headerHeight = this.getHeaderHeight();
        const offset = headerHeight + tabBarHeight + 16;

        const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        this.setActiveTab(tab);
      });
    }
  }

  getHeaderHeight() {
    const header = document.querySelector('#header-component, header-component, .header');
    if (header) {
      return header.offsetHeight || 0;
    }
    return 0;
  }

  initScrollSpy() {
    if (this.groups.length === 0) return;

    const options = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const groupId = entry.target.id;
          const matchingTab = this.querySelector(`[data-plp-target="${groupId}"]`);

          if (matchingTab) {
            this.setActiveTab(matchingTab);
          }
        }
      }
    }, options);

    for (const group of this.groups) {
      this.observer.observe(group);
    }
  }

  setActiveTab(activeTab) {
    for (const tab of this.tabs) {
      tab.classList.remove('plp__tab--active');
      tab.setAttribute('aria-selected', 'false');
    }
    activeTab.classList.add('plp__tab--active');
    activeTab.setAttribute('aria-selected', 'true');

    activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  initRowScrollControls() {
    for (const container of this.rowContainers) {
      const wrapper = container.closest('.plp__row-wrapper');

      if (!wrapper) continue;

      const prevBtn = wrapper.querySelector('.plp__row-arrow--prev');
      const nextBtn = wrapper.querySelector('.plp__row-arrow--next');

      if (!prevBtn || !nextBtn) continue;

      const scrollAmount = 360;

      prevBtn.addEventListener('click', () => {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      });

      nextBtn.addEventListener('click', () => {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      });

      const updateArrows = () => {
        const { scrollLeft, scrollWidth, clientWidth } = container;
        prevBtn.style.display = scrollLeft <= 1 ? 'none' : 'flex';
        nextBtn.style.display = scrollLeft + clientWidth >= scrollWidth - 1 ? 'none' : 'flex';
      };

      container._scrollHandler = updateArrows;
      container.addEventListener('scroll', updateArrows, { passive: true });
      updateArrows();
    }
  }
}

customElements.define('custom-plp-section', CustomPlpSection);
