/* ==========================================================================
   Vardaan — main.js
   UI behavior: promo bar, nav, mobile menu, reveals, FAQ, pricing toggles,
   marquee loops, and procedural SVG charts. Tuning values prefer window.SITE
   (see config.js) when present.
   ========================================================================== */

(function () {
  'use strict';

  const SITE = window.SITE || {};

  /* ------------------------------------------------------------------
     Promo bar: dismiss (persisted) + click-to-copy code
     ------------------------------------------------------------------ */
  const PROMO_KEY = (SITE.promo && SITE.promo.storageKey) || 'vardaan:promo:v1:dismissed';
  try {
    if (localStorage.getItem(PROMO_KEY) === '1' && document.body) {
      document.body.classList.add('promo-hidden');
    }
  } catch (_) {}

  const promo = document.getElementById('promo-bar');
  if (promo) {
    function syncPromoBarHeight() {
      if (document.body.classList.contains('promo-hidden')) {
        document.documentElement.style.removeProperty('--promo-h');
        return;
      }
      if (window.innerWidth > 960) {
        document.documentElement.style.removeProperty('--promo-h');
        return;
      }
      const h = promo.getBoundingClientRect().height;
      document.documentElement.style.setProperty(
        '--promo-h',
        Math.max(40, Math.ceil(h)) + 'px'
      );
    }

    const closeBtn = promo.querySelector('.promo-bar__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.body.classList.add('promo-hidden');
        try { localStorage.setItem(PROMO_KEY, '1'); } catch (_) {}
        syncPromoBarHeight();
      });
    }

    const codeBtn = promo.querySelector('.promo-bar__code');
    if (codeBtn) {
      const valueEl = codeBtn.querySelector('.promo-bar__code-value');
      const originalValue = valueEl ? valueEl.textContent : '';
      codeBtn.addEventListener('click', async () => {
        const code = codeBtn.getAttribute('data-code') || originalValue;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(code);
          } else {
            const ta = document.createElement('textarea');
            ta.value = code;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }
          codeBtn.classList.add('is-copied');
          if (valueEl) valueEl.textContent = 'Copied!';
          setTimeout(() => {
            codeBtn.classList.remove('is-copied');
            if (valueEl) valueEl.textContent = originalValue;
          }, 1400);
        } catch (_) {}
      });
    }

    window.addEventListener('resize', syncPromoBarHeight, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(syncPromoBarHeight).observe(promo);
    }
    syncPromoBarHeight();
  }

  /* ------------------------------------------------------------------
     Contact form: UX feedback only (no backend)
     ------------------------------------------------------------------ */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const successBox = contactForm.querySelector('.contact-form__success');
    const submitBtn = contactForm.querySelector('[type="submit"]');
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (submitBtn) submitBtn.disabled = true;
      if (successBox) successBox.classList.add('is-visible');
      contactForm.reset();
      setTimeout(() => { if (submitBtn) submitBtn.disabled = false; }, 2000);
    });
  }

  /* ------------------------------------------------------------------
     Sticky nav: .scrolled after 30px
     ------------------------------------------------------------------ */
  const nav = document.querySelector('.nav');
  const navScrollThreshold =
    SITE.ui && typeof SITE.ui.navScrollThreshold === 'number' ? SITE.ui.navScrollThreshold : 30;
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > navScrollThreshold);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------ */
  const burger = document.querySelector('.nav__burger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const closeMenu = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  };
  if (burger && mobileMenu) {
    burger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    burger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('is-open');
      document.body.classList.toggle('nav-open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    });
    mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  }

  /* ------------------------------------------------------------------
     Reveal on scroll
     data-delay on element → sets --rev-delay
     data-stagger on parent → auto-staggers children
     ------------------------------------------------------------------ */
  document.querySelectorAll('.reveal[data-delay]').forEach((el) => {
    el.style.setProperty('--rev-delay', el.getAttribute('data-delay') + 'ms');
  });

  document.querySelectorAll('[data-stagger]').forEach((group) => {
    const step = parseInt(group.getAttribute('data-stagger'), 10) || 80;
    Array.from(group.children).forEach((child, i) => {
      if (child.classList.contains('reveal') && !child.hasAttribute('data-delay')) {
        child.style.setProperty('--rev-delay', i * step + 'ms');
      }
    });
  });

  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ------------------------------------------------------------------
     FAQ accordion (+ a11y ids) and optional search (faqs page)
     ------------------------------------------------------------------ */
  document.querySelectorAll('.faq-item').forEach((item, index) => {
    const trigger = item.querySelector('.faq-item__trigger');
    const panel = item.querySelector('.faq-item__panel');
    if (!trigger || !panel) return;

    const triggerId = 'faq-trigger-' + index;
    const panelId = 'faq-panel-' + index;
    trigger.id = triggerId;
    panel.id = panelId;
    panel.setAttribute('role', 'region');
    trigger.setAttribute('aria-controls', panelId);
    panel.setAttribute('aria-labelledby', triggerId);

    trigger.setAttribute('aria-expanded', 'false');
    panel.style.maxHeight = '0px';

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', String(isOpen));
      panel.style.maxHeight = isOpen ? panel.scrollHeight + 'px' : '0px';
    });
  });

  window.addEventListener('resize', () => {
    document.querySelectorAll('.faq-item.is-open .faq-item__panel').forEach((p) => {
      p.style.maxHeight = p.scrollHeight + 'px';
    });
  });

  const faqSearch = document.getElementById('faq-search');
  const faqAccordion = document.getElementById('faq-accordion');
  const faqEmpty = document.getElementById('faq-empty');
  const faqSearchLive = document.getElementById('faq-search-live');
  const faqEmptyClear = document.getElementById('faq-empty-clear');

  if (faqSearch && faqAccordion) {
    const faqItems = Array.from(faqAccordion.querySelectorAll('.faq-item'));

    function collapseFaqItem(item) {
      const trigger = item.querySelector('.faq-item__trigger');
      const panel = item.querySelector('.faq-item__panel');
      if (!trigger || !panel || !item.classList.contains('is-open')) return;
      item.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      panel.style.maxHeight = '0px';
    }

    function applyFaqFilter() {
      const q = faqSearch.value.trim().toLowerCase().replace(/\s+/g, ' ');
      let n = 0;
      faqItems.forEach((item) => {
        const text = item.textContent.toLowerCase().replace(/\s+/g, ' ');
        const match = !q || text.indexOf(q) !== -1;
        item.classList.toggle('is-filtered-out', !match);
        if (!match) collapseFaqItem(item);
        if (match) n += 1;
      });

      if (faqEmpty) faqEmpty.hidden = n > 0 || !q;
      faqAccordion.hidden = q.length > 0 && n === 0;

      if (faqSearchLive) {
        if (!q) faqSearchLive.textContent = '';
        else if (n === 0) faqSearchLive.textContent = 'No questions match your search.';
        else faqSearchLive.textContent = n + (n === 1 ? ' question matches' : ' questions match') + ' your search.';
      }
    }

    faqSearch.addEventListener('input', applyFaqFilter);
    faqSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        faqSearch.value = '';
        applyFaqFilter();
      }
    });

    if (faqEmptyClear) {
      faqEmptyClear.addEventListener('click', () => {
        faqSearch.value = '';
        applyFaqFilter();
        faqSearch.focus();
      });
    }
  }

  /* ------------------------------------------------------------------
     Pricing: monthly/yearly toggle (pages that still use .price-toggle)
     Adds .yearly on <body>; CSS swaps price spans.
     ------------------------------------------------------------------ */
  const toggle = document.querySelector('.price-toggle');
  if (toggle) {
    const btns = toggle.querySelectorAll('.price-toggle__btn');
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const plan = btn.getAttribute('data-plan');
        if (!plan) return;
        toggle.setAttribute('data-state', plan);
        btns.forEach((b) => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-selected', String(b === btn));
        });
        document.body.classList.toggle('yearly', plan === 'yearly');
      });
    });
  }

  /* ------------------------------------------------------------------
     Pricing page: INR / USD (persists in localStorage)
     ------------------------------------------------------------------ */
  const CURRENCY_KEY =
    (SITE.storageKeys && SITE.storageKeys.pricingCurrency) || 'vardaan:pricing:currency';
  const currencyToggle = document.querySelector('.currency-toggle');
  if (currencyToggle) {
    const currBtns = currencyToggle.querySelectorAll('.currency-toggle__btn');
    const applyCurrency = (cur) => {
      const isUsd = cur === 'usd';
      document.documentElement.classList.toggle('pricing-currency-usd', isUsd);
      document.documentElement.classList.toggle('pricing-currency-inr', !isUsd);
      currencyToggle.setAttribute('data-state', isUsd ? 'usd' : 'inr');
      currBtns.forEach((b) => {
        const sel = b.getAttribute('data-currency') === cur;
        b.classList.toggle('is-active', sel);
        b.setAttribute('aria-checked', String(sel));
      });
      try {
        localStorage.setItem(CURRENCY_KEY, cur);
      } catch (_) {}
    };
    let initial = 'inr';
    try {
      const saved = localStorage.getItem(CURRENCY_KEY);
      if (saved === 'usd' || saved === 'inr') initial = saved;
    } catch (_) {}
    applyCurrency(initial);
    currBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cur = btn.getAttribute('data-currency');
        if (cur === 'inr' || cur === 'usd') applyCurrency(cur);
      });
    });
  }

  /* ------------------------------------------------------------------
     Marquees — duplicate track children once for a seamless CSS loop
     (logo strip + testimonial rows use different selectors).
     ------------------------------------------------------------------ */
  function cloneMarqueeTrack(track) {
    Array.from(track.children).forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  }
  document.querySelectorAll('.marquee__track, .t-rows .t-track').forEach(cloneMarqueeTrack);

  /* ------------------------------------------------------------------
     Hero chart — crisp inline SVG candlestick chart
     Generated in JS so it stays sharp at any viewport size.
     ------------------------------------------------------------------ */
  (function renderHeroChart() {
    const svg = document.querySelector('.vd-chart');
    if (!svg) return;

    const NS = 'http://www.w3.org/2000/svg';
    const W = 1200, H = 620;

    // chart plot bounds
    const leftPad = 14;
    const plotRight = 1108;
    const topPad = 60;
    const plotBottom = 560;

    const el = (tag, attrs, text) => {
      const e = document.createElementNS(NS, tag);
      if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (text !== undefined) e.textContent = text;
      return e;
    };

    const FONT = 'Inter, system-ui, sans-serif';
    const MONO = '"JetBrains Mono", ui-monospace, monospace';
    const PAL = SITE.chartPalette || {};
    const COLORS = {
      r: PAL.bearish || '#FF4D5E',
      y: PAL.neutral || '#E8B233',
      b: PAL.bullishBlue || '#4A90FF',
    };

    // deterministic PRNG so the chart is identical every reload
    const mulberry32 = (seed) => () => {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const rnd = mulberry32(0x5a17);

    // -----------------------------------------------------------------
    // Candle generation — phase-based with proper market structure
    //
    // Impulse / pullback legs create HH-HL (uptrend) and LL-LH (downtrend)
    // structure instead of a straight drifting random walk.  Sideways
    // phases oscillate around a slowly-drifting midline (the "EMA lag"
    // zone after a trend exhausts).
    //
    // Phase sequence:
    //   1. red impulse down    — clean LL/LH downtrend
    //   2. red sideways        — price has bottomed but indicator still red
    //                            (EMA hasn't flipped yet → lag)
    //   3. yellow consolidation — indicator confirms neutral range
    //   4. blue impulse up     — clean HH/HL uptrend
    // -----------------------------------------------------------------

    const mkBar = (color, open, close, vol) => {
      const upWick = rnd() * rnd() * vol * 1.8;
      const dnWick = rnd() * rnd() * vol * 1.8;
      return [
        color, open, close,
        Math.max(open, close) + upWick,
        Math.min(open, close) - dnWick
      ];
    };

    const genImpulse = (color, count, dir, startPrice, vol) => {
      // repeating impulse legs (3–5 bars trend) + pullbacks (2–3 bars counter-trend)
      const bars = [];
      let price = startPrice;
      let i = 0;
      while (i < count) {
        const legLen = Math.min(count - i, 3 + Math.floor(rnd() * 3)); // 3–5
        // impulse leg
        for (let j = 0; j < legLen; j++, i++) {
          const open = price;
          const strong = dir * (vol * 0.75 + rnd() * vol * 1.2);
          const noise  = (rnd() - 0.5) * vol * 0.5;
          const close  = open + strong + noise;
          bars.push(mkBar(color, open, close, vol));
          price = close;
        }
        if (i >= count) break;
        // pullback leg — counter-trend, shorter
        const pbLen = Math.min(count - i, 2 + Math.floor(rnd() * 2)); // 2–3
        for (let j = 0; j < pbLen; j++, i++) {
          const open = price;
          const weak  = -dir * (vol * 0.3 + rnd() * vol * 0.55);
          const noise = (rnd() - 0.5) * vol * 0.4;
          const close = open + weak + noise;
          bars.push(mkBar(color, open, close, vol));
          price = close;
        }
      }
      return { bars, endPrice: price };
    };

    const genSideways = (color, count, startPrice, vol, driftPerBar) => {
      // mean-revert around a slowly-drifting center line
      const bars = [];
      let price = startPrice;
      let center = startPrice;
      for (let i = 0; i < count; i++) {
        center += driftPerBar;
        const open = price;
        const pull  = (center - open) * 0.22;          // pulled back toward center
        const noise = (rnd() - 0.5) * vol * 2.0;
        const close = open + pull + noise;
        bars.push(mkBar(color, open, close, vol));
        price = close;
      }
      return { bars, endPrice: price };
    };

    const phases = [
      // 1. strong red downtrend  — ~75pt drop
      { run: (p) => genImpulse('r', 28, -1, p, 2.9) },
      // 2. red sideways (EMA-lag zone: price has bottomed but indicator still red)
      { run: (p) => genSideways('r', 10, p, 2.1, 0.4) },
      // 3. yellow consolidation — slight upward accumulation drift
      { run: (p) => genSideways('y', 16, p, 2.3, 0.9) },
      // 4. strong blue uptrend — ~95pt rise
      { run: (p) => genImpulse('b', 48, +1, p, 3.0) }
    ];

    const candles = [];
    let price = 4502;
    phases.forEach((ph) => {
      const { bars, endPrice } = ph.run(price);
      candles.push(...bars);
      price = endPrice;
    });

    // derive header / axis values from the actual series
    const firstOpen = candles[0][1];
    const lastClose = candles[candles.length - 1][2];
    let dayHigh = -Infinity, dayLow = Infinity;
    candles.forEach((c) => {
      if (c[3] > dayHigh) dayHigh = c[3];
      if (c[4] < dayLow)  dayLow  = c[4];
    });
    const change = lastClose - firstOpen;
    const pct = ((change / firstOpen) * 100);
    const fmt = (n, d = 3) =>
      n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

    // auto-fit vertical price window with a little head / foot room
    const padP = (dayHigh - dayLow) * 0.07;
    const priceMin = Math.floor((dayLow  - padP) / 5) * 5;
    const priceMax = Math.ceil ((dayHigh + padP) / 5) * 5;
    const pY = (p) =>
      plotBottom - ((p - priceMin) * (plotBottom - topPad)) / (priceMax - priceMin);

    // background
    svg.appendChild(el('rect', { x: 0, y: 0, width: W, height: H, fill: '#000' }));

    // horizontal grid + right-side price axis labels (every 20 pts)
    const gridLevels = [];
    for (let p = Math.ceil(priceMin / 20) * 20; p < priceMax; p += 20) gridLevels.push(p);
    gridLevels.forEach((p) => {
      const y = pY(p);
      svg.appendChild(el('line', {
        x1: leftPad, y1: y, x2: plotRight, y2: y,
        stroke: 'rgba(255,255,255,0.045)', 'stroke-width': 1
      }));
      svg.appendChild(el('text', {
        x: plotRight + 10, y: y + 4,
        'font-family': MONO, 'font-size': 11.5, fill: '#7A7A82'
      }, fmt(p, 3)));
    });

    // bottom time axis
    const timeLabels = ['05:00', '07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];
    const plotWidth = plotRight - leftPad - 30;
    timeLabels.forEach((t, i) => {
      const x = leftPad + 30 + (i + 0.5) * (plotWidth / timeLabels.length);
      svg.appendChild(el('text', {
        x: x, y: 598,
        'font-family': MONO, 'font-size': 11.5, fill: '#5C5C64',
        'text-anchor': 'middle'
      }, t));
    });

    // USD label (top-right, above the price pill)
    svg.appendChild(el('text', {
      x: plotRight + 40, y: 26,
      'font-family': FONT, 'font-size': 12, fill: '#7A7A82',
      'text-anchor': 'middle', 'font-weight': '500', 'letter-spacing': '0.1em'
    }, 'USD'));

    // header: symbol name + OHLC line
    const header = el('text', { x: 14, y: 26, 'font-family': FONT, 'font-size': 14 });
    const seg = (t, fill, weight) => {
      const ts = el('tspan', { fill: fill, 'font-weight': weight || '500' });
      ts.textContent = t;
      return ts;
    };
    const changeColor = change >= 0 ? '#4ADE80' : '#FF4D5E';
    const sign = change >= 0 ? '+' : '';
    header.appendChild(seg('Gold Spot / U.S. Dollar', '#E8E8E8', '600'));
    header.appendChild(seg('  ·  5  ·  OANDA', '#6E6E76'));
    header.appendChild(seg('   O ', '#6E6E76'));
    header.appendChild(seg(fmt(firstOpen), '#E8E8E8'));
    header.appendChild(seg('   H ', '#6E6E76'));
    header.appendChild(seg(fmt(dayHigh), '#4ADE80'));
    header.appendChild(seg('   L ', '#6E6E76'));
    header.appendChild(seg(fmt(dayLow),  '#FF4D5E'));
    header.appendChild(seg('   C ', '#6E6E76'));
    header.appendChild(seg(fmt(lastClose), '#E8E8E8'));
    header.appendChild(seg(`   ${sign}${fmt(change, 3)} (${sign}${pct.toFixed(2)}%)`, changeColor));
    svg.appendChild(header);

    // indicator label (sub-title under the OHLC strip)
    svg.appendChild(el('text', {
      x: 14, y: 48, 'font-family': FONT, 'font-size': 13,
      fill: '#9CA3AA', 'font-weight': '500'
    }, 'Vardaan Indicator  ·  6.0'));

    // candle layout
    const slot = plotWidth / candles.length;
    const bodyW = Math.max(2.4, slot * 0.62);
    const firstX = leftPad + 30 + slot / 2;

    // --- Candlesticks ---
    const candlesG = el('g');
    candles.forEach((c, i) => {
      const [color, open, close, high, low] = c;
      const cx = firstX + i * slot;
      const col = COLORS[color];

      // wick
      candlesG.appendChild(el('line', {
        x1: cx, y1: pY(high), x2: cx, y2: pY(low),
        stroke: col, 'stroke-width': 1
      }));
      // body (min 1 px so dojis render)
      const yTop = pY(Math.max(open, close));
      const yBot = pY(Math.min(open, close));
      candlesG.appendChild(el('rect', {
        x: cx - bodyW / 2, y: yTop,
        width: bodyW, height: Math.max(1, yBot - yTop),
        fill: col
      }));
    });
    svg.appendChild(candlesG);

    // signal X markers — find actual swing low in the red regime and
    // actual swing high in the blue regime, then place markers there.
    let redLowIdx = 0, redLow = Infinity;
    let blueHighIdx = 0, blueHigh = -Infinity;
    candles.forEach((c, i) => {
      if (c[0] === 'r' && c[4] < redLow) { redLow = c[4]; redLowIdx = i; }
      if (c[0] === 'b' && c[3] > blueHigh) { blueHigh = c[3]; blueHighIdx = i; }
    });
    const mkX = (cx, cy, color) => {
      const s = 5;
      const g = el('g', { stroke: color, 'stroke-width': 1.6, 'stroke-linecap': 'round' });
      g.appendChild(el('line', { x1: cx - s, y1: cy - s, x2: cx + s, y2: cy + s }));
      g.appendChild(el('line', { x1: cx - s, y1: cy + s, x2: cx + s, y2: cy - s }));
      return g;
    };
    svg.appendChild(mkX(firstX + redLowIdx  * slot, pY(redLow)   + 14, '#E8B233'));
    svg.appendChild(mkX(firstX + blueHighIdx * slot, pY(blueHigh) - 14, '#E8B233'));

    // current price horizontal line + right-side pill
    const cy = pY(lastClose);
    svg.appendChild(el('line', {
      x1: leftPad, y1: cy, x2: plotRight, y2: cy,
      stroke: changeColor, 'stroke-width': 1,
      'stroke-dasharray': '2 4', opacity: 0.6
    }));
    const pill = el('g');
    pill.appendChild(el('rect', {
      x: plotRight + 3, y: cy - 10,
      width: 78, height: 20, rx: 3, fill: changeColor
    }));
    pill.appendChild(el('text', {
      x: plotRight + 42, y: cy + 5,
      'font-family': MONO, 'font-size': 12,
      fill: '#0A0A0A', 'font-weight': '700',
      'text-anchor': 'middle'
    }, fmt(lastClose)));
    svg.appendChild(pill);
  })();

  /* ------------------------------------------------------------------
     Trend viz (features section · Smart candle coloring tile)

     TWO-STAGE PIPELINE — price first, color second.

     Stage 1: simulate a realistic continuous price path (tick-level
     geometric Brownian motion with phase-based drift). No regime
     labels yet — it's just price.

     Stage 2: color each bar the way a real 3-color indicator would —
     EMA(fast) vs EMA(slow) separation + slope, normalized by ATR.
     This naturally produces authentic LAG: color flips a few bars
     AFTER each trend change (not coincident with it), and sharp
     move candles stay the color of the dominant regime even when
     they visually look opposite — exactly like a real indicator.
     ------------------------------------------------------------------ */
  (function renderTrendViz() {
    const g = document.querySelector('.trend-viz__candles');
    if (!g) return;
    const NS = 'http://www.w3.org/2000/svg';
    const W = 480, H = 140;
    const PAL = SITE.chartPalette || {};
    const COL = {
      r: PAL.bearish || '#FF4D5E',
      y: PAL.neutral || '#E8B233',
      g_: PAL.bullishGreen || '#4ADE80',
    };

    const el = (tag, attrs) => {
      const e = document.createElementNS(NS, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      return e;
    };

    const rng = (() => {
      let s = 0x7a3cf1;
      return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    })();
    const gauss = () => (rng() + rng() + rng() + rng() + rng() + rng() - 3);

    const N = 48;
    const TICKS = 22;

    /* ---- Stage 1 · Simulate a continuous price path ---- */
    // Phase envelope (0..1 across the chart):
    //   0.00 – 0.42  downtrend  (steepening, then bottoming)
    //   0.42 – 0.62  base / chop (slight mean reversion)
    //   0.62 – 1.00  uptrend    (accelerating, then easing)
    const phase = (t) => {
      if (t < 0.42) {
        const u = t / 0.42;
        return { drift: -(0.30 + 1.15 * Math.sin(u * Math.PI)), vol: 0.55, chop: 0 };
      }
      if (t < 0.62) {
        return { drift: 0, vol: 0.38, chop: 1 };
      }
      const u = (t - 0.62) / 0.38;
      return { drift: 0.32 + 1.05 * Math.sin(u * Math.PI), vol: 0.55, chop: 0 };
    };

    const bars = [];
    let price = 92;
    let baseLevel = null; // captured when we enter the chop phase

    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const { drift, vol, chop } = phase(t);
      if (chop && baseLevel === null) baseLevel = price;

      const driftPerTick = drift / TICKS;
      const ticks = [price];
      for (let j = 0; j < TICKS; j++) {
        const last = ticks[ticks.length - 1];
        let step = driftPerTick + gauss() * vol;
        // Gentle mean reversion during chop so big directional candles don't sneak in
        if (chop) step += (baseLevel - last) * 0.08;
        ticks.push(last + step);
      }

      // Occasional rejection spike → pin-bar / hammer / shooting-star wicks.
      // Skip inside chop to keep the consolidation visually calm.
      if (!chop && rng() < 0.22) {
        const idx = 4 + Math.floor(rng() * (TICKS - 8));
        const dir = rng() < 0.5 ? -1 : 1;
        const mag = 1.2 + rng() * 2.0;
        const prev = ticks[idx - 1];
        const next = ticks[idx + 1];
        ticks[idx] += dir * mag;
        if (next !== undefined) ticks[idx + 1] = prev + (next - prev) * 0.5;
      }

      const o = ticks[0];
      const c = ticks[ticks.length - 1];
      let h = -Infinity, l = Infinity;
      for (const v of ticks) { if (v > h) h = v; if (v < l) l = v; }

      bars.push({ o, c, h, l });
      price = c;
    }

    /* ---- Stage 2 · Color the bars like a real EMA indicator ---- */
    const ema = (arr, period) => {
      const k = 2 / (period + 1);
      let e = arr[0];
      return arr.map(v => (e = v * k + e * (1 - k)));
    };
    const closes = bars.map(b => b.c);
    const emaFast = ema(closes, 8);
    const emaSlow = ema(closes, 20);

    // ATR (14) for adaptive thresholds
    const tr = bars.map((b, i) => {
      if (i === 0) return b.h - b.l;
      const pc = bars[i - 1].c;
      return Math.max(b.h - b.l, Math.abs(b.h - pc), Math.abs(b.l - pc));
    });
    const atrArr = ema(tr, 14);

    const LOOKBACK = 3;
    const candles = bars.map((b, i) => {
      const sep = emaFast[i] - emaSlow[i];
      const slope = i >= LOOKBACK ? emaFast[i] - emaFast[i - LOOKBACK] : 0;
      const atr = atrArr[i];
      const sepThresh = atr * 0.35;
      const slopeThresh = atr * 0.18;

      let regime;
      const flatEmas = Math.abs(sep) < sepThresh;
      const flatSlope = Math.abs(slope) < slopeThresh;

      if (flatEmas || flatSlope) {
        regime = 'y';                          // consolidation
      } else if (sep > 0 && slope > 0) {
        regime = 'g_';                         // bullish (both agree)
      } else if (sep < 0 && slope < 0) {
        regime = 'r';                          // bearish (both agree)
      } else {
        regime = 'y';                          // transition / disagreement
      }
      return { ...b, regime };
    });

    /* ---- Render ---- */
    let pMin = Infinity, pMax = -Infinity;
    for (const k of candles) {
      if (k.l < pMin) pMin = k.l;
      if (k.h > pMax) pMax = k.h;
    }
    const pad = (pMax - pMin) * 0.05;
    pMin -= pad; pMax += pad;
    const TOP = 6, BOT = H - 6;
    const yFor = (v) => TOP + (pMax - v) * (BOT - TOP) / (pMax - pMin);

    const slot = W / N;
    const bodyW = Math.max(3.0, Math.min(6.2, slot * 0.52));

    candles.forEach((k, i) => {
      const cx = i * slot + slot / 2;
      const color = COL[k.regime];
      const yTop = Math.min(yFor(k.o), yFor(k.c));
      const yBot = Math.max(yFor(k.o), yFor(k.c));
      const bodyH = Math.max(0.8, yBot - yTop);

      g.appendChild(el('line', {
        x1: cx, y1: yFor(k.h), x2: cx, y2: yFor(k.l),
        stroke: color, 'stroke-width': 1, opacity: 0.9,
        'stroke-linecap': 'round'
      }));
      g.appendChild(el('rect', {
        x: cx - bodyW / 2, y: yTop,
        width: bodyW, height: bodyH,
        fill: color, rx: 0.6
      }));
    });
  })();

})();
