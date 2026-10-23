/* ==========================================================================
   Ascent Protein — Recharge customer portal
   Theme-hosted portal built on the Recharge Storefront JS SDK (window.recharge).
   Rendered by sections/ap-portal.liquid. No build step.

   Data flows through an adapter with one interface, so the UI renders the
   same way from:
     • RechargeAdapter — live data (customer logged in + storefront token set)
     • DemoAdapter     — Figma sample data (theme editor, no token, ?ap_demo=1)
   ========================================================================== */
(() => {
  if (customElements.get('ap-portal')) return;

  /* ------------------------------------------------------------------ utils */
  const I = (name, cls = '') => {
    const svg = (window.APIcons && window.APIcons[name]) || '';
    return cls ? svg.replace('class="ap-i', `class="${cls} ap-i`) : svg;
  };
  const esc = (v) =>
    String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const num = (v) => (v == null || v === '' ? 0 : Number(v));
  const isoDay = (v) => (v ? String(v).slice(0, 10) : null);
  const toDate = (iso) => {
    if (!iso) return null;
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const fromDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const addDays = (iso, n) => {
    const d = toDate(iso);
    d.setDate(d.getDate() + n);
    return fromDate(d);
  };
  const today = () => fromDate(new Date());
  const fmtLong = (iso) =>
    iso ? toDate(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : '';
  const fmtShort = (iso) => (iso ? toDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '');
  const unitWord = (unit, n) => {
    const u = String(unit || 'day').toLowerCase().replace(/s$/, '');
    return n === 1 ? u : `${u}s`;
  };
  const everyText = (freq, unit) => (freq ? `Every ${freq} ${unitWord(unit, Number(freq))}` : '');
  const addrLine = (a) => {
    if (!a) return '';
    const who = [a.first_name, a.last_name].filter(Boolean).join(' ');
    const head = a.company ? `${a.company}${who ? `, Attn: ${who}` : ''}` : who;
    const street = [a.address1, a.address2].filter(Boolean).join(' ');
    const cityLine = [a.city, [a.province, a.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    return [head, [street, cityLine].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
  };
  const addrFull = (a) =>
    a
      ? [a.company, [a.address1, a.address2].filter(Boolean).join(' '), a.city, [a.province, a.zip].filter(Boolean).join(' '), a.country || a.country_code]
          .filter(Boolean)
          .join(', ')
      : '';
  const cardLabel = (p) => {
    if (!p) return '';
    if (p.email) return `PayPal (${p.email})`;
    const brand = p.brand ? p.brand.charAt(0).toUpperCase() + p.brand.slice(1).replace(/_/g, ' ') : 'Card';
    return `${brand} •••• ${p.last4 || '••••'}`;
  };
  const errMsg = (e) => {
    const m = e?.message || e?.errors || e;
    if (typeof m === 'string') return m.replace(/^Error:\s*/, '');
    try {
      return JSON.stringify(m);
    } catch (_) {
      return 'Something went wrong. Please try again.';
    }
  };

  /* --------------------------------------------------------- demo adapter */
  class DemoAdapter {
    constructor(cfg) {
      this.cfg = cfg;
      const a = cfg.assets || {};
      const t = today();
      const d1 = addDays(t, 12);
      this.state = {
        customer: { firstName: cfg.customerFirstName || 'Kyle', email: 'kyle@example.com' },
        addresses: [
          { id: 1, first_name: 'Kyle', last_name: 'Wilbourn', company: 'Ascent Protein', address1: '1830 W 38th Ave', address2: '', city: 'Denver', province: 'CO', zip: '80211', country_code: 'US', country: 'United States', phone: '', discounts: [], payment_method_id: 1 },
          { id: 2, first_name: 'Kyle', last_name: 'Wilbourn', company: '', address1: '2400 Larimer St', address2: 'Apt 5', city: 'Denver', province: 'CO', zip: '80205', country_code: 'US', country: 'United States', phone: '', discounts: [], payment_method_id: 1 },
        ],
        payments: [{ id: 1, brand: 'visa', last4: '4242', exp: '08/28', default: true, billing: { address1: '1830 W 38th Ave', city: 'Denver', province: 'CO', zip: '80211' } }],
        subscriptions: [
          { id: 101, title: 'Chocolate Protein Powder', variant: 'Chocolate / 1lb Bag - 14 Servings / EA', qty: 1, price: 22.48, original: 24.98, freq: 30, unit: 'day', next: d1, addressId: 1, status: 'active', image: a.whey, productId: '1', variantId: '11', isSkippable: true },
          { id: 102, title: 'Whey + Creatine Stack', variant: 'Chocolate Whey 1lb + Clean Creatine 45 · free shaker', qty: 1, price: 55.99, original: 69.99, freq: 30, unit: 'day', next: addDays(d1, 14), addressId: 1, status: 'active', image: a.creatine, productId: '2', variantId: '22', isSkippable: true },
          { id: 103, title: 'Clean Hydration + Energy', variant: 'Citrus / 20 Stick Box / EA', qty: 1, price: 26.99, original: 29.99, freq: 45, unit: 'day', next: addDays(d1, 59), addressId: 1, status: 'active', image: a.hydration, productId: '3', variantId: '33', isSkippable: true },
          { id: 104, title: 'Chocolate Micellar Casein', variant: 'Chocolate / 2lb Bag - 27 Servings / EA', qty: 1, price: 40.49, original: 44.99, freq: 60, unit: 'day', next: addDays(d1, 27), addressId: 1, status: 'active', image: a.casein, productId: '4', variantId: '44', isSkippable: true },
          { id: 105, title: 'Vanilla Protein Powder', variant: 'Vanilla / 1lb Bag - 14 Servings / EA', qty: 1, price: 22.48, original: 24.98, freq: 30, unit: 'day', next: null, addressId: 1, status: 'cancelled', image: a.whey, productId: '5', variantId: '55', isSkippable: false },
        ],
        onetimes: [],
        skipped: {},
        discounts: {},
        orders: [
          { id: 9001, number: '#1043', date: addDays(t, -2), status: 'queued', addressId: 1, items: [{ title: 'Clean Creatine - 45 Servings', variant: 'Unflavored / 45 Serving Tub / EA', qty: 1, price: 26.99, image: a.creatine }, { title: 'Chocolate Protein Powder', variant: 'Chocolate / 1lb Bag', qty: 1, price: 22.48, image: a.whey }], subtotal: 49.47, tax: 3.99, shipping: 0, discount: 0, total: 53.46 },
          { id: 9000, number: '#1021', date: addDays(t, -18), status: 'success', addressId: 1, items: [{ title: 'Clean Creatine - 45 Servings', variant: 'Unflavored / 45 Serving Tub / EA', qty: 1, price: 26.99, image: a.creatine }, { title: 'Chocolate Protein Powder', variant: 'Chocolate / 1lb Bag', qty: 1, price: 22.48, image: a.whey }], subtotal: 49.47, tax: 3.99, shipping: 0, discount: 0, total: 53.46 },
        ],
      };
    }
    async init() {
      return true;
    }
    wait(ms = 450) {
      return new Promise((r) => setTimeout(r, ms));
    }
    async load() {
      await this.wait(250);
      const s = this.state;
      const subs = s.subscriptions.map((x) => ({ ...x }));
      // Build charges from subscription schedule (grouped by date+address)
      const groups = new Map();
      subs
        .filter((x) => x.status === 'active' && x.next)
        .forEach((x) => {
          const key = `${x.next}|${x.addressId}`;
          if (!groups.has(key)) groups.set(key, { date: x.next, addressId: x.addressId, subs: [] });
          groups.get(key).subs.push(x);
        });
      s.onetimes.forEach((o) => {
        const key = `${o.date}|${o.addressId}`;
        if (!groups.has(key)) groups.set(key, { date: o.date, addressId: o.addressId, subs: [] });
        (groups.get(key).onetimes ||= []).push(o);
      });
      const charges = [...groups.values()]
        .sort((x, y) => x.date.localeCompare(y.date))
        .map((g, i) => {
          const id = 5000 + Number(g.date.replace(/-/g, '').slice(-4)) + g.addressId;
          const items = [
            ...g.subs.map((x) => ({ id: x.id, subId: x.id, type: 'subscription', title: x.title, variant: x.variant, qty: x.qty, price: x.price, original: x.original, image: x.image })),
            ...(g.onetimes || []).map((o) => ({ id: o.id, type: 'onetime', title: o.title, variant: o.variant, qty: o.qty, price: o.price, original: o.original || o.price, image: o.image })),
          ];
          const subtotal = items.reduce((t, it) => t + it.price * it.qty, 0);
          const code = s.discounts[g.addressId];
          const discount = code ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
          const address = s.addresses.find((x) => x.id === g.addressId);
          return {
            id,
            date: g.date,
            status: s.skipped[id] ? 'skipped' : 'queued',
            addressId: g.addressId,
            address,
            payment: s.payments[0],
            items,
            subtotal,
            discount,
            discountCodes: code ? [code] : [],
            tax: 0,
            shipping: null,
            total: subtotal - discount,
            currency: 'USD',
          };
        });
      return {
        customer: s.customer,
        charges,
        subscriptions: subs,
        orders: s.orders.map((o) => ({ ...o, address: s.addresses.find((a) => a.id === o.addressId) })),
        addresses: s.addresses.map((x) => ({ ...x })),
        payments: s.payments,
      };
    }
    _subsOf(chargeId, data) {
      const c = data.charges.find((x) => x.id === chargeId);
      return c ? c.items.filter((i) => i.type === 'subscription').map((i) => i.subId) : [];
    }
    async skip(charge) {
      await this.wait();
      this.state.skipped[charge.id] = true;
    }
    async unskip(charge) {
      await this.wait();
      delete this.state.skipped[charge.id];
    }
    async sendNow(charge) {
      await this.wait();
      charge.items.forEach((it) => {
        const s = this.state.subscriptions.find((x) => x.id === it.subId);
        if (s) s.next = addDays(s.next, s.unit === 'week' ? s.freq * 7 : s.unit === 'month' ? s.freq * 30 : s.freq);
      });
      this.state.onetimes = this.state.onetimes.filter((o) => o.date !== charge.date);
      this.state.orders.unshift({ id: Date.now(), number: '#' + (1044 + this.state.orders.length), date: today(), status: 'queued', addressId: charge.addressId, items: charge.items, subtotal: charge.subtotal, tax: 0, shipping: 0, discount: charge.discount, total: charge.total });
    }
    async reschedule(charge, date) {
      await this.wait();
      charge.items.forEach((it) => {
        const s = this.state.subscriptions.find((x) => x.id === it.subId);
        if (s) s.next = date;
      });
      this.state.onetimes.filter((o) => o.date === charge.date).forEach((o) => (o.date = date));
      if (this.state.skipped[charge.id]) delete this.state.skipped[charge.id];
    }
    async applyDiscount(charge, code) {
      await this.wait();
      if (!/^[a-z0-9_-]{3,}$/i.test(code)) throw new Error('That discount code is not valid.');
      this.state.discounts[charge.addressId] = code.toUpperCase();
    }
    async removeDiscount(charge) {
      await this.wait();
      delete this.state.discounts[charge.addressId];
    }
    async addOnetime(charge, product) {
      await this.wait();
      this.state.onetimes.push({ id: Date.now(), addressId: charge.addressId, date: charge.date, title: product.title, variant: product.variantTitle || '', qty: 1, price: product.price, original: product.compare || product.price, image: product.image });
    }
    async removeOnetime(id) {
      await this.wait();
      this.state.onetimes = this.state.onetimes.filter((o) => o.id !== id);
    }
    async updateSubscription(id, patch) {
      await this.wait();
      const s = this.state.subscriptions.find((x) => x.id === id);
      if (patch.qty) s.qty = patch.qty;
      if (patch.freq) Object.assign(s, { freq: patch.freq, unit: patch.unit });
      if (patch.next) s.next = patch.next;
    }
    async plansFor() {
      return [];
    }
    async skipSubscription(sub) {
      await this.wait();
      const s = this.state.subscriptions.find((x) => x.id === sub.id);
      s.next = addDays(s.next, s.unit === 'week' ? s.freq * 7 : s.unit === 'month' ? s.freq * 30 : s.freq);
    }
    async activate(sub) {
      await this.wait();
      const s = this.state.subscriptions.find((x) => x.id === sub.id);
      Object.assign(s, { status: 'active', next: addDays(today(), 7) });
    }
    async cancelUrl() {
      return null;
    }
    async saveAddress(id, data) {
      await this.wait();
      if (id) Object.assign(this.state.addresses.find((x) => x.id === id), data);
      else this.state.addresses.push({ id: Date.now(), discounts: [], ...data });
    }
    async portalUrl() {
      return null;
    }
  }

  /* ----------------------------------------------------- recharge adapter */
  class RechargeAdapter {
    constructor(cfg) {
      this.cfg = cfg;
      this.session = null;
      this.images = {};
    }
    get rc() {
      return window.recharge;
    }
    async init() {
      if (!this.rc) throw new Error('Recharge SDK failed to load.');
      this.rc.init({
        storeIdentifier: this.cfg.storeIdentifier,
        storefrontAccessToken: this.cfg.token,
        appName: 'ascent-portal',
        appVersion: '1.0.0',
        loginRetryFn: () => this.rc.auth.loginShopifyAppProxy(),
      });
      this.session = await this.rc.auth.loginShopifyAppProxy();
      return Boolean(this.session && this.session.customerId);
    }
    async all(fn, key, params) {
      // Follow cursors (bounded) so long histories still load.
      let out = [];
      let res = await fn(this.session, params);
      out = out.concat(res[key] || []);
      let guard = 0;
      while (res.next_cursor && guard++ < 4) {
        res = await fn(this.session, { cursor: res.next_cursor, limit: params.limit });
        out = out.concat(res[key] || []);
      }
      return out;
    }
    img(li) {
      const im = li.images || {};
      return im.medium || im.large || im.original || im.small || null;
    }
    normPayment(p) {
      if (!p) return null;
      const d = p.payment_details || {};
      return {
        id: p.id,
        brand: d.brand || (p.payment_type || '').toLowerCase(),
        last4: d.last4,
        email: d.paypal_email,
        exp: d.exp_month ? `${String(d.exp_month).padStart(2, '0')}/${String(d.exp_year).slice(-2)}` : '',
        default: Boolean(p.default),
        billing: p.billing_address,
        status: p.status,
      };
    }
    normItems(lines) {
      return (lines || []).map((li) => {
        const image = this.img(li) || this.images[li.external_variant_id?.ecommerce] || null;
        if (image && li.external_variant_id?.ecommerce) this.images[li.external_variant_id.ecommerce] = image;
        if (image && li.purchase_item_id) this.images['p' + li.purchase_item_id] = image;
        return {
          id: li.purchase_item_id,
          subId: li.purchase_item_type === 'subscription' ? li.purchase_item_id : null,
          type: li.purchase_item_type === 'onetime' ? 'onetime' : 'subscription',
          title: li.title,
          variant: li.variant_title,
          qty: li.quantity,
          price: num(li.unit_price),
          original: num(li.original_price),
          image,
          productId: li.external_product_id?.ecommerce,
          variantId: li.external_variant_id?.ecommerce,
        };
      });
    }
    async load() {
      const s = this.session;
      const rc = this.rc;
      const [customer, charges, subs, orders, addresses, pms] = await Promise.all([
        rc.customer.getCustomer(s),
        this.all(rc.charge.listCharges, 'charges', { status: ['queued', 'skipped', 'error', 'pending'], sort_by: 'scheduled_at-asc', limit: 50 }),
        this.all(rc.subscription.listSubscriptions, 'subscriptions', { limit: 100 }),
        rc.order.listOrders(s, { sort_by: 'processed_at-desc', limit: 25 }).then((r) => r.orders || []),
        this.all(rc.address.listAddresses, 'addresses', { limit: 50 }),
        rc.paymentMethod.listPaymentMethods(s, { limit: 25 }).then((r) => r.payment_methods || []),
      ]);
      const payments = pms.map((p) => this.normPayment(p));
      const payById = Object.fromEntries(payments.map((p) => [p.id, p]));
      const addrById = Object.fromEntries(addresses.map((a) => [a.id, a]));
      const shipTotal = (lines) => (lines && lines.length ? lines.reduce((t, l) => t + num(l.price), 0) : null);

      const nCharges = charges.map((c) => {
        const addr = addrById[c.address_id];
        return {
          id: c.id,
          date: isoDay(c.scheduled_at),
          status: c.status === 'skipped' ? 'skipped' : c.status === 'error' ? 'error' : 'queued',
          error: c.error,
          addressId: c.address_id,
          address: c.shipping_address || addr,
          payment: payById[addr?.payment_method_id] || payments.find((p) => p.default) || payments[0] || null,
          items: this.normItems(c.line_items),
          subtotal: num(c.subtotal_price || c.total_line_items_price),
          discount: num(c.total_discounts),
          discountCodes: (c.discounts || []).map((d) => d.code).filter(Boolean),
          tax: num(c.total_tax),
          shipping: shipTotal(c.shipping_lines),
          total: num(c.total_price),
          currency: c.currency,
        };
      });
      const nOrders = orders.map((o) => ({
        id: o.id,
        number: o.external_order_number?.ecommerce ? `#${o.external_order_number.ecommerce}` : '',
        date: isoDay(o.processed_at || o.scheduled_at || o.created_at),
        status: o.status,
        addressId: o.address_id,
        address: o.shipping_address,
        items: this.normItems(o.line_items),
        subtotal: num(o.subtotal_price),
        tax: num(o.total_tax),
        shipping: shipTotal(o.shipping_lines) || 0,
        discount: num(o.total_discounts),
        total: num(o.total_price),
        currency: o.currency,
      }));
      const nSubs = subs
        .filter((x) => x.status !== 'onetime')
        .map((x) => ({
          id: x.id,
          title: x.product_title,
          variant: x.variant_title,
          qty: x.quantity,
          price: num(x.price),
          original: null,
          freq: x.order_interval_frequency,
          unit: x.order_interval_unit,
          next: isoDay(x.next_charge_scheduled_at),
          addressId: x.address_id,
          status: x.status === 'active' ? 'active' : 'cancelled',
          image: this.images['p' + x.id] || this.images[x.external_variant_id?.ecommerce] || null,
          productId: x.external_product_id?.ecommerce,
          variantId: x.external_variant_id?.ecommerce,
          isSkippable: x.is_skippable,
          isSwappable: x.is_swappable,
        }));
      return {
        customer: { firstName: customer.first_name, email: customer.email, hash: customer.hash },
        charges: nCharges,
        subscriptions: nSubs,
        orders: nOrders,
        addresses,
        payments,
      };
    }
    purchaseIds(charge) {
      return charge.items.map((i) => i.id);
    }
    skip(charge) {
      return this.rc.charge.skipCharge(this.session, charge.id, this.purchaseIds(charge));
    }
    unskip(charge) {
      return this.rc.charge.unskipCharge(this.session, charge.id, this.purchaseIds(charge));
    }
    sendNow(charge) {
      return this.rc.charge.processCharge(this.session, charge.id);
    }
    reschedule(charge, date) {
      return this.rc.charge.rescheduleCharge(this.session, charge.id, date);
    }
    applyDiscount(charge, code) {
      return this.rc.address.applyDiscountToAddress(this.session, charge.addressId, code);
    }
    removeDiscount(charge) {
      return this.rc.address.removeDiscountsFromAddress(this.session, charge.addressId);
    }
    addOnetime(charge, product) {
      return this.rc.onetime.createOnetime(this.session, {
        address_id: charge.addressId,
        external_variant_id: { ecommerce: String(product.variantId) },
        external_product_id: { ecommerce: String(product.productId) },
        quantity: 1,
        next_charge_scheduled_at: charge.date,
        add_to_next_charge: true,
      });
    }
    removeOnetime(id) {
      return this.rc.onetime.deleteOnetime(this.session, id);
    }
    async plansFor(sub) {
      if (!sub.productId) return [];
      try {
        const res = await this.rc.plan.listPlans(this.session, { external_product_id: sub.productId, limit: 25 });
        return (res.plans || [])
          .filter((p) => p.type === 'subscription' && p.subscription_preferences?.order_interval_frequency)
          .map((p) => ({ id: p.id, freq: p.subscription_preferences.order_interval_frequency, unit: p.subscription_preferences.interval_unit, title: p.title }));
      } catch (_) {
        return [];
      }
    }
    async updateSubscription(id, patch) {
      const body = {};
      if (patch.qty) body.quantity = patch.qty;
      if (patch.planId) body.plan_id = patch.planId;
      else if (patch.freq) Object.assign(body, { order_interval_frequency: patch.freq, charge_interval_frequency: patch.freq, order_interval_unit: patch.unit });
      if (Object.keys(body).length) await this.rc.subscription.updateSubscription(this.session, id, body);
      if (patch.next) await this.rc.subscription.updateSubscriptionChargeDate(this.session, id, patch.next);
    }
    skipSubscription(sub) {
      return this.rc.subscription.skipSubscriptionCharge(this.session, sub.id, sub.next);
    }
    activate(sub) {
      return this.rc.subscription.activateSubscription(this.session, sub.id);
    }
    cancelUrl(sub) {
      return this.rc.customer.getActiveChurnLandingPageURL(this.session, sub.id, window.location.href);
    }
    saveAddress(id, data) {
      return id ? this.rc.address.updateAddress(this.session, id, data) : this.rc.address.createAddress(this.session, data);
    }
    async portalUrl() {
      const r = await this.rc.customer.getCustomerPortalAccess(this.session);
      return r.portal_url;
    }
  }

  /* ---------------------------------------------------------------- portal */
  class APPortal extends HTMLElement {
    async connectedCallback() {
      this.root = this.querySelector('[data-ap-root]');
      try {
        this.cfg = JSON.parse(this.querySelector('[data-ap-config]').textContent);
      } catch (e) {
        this.root.innerHTML = '<p>Portal configuration error.</p>';
        return;
      }
      const params = new URLSearchParams(location.search);
      this.demo = Boolean(this.cfg.designMode || this.cfg.forceDemo || !this.cfg.token || params.has('ap_demo'));
      this.filter = 'active';
      this.openHistory = new Set();
      this.onClick = this.onClick.bind(this);
      this.addEventListener('click', this.onClick);
      this.addEventListener('submit', (e) => this.onSubmit(e));
      window.addEventListener('hashchange', () => {
        this.render();
        this.scrollTop();
      });

      if (!this.demo && !this.cfg.loggedIn) return this.renderGate();

      this.api = this.demo ? new DemoAdapter(this.cfg) : new RechargeAdapter(this.cfg);
      this.renderSkeleton();
      try {
        const ok = await this.api.init();
        if (!ok) return this.renderNoSubs();
        await this.reload();
      } catch (e) {
        console.error('[ap-portal]', e);
        this.renderError(e);
      }
    }

    async reload() {
      this.data = await this.api.load();
      this.render();
    }

    scrollTop() {
      const top = this.getBoundingClientRect().top + window.scrollY - 24;
      if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
    }

    /* ----- routing ----- */
    route() {
      const h = (location.hash || '').replace(/^#\/?/, '');
      const [view, id] = h.split('/');
      const known = ['dashboard', 'subscriptions', 'subscription', 'upcoming', 'order', 'history', 'addresses'];
      return { view: known.includes(view) ? view : 'dashboard', id: id ? Number(id) || id : null };
    }

    /* ----- data helpers ----- */
    nextCharge() {
      const list = (this.data?.charges || []).filter((c) => c.status !== 'processing');
      return list[0] || null;
    }
    chargeAfter(c) {
      const list = this.data.charges.filter((x) => x.status === 'queued' && x.date > c.date);
      return list[0] || null;
    }
    money(v, currency) {
      try {
        return new Intl.NumberFormat(this.cfg.locale || 'en-US', { style: 'currency', currency: currency || this.cfg.currency || 'USD' }).format(num(v));
      } catch (_) {
        return `$${num(v).toFixed(2)}`;
      }
    }
    priceHtml(it, prefix = '') {
      const strike = it.original && it.original > it.price ? `<s>${this.money(it.original)}</s>` : '';
      return `${prefix}${strike}${this.money(it.price)}`;
    }
    image(src, alt, w = 96) {
      return src
        ? `<img src="${esc(src)}" alt="${esc(alt || '')}" width="${w}" height="${w}" loading="lazy">`
        : `<span class="ap-thumb__ph" aria-hidden="true">${esc((alt || '?').charAt(0))}</span>`;
    }
    itemsSummary(c) {
      if (!c || !c.items.length) return '';
      const f = c.items[0];
      return `${f.qty} x ${f.title}${f.variant ? ` ${f.variant}` : ''}${c.items.length > 1 ? ` + ${c.items.length - 1} more` : ''}`;
    }
    subById(id) {
      return this.data.subscriptions.find((s) => s.id === id);
    }

    /* ----- shell ----- */
    render() {
      if (!this.data) return;
      const r = this.route();
      const wide = r.view === 'dashboard' || r.view === 'upcoming';
      const views = {
        dashboard: () => this.vDashboard(),
        subscriptions: () => this.vSubscriptions(),
        subscription: () => this.vSubscription(r.id),
        upcoming: () => this.vUpcoming(),
        order: () => this.vOrder(r.id),
        history: () => this.vHistory(),
        addresses: () => this.vAccount(),
      };
      const main = views[r.view]();
      const body = wide
        ? `<div class="ap-grid"><div class="ap-main">${main}</div><aside class="ap-side">${this.vKnowledge()}</aside></div>`
        : `<div class="ap-main">${main}</div>`;
      this.root.innerHTML = `${this.demoBar()}<div class="ap-shell${wide ? '' : ' ap-shell--narrow'}">${this.vTop(r.view)}${body}</div>`;
      this.bindCarousel();
    }

    demoBar() {
      if (!this.demo || this.cfg.hideDemoBar) return '';
      return `<div class="ap-demo-bar"><strong>Preview mode:</strong> you are seeing sample data from the design. ${
        this.cfg.token ? '' : 'Add the Recharge Storefront API token in the theme editor (Subscriptions portal section) to load live subscriptions.'
      } Actions here are simulated.</div>`;
    }

    vTop(view) {
      const tabs = [
        ['dashboard', 'Dashboard'],
        ['subscriptions', 'Subscriptions'],
        ['upcoming', 'Upcoming orders'],
        ['history', 'Order history'],
        ['addresses', 'Addresses & payment'],
      ];
      const active = { subscription: 'subscriptions', order: 'upcoming' }[view] || view;
      const name = this.cfg.customerFirstName || this.data.customer?.firstName;
      const title = (this.cfg.welcome || 'Welcome back, [name]!').replace('[name]', name || 'there').replace(', there!', '!');
      return `<div class="ap-top">
        <h1 class="ap-welcome">${esc(title)}</h1>
        <nav class="ap-tabs" aria-label="Account sections">
          ${tabs.map(([k, l]) => `<a class="ap-tab" href="#/${k}"${k === active ? ' aria-current="page"' : ''}>${l}</a>`).join('')}
          <a class="ap-tab" href="${esc(this.cfg.accountUrl || '/account')}">My account →</a>
        </nav>
      </div>`;
    }

    /* ----- dashboard ----- */
    vDashboard() {
      const c = this.nextCharge();
      if (!c) return this.vNoUpcoming();
      return `${this.vNextCard(c)}${this.vOrderSummary(c, true)}${this.vUpsell(c)}${this.vEduVideo()}`;
    }

    alertFor(c) {
      if (this.flash) {
        const f = this.flash;
        this.flash = null;
        return `<div class="ap-alert${f.type === 'error' ? ' ap-alert--error' : ''} ap-alert--strong" role="status">${f.type === 'error' ? I('warning') : I('check')}<p>${f.html}</p></div>`;
      }
      if (c.status === 'skipped') {
        const n = this.chargeAfter(c);
        return `<div class="ap-alert ap-alert--strong">${I('check')}<p>Your ${esc(fmtLong(c.date))} order has been skipped.${
          n ? ` Your next order is ${esc(fmtLong(n.date))}.` : ''
        } Changed your mind? You can unskip until ${esc(fmtShort(c.date))}.</p></div>`;
      }
      if (c.status === 'error') {
        return `<div class="ap-alert ap-alert--error">${I('warning')}<p>We couldn’t process your last payment. <a href="#" data-act="payment">Update your payment method</a> to keep your order on schedule.</p></div>`;
      }
      const recent = (this.data.orders || []).find((o) => o.date && o.date >= addDays(today(), -num(this.cfg.recentDays || 5)));
      if (recent) {
        return `<div class="ap-alert">${I('check')}<p>${esc(this.cfg.alertRecent || 'We’re working on your recent order and will dispatch it as soon as it’s ready.')} <a href="#/history">See what’s in your order</a></p></div>`;
      }
      return `<div class="ap-alert">${I('check')}<p>${esc(this.cfg.alertDefault || 'Your next order is set to arrive in time to replace on schedule.')}</p></div>`;
    }

    vNextCard(c) {
      const skipped = c.status === 'skipped';
      const first = c.items[0];
      const items = first ? `${first.title}${c.items.length > 1 ? ` + ${c.items.length - 1} more` : ''}` : '';
      const ctas = skipped
        ? `<div class="ap-cta-row ap-cta-row--single"><button class="ap-btn ap-btn--primary" data-act="unskip" data-id="${c.id}">Unskip</button></div>`
        : `<div class="ap-cta-row">
            <button class="ap-btn ap-btn--primary" data-act="send" data-id="${c.id}">${I('send')}Send now</button>
            <div class="ap-cta-row__pair">
              <button class="ap-btn ap-btn--outline" data-act="skip" data-id="${c.id}">${I('skip')}Skip</button>
              <button class="ap-btn ap-btn--outline" data-act="reschedule" data-id="${c.id}">${I('calendar')}Reschedule</button>
            </div>
          </div>`;
      return `<section class="ap-card ap-card--pad" aria-labelledby="ap-next">
        ${this.alertFor(c)}
        <div>
          <h2 class="ap-h-label" id="ap-next">Your next order</h2>
          <p class="ap-h-date">${skipped ? 'Skipped' : esc(fmtLong(c.date))}</p>
          <p class="ap-next-items">${esc(items)}</p>
        </div>
        ${ctas}
      </section>`;
    }

    vLineItems(c, editable = true) {
      return `<ul class="ap-items">${c.items
        .map(
          (it) => `<li class="ap-item">
          <div class="ap-thumb">${this.image(it.image, it.title)}<span class="ap-qty">${it.qty}</span></div>
          <div class="ap-item__body">
            <div>
              <p class="ap-item__title">${esc(it.title)}</p>
              ${it.type === 'onetime' ? '<p class="ap-chip-onetime">One-time add-on</p>' : ''}
              <p class="ap-price">${this.priceHtml(it)}</p>
            </div>
            ${
              !editable
                ? ''
                : it.type === 'onetime'
                  ? `<button class="ap-pill" data-act="remove-onetime" data-id="${it.id}">Remove</button>`
                  : `<a class="ap-pill" href="#/subscription/${it.subId}">Edit Subscription</a>`
            }
          </div>
        </li>`
        )
        .join('')}</ul>`;
    }

    vSummary(c) {
      const ship = c.shipping == null ? ['Shipping: Pending estimation', 'Calculating'] : ['Shipping', c.shipping === 0 ? 'FREE' : this.money(c.shipping, c.currency)];
      return `<div class="ap-sum">
        <div class="ap-sum__rows">
          <div class="ap-sum__row"><span>Subtotal</span><span>${this.money(c.subtotal, c.currency)}</span></div>
          ${c.discount ? `<div class="ap-sum__row"><span>Discount</span><span>−${this.money(c.discount, c.currency)}</span></div>` : ''}
          <div class="ap-sum__row"><span>Estimated taxes</span><span>${this.money(c.tax, c.currency)}</span></div>
          <div class="ap-sum__row"><span>${ship[0]}</span><span>${ship[1]}</span></div>
        </div>
        <div class="ap-sum__row ap-sum__row--total">
          <span class="ap-sum__total-label">Total <span class="ap-info" tabindex="0" aria-label="About your total">i<span class="ap-info__tip">Final shipping and taxes are calculated when your order is processed.</span></span></span>
          <span>${this.money(c.total, c.currency)}</span>
        </div>
        ${
          c.discountCodes.length
            ? `<div class="ap-discount__applied">${c.discountCodes
                .map((d) => `<span class="ap-tag">${esc(d)}<button type="button" data-act="remove-discount" data-id="${c.id}" aria-label="Remove discount ${esc(d)}">${I('close')}</button></span>`)
                .join('')}</div>`
            : `<form class="ap-discount" data-form="discount" data-id="${c.id}">
                <label class="ap-sr" for="ap-dc-${c.id}">Discount code</label>
                <input id="ap-dc-${c.id}" name="code" placeholder="Discount code" autocomplete="off" required>
                <button class="ap-pill" type="submit">Apply</button>
              </form>`
        }
      </div>`;
    }

    vOrderSummary(c) {
      return `<section class="ap-card ap-card--summary">
        <h2 class="ap-h-sub">In your order</h2>
        ${this.vLineItems(c)}
        <h2 class="ap-h-sub">Order Summary</h2>
        ${this.vSummary(c)}
        <h2 class="ap-h-sub">Delivery address &amp; payment</h2>
        <div class="ap-kv">
          <div class="ap-kv__row ap-kv__row--strong"><span>${esc(addrLine(c.address))}</span><button class="ap-kv__edit" data-act="edit-address" data-id="${c.addressId}">Edit</button></div>
          <div class="ap-kv__row"><span>${c.payment ? `Charge to ${esc(cardLabel(c.payment))}` : 'No payment method on file'}</span><button class="ap-kv__edit" data-act="payment">Edit</button></div>
        </div>
      </section>`;
    }

    vUpsell(c) {
      const products = this.cfg.upsell || [];
      if (!products.length || c.status === 'skipped') return '';
      const sub = c.items.find((i) => i.subId) && this.subById(c.items.find((i) => i.subId).subId);
      const every = sub && sub.freq ? ` (${everyText(sub.freq, sub.unit).toLowerCase()})` : '';
      return `<section class="ap-card ap-upsell" aria-labelledby="ap-upsell-h">
        <div class="ap-upsell__head">
          <h2 class="ap-h-section" id="ap-upsell-h">${esc(this.cfg.upsellHeading || 'Add items to your subscription')}</h2>
          <div class="ap-upsell__arrows">
            <button type="button" data-dir="-1" aria-label="Previous products">${I('prev')}</button>
            <button type="button" data-dir="1" aria-label="Next products">${I('next')}</button>
          </div>
        </div>
        <div class="ap-upsell__note"><div class="ap-alert ap-alert--warn">${I('warning')}<p>Ships with your next delivery on ${esc(fmtShort(c.date))}${esc(every)}.</p></div></div>
        <div class="ap-track" data-track>
          ${products
            .map(
              (p, i) => `<div class="ap-pcard">
              <a class="ap-pcard__img${p.pad ? ' ap-pcard__img--pad' : ''}" href="${esc(p.url || '#')}">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.title)}" width="200" height="200" loading="lazy">` : ''}</a>
              <div>
                <p class="ap-pcard__title">${esc(p.title)}</p>
                <p class="ap-pcard__price">${p.compare && p.compare > p.price ? `<s>${this.money(p.compare)}</s> ` : ''}${this.money(p.price)}</p>
              </div>
              <button class="ap-btn ap-btn--primary ap-btn--block" data-act="add" data-idx="${i}" data-id="${c.id}"${p.available === false ? ' disabled' : ''}>${p.available === false ? 'Sold out' : 'Add'}</button>
            </div>`
            )
            .join('')}
        </div>
        ${this.cfg.browseUrl ? `<div class="ap-upsell__foot"><a class="ap-btn ap-btn--outline ap-btn--thick ap-btn--block" href="${esc(this.cfg.browseUrl)}">${esc(this.cfg.browseLabel || 'Browse all')}</a></div>` : ''}
      </section>`;
    }

    bindCarousel() {
      const track = this.querySelector('[data-track]');
      if (!track) return;
      const btns = this.querySelectorAll('[data-dir]');
      const update = () => {
        btns[0].disabled = track.scrollLeft <= 2;
        btns[1].disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      };
      btns.forEach((b) =>
        b.addEventListener('click', () => track.scrollBy({ left: Number(b.dataset.dir) * (track.clientWidth - 40), behavior: 'smooth' }))
      );
      track.addEventListener('scroll', update, { passive: true });
      update();
    }

    vEduVideo() {
      const e = this.cfg.edu || {};
      if (!e.enabled) return '';
      const poster = e.poster ? `<img src="${esc(e.poster)}" alt="" width="740" height="416" loading="lazy">` : '';
      const media = e.video
        ? `<video src="${esc(e.video)}"${e.poster ? ` poster="${esc(e.poster)}"` : ''} playsinline controls preload="none"></video>`
        : e.videoUrl
          ? `${poster}<a class="ap-edu__play" href="${esc(e.videoUrl)}" target="_blank" rel="noopener" aria-label="Play video"><span>${I('play')}</span></a>`
          : poster;
      return `<section class="ap-edu">
        <div class="ap-edu__media">${media}</div>
        ${this.eduText(e)}
      </section>`;
    }
    eduText(e) {
      return `<div class="ap-edu__text">
        ${e.eyebrow ? `<p class="ap-eyebrow">${esc(e.eyebrow)}</p>` : ''}
        ${e.headline ? `<p class="ap-edu__headline">${esc(e.headline)}</p>` : ''}
        ${e.linkUrl ? `<a class="ap-learn" href="${esc(e.linkUrl)}">${esc(e.linkLabel || 'Learn more')}${I('arrowRight')}</a>` : ''}
      </div>`;
    }

    vKnowledge() {
      const k = this.cfg.knowledge || {};
      const arts = k.articles || [];
      if (!k.enabled || !arts.length) return '';
      return `<section class="ap-card ap-kc" aria-labelledby="ap-kc-h">
        <div class="ap-kc__head">
          <h2 class="ap-kc__title" id="ap-kc-h">${esc(k.title || 'Knowledge Center')}</h2>
          ${k.allUrl ? `<a class="ap-kc__all" href="${esc(k.allUrl)}">${esc(k.allLabel || 'View all articles')}${I('caretDown')}</a>` : ''}
        </div>
        ${k.intro ? `<p class="ap-kc__intro">${esc(k.intro)}</p>` : ''}
        <div class="ap-kc__list">
          ${arts
            .map(
              (a) => `<article class="ap-article">
              ${a.image ? `<div class="ap-article__img"><img src="${esc(a.image)}" alt="" width="310" height="196" loading="lazy"></div>` : ''}
              <div class="ap-article__body">
                <h3 class="ap-article__title">${esc(a.title)}</h3>
                ${a.text ? `<p class="ap-article__text">${esc(a.text)}</p>` : ''}
                ${a.url ? `<a class="ap-article__link" href="${esc(a.url)}">${esc(a.label || 'View article')}${I('arrowSmall')}</a>` : ''}
              </div>
            </article>`
            )
            .join('')}
        </div>
      </section>`;
    }

    vNoUpcoming() {
      const active = this.data.subscriptions.some((s) => s.status === 'active');
      return `<section class="ap-card ap-empty">
        <p class="ap-h-date">${active ? 'No upcoming orders' : 'No active subscriptions'}</p>
        <p>${active ? 'Your subscriptions don’t have an order scheduled right now.' : 'Subscribe & save on your favourites and manage everything here.'}</p>
        <a class="ap-btn ap-btn--primary" href="${esc(this.cfg.browseUrl || '/collections/all')}">Shop products</a>
      </section>${this.vEduVideo()}`;
    }

    /* ----- charge detail (upcoming › edit) ----- */
    vOrder(id) {
      const c = this.data.charges.find((x) => x.id === id) || this.nextCharge();
      if (!c) return this.vNoUpcoming();
      const skipped = c.status === 'skipped';
      return `<section class="ap-card ap-detail-head">
          <a class="ap-back ap-back--lg" href="#/upcoming">${I('arrowLeft')}Back</a>
          <div class="ap-modal__text">
            ${skipped ? '<span class="ap-badge">Skipped</span>' : ''}
            <p class="ap-h-date">${esc(fmtLong(c.date))}</p>
          </div>
          ${
            skipped
              ? `<div class="ap-cta-row ap-cta-row--single"><button class="ap-btn ap-btn--primary" data-act="unskip" data-id="${c.id}">Unskip</button></div>`
              : `<div class="ap-cta-row">
              <button class="ap-btn ap-btn--primary" data-act="send" data-id="${c.id}">Send now</button>
              <button class="ap-btn ap-btn--outline" data-act="reschedule" data-id="${c.id}">Reschedule</button>
              <button class="ap-btn ap-btn--outline" data-act="skip" data-id="${c.id}">Skip</button>
            </div>`
          }
        </section>
        <section class="ap-card ap-card--summary">
          <div class="ap-kv__row ap-kv__row--strong"><span>Deliver to ${esc(addrLine(c.address))}</span><button class="ap-kv__edit" data-act="edit-address" data-id="${c.addressId}">Edit</button></div>
          ${this.vLineItems(c)}
          <h2 class="ap-h-sub">Order Summary</h2>
          ${this.vSummary(c)}
          <div class="ap-kv__row"><span>${c.payment ? `Charge to ${esc(cardLabel(c.payment))}` : 'No payment method on file'}</span><button class="ap-kv__edit" data-act="payment">Edit</button></div>
        </section>`;
    }

    /* ----- subscriptions ----- */
    vSubscriptions() {
      const subs = this.data.subscriptions.filter((s) => (this.filter === 'active' ? s.status === 'active' : s.status !== 'active'));
      const list = subs.length
        ? subs
            .map(
              (s) => `<a class="ap-sub" href="#/subscription/${s.id}">
              <div class="ap-thumb">${this.image(s.image, s.title, 120)}</div>
              <div class="ap-sub__body">
                <div>
                  <p class="ap-item__title">${esc(s.title)}</p>
                  ${s.variant ? `<p class="ap-item__variant">${esc(s.variant)}</p>` : ''}
                  <p class="ap-price">${this.priceHtml(s, `${s.qty} × `)}</p>
                </div>
                ${s.status === 'active' ? `<span class="ap-freq">${I('repeat')}${esc(everyText(s.freq, s.unit))}</span>` : '<span class="ap-badge">Inactive</span>'}
                <p>${s.status === 'active' && s.next ? `Next order ${esc(fmtLong(s.next))}` : s.status === 'active' ? 'No order scheduled' : 'Reactivate anytime'}</p>
              </div>
              <span class="ap-sub__caret">${I('caretRight')}</span>
            </a>`
            )
            .join('')
        : `<div class="ap-card ap-empty"><p>${this.filter === 'active' ? 'You have no active subscriptions.' : 'No inactive subscriptions.'}</p></div>`;
      const tip = this.cfg.tips?.subscriptions;
      return `<div>
          <div class="ap-filter" role="group" aria-label="Filter subscriptions">
            <button type="button" data-act="filter" data-v="active" aria-pressed="${this.filter === 'active'}">Active</button>
            <button type="button" data-act="filter" data-v="inactive" aria-pressed="${this.filter !== 'active'}">Inactive</button>
          </div>
          <div class="ap-list">${list}</div>
        </div>
        ${tip ? `<section class="ap-edu ap-edu--text">${this.eduText({ eyebrow: tip.eyebrow, headline: tip.text })}</section>` : ''}`;
    }

    vSubscription(id) {
      const s = this.subById(id);
      if (!s) return `<section class="ap-card ap-empty"><p>Subscription not found.</p><a class="ap-btn ap-btn--outline" href="#/subscriptions">Back to subscriptions</a></section>`;
      const active = s.status === 'active';
      const plans = this.plansCache?.[s.id];
      if (active && !plans) {
        this.plansCache = this.plansCache || {};
        this.api.plansFor(s).then((p) => {
          this.plansCache[s.id] = p;
          if (this.route().id === s.id) this.render();
        });
      }
      const options = (plans && plans.length ? plans : (this.cfg.frequencies || [30, 45, 60]).map((d) => ({ freq: d, unit: 'day' }))).slice();
      if (active && !options.some((o) => o.freq === s.freq && unitWord(o.unit, 1) === unitWord(s.unit, 1))) options.unshift({ freq: s.freq, unit: s.unit });
      const addr = this.data.addresses.find((a) => a.id === s.addressId);
      return `<section class="ap-card ap-sub-detail">
        <a class="ap-back ap-back--lg" href="#/subscriptions">${I('arrowLeft')}Back</a>
        <div class="ap-item">
          <div class="ap-thumb">${this.image(s.image, s.title, 120)}</div>
          <div class="ap-item__body">
            <div>
              <p class="ap-item__title">${esc(s.title)}</p>
              ${s.variant ? `<p class="ap-item__variant">${esc(s.variant)}</p>` : ''}
              <p class="ap-price">${this.priceHtml(s, `${s.qty} × `)}</p>
            </div>
            ${active ? `<span class="ap-freq">${I('repeat')}${esc(everyText(s.freq, s.unit))}</span>` : '<span class="ap-badge">Inactive</span>'}
          </div>
        </div>
        ${
          active
            ? `<form class="ap-modal__text" data-form="subscription" data-id="${s.id}" style="gap:16px">
            <div class="ap-form-grid">
              <div class="ap-field"><span>Quantity</span>
                <div class="ap-stepper"><button type="button" data-step="-1" aria-label="Decrease quantity">−</button><output name="qtyOut">${s.qty}</output><button type="button" data-step="1" aria-label="Increase quantity">+</button></div>
                <input type="hidden" name="qty" value="${s.qty}">
              </div>
              <label class="ap-field"><span>Delivery frequency</span>
                <select name="freq">${options
                  .map((o) => {
                    const sel = o.freq === s.freq && unitWord(o.unit, 1) === unitWord(s.unit, 1);
                    return `<option value="${o.id ? `plan:${o.id}` : `${o.freq}|${unitWord(o.unit, 1)}`}"${sel ? ' selected' : ''}>${esc(everyText(o.freq, o.unit))}</option>`;
                  })
                  .join('')}</select>
              </label>
              <label class="ap-field ap-field--full"><span>Next order date</span>
                <input type="date" name="next" value="${esc(s.next || '')}" min="${addDays(today(), 1)}">
              </label>
            </div>
            <p class="ap-row__meta">Ships to ${esc(addrLine(addr))}</p>
            <div class="ap-modal__ctas">
              <button class="ap-btn ap-btn--primary" type="submit">Save changes</button>
              ${s.isSkippable !== false && s.next ? `<button class="ap-btn ap-btn--outline" type="button" data-act="skip-sub" data-id="${s.id}">Skip next order</button>` : ''}
              ${s.isSwappable ? `<button class="ap-btn ap-btn--outline" type="button" data-act="payment" data-swap="1">Swap product</button>` : ''}
            </div>
          </form>
          <button class="ap-danger-link" data-act="cancel-sub" data-id="${s.id}">Cancel subscription</button>`
            : `<div class="ap-modal__ctas"><button class="ap-btn ap-btn--primary" data-act="activate" data-id="${s.id}">Reactivate subscription</button></div>`
        }
      </section>`;
    }

    /* ----- upcoming ----- */
    vUpcoming() {
      const list = this.data.charges.filter((c) => c.status !== 'processing');
      if (!list.length) return this.vNoUpcoming();
      const row = (c) => `<div class="ap-card ap-row">
        <div class="ap-row__text">
          ${c.status === 'skipped' ? '<span class="ap-badge">Skipped</span>' : ''}
          <p class="ap-h-sub">${esc(fmtLong(c.date))}</p>
          <p class="ap-row__meta">${esc(this.itemsSummary(c))}</p>
        </div>
        <div class="ap-row__ctas">
          <a class="ap-btn ap-btn--outline ap-btn--sm" href="#/order/${c.id}">${I('pencil')}Edit</a>
          ${
            c.status === 'skipped'
              ? `<button class="ap-btn ap-btn--outline ap-btn--sm" data-act="unskip" data-id="${c.id}">Unskip</button>`
              : `<button class="ap-btn ap-btn--outline ap-btn--sm" data-act="skip" data-id="${c.id}">${I('skip')}Skip</button>`
          }
        </div>
      </div>`;
      const [first, ...rest] = list;
      return `<div class="ap-stack">
        <div class="ap-alert ap-alert--lg">${I('check')}<p>${esc(this.cfg.alertUpcoming || 'Your next order ships on the scheduled date. Reschedule or skip it anytime before then.')}</p></div>
        <section class="ap-block"><h2 class="ap-h-page">Your next order</h2>${row(first)}</section>
        ${rest.length ? `<section class="ap-block"><h2 class="ap-h-page">Future orders</h2><div class="ap-list">${rest.map(row).join('')}</div></section>` : ''}
      </div>`;
    }

    /* ----- history ----- */
    vHistory() {
      const orders = this.data.orders || [];
      const statusLabel = { queued: 'Processing', success: '', error: 'Payment failed', cancelled: 'Cancelled', pending_charge_status: 'Processing' };
      const list = orders.length
        ? orders
            .map((o) => {
              const open = this.openHistory.has(o.id);
              const st = statusLabel[o.status];
              return `<div class="ap-card ap-hist">
            <div class="ap-hist__top">
              <div class="ap-hist__text">
                <div class="ap-row__text">
                  ${st ? `<span class="ap-badge${o.status === 'queued' ? ' ap-badge--yellow' : ''}">${st}</span>` : ''}
                  <p class="ap-h-sub">${esc(fmtLong(o.date))}</p>
                  <p class="ap-row__meta">${esc(this.itemsSummary(o))}</p>
                </div>
                <button class="ap-hist__link" data-act="toggle-order" data-id="${o.id}" aria-expanded="${open}">${open ? 'Hide order details' : 'View order details'}</button>
              </div>
              <p class="ap-h-sub">${this.money(o.total, o.currency)}</p>
            </div>
            ${
              open
                ? `<div class="ap-hist__detail">
                ${o.number ? `<p class="ap-row__meta">Order ${esc(o.number)}</p>` : ''}
                ${this.vLineItems(o, false)}
                <div class="ap-sum__rows">
                  <div class="ap-sum__row"><span>Subtotal</span><span>${this.money(o.subtotal, o.currency)}</span></div>
                  ${o.discount ? `<div class="ap-sum__row"><span>Discount</span><span>−${this.money(o.discount, o.currency)}</span></div>` : ''}
                  <div class="ap-sum__row"><span>Taxes</span><span>${this.money(o.tax, o.currency)}</span></div>
                  <div class="ap-sum__row"><span>Shipping</span><span>${o.shipping ? this.money(o.shipping, o.currency) : 'FREE'}</span></div>
                  <div class="ap-sum__row ap-sum__row--total"><span>Total</span><span>${this.money(o.total, o.currency)}</span></div>
                </div>
                ${o.address ? `<p class="ap-row__meta">Shipped to ${esc(addrLine(o.address))}</p>` : ''}
              </div>`
                : ''
            }
          </div>`;
            })
            .join('')
        : `<div class="ap-card ap-empty"><p>No orders yet.</p></div>`;
      const e = this.cfg.historyEdu || {};
      const faq = this.cfg.faq || [];
      return `<div class="ap-stack">
        <section class="ap-block"><h2 class="ap-h-page">Previous orders</h2><div class="ap-list">${list}</div></section>
        ${
          e.enabled
            ? `<section class="ap-edu ap-edu--split">${e.image ? `<div class="ap-edu__img"><img src="${esc(e.image)}" alt="" width="358" height="201" loading="lazy"></div>` : ''}${this.eduText(e)}</section>`
            : ''
        }
        ${
          faq.length
            ? `<section class="ap-faq"><h2 class="ap-faq__title">${esc(this.cfg.faqTitle || 'Frequently Asked Questions')}</h2><div>${faq
                .map((f, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(f.q)}${I('caretDown')}</summary><div class="ap-faq__a">${f.a}</div></details>`)
                .join('')}</div></section>`
            : ''
        }
      </div>`;
    }

    /* ----- addresses & payment ----- */
    vAccount() {
      const next = this.nextCharge();
      const defaultAddr = next ? next.addressId : this.data.addresses[0]?.id;
      const addrs = this.data.addresses
        .map(
          (a) => `<div class="ap-card ap-li">
          ${I('pin')}
          <div class="ap-li__main">
            <div class="ap-li__text">
              <p class="ap-li__name">${esc([a.first_name, a.last_name].filter(Boolean).join(' '))}${a.id === defaultAddr ? '<span class="ap-badge ap-badge--yellow">Default</span>' : ''}</p>
              <p class="ap-li__addr">${esc(addrFull(a))}</p>
            </div>
            <button class="ap-text-btn" data-act="edit-address" data-id="${a.id}">Edit Address</button>
          </div>
        </div>`
        )
        .join('');
      const pays = this.data.payments
        .map(
          (p) => `<div class="ap-card ap-li">
          <span class="ap-card-logo">${esc(p.email ? 'PayPal' : p.brand || 'Card')}</span>
          <div class="ap-li__main">
            <div class="ap-li__text">
              <p class="ap-li__name">${esc(p.email ? 'PayPal' : `${(p.brand || 'Card').replace(/^./, (m) => m.toUpperCase())} ••••${p.last4 || ''}`)}${p.default ? '<span class="ap-badge ap-badge--yellow">Default</span>' : ''}</p>
              ${p.billing ? `<p class="ap-li__addr">Billing address: ${esc([p.billing.address1, p.billing.city, [p.billing.province, p.billing.zip].filter(Boolean).join(' ')].filter(Boolean).join(', '))}</p>` : ''}
              ${p.exp ? `<p class="ap-li__addr">Expires ${esc(p.exp)}</p>` : ''}
            </div>
            <button class="ap-text-btn" data-act="payment">Edit</button>
          </div>
        </div>`
        )
        .join('');
      return `<section class="ap-card ap-acct-head">
          <a class="ap-back" href="#/dashboard">${I('arrowLeft')}Back</a>
          <div class="ap-acct-head__row">
            <h2 class="ap-h-card">Your Addresses</h2>
            <button class="ap-btn ap-btn--primary ap-btn--square" data-act="new-address">${I('plus', 'ap-i--20')}Add new address</button>
          </div>
        </section>
        <div class="ap-list">${addrs || '<div class="ap-card ap-empty"><p>No addresses yet.</p></div>'}</div>
        <section class="ap-card ap-acct-head">
          <div class="ap-acct-head__row">
            <h2 class="ap-h-card">Your Payment methods</h2>
            <button class="ap-btn ap-btn--primary ap-btn--square" data-act="payment">${I('plus')}Add payment method</button>
          </div>
        </section>
        <div class="ap-list">${pays || '<div class="ap-card ap-empty"><p>No payment methods on file.</p></div>'}</div>`;
    }

    /* ----- states ----- */
    renderSkeleton() {
      this.root.innerHTML = `<div class="ap-shell"><div class="ap-top"><div class="ap-skel" style="height:34px;width:280px"></div><div class="ap-skel" style="height:34px;width:min(100%,640px)"></div></div>
        <div class="ap-grid"><div class="ap-main"><div class="ap-skel" style="height:261px"></div><div class="ap-skel" style="height:420px"></div></div><div class="ap-side"><div class="ap-skel" style="height:520px"></div></div></div></div>`;
    }
    renderGate() {
      this.root.innerHTML = `<div class="ap-shell"><div class="ap-card ap-gate">
        <h1 class="ap-h-date">Manage your subscription</h1>
        <p>Log in to skip, reschedule or edit your upcoming orders.</p>
        <a class="ap-btn ap-btn--primary" href="${esc(this.cfg.loginUrl)}">Log in</a>
      </div></div>`;
    }
    renderNoSubs() {
      this.data = { customer: {}, charges: [], subscriptions: [], orders: [], addresses: [], payments: [] };
      this.root.innerHTML = `<div class="ap-shell"><div class="ap-card ap-gate">
        <h1 class="ap-h-date">No subscriptions yet</h1>
        <p>Subscribe &amp; save on your favourites and manage every delivery from here.</p>
        <a class="ap-btn ap-btn--primary" href="${esc(this.cfg.browseUrl || '/collections/all')}">Shop products</a>
        <a class="ap-link" href="${esc(this.cfg.accountUrl)}">Go to my account</a>
      </div></div>`;
    }
    renderError(e) {
      this.root.innerHTML = `<div class="ap-shell"><div class="ap-card ap-gate">
        <h1 class="ap-h-date">We couldn’t load your subscriptions</h1>
        <p>${esc(errMsg(e))}</p>
        <button class="ap-btn ap-btn--primary" data-act="retry">Try again</button>
      </div></div>`;
    }
    toast(text) {
      document.querySelector('.ap-toast')?.remove();
      const t = document.createElement('div');
      t.className = 'ap-toast';
      t.setAttribute('role', 'status');
      t.textContent = text;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3200);
    }

    /* ----- modals ----- */
    modal({ title, body = '', content = '', confirm, cancel = 'Cancel', onConfirm, form = false }) {
      this.closeModal();
      const wrap = document.createElement('div');
      wrap.className = 'ap ap-modal';
      wrap.style.cssText = 'padding:0;background:transparent';
      wrap.innerHTML = `<div class="ap-modal__scrim" data-close></div>
        <${form ? 'form' : 'div'} class="ap-modal__panel" role="dialog" aria-modal="true" aria-labelledby="ap-modal-t">
          <button type="button" class="ap-modal__close" data-close aria-label="Close">${I('close')}</button>
          <div class="ap-modal__text">
            <h2 class="ap-h-date" id="ap-modal-t">${title}</h2>
            ${body ? `<p class="ap-modal__body">${body}</p>` : ''}
          </div>
          ${content}
          <p class="ap-modal__error" data-error hidden></p>
          <div class="ap-modal__ctas">
            <button type="${form ? 'submit' : 'button'}" class="ap-btn ap-btn--primary" data-confirm>${confirm}</button>
            <button type="button" class="ap-btn ap-btn--outline" data-close>${cancel}</button>
          </div>
        </${form ? 'form' : 'div'}>`;
      document.body.appendChild(wrap);
      document.documentElement.style.overflow = 'hidden';
      this.modalEl = wrap;
      this.lastFocus = document.activeElement;
      const panel = wrap.querySelector('.ap-modal__panel');
      const confirmBtn = wrap.querySelector('[data-confirm]');
      const run = async (ev) => {
        ev?.preventDefault();
        const err = wrap.querySelector('[data-error]');
        err.hidden = true;
        confirmBtn.setAttribute('aria-busy', 'true');
        try {
          await onConfirm(panel);
          this.closeModal();
        } catch (e) {
          console.error('[ap-portal]', e);
          err.textContent = errMsg(e);
          err.hidden = false;
          confirmBtn.removeAttribute('aria-busy');
        }
      };
      if (form) panel.addEventListener('submit', run);
      else confirmBtn.addEventListener('click', run);
      wrap.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) this.closeModal();
      });
      wrap.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.closeModal();
        if (e.key === 'Tab') {
          const f = [...panel.querySelectorAll('button, input, select, a[href]')].filter((x) => !x.disabled && x.offsetParent);
          if (!f.length) return;
          if (e.shiftKey && document.activeElement === f[0]) {
            e.preventDefault();
            f[f.length - 1].focus();
          } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
            e.preventDefault();
            f[0].focus();
          }
        }
      });
      (panel.querySelector('input:not([type=hidden]):not([type=radio]), [data-confirm]') || confirmBtn).focus();
      return panel;
    }
    closeModal() {
      if (!this.modalEl) return;
      this.modalEl.remove();
      this.modalEl = null;
      document.documentElement.style.overflow = '';
      this.lastFocus?.focus?.();
    }

    async act(fn, flashHtml, toastText) {
      await fn();
      if (flashHtml) this.flash = { html: flashHtml };
      await this.reload();
      if (toastText) this.toast(toastText);
    }

    openSkip(c) {
      const n = this.chargeAfter(c);
      this.modal({
        title: `Skip your ${esc(fmtLong(c.date))} order?`,
        body: `You won’t be charged and nothing will ship.${n ? ` Your next order will move to ${esc(fmtLong(n.date))}.` : ''}`,
        confirm: 'Skip',
        onConfirm: () => this.act(() => this.api.skip(c), null, 'Order skipped'),
      });
    }
    openSend(c) {
      this.modal({
        title: 'Send your order now?',
        body: `Your ${esc(fmtLong(c.date))} order will be processed and charged${c.payment ? ` to ${esc(cardLabel(c.payment))}` : ''} right away. You can’t make further changes to this order once it’s sent.`,
        confirm: 'Send now',
        onConfirm: () =>
          this.act(
            () => this.api.sendNow(c),
            `We’re working on your order and will dispatch it as soon as it’s ready. <a href="#/history">View order</a>`,
            'Order sent'
          ),
      });
    }
    openReschedule(c) {
      const o1 = addDays(c.date, 7);
      const o2 = addDays(c.date, 14);
      const content = `<div class="ap-options" role="radiogroup" aria-label="New date">
          <label class="ap-option"><input type="radio" name="when" value="${o1}" checked>Delay for 1 week<span class="ap-option__date">${esc(fmtShort(o1))}</span></label>
          <label class="ap-option"><input type="radio" name="when" value="${o2}">Delay for 2 weeks<span class="ap-option__date">${esc(fmtShort(o2))}</span></label>
          <label class="ap-option"><input type="radio" name="when" value="custom">${I('calendar')}Select a specific date</label>
          <input class="ap-input" type="date" name="date" min="${addDays(today(), 1)}" value="${c.date}" hidden aria-label="Specific date">
        </div>`;
      const panel = this.modal({
        title: 'When would you like your next order?',
        body: 'Schedule changes will apply to all future orders.',
        content,
        confirm: 'Save changes',
        form: true,
        onConfirm: (p) => {
          const v = p.querySelector('[name=when]:checked').value;
          const date = v === 'custom' ? p.querySelector('[name=date]').value : v;
          if (!date || date <= today()) throw new Error('Please choose a future date.');
          return this.act(() => this.api.reschedule(c, date), `Your next order has been rescheduled to ${esc(fmtLong(date))}.`);
        },
      });
      panel.addEventListener('change', () => {
        const custom = panel.querySelector('[name=when]:checked').value === 'custom';
        const d = panel.querySelector('[name=date]');
        d.hidden = !custom;
        if (custom) d.focus();
      });
    }
    openDiscount(c, prefill = '') {
      this.modal({
        title: 'Apply a discount code',
        body: 'If you have a discount code, add it here. This will apply to all orders that get sent to this address.',
        content: `<label class="ap-sr" for="ap-dc-modal">Discount code</label><input class="ap-input" id="ap-dc-modal" name="code" placeholder="Discount code" value="${esc(prefill)}" required autocomplete="off">`,
        confirm: 'Apply discount code',
        form: true,
        onConfirm: (p) => {
          const code = p.querySelector('[name=code]').value.trim();
          if (!code) throw new Error('Enter a discount code.');
          return this.act(() => this.api.applyDiscount(c, code), null, 'Discount applied');
        },
      });
    }
    openAddress(id) {
      const a = id ? this.data.addresses.find((x) => x.id === id) || {} : { country_code: this.cfg.country || 'US' };
      const f = (name, label, opts = {}) =>
        `<label class="ap-field${opts.full ? ' ap-field--full' : ''}"><span>${label}</span><input name="${name}" value="${esc(a[name] || '')}"${opts.req ? ' required' : ''}${opts.ac ? ` autocomplete="${opts.ac}"` : ''}></label>`;
      this.modal({
        title: id ? 'Update address' : 'Add new address',
        body: id ? 'Changes apply to every upcoming order shipping to this address.' : '',
        content: `<div class="ap-form-grid">
          ${f('first_name', 'First name', { req: true, ac: 'given-name' })}${f('last_name', 'Last name', { req: true, ac: 'family-name' })}
          ${f('company', 'Company (optional)', { full: true, ac: 'organization' })}
          ${f('address1', 'Address', { req: true, full: true, ac: 'address-line1' })}
          ${f('address2', 'Apartment, suite, etc. (optional)', { full: true, ac: 'address-line2' })}
          ${f('city', 'City', { req: true, ac: 'address-level2' })}${f('province', 'State / Province', { ac: 'address-level1' })}
          ${f('zip', 'ZIP / Postal code', { req: true, ac: 'postal-code' })}${f('country_code', 'Country code', { req: true, ac: 'country' })}
          ${f('phone', 'Phone (optional)', { full: true, ac: 'tel' })}
        </div>`,
        confirm: id ? 'Save address' : 'Add address',
        form: true,
        onConfirm: (p) => {
          const data = Object.fromEntries(new FormData(p).entries());
          data.country_code = String(data.country_code || '').toUpperCase().slice(0, 2);
          return this.act(() => this.api.saveAddress(id, data), null, id ? 'Address updated' : 'Address added');
        },
      });
    }
    async openPortal(btn) {
      if (this.demo) return this.toast('Payment updates open the secure Recharge payment page (live mode only).');
      btn?.setAttribute('aria-busy', 'true');
      try {
        const url = await this.api.portalUrl();
        this.goRecharge(url);
      } catch (e) {
        this.toast(errMsg(e));
      } finally {
        btn?.removeAttribute('aria-busy');
      }
    }

    goRecharge(url) {
      // Tell snippets/ap-recharge-affinity.liquid not to bounce this visit back here.
      try {
        sessionStorage.setItem('ap_native', String(Date.now()));
      } catch (_) {}
      window.location.href = url;
    }

    /* ----- events ----- */
    async onClick(e) {
      const step = e.target.closest('[data-step]');
      if (step) {
        const form = step.closest('form');
        const input = form.querySelector('[name=qty]');
        const v = Math.max(1, Math.min(99, Number(input.value) + Number(step.dataset.step)));
        input.value = v;
        form.querySelector('[name=qtyOut]').textContent = v;
        return;
      }
      const el = e.target.closest('[data-act]');
      if (!el) return;
      const act = el.dataset.act;
      const id = el.dataset.id ? Number(el.dataset.id) || el.dataset.id : null;
      const charge = () => this.data.charges.find((c) => c.id === id);
      if (el.tagName === 'A' && act === 'payment') e.preventDefault();
      try {
        switch (act) {
          case 'retry':
            location.reload();
            break;
          case 'send':
            this.openSend(charge());
            break;
          case 'skip':
            this.openSkip(charge());
            break;
          case 'unskip':
            el.setAttribute('aria-busy', 'true');
            await this.act(() => this.api.unskip(charge()), null, 'Order unskipped');
            break;
          case 'reschedule':
            this.openReschedule(charge());
            break;
          case 'remove-discount':
            el.setAttribute('aria-busy', 'true');
            await this.act(() => this.api.removeDiscount(charge()), null, 'Discount removed');
            break;
          case 'remove-onetime':
            el.setAttribute('aria-busy', 'true');
            await this.act(() => this.api.removeOnetime(id), null, 'Item removed');
            break;
          case 'add': {
            const p = this.cfg.upsell[Number(el.dataset.idx)];
            el.setAttribute('aria-busy', 'true');
            await this.act(() => this.api.addOnetime(charge(), p), null, `${p.title} added to your next order`);
            break;
          }
          case 'edit-address':
            this.openAddress(id);
            break;
          case 'new-address':
            this.openAddress(null);
            break;
          case 'payment':
            await this.openPortal(el);
            break;
          case 'filter':
            this.filter = el.dataset.v;
            this.render();
            break;
          case 'toggle-order':
            this.openHistory.has(id) ? this.openHistory.delete(id) : this.openHistory.add(id);
            this.render();
            break;
          case 'skip-sub': {
            const s = this.subById(id);
            this.modal({
              title: `Skip your ${esc(fmtLong(s.next))} delivery?`,
              body: `${esc(s.title)} won’t ship or be charged on that date.`,
              confirm: 'Skip',
              onConfirm: () => this.act(() => this.api.skipSubscription(s), null, 'Delivery skipped'),
            });
            break;
          }
          case 'activate':
            el.setAttribute('aria-busy', 'true');
            await this.act(() => this.api.activate(this.subById(id)), null, 'Subscription reactivated');
            break;
          case 'cancel-sub': {
            if (this.demo) {
              this.toast('Cancellation opens the Recharge retention flow (live mode only).');
              break;
            }
            el.setAttribute('aria-busy', 'true');
            const url = await this.api.cancelUrl(this.subById(id));
            if (url) this.goRecharge(url);
            break;
          }
        }
      } catch (err) {
        console.error('[ap-portal]', err);
        el.removeAttribute('aria-busy');
        this.toast(errMsg(err));
      }
    }

    async onSubmit(e) {
      const form = e.target.closest('[data-form]');
      if (!form) return;
      e.preventDefault();
      const id = Number(form.dataset.id) || form.dataset.id;
      const btn = form.querySelector('[type=submit]');
      btn?.setAttribute('aria-busy', 'true');
      try {
        if (form.dataset.form === 'discount') {
          const c = this.data.charges.find((x) => x.id === id);
          const code = form.querySelector('[name=code]').value.trim();
          await this.act(() => this.api.applyDiscount(c, code), null, 'Discount applied');
        } else if (form.dataset.form === 'subscription') {
          const s = this.subById(id);
          const fd = new FormData(form);
          const patch = {};
          const qty = Number(fd.get('qty'));
          if (qty !== s.qty) patch.qty = qty;
          const fv = String(fd.get('freq') || '');
          if (fv.startsWith('plan:')) {
            const plan = (this.plansCache?.[s.id] || []).find((p) => String(p.id) === fv.slice(5));
            if (plan && !(plan.freq === s.freq && unitWord(plan.unit, 1) === unitWord(s.unit, 1))) Object.assign(patch, { planId: plan.id, freq: plan.freq, unit: plan.unit });
          } else if (fv) {
            const [f, u] = fv.split('|');
            if (!(Number(f) === s.freq && u === unitWord(s.unit, 1))) Object.assign(patch, { freq: Number(f), unit: u });
          }
          const next = fd.get('next');
          if (next && next !== s.next) patch.next = next;
          if (!Object.keys(patch).length) {
            this.toast('No changes to save');
          } else {
            await this.act(() => this.api.updateSubscription(s.id, patch), null, 'Subscription updated');
          }
        }
      } catch (err) {
        console.error('[ap-portal]', err);
        this.toast(errMsg(err));
      } finally {
        btn?.removeAttribute('aria-busy');
      }
    }
  }

  customElements.define('ap-portal', APPortal);
})();
