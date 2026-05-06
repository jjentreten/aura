/**
 * Preços promocionais dos produtos da seção "Destaque AURA Beauty" (home).
 * Ajusta cards em qualquer página + bloco de preço da PDP para combinar com o carrinho (product_catalog.json).
 */
(function () {
  'use strict';

  var MAP = {
    '55440325673128': { compare: 12900, sale: 10320 },
    '49426967756968': { compare: 11900, sale: 7615 },
    '53373297066152': { compare: 11900, sale: 7615 },
    '53215986155688': { compare: 11120, sale: 8896 },
    '55414174810280': { compare: 31760, sale: 25408 },
    '54614076162216': { compare: 10320, sale: 8256 },
    '54834813927592': { compare: 11120, sale: 10008 },
    '51880530280616': { compare: 18900, sale: 15120 },
    '52738805137576': { compare: 11900, sale: 9520 },
  };

  function fmtBRLFromCents(cents) {
    var n = cents / 100;
    return (
      'R$ ' +
      n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }

  function patchPriceEl(priceEl, vid) {
    var cfg = MAP[vid];
    if (!cfg || !priceEl) return;
    var compare = cfg.compare;
    var sale = cfg.sale;
    if (!(sale < compare)) return;

    priceEl.classList.add('price--on-sale');

    var saleBdi =
      priceEl.querySelector('.price__sale .price-item--sale price-money bdi') ||
      priceEl.querySelector('.price__sale dd:not(.price__compare) .price-item--sale bdi');
    var compareBdi =
      priceEl.querySelector('.price__compare s.price-item price-money bdi') ||
      priceEl.querySelector('dd.price__compare s.price-item bdi') ||
      priceEl.querySelector('.price__compare s bdi');

    if (saleBdi) saleBdi.textContent = fmtBRLFromCents(sale);
    if (compareBdi) compareBdi.textContent = fmtBRLFromCents(compare);

    var regBdi =
      priceEl.querySelector('.price__regular .price-item--regular price-money bdi') ||
      priceEl.querySelector('.price__regular dd .price-item--regular bdi');
    if (regBdi) regBdi.textContent = fmtBRLFromCents(sale);

    var perSix = Math.round(sale / 6);
    priceEl.querySelectorAll('.js-installment-value, .price-installment').forEach(function (el) {
      el.textContent = fmtBRLFromCents(perSix);
    });
  }

  function patchCardWrapper(wrap) {
    var btn = wrap.querySelector('[data-variant-id]');
    if (!btn) return;
    var vid = btn.getAttribute('data-variant-id');
    if (!MAP[vid]) return;
    var info = wrap.querySelector('.card-information');
    var priceEl = (info || wrap).querySelector('.price');
    patchPriceEl(priceEl, vid);

    var badgeWrap = wrap.querySelector('.card__badge');
    if (badgeWrap && !badgeWrap.querySelector('.badge')) {
      var pct = Math.round((1 - MAP[vid].sale / MAP[vid].compare) * 100);
      badgeWrap.innerHTML =
        '<span class="badge badge--onsale" aria-hidden="true">\u2013' + pct + '%</span>';
    }
  }

  function activeVariantId() {
    var form = document.querySelector('form.shopify-product-form');
    if (form) {
      var inp = form.querySelector('input[name="id"]:not([disabled])');
      if (inp && inp.value) return String(inp.value).trim();
    }
    var sel = document.querySelector('select[name="id"]');
    if (sel && sel.options && sel.selectedIndex >= 0) {
      return String(sel.options[sel.selectedIndex].value || '').trim();
    }
    return null;
  }

  function patchPdp() {
    var vid = activeVariantId();
    if (!vid || !MAP[vid]) return;
    var priceRoot = document.querySelector('[id^="price-template"]');
    if (!priceRoot) return;
    patchPriceEl(priceRoot.querySelector('.price') || priceRoot, vid);
  }

  function run() {
    document.querySelectorAll('.card-wrapper').forEach(patchCardWrapper);
    patchPdp();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
