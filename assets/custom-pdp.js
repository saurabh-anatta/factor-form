/**
 * Custom PDP Section Web Component
 * Coordinates variant selection, subscription toggling, media gallery,
 * accordion, and AJAX add-to-cart across child blocks.
 */
class CustomPdpSection extends HTMLElement {
  constructor() {
    super();
    this._onThumbnailClick = this._onThumbnailClick.bind(this);
    this._onVariantSelect = this._onVariantSelect.bind(this);
    this._onSubscriptionSelect = this._onSubscriptionSelect.bind(this);
    this._onAccordionToggle = this._onAccordionToggle.bind(this);
    this._onAddToCart = this._onAddToCart.bind(this);
    this._onUpsellAdd = this._onUpsellAdd.bind(this);
    this._onFrequencySelect = this._onFrequencySelect.bind(this);
  }

  connectedCallback() {
    this.productData = this._getProductData();
    this.addEventListener('click', this._handleClick.bind(this));
    this.addEventListener('change', this._handleChange.bind(this));
  }

  disconnectedCallback() {}

  _getProductData() {
    const script = this.querySelector('[data-product-json]');
    if (script) {
      try {
        return JSON.parse(script.textContent);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  _handleClick(event) {
    const thumbnail = event.target.closest('[data-thumbnail-index]');
    if (thumbnail) {
      this._onThumbnailClick(thumbnail);
      return;
    }

    const variantCard = event.target.closest('[data-variant-id]');
    if (variantCard) {
      this._onVariantSelect(variantCard);
      return;
    }

    const subscriptionOption = event.target.closest('[data-subscription-type]');
    if (subscriptionOption) {
      this._onSubscriptionSelect(subscriptionOption);
      return;
    }

    const frequencyOption = event.target.closest('[data-frequency-id]');
    if (frequencyOption) {
      this._onFrequencySelect(frequencyOption);
      return;
    }

    const accordionHeader = event.target.closest('[data-accordion-header]');
    if (accordionHeader) {
      this._onAccordionToggle(accordionHeader);
      return;
    }

    const addToCartBtn = event.target.closest('[data-add-to-cart]');
    if (addToCartBtn) {
      this._onAddToCart(addToCartBtn, event);
      return;
    }

    const upsellBtn = event.target.closest('[data-upsell-add]');
    if (upsellBtn) {
      this._onUpsellAdd(upsellBtn, event);
      return;
    }
  }

  _handleChange(event) {
    const frequencySelect = event.target.closest('[data-frequency-select]');
    if (frequencySelect) {
      const sellingPlanId = frequencySelect.value;
      if (sellingPlanId) {
        this.dataset.sellingPlanId = sellingPlanId;
        this._updateSubscriptionPrices(sellingPlanId);
      }
    }
  }

  /** Media gallery thumbnail click */
  _onThumbnailClick(thumbnail) {
    const index = parseInt(thumbnail.dataset.thumbnailIndex, 10);
    const mainImage = this.querySelector('[data-main-image]');
    const allThumbnails = this.querySelectorAll('[data-thumbnail-index]');
    const mediaItems = this.querySelectorAll('[data-media-index]');

    // Update desktop grid active state
    for (const item of mediaItems) {
      item.classList.remove('custom-pdp__media-item--active');
      if (parseInt(item.dataset.mediaIndex, 10) === index) {
        item.classList.add('custom-pdp__media-item--active');
      }
    }

    // Update mobile main image
    if (mainImage) {
      const newSrc = thumbnail.dataset.thumbnailSrc;
      const newAlt = thumbnail.dataset.thumbnailAlt || '';
      if (newSrc) {
        mainImage.src = newSrc;
        mainImage.alt = newAlt;
      }
    }

    // Update active thumbnail border
    for (const thumb of allThumbnails) {
      thumb.classList.remove('custom-pdp__thumbnail--active');
    }
    thumbnail.classList.add('custom-pdp__thumbnail--active');
  }

  /** Variant card selection */
  _onVariantSelect(variantCard) {
    const variantId = variantCard.dataset.variantId;
    this.dataset.currentVariantId = variantId;

    // Update selected state visuals
    const allCards = this.querySelectorAll('[data-variant-id]');
    for (const card of allCards) {
      const optionGroup = card.closest('[data-option-group]');
      const currentGroup = variantCard.closest('[data-option-group]');
      if (optionGroup && currentGroup && optionGroup === currentGroup) {
        card.classList.remove('pdp-variant-picker__card--selected');
      }
    }
    variantCard.classList.add('pdp-variant-picker__card--selected');

    // Get selected options from all groups
    const selectedOptions = [];
    const optionGroups = this.querySelectorAll('[data-option-group]');
    for (const group of optionGroups) {
      const selected = group.querySelector('.pdp-variant-picker__card--selected');
      if (selected) {
        selectedOptions.push(selected.dataset.optionValue);
      }
    }

    // Find matching variant
    if (this.productData && this.productData.variants) {
      const matchedVariant = this.productData.variants.find((v) => {
        return selectedOptions.every((opt, idx) => v.options[idx] === opt);
      });

      if (matchedVariant) {
        this.dataset.currentVariantId = matchedVariant.id;
        this._updatePriceDisplay(matchedVariant);
        this._updateButtonState(matchedVariant);
        this._updateSellingPlanPrices(matchedVariant);

        this.dispatchEvent(
          new CustomEvent('variant:change', {
            detail: { variant: matchedVariant },
            bubbles: true,
          })
        );
      }
    }
  }

  /** Update price in hero card */
  _updatePriceDisplay(variant) {
    const salePrice = this.querySelector('[data-sale-price]');
    const comparePrice = this.querySelector('[data-compare-price]');

    if (salePrice) {
      salePrice.textContent = this._formatMoney(variant.price);
    }
    if (comparePrice) {
      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        comparePrice.textContent = this._formatMoney(variant.compare_at_price);
        comparePrice.style.display = '';
      } else {
        comparePrice.style.display = 'none';
      }
    }
  }

  /** Update add to cart button availability */
  _updateButtonState(variant) {
    const btn = this.querySelector('[data-add-to-cart]');
    const btnText = this.querySelector('[data-add-to-cart-text]');
    if (!btn) return;

    if (variant.available) {
      btn.disabled = false;
      if (btnText) btnText.textContent = btn.dataset.addText || 'ADD TO CART';
    } else {
      btn.disabled = true;
      if (btnText) btnText.textContent = btn.dataset.soldOutText || 'SOLD OUT';
    }
  }

  /** Subscription option selection */
  _onSubscriptionSelect(option) {
    const type = option.dataset.subscriptionType;
    const allOptions = this.querySelectorAll('[data-subscription-type]');

    for (const opt of allOptions) {
      opt.classList.remove('pdp-subscription__option--selected');
    }
    option.classList.add('pdp-subscription__option--selected');

    if (type === 'subscribe') {
      const firstPlan = option.querySelector('[data-selling-plan-id]');
      if (firstPlan) {
        this.dataset.sellingPlanId = firstPlan.dataset.sellingPlanId;
      }
    } else {
      delete this.dataset.sellingPlanId;
    }

    this._updateSubscriptionPriceDisplay(type);
  }

  /** Frequency pill selection */
  _onFrequencySelect(frequencyOption) {
    const sellingPlanId = frequencyOption.dataset.frequencyId;
    this.dataset.sellingPlanId = sellingPlanId;

    const allFreqs = frequencyOption.closest('.pdp-subscription__frequencies');
    if (allFreqs) {
      const pills = allFreqs.querySelectorAll('[data-frequency-id]');
      for (const pill of pills) {
        pill.classList.remove('pdp-subscription__freq--selected');
      }
    }
    frequencyOption.classList.add('pdp-subscription__freq--selected');
  }

  /** Update displayed prices based on subscription type */
  _updateSubscriptionPriceDisplay(type) {
    const subscribePrice = this.querySelector('[data-subscribe-price]');
    const onetimePrice = this.querySelector('[data-onetime-price]');
    const salePrice = this.querySelector('[data-sale-price]');

    if (type === 'subscribe' && subscribePrice && salePrice) {
      salePrice.textContent = subscribePrice.textContent;
    } else if (type === 'onetime' && onetimePrice && salePrice) {
      salePrice.textContent = onetimePrice.textContent;
    }
  }

  /** Update selling plan prices when variant changes */
  _updateSellingPlanPrices(variant) {
    // Prices for subscription are computed server-side, no client update needed in static render
  }

  _updateSubscriptionPrices(sellingPlanId) {
    // Could be expanded for dynamic selling plan price updates
  }

  /** Accordion toggle */
  _onAccordionToggle(header) {
    const row = header.closest('[data-accordion-row]');
    if (!row) return;

    const content = row.querySelector('[data-accordion-content]');
    const icon = header.querySelector('[data-accordion-icon]');

    if (!content) return;

    const isOpen = row.classList.contains('pdp-accordion__row--open');

    if (isOpen) {
      row.classList.remove('pdp-accordion__row--open');
      content.style.display = 'none';
      if (icon) icon.classList.remove('pdp-accordion__icon--open');
    } else {
      row.classList.add('pdp-accordion__row--open');
      content.style.display = 'block';
      if (icon) icon.classList.add('pdp-accordion__icon--open');
    }
  }

  /** AJAX add to cart */
  async _onAddToCart(btn, event) {
    event.preventDefault();
    if (btn.disabled) return;

    const variantId = this.dataset.currentVariantId;
    if (!variantId) return;

    const btnText = btn.querySelector('[data-add-to-cart-text]');
    const originalText = btnText ? btnText.textContent : '';

    btn.disabled = true;
    btn.classList.add('pdp-buy-cta__btn--loading');
    if (btnText) btnText.textContent = 'Adding...';

    const body = {
      id: parseInt(variantId, 10),
      quantity: 1,
    };

    const sellingPlanId = this.dataset.sellingPlanId;
    if (sellingPlanId) {
      body.selling_plan = parseInt(sellingPlanId, 10);
    }

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Add to cart failed');

      if (btnText) btnText.textContent = btn.dataset.addedText || 'Added!';

      // Update cart bubble count
      const cartResponse = await fetch('/cart.js');
      const cartData = await cartResponse.json();
      const cartBubbles = document.querySelectorAll('[data-cart-count]');
      for (const bubble of cartBubbles) {
        bubble.textContent = cartData.item_count;
      }

      this.dispatchEvent(
        new CustomEvent('cart:add', {
          detail: { variantId, sellingPlanId },
          bubbles: true,
        })
      );

      setTimeout(() => {
        btn.disabled = false;
        btn.classList.remove('pdp-buy-cta__btn--loading');
        if (btnText) btnText.textContent = originalText;
      }, 2000);
    } catch (error) {
      btn.disabled = false;
      btn.classList.remove('pdp-buy-cta__btn--loading');
      if (btnText) btnText.textContent = originalText;
    }
  }

  /** Upsell quick add */
  async _onUpsellAdd(btn, event) {
    event.preventDefault();
    if (btn.disabled) return;

    const variantId = btn.dataset.upsellAdd;
    if (!variantId) return;

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '...';

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(variantId, 10), quantity: 1 }),
      });

      if (!response.ok) throw new Error('Add to cart failed');

      btn.textContent = 'ADDED';

      const cartResponse = await fetch('/cart.js');
      const cartData = await cartResponse.json();
      const cartBubbles = document.querySelectorAll('[data-cart-count]');
      for (const bubble of cartBubbles) {
        bubble.textContent = cartData.item_count;
      }

      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = originalText;
      }, 2000);
    } catch (error) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  /** Format cents to money string */
  _formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2);
  }
}

customElements.define('custom-pdp-section', CustomPdpSection);
