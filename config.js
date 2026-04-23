/* ==========================================================================
   Vardaan — site config
   SINGLE SOURCE OF TRUTH for all links, emails, domain and promo data.
   Edit values in this file; the rest of the site auto-hydrates from it.

   Usage in HTML:
     <a data-link="discord">…</a>          href ← SITE.links.discord   (+target/rel)
     <a data-link="pricing.monthly">…</a>  href ← SITE.links.pricing.monthly
     <a data-mail>…</a>                     href ← "mailto:" + SITE.email
     <span data-text="email">…</span>       text ← SITE.email
     <span data-text="promo.code">…</span>      text ← SITE.promo.code
     <span data-text="promo.offerName">…</span>  text ← SITE.promo.offerName (badge label)
     <button data-promo-code>…</button>          sets data-code + aria-label
     #promo-bar aria-label                       ← SITE.promo.offerName (after hydrate)
   ========================================================================== */

window.SITE = {
  brand:   'Vardaan',
  domain:  'vardaan.app',
  url:     'https://vardaan.app',
  tagline: 'Built for traders, by traders.',
  year:    new Date().getFullYear(),

  email: 'support1@vardaan.app',

  links: {
    discord:  'https://discord.gg/GDDc4kZmCR',
    telegram: 'https://t.me/vardaanindicator',
    twitter:  'https://twitter.com/vardaantrade',

    /** Checkout / product URLs for pricing cards (Stripe, Lemon Squeezy, etc.). Leave '' until set. */
    pricing: {
      monthly:    '',
      threeMonths: 'https://t.me/vardaanindicator',
      lifetime:   '',
    },
  },

  promo: {
    /** Short label in the promo pill (e.g. “Launch Sale”, “Founders Week”). */
    offerName:  'April Sale',
    code:       'VARDAAN10',
    percent:    '10%',
    deadline:   '48h',
    storageKey: 'vardaan:promo:v1:dismissed',
  },
};

/* ---- Hydrate the DOM from the config above ---- */
(function () {
  const SITE = window.SITE;
  if (!SITE) return;

  const get = (path) =>
    path.split('.').reduce((o, k) => (o == null ? o : o[k]), SITE);

  const isExternal = (url) => /^https?:\/\//i.test(url);

  const hydrate = () => {
    document.querySelectorAll('[data-link]').forEach((el) => {
      const url = get('links.' + el.getAttribute('data-link'));
      if (!url) return;
      el.setAttribute('href', url);
      if (isExternal(url)) {
        if (!el.hasAttribute('target')) el.setAttribute('target', '_blank');
        if (!el.hasAttribute('rel'))    el.setAttribute('rel',    'noopener');
      }
    });

    if (SITE.email) {
      document.querySelectorAll('[data-mail]').forEach((el) => {
        el.setAttribute('href', 'mailto:' + SITE.email);
      });
    }

    document.querySelectorAll('[data-text]').forEach((el) => {
      const val = get(el.getAttribute('data-text'));
      if (val != null) el.textContent = val;
    });

    const promoBar = document.getElementById('promo-bar');
    if (promoBar && SITE.promo && SITE.promo.offerName) {
      promoBar.setAttribute(
        'aria-label',
        SITE.promo.offerName + ' promotional offer'
      );
    }

    if (SITE.promo && SITE.promo.code) {
      document.querySelectorAll('[data-promo-code]').forEach((el) => {
        el.setAttribute('data-code', SITE.promo.code);
        el.setAttribute('aria-label', 'Copy code ' + SITE.promo.code);
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrate);
  } else {
    hydrate();
  }
})();
