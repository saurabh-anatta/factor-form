/**
 * Subscription Quick-Add Drawer
 *
 * Opens a side drawer when clicking Add to Cart on product cards
 * that have selling plans (subscriptions). Shows variant picker,
 * subscription options, and add-to-cart.
 */
class SubscriptionDrawer extends HTMLElement {
  constructor() {
    super();
    this._onClick = this._onClick.bind(this);
    this._onKeydown = this._onKeydown.bind(this);
    this._productCache = new Map();
  }

  connectedCallback() {
    this.addEventListener('click', this._onClick);
    document.addEventListener('keydown', this._onKeydown);
    this._interceptAddToCart();
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._onKeydown);
  }

  // ─── Intercept add-to-cart clicks site-wide ───

  _interceptAddToCart() {
    document.addEventListener('click', (e) => {
      // PLP card add button
      const plpBtn = e.target.closest('.plp-card__add-btn');
      if (plpBtn) {
        const card = plpBtn.closest('.plp-card');
        const link = card?.querySelector('.plp-card__link');
        if (link) {
          const handle = this._handleFromUrl(link.href);
          if (handle) {
            e.preventDefault();
            e.stopPropagation();
            this.open(handle);
            return;
          }
        }
      }

      // Upsell add button
      const upsellBtn = e.target.closest('[data-upsell-add]');
      if (upsellBtn) {
        const titleLink = upsellBtn.closest('.pdp-upsells__card')?.querySelector('.pdp-upsells__card-title');
        if (titleLink) {
          const handle = this._handleFromUrl(titleLink.href);
          if (handle) {
            e.preventDefault();
            e.stopPropagation();
            this.open(handle);
            return;
          }
        }
      }

      // Generic trigger: data-subscription-drawer-handle
      const drawerBtn = e.target.closest('[data-subscription-drawer-handle]');
      if (drawerBtn) {
        e.preventDefault();
        this.open(drawerBtn.dataset.subscriptionDrawerHandle);
      }
    }, true); // capture phase — fires before other handlers
  }

  _handleFromUrl(url) {
    try {
      const path = new URL(url, window.location.origin).pathname;
      const match = path.match(/\/products\/([^/?#]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  // ─── Open / Close ───

  async open(handle) {
    this.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const body = this.querySelector('[data-drawer-body]');
    const title = this.querySelector('[data-drawer-title]');
    const addBtn = this.querySelector('[data-drawer-add]');
    const viewLink = this.querySelector('[data-drawer-view-link]');

    body.innerHTML = '<div class="sub-drawer__loading">Loading...</div>';
    addBtn.disabled = true;
    title.textContent = '';

    try {
      const [product, sellingPlanData] = await Promise.all([
        this._fetchProduct(handle),
        this._fetchSellingPlans(handle),
      ]);

      this._product = product;
      this._sellingPlans = sellingPlanData?.selling_plan_groups || [];
      this._allocations = sellingPlanData?.allocations || [];
      this._sellingPlanId = null;

      // Normalize variant prices from dollars (string) to cents (integer)
      this._variants = product.variants.map((v) => ({
        ...v,
        price_cents: Math.round(parseFloat(v.price) * 100),
        compare_at_price_cents: v.compare_at_price ? Math.round(parseFloat(v.compare_at_price) * 100) : 0,
        available: true, // product.json doesn't include availability — assume true
      }));

      // Map images to variants
      for (const v of this._variants) {
        if (v.image_id) {
          const img = product.images.find((i) => i.id === v.image_id);
          if (img) v.image_src = img.src;
        }
        if (!v.image_src && product.image) {
          v.image_src = product.image.src;
        }
      }

      this._currentVariant = this._variants[0];

      title.textContent = product.title;
      viewLink.href = `/products/${handle}`;

      this._renderBody();
    } catch (err) {
      console.error('Subscription drawer error:', err);
      body.innerHTML = '<div class="sub-drawer__loading">Failed to load product.</div>';
    }
  }

  close() {
    this.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // ─── Data fetching ───

  async _fetchProduct(handle) {
    if (this._productCache.has(handle)) return this._productCache.get(handle);
    const resp = await fetch(`/products/${handle}.json`);
    if (!resp.ok) throw new Error('Product fetch failed');
    const data = await resp.json();
    this._productCache.set(handle, data.product);
    return data.product;
  }

  async _fetchSellingPlans(handle) {
    try {
      const resp = await fetch(`/products/${handle}?section_id=subscription-drawer-data`);
      if (!resp.ok) return null;
      const html = await resp.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const script = doc.querySelector('[data-selling-plans-json]');
      if (script) {
        return JSON.parse(script.textContent);
      }
    } catch (err) {
      console.error('Selling plans fetch error:', err);
    }
    return null;
  }

  // ─── Render ───

  _renderBody() {
    const body = this.querySelector('[data-drawer-body]');
    const product = this._product;
    const variant = this._currentVariant;
    let html = '';

    // Tags
    const hiddenTags = ['new', 'bestseller', 'best-value', 'free-welcome-kit', 'sale'];
    if (product.tags) {
      const tagList = typeof product.tags === 'string' ? product.tags.split(', ') : product.tags;
      const displayTags = tagList.filter((t) => !hiddenTags.includes(t.toLowerCase().trim()));
      if (displayTags.length) {
        html += '<div class="sub-drawer__tags">';
        for (const tag of displayTags) {
          html += `<span class="sub-drawer__tag">${this._esc(tag.trim())}</span>`;
        }
        html += '</div>';
      }
    }

    // Description
    if (product.body_html) {
      const text = product.body_html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text) {
        const short = text.length > 150 ? text.substring(0, 150) + '...' : text;
        html += `<p class="sub-drawer__desc">${this._esc(short)}</p>`;
      }
    }

    // Variant picker
    if (this._variants.length > 1) {
      const optionName = product.options?.[0]?.name || 'Variant';
      html += '<div class="sub-drawer__variant-section">';
      html += `<div class="sub-drawer__variant-label">Select ${this._esc(optionName)}: <strong data-drawer-variant-value>${this._esc(variant.title)}</strong></div>`;
      html += '<div class="sub-drawer__variants">';
      for (const v of this._variants) {
        const selected = v.id === variant.id ? ' sub-drawer__variant-card--selected' : '';
        const imgHtml = v.image_src
          ? `<img class="sub-drawer__variant-img" src="${v.image_src}" alt="${this._esc(v.title)}" width="64" height="64" loading="lazy">`
          : '';
        const perDay = this._formatMoney(Math.round(v.price_cents / 30)) + '/day';
        html += `<button type="button" class="sub-drawer__variant-card${selected}" data-drawer-variant-id="${v.id}">
          ${imgHtml}
          <div class="sub-drawer__variant-info">
            <span class="sub-drawer__variant-name">${this._esc(v.title)}</span>
            <span class="sub-drawer__variant-meta">${perDay}</span>
          </div>
        </button>`;
      }
      html += '</div></div>';
    }

    // Subscription options
    if (this._sellingPlans.length > 0) {
      html += this._renderSubscriptionOptions(variant);

      // Set initial selling plan
      const firstPlan = this._sellingPlans[0].selling_plans[0];
      if (firstPlan) this._sellingPlanId = firstPlan.id;
    }

    body.innerHTML = html;
    this._updateAddButton();
  }

  _renderSubscriptionOptions(variant) {
    const firstGroup = this._sellingPlans[0];
    const firstPlan = firstGroup.selling_plans[0];
    const allocation = this._findAllocation(variant.id, firstPlan.id);
    const onetimePrice = this._formatMoney(variant.price_cents);

    let html = '<div class="sub-drawer__sub-options">';

    // Subscribe & Save
    html += '<div class="sub-drawer__sub-option sub-drawer__sub-option--selected" data-drawer-sub-type="subscribe">';
    html += '<div class="sub-drawer__sub-badge"><span class="sub-drawer__sub-badge-text">MOST POPULAR</span></div>';
    html += '<div class="sub-drawer__sub-content">';
    html += '<div class="sub-drawer__sub-left">';
    html += '<div class="sub-drawer__sub-radio-row"><span class="sub-drawer__sub-radio"></span><span class="sub-drawer__sub-heading">Subscribe & Save</span></div>';
    html += '<div class="sub-drawer__sub-details">';
    html += '<ul class="sub-drawer__sub-benefits"><li>Reschedule or cancel anytime</li><li>Free Shipping</li></ul>';
    html += '<div class="sub-drawer__sub-freq-label">Delivered every:</div>';
    html += '<div class="sub-drawer__sub-freqs">';
    for (const plan of firstGroup.selling_plans) {
      const name = plan.name.replace(/Deliver(ed)?\s+every\s*/i, '').replace(/,.*$/, '').trim();
      const selected = plan.id === firstPlan.id ? ' sub-drawer__sub-freq--selected' : '';
      html += `<button type="button" class="sub-drawer__sub-freq${selected}" data-drawer-freq-id="${plan.id}">${this._esc(name)}</button>`;
    }
    html += '</div></div></div>';

    // Price column
    html += '<div class="sub-drawer__sub-right">';
    if (allocation) {
      html += `<span class="sub-drawer__sub-price" data-drawer-sub-price>${this._formatMoney(allocation.price)}</span>`;
      if (variant.price_cents > allocation.price) {
        html += `<span class="sub-drawer__sub-compare">${onetimePrice}</span>`;
        html += `<span class="sub-drawer__sub-savings">SAVE ${this._formatMoney(variant.price_cents - allocation.price)}</span>`;
      }
    } else {
      html += `<span class="sub-drawer__sub-price" data-drawer-sub-price>${onetimePrice}</span>`;
    }
    html += '</div></div></div>';

    // One-time Purchase
    html += '<div class="sub-drawer__sub-option" data-drawer-sub-type="onetime">';
    html += '<div class="sub-drawer__sub-content" style="align-items:center">';
    html += '<div class="sub-drawer__sub-left"><div class="sub-drawer__sub-radio-row"><span class="sub-drawer__sub-radio"></span><span class="sub-drawer__sub-heading">One-time Purchase</span></div></div>';
    html += `<div class="sub-drawer__sub-right"><span class="sub-drawer__sub-price" data-drawer-onetime-price>${onetimePrice}</span></div>`;
    html += '</div></div>';

    html += '</div>';
    return html;
  }

  _findAllocation(variantId, planId) {
    return this._allocations.find(
      (a) => String(a.variant_id) === String(variantId) && String(a.selling_plan_id) === String(planId)
    );
  }

  _updateAddButton() {
    const btn = this.querySelector('[data-drawer-add]');
    if (!btn || !this._currentVariant) return;
    btn.disabled = false;
    btn.textContent = 'ADD TO CART';
  }

  // ─── Event handlers ───

  _onClick(e) {
    if (e.target.closest('[data-drawer-close]')) {
      this.close();
      return;
    }

    // Frequency pill (check before sub-option since it's nested)
    const freqBtn = e.target.closest('[data-drawer-freq-id]');
    if (freqBtn) {
      this._selectFrequency(freqBtn);
      return;
    }

    const variantCard = e.target.closest('[data-drawer-variant-id]');
    if (variantCard) {
      this._selectVariant(variantCard);
      return;
    }

    const subOption = e.target.closest('[data-drawer-sub-type]');
    if (subOption) {
      this._selectSubscriptionType(subOption);
      return;
    }

    const addBtn = e.target.closest('[data-drawer-add]');
    if (addBtn && !addBtn.disabled) {
      this._addToCart(addBtn);
      return;
    }
  }

  _onKeydown(e) {
    if (e.key === 'Escape' && this.getAttribute('aria-hidden') === 'false') {
      this.close();
    }
  }

  _selectVariant(card) {
    const variantId = parseInt(card.dataset.drawerVariantId, 10);
    const variant = this._variants.find((v) => v.id === variantId);
    if (!variant) return;

    this._currentVariant = variant;

    // Update selected state
    for (const c of this.querySelectorAll('[data-drawer-variant-id]')) {
      c.classList.remove('sub-drawer__variant-card--selected');
    }
    card.classList.add('sub-drawer__variant-card--selected');

    // Update label
    const label = this.querySelector('[data-drawer-variant-value]');
    if (label) label.textContent = variant.title;

    // Update subscription prices
    this._updatePricesForVariant(variant);
    this._updateAddButton();
  }

  _updatePricesForVariant(variant) {
    const onetimePrice = this._formatMoney(variant.price_cents);

    // Update one-time price
    const onetimeEl = this.querySelector('[data-drawer-onetime-price]');
    if (onetimeEl) onetimeEl.textContent = onetimePrice;

    // Update subscribe price
    const subPriceEl = this.querySelector('[data-drawer-sub-price]');
    if (!subPriceEl) return;

    const selectedFreq = this.querySelector('.sub-drawer__sub-freq--selected');
    const planId = selectedFreq ? parseInt(selectedFreq.dataset.drawerFreqId, 10) : this._sellingPlans?.[0]?.selling_plans?.[0]?.id;
    if (!planId) return;

    const allocation = this._findAllocation(variant.id, planId);
    if (allocation) {
      subPriceEl.textContent = this._formatMoney(allocation.price);

      const compare = subPriceEl.closest('.sub-drawer__sub-right')?.querySelector('.sub-drawer__sub-compare');
      const savings = subPriceEl.closest('.sub-drawer__sub-right')?.querySelector('.sub-drawer__sub-savings');

      if (compare) {
        if (variant.price_cents > allocation.price) {
          compare.textContent = onetimePrice;
          compare.style.display = '';
        } else {
          compare.style.display = 'none';
        }
      }
      if (savings) {
        const saved = variant.price_cents - allocation.price;
        if (saved > 0) {
          savings.textContent = 'SAVE ' + this._formatMoney(saved);
          savings.style.display = '';
        } else {
          savings.style.display = 'none';
        }
      }
    }
  }

  _selectSubscriptionType(option) {
    const type = option.dataset.drawerSubType;
    for (const opt of this.querySelectorAll('[data-drawer-sub-type]')) {
      opt.classList.remove('sub-drawer__sub-option--selected');
    }
    option.classList.add('sub-drawer__sub-option--selected');

    if (type === 'subscribe') {
      const selectedFreq = option.querySelector('.sub-drawer__sub-freq--selected');
      this._sellingPlanId = selectedFreq
        ? parseInt(selectedFreq.dataset.drawerFreqId, 10)
        : this._sellingPlans?.[0]?.selling_plans?.[0]?.id || null;
    } else {
      this._sellingPlanId = null;
    }
  }

  _selectFrequency(btn) {
    const freqs = btn.closest('.sub-drawer__sub-freqs');
    if (freqs) {
      for (const f of freqs.querySelectorAll('[data-drawer-freq-id]')) {
        f.classList.remove('sub-drawer__sub-freq--selected');
      }
    }
    btn.classList.add('sub-drawer__sub-freq--selected');
    this._sellingPlanId = parseInt(btn.dataset.drawerFreqId, 10);

    // Update prices for new frequency
    if (this._currentVariant) {
      this._updatePricesForVariant(this._currentVariant);
    }
  }

  async _addToCart(btn) {
    const variant = this._currentVariant;
    if (!variant) return;

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Adding...';

    // Collect section IDs from cart-items-component elements so Shopify
    // returns updated HTML for the cart drawer in the response
    const sectionIds = [];
    for (const el of document.querySelectorAll('cart-items-component')) {
      if (el.dataset.sectionId) sectionIds.push(el.dataset.sectionId);
    }

    const cartBody = { id: variant.id, quantity: 1 };
    if (this._sellingPlanId) {
      cartBody.selling_plan = this._sellingPlanId;
    }
    if (sectionIds.length) {
      cartBody.sections = sectionIds.join(',');
    }

    try {
      const resp = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartBody),
      });

      if (!resp.ok) throw new Error('Add to cart failed');

      const response = await resp.json();

      // Dispatch the theme's cart:update event so cart-items-component
      // morphs its HTML and the cart drawer auto-opens
      const cartUpdateEvent = new CustomEvent('cart:update', {
        bubbles: true,
        detail: {
          resource: response,
          sourceId: 'subscription-drawer',
          data: {
            source: 'subscription-drawer',
            itemCount: 1,
            sections: response.sections || {},
          },
        },
      });
      document.dispatchEvent(cartUpdateEvent);

      // Close subscription drawer
      this.close();
      btn.disabled = false;
      btn.textContent = originalText;

      // Open the cart drawer (it now has fresh HTML from the morph)
      const cartDrawer = document.querySelector('cart-drawer-component');
      if (cartDrawer) {
        cartDrawer.open();
      }
    } catch {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  // ─── Helpers ───

  /** Format cents to dollar string */
  _formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  _esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

customElements.define('subscription-drawer', SubscriptionDrawer);
