/* ==========================================================================
   Vardaan — site config
   SINGLE SOURCE OF TRUTH for links, copy, paths, and promo data.
   Edit values here; the rest of the site hydrates via hydrateSite() below.

   HTML hooks
   ---------
   <a data-link="discord">…</a>              → SITE.links.discord (+ target/rel)
   <a data-link="pricing.monthly">…</a>      → nested links.*
   <a data-page="pricing">…</a>             → SITE.paths.pricing
   <a data-page="home" data-page-hash="features">…</a> → path + #hash
   <a data-mail>…</a>                       → mailto:SITE.email
   <span data-text="brand">…</span>         → SITE.brand
   <span data-text="promo.code">…</span>    → nested keys via dot path
   <button data-promo-code>…</button>       → data-code + aria-label from promo
   <img data-site-asset="logo" />             → src ← SITE.assets.logo
   <link data-site-asset="icon" />          → href ← SITE.assets.logo (favicon)
   ========================================================================== */

window.SITE = {
  brand: 'Vardaan',
  domain: 'vardaanindicator.com',
  url: 'https://vardaanindicator.com',
  tagline: 'Built for traders, by traders.',
  year: new Date().getFullYear(),

  email: 'support1@vardaan.app',

  /** Browser chrome & PWA-ish meta; kept in sync with <meta name="theme-color"> via JS. */
  themeColor: '#060607',

  /**
   * Relative paths for static HTML files (no leading slash).
   * Used by [data-page] hydration so nav/footer links stay consistent.
   */
  paths: {
    home: 'index.html',
    pricing: 'pricing.html',
    faqs: 'faqs.html',
    contact: 'contact.html',
    terms: 'terms.html',
  },

  /** Brand mark (SVG). Path is relative to each HTML file in site root. */
  assets: {
    logo: 'assets/logo.svg',
  },

  links: {
    discord: 'https://discord.gg/GDDc4kZmCR',
    telegram: 'https://t.me/vardaanindicator',
    instagram: 'https://www.instagram.com/vardaantrade',

    /** Checkout URLs (Stripe, Lemon Squeezy, Telegram, etc.). Empty string = disabled until set. */
    pricing: {
      monthly: '',
      threeMonths: 'https://t.me/vardaanindicator',
      lifetime: '',
    },
  },

  promo: {
    offerName: 'April Sale',
    code: 'VARDAAN10',
    percent: '10%',
    deadline: '48h',
    storageKey: 'vardaan:promo:v1:dismissed',
  },

  /** Longer marketing strings referenced from multiple pages. */
  copy: {
    footerBlurb:
      'A smart trend indicator for TradingView. Built for traders who want clarity, not clutter.',
    heroBadge: 'TradingView Indicator · v6.0 released',
    heroTrustLine: 'Trusted by 1,200+ traders',
    discordInviteCta: 'Join 1,200+ traders',
  },

  /** localStorage keys used outside promo (see promo.storageKey). */
  storageKeys: {
    pricingCurrency: 'vardaan:pricing:currency',
  },

  /** Shared palette for inline SVG charts drawn in main.js (hero + feature viz). */
  chartPalette: {
    bearish: '#FF4D5E',
    neutral: '#E8B233',
    bullishBlue: '#4A90FF',
    bullishGreen: '#4ADE80',
    gridMuted: 'rgba(255,255,255,0.045)',
    axisLabel: '#7A7A82',
  },

  /** Small UX tuning constants consumed by main.js. */
  ui: {
    /** Scroll distance (px) before .nav gets .scrolled */
    navScrollThreshold: 30,
  },
};

/**
 * Resolve "a.b.c" against SITE (returns undefined if any segment is missing).
 * @param {string} path Dot-separated path
 * @param {object} root Object to traverse (default: window.SITE)
 */
function siteGet(path, root) {
  const obj = root || window.SITE;
  if (!obj || !path) return undefined;
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

/**
 * Apply SITE to the live document: links, text, promo affordances, theme color.
 */
function hydrateSite() {
  const SITE = window.SITE;
  if (!SITE) return;

  const isExternal = (url) => /^https?:\/\//i.test(url);

  if (SITE.themeColor) {
    document.querySelectorAll('meta[name="theme-color"]').forEach((el) => {
      el.setAttribute('content', SITE.themeColor);
    });
  }

  document.querySelectorAll('[data-link]').forEach((el) => {
    const url = siteGet('links.' + el.getAttribute('data-link'));
    if (!url) return;
    el.setAttribute('href', url);
    if (isExternal(url)) {
      if (!el.hasAttribute('target')) el.setAttribute('target', '_blank');
      if (!el.hasAttribute('rel')) el.setAttribute('rel', 'noopener');
    }
  });

  if (SITE.paths) {
    document.querySelectorAll('[data-page]').forEach((el) => {
      const key = el.getAttribute('data-page');
      const path = key && SITE.paths[key];
      if (!path) return;
      const hash = el.getAttribute('data-page-hash');
      el.setAttribute('href', path + (hash ? '#' + hash : ''));
    });
  }

  if (SITE.email) {
    document.querySelectorAll('[data-mail]').forEach((el) => {
      el.setAttribute('href', 'mailto:' + SITE.email);
    });
  }

  document.querySelectorAll('[data-text]').forEach((el) => {
    const val = siteGet(el.getAttribute('data-text'));
    if (val != null) el.textContent = val;
  });

  const promoBar = document.getElementById('promo-bar');
  if (promoBar && SITE.promo && SITE.promo.offerName) {
    promoBar.setAttribute('aria-label', SITE.promo.offerName + ' promotional offer');
  }

  if (SITE.promo && SITE.promo.code) {
    document.querySelectorAll('[data-promo-code]').forEach((el) => {
      el.setAttribute('data-code', SITE.promo.code);
      el.setAttribute('aria-label', 'Copy code ' + SITE.promo.code);
    });
  }

  const logoPath = SITE.assets && SITE.assets.logo;
  if (logoPath) {
    document.querySelectorAll('[data-site-asset="logo"]').forEach((el) => {
      el.setAttribute('src', logoPath);
    });
    document.querySelectorAll('[data-site-asset="icon"]').forEach((el) => {
      el.setAttribute('href', logoPath);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', hydrateSite);
} else {
  hydrateSite();
}
