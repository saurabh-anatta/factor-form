# Recharge customer portal (Ascent Protein)

This is a custom subscription portal that runs inside the Shopify theme. It is built from the
Figma file "Ascent Design File › Account Portal" (node `4228:43302`, A1 Dashboard). It reads and
changes subscriptions through the **Recharge Storefront JS SDK** (`recharge-client-2.7.0`), so
there is **no server and no widget to upload to Recharge**.

| Piece | File |
| --- | --- |
| Section (settings, content, JSON config) | `sections/ap-portal.liquid` |
| Page template | `templates/page.subscriptions.json` |
| UI + Recharge adapter (vanilla JS, no build) | `assets/ap-portal.js`, `assets/ap-portal-icons.js` |
| Styles | `assets/ap-portal.css` |
| Bridge for Recharge's own pages (styles + email-link redirect) | `snippets/ap-recharge-affinity.liquid`, `assets/ap-recharge-affinity.css` |
| Optional copy-paste CSS for the Recharge admin | `recharge/affinity-custom.css` |

## What you need to do in the Recharge admin

No files have to be uploaded. You need one token and to check a few settings.

1. **Plan check.** The Storefront API and JS SDK require the Recharge **Pro/Plus** or **Custom** plan.
2. **Create a Storefront API token.**
   Recharge admin › *Apps & integrations* (or *Tools & apps*) › **API tokens** › **Create storefront token**.
   - Name: `Ascent theme portal`
   - Scopes: give read **and** write access to *Customers, Subscriptions, Charges, Onetimes,
     Addresses*, plus read access to *Orders, Payment methods, Products/Plans*. Turn on write
     *Discounts* too if it is listed.
   - Copy the token (it starts with `strfnt_`). It is browser-safe, because Recharge scopes every call to the
     logged-in customer.
3. **Customer portal settings** (Storefront › Customer portal). The SDK follows these settings, so
   turn on what the design offers:
   - Allow customers to **skip**, **reschedule** (change next charge date), **order now / process now**
   - Allow **change frequency**, **change quantity**, **swap product**
   - Allow **apply discount codes** and **add one-time products**
   - Keep **Customer portal location = Embedded in platform storefront**. This is needed so the
     Shopify app-proxy login works and the payment/cancellation pages that Recharge still
     hosts render inside this theme.
4. **Optional: only if you use "Hosted by Recharge".** Paste the whole contents of
   [`recharge/affinity-custom.css`](./affinity-custom.css) into
   Storefront › Customer portal › Customize › **Custom CSS**. In embedded mode the theme already
   loads the same overrides on `/tools/recurring/*` pages, so there is nothing to paste.

## What you need to do in Shopify

1. **Online Store › Pages › Add page**: title **Subscriptions**, handle `subscriptions`,
   template **page.subscriptions**. Save.
2. **Customize theme › Pages › Subscriptions › Subscriptions portal section**: paste the Recharge
   storefront token into **Recharge Storefront API token**. Then pick the
   **Products collection** for "Add items to your subscription" (Recharge-enabled products).
   Also set the education video and the article links.
3. Add a navigation link to `/pages/subscriptions` (account menu / footer).

When a page with handle `subscriptions` exists, `snippets/ap-recharge-affinity.liquid` sends the
Recharge portal landing page (`/tools/recurring/portal/<hash>/` and `/overview`, the target of
Recharge emails) to `/pages/subscriptions`. Add `?ap_native=1` to any Recharge portal URL to
skip the redirect.

## How it works

- **Login**: `recharge.auth.loginShopifyAppProxy()`. The customer must be logged in to Shopify. Logged-out
  visitors see a "Log in" gate that returns them to the page.
- **Data**: customer, queued/skipped charges, subscriptions, orders, addresses and payment
  methods are loaded in parallel.
- **Actions** (SDK call):
  - Send now: `charge.processCharge`
  - Skip / Unskip: `charge.skipCharge` / `charge.unskipCharge`
  - Reschedule (1 week, 2 weeks, or a specific date): `charge.rescheduleCharge`
  - Discount code (applies to the address): `address.applyDiscountToAddress` / `removeDiscountsFromAddress`
  - Add item to next order: `onetime.createOnetime` with `add_to_next_charge`
  - Remove added item: `onetime.deleteOnetime`
  - Quantity / frequency / next date: `subscription.updateSubscription` (with `plan_id` when the
    product has Recharge plans) and `subscription.updateSubscriptionChargeDate`
  - Skip a single subscription: `subscription.skipSubscriptionCharge`
  - Reactivate: `subscription.activateSubscription`
  - Edit or add an address: `address.updateAddress` / `address.createAddress`
- **Handled by Recharge pages on purpose**:
  - **Payment method changes** use `customer.getCustomerPortalAccess` (secure card entry).
  - **Cancellation** uses `customer.getActiveChurnLandingPageURL`, so your Recharge
    cancellation/retention flow and its reasons still apply.
- **Preview mode**: sample data from the Figma file is shown when the token is blank, inside the
  theme editor, when "Always show sample data" is on, or with `?ap_demo=1`. Actions are
  simulated.

## Tabs and design frames

| Tab | Figma frame |
| --- | --- |
| Dashboard (next order, summary, add items, video, Knowledge Center) | A1 `4228:43302` / mobile `4228:43096` |
| Skip / Send now / Reschedule / Discount modals and confirmed states | A2–A7, `4228:37667` |
| Subscriptions (active / inactive) + subscription detail | B1 `4228:32323`, B2 |
| Upcoming orders + order detail | U1 `4617:38305`, A8 |
| Order history + FAQ | C1 `4228:30309` |
| Addresses & payment | D1 `4228:44367`, `4228:44434` |
| My account → | Shopify customer account (`routes.account_url`) |

Fonts: the design uses Proxima Nova and Neue Haas Grotesk Display (commercial licences). The CSS
names them first. If they aren't installed on the store, Nunito Sans and Familjen Grotesk (Google
Fonts) are used, because their widths are within about 2% of the originals. IBM Plex Mono is used as designed.
