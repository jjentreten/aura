/**
 * Sincroniza as páginas estáticas de checkout com o carrinho real do servidor (/cart.js).
 * Requer servidor local (python3 server.py) para o carrinho em memória funcionar.
 */
(function () {
  'use strict';

  /** Esconde e-mail/endereço estáticos do HTML até preencher com dados do lead (evita “flash” duplo). */
  (function injectReviewPlaceholderHide() {
    try {
      var path = typeof location !== 'undefined' ? location.pathname || '' : '';
      if (path.indexOf('checkout-frete') === -1 && path.indexOf('checkout-pagamento') === -1) return;
      if (document.getElementById('aura-review-placeholder-hide')) return;
      var st = document.createElement('style');
      st.id = 'aura-review-placeholder-hide';
      st.textContent =
        'html:not(.aura-review-hydrated) #checkout-main [role="table"] [role="cell"] span[dir="ltr"],' +
        'html:not(.aura-review-hydrated) #checkout-main [role="table"] [role="cell"] address{' +
        'visibility:hidden!important}';
      (document.head || document.documentElement).appendChild(st);
    } catch (e) {}
  })();

  var STORAGE_SHIPPING = 'aura_mock_shipping_cents';
  var STORAGE_SHIPPING_LABEL = 'aura_mock_shipping_label';
  var STORAGE_CHECKOUT_INFO = 'aura_checkout_info';

  var SHIPPING_FREE_THRESHOLD = 14990; // R$ 149,90
  var ECON_LABEL = 'Mandaê Econômico';
  var FAST_LABEL = 'Mandaê Rápido';
  var ECON_PRICE = 1441; // R$ 14,41
  var FAST_PRICE = 2441; // R$ 24,41
  var ECON_DAYS = 14;
  var FAST_DAYS = 7;

  function showLoadingModal(label) {
    try {
      if (document.getElementById('aura-checkout-loading')) return;
      var overlay = document.createElement('div');
      overlay.id = 'aura-checkout-loading';
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.zIndex = '999999';
      overlay.style.background = 'rgba(0,0,0,0.35)';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.padding = '24px';

      var card = document.createElement('div');
      card.style.background = '#fff';
      card.style.borderRadius = '14px';
      card.style.width = 'min(420px, 100%)';
      card.style.boxShadow = '0 18px 60px rgba(0,0,0,0.22)';
      card.style.padding = '18px 16px';
      card.style.display = 'flex';
      card.style.gap = '12px';
      card.style.alignItems = 'center';

      var spinner = document.createElement('div');
      spinner.style.width = '18px';
      spinner.style.height = '18px';
      spinner.style.border = '3px solid #e6e6e6';
      spinner.style.borderTopColor = '#111';
      spinner.style.borderRadius = '50%';
      spinner.style.animation = 'auraSpin 0.9s linear infinite';

      var text = document.createElement('div');
      text.style.fontSize = '14px';
      text.style.fontWeight = '600';
      text.style.color = '#111';
      text.textContent = label || 'Carregando…';

      var style = document.createElement('style');
      style.textContent = '@keyframes auraSpin{to{transform:rotate(360deg)}}';

      card.appendChild(spinner);
      card.appendChild(text);
      overlay.appendChild(card);
      document.head.appendChild(style);
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
    } catch (e) {}
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function normalizeReviewHeader(t) {
    return String(t || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function findReviewTable() {
    var headers = document.querySelectorAll('[role="rowheader"]');
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i];
      if (normalizeReviewHeader(h.textContent) === 'Contato') {
        var table = h.closest('[role="table"]');
        if (table) return table;
      }
    }
    return null;
  }

  function saveCheckoutInfoFromForm(form) {
    if (!form) return;
    var fd = new FormData(form);
    function get(name) {
      var v = fd.get(name);
      return v == null ? '' : String(v).trim();
    }
    var info = {
      email: get('email'),
      firstName: get('firstName'),
      lastName: get('lastName'),
      phone: get('phone'),
      streetName: get('streetName'),
      streetNumber: get('streetNumber'),
      line2: get('line2'),
      neighborhood: get('neighborhood'),
      address1: get('address1'),
      city: get('city'),
      province: get('province'),
      zone: get('zone'),
      postalCode: get('postalCode'),
      country: get('country'),
      countryCode: get('countryCode'),
    };
    try {
      sessionStorage.setItem(STORAGE_CHECKOUT_INFO, JSON.stringify(info));
    } catch (e) {}
  }

  function readCheckoutInfo() {
    try {
      var raw = sessionStorage.getItem(STORAGE_CHECKOUT_INFO);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function formatAddressFromInfo(info) {
    if (!info) return '';
    var parts = [];
    var line1 = [info.streetName || info.address1, info.streetNumber].filter(Boolean).join(', ');
    if (line1) parts.push(line1);
    var line2 = info.line2 || info.neighborhood;
    if (line2) parts.push(line2);
    var region = info.province || info.zone || '';
    var cityLine = [info.postalCode, info.city, region].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    if (cityLine) parts.push(cityLine);
    if (info.country) parts.push(info.country);
    return parts.join(', ');
  }

  function readSelectedShippingLabel() {
    var radio = document.querySelector('input[name="shipping_methods"]:checked');
    if (!radio || !radio.id) return '';
    var labelEl = document.querySelector('label[for="' + radio.id + '"]');
    if (!labelEl) return '';
    var p = labelEl.querySelector('p._1tx8jg70');
    return p ? p.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  function hydrateReviewRows() {
    var table = findReviewTable();
    if (!table) return;
    var info = readCheckoutInfo();
    var shipCents = getShippingFromSession();
    var shipLabel = '';
    try {
      shipLabel = sessionStorage.getItem(STORAGE_SHIPPING_LABEL) || '';
    } catch (e) {}
    if (!shipLabel && detectPage() === 'shipping') {
      shipLabel = readSelectedShippingLabel();
    }

    var rows = table.querySelectorAll('[role="row"]');
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var rh = row.querySelector('[role="rowheader"]');
      if (!rh) continue;
      var h = normalizeReviewHeader(rh.textContent);
      if (h === 'Contato') {
        var span = row.querySelector('[role="cell"] span[dir="ltr"]');
        if (span) span.textContent = info && info.email ? info.email : '';
      }
      if (h === 'Enviar para') {
        var addr = row.querySelector('address');
        if (addr) {
          var txt = info ? formatAddressFromInfo(info) : '';
          addr.textContent = txt || '';
        }
      }
      if (h === 'Forma de frete') {
        var p = row.querySelector('p._1tx8jg70');
        var lbl = shipLabel || 'Frete';
        if (p) {
          p.innerHTML =
            escapeHtml(lbl) +
            ' · <strong translate="no" class="_19gi7yt0 _19gi7yt18 _19gi7yt1g _19gi7yt1s _19gi7yt1k _1fragemvv _1fragem3h notranslate">' +
            fmtBRLNbsp(shipCents) +
            '</strong>';
        }
      }
    }
  }

  function attachFormNavHandlers() {
    var page = detectPage();
    if (page === 'info') {
      var form0 = document.getElementById('Form0');
      if (form0) {
        form0.addEventListener('submit', function (e) {
          e.preventDefault();
          showLoadingModal('Indo para o frete…');
          saveCheckoutInfoFromForm(form0);
          setTimeout(function () { window.location.href = '/checkout-frete.html'; }, 280);
        });
      }
    }
    if (page === 'shipping') {
      var form2 = document.getElementById('Form2');
      if (form2) {
        form2.addEventListener('submit', function (e) {
          e.preventDefault();
          showLoadingModal('Indo para o pagamento…');
          var c = readSelectedShippingCents(window.__auraCart || null);
          var lbl = readSelectedShippingLabel();
          try {
            sessionStorage.setItem(STORAGE_SHIPPING, String(c));
            sessionStorage.setItem(STORAGE_SHIPPING_LABEL, lbl);
          } catch (err) {}
          setTimeout(function () { window.location.href = '/checkout-pagamento.html'; }, 280);
        });
      }
    }
  }

  function fmtBRLNbsp(cents) {
    var s = (Number(cents) / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return 'R$\u00a0' + s;
  }

  function parseBRLToCents(text) {
    if (!text) return 0;
    var m = String(text).replace(/\u00a0/g, ' ').match(/R\$\s*([\d]{1,3}(?:\.[\d]{3})*,\d{2}|[\d]+,\d{2})/);
    if (!m) return 0;
    var num = m[1].replace(/\./g, '').replace(',', '.');
    var v = Math.round(parseFloat(num) * 100);
    return isNaN(v) ? 0 : v;
  }

  function findOrderAside() {
    return document.querySelector('.i4DWM ._4QenE aside');
  }

  function clearMobileDisclosureClone() {
    var dd = document.getElementById('disclosure_details');
    if (!dd) return;
    var inner = dd.firstElementChild;
    if (inner) inner.innerHTML = '';
  }

  function syncLineItems(aside, cart) {
    var h3 = aside.querySelector('h3[id^="ResourceList"]');
    if (!h3) return;
    var table = aside.querySelector('[role="table"][aria-labelledby="' + h3.id + '"]');
    if (!table) return;
    var groups = table.querySelectorAll('[role="rowgroup"]');
    if (groups.length < 2) return;
    var body = groups[groups.length - 1];
    var template = body.querySelector('[role="row"]._6zbcq51k, [role="row"]');
    if (!template) return;

    body.querySelectorAll('[role="row"]').forEach(function (row) {
      row.remove();
    });

    (cart.items || []).forEach(function (it) {
      var row = template.cloneNode(true);
      var title = it.product_title || it.title || 'Produto';
      var qty = it.quantity || 1;
      var lineCents = it.final_line_price != null ? it.final_line_price : it.line_price || 0;
      var imgPath = it.image || '';
      if (imgPath && imgPath.charAt(0) !== '/' && imgPath.indexOf('http') !== 0) {
        imgPath = '/' + imgPath;
      }
      var img = row.querySelector('img');
      if (img) {
        img.src = imgPath;
        img.srcset = '';
        img.alt = title;
      }
      var titleEl = row.querySelector('.dDm6x p._1tx8jg70, [role="cell"] p._1tx8jg70');
      if (titleEl) titleEl.textContent = title;
      var cells = row.querySelectorAll('[role="cell"]');
      if (cells.length >= 3) {
        var qtySpan = cells[2].querySelector('span');
        if (qtySpan) qtySpan.textContent = String(qty);
      }
      var priceSpan = row.querySelector('.Byb5s span.notranslate');
      if (!priceSpan && cells.length >= 4) {
        priceSpan = cells[3].querySelector('span.notranslate');
      }
      if (priceSpan) priceSpan.textContent = fmtBRLNbsp(lineCents);
      body.appendChild(row);
    });
  }

  function findMoneyTable(aside) {
    var h3 = aside.querySelector('h3[id^="MoneyLine-Heading"]');
    if (!h3) return null;
    return aside.querySelector('[role="table"][aria-labelledby="' + h3.id + '"]');
  }

  function setRowAmount(table, labelText, valueHtml, isSubdued) {
    if (!table) return;
    var groups = table.querySelectorAll('[role="rowgroup"]');
    if (groups.length < 2) return;
    var body = groups[groups.length - 1];
    var rows = body.querySelectorAll('[role="row"]');
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var hdr = row.querySelector('[role="rowheader"]');
      if (!hdr) continue;
      var txt = hdr.textContent.replace(/\s+/g, ' ').trim();
      if (txt.indexOf(labelText) === -1) continue;
      var cell = row.querySelector('[role="cell"]');
      if (!cell) continue;
      var span = cell.querySelector('span.notranslate, span._19gi7ytb');
      if (!span) span = cell.querySelector('span');
      if (!span) continue;
      span.classList.remove('_19gi7yt1h');
      if (isSubdued) span.classList.add('_19gi7yt1h');
      span.textContent = valueHtml;
      return;
    }
  }

  function setTotalRow(table, cents) {
    if (!table) return;
    var groups = table.querySelectorAll('[role="rowgroup"]');
    if (groups.length < 2) return;
    var body = groups[groups.length - 1];
    var row = body.querySelector('[role="row"]._1x41w3p1, [role="row"]:last-child');
    if (!row) return;
    var strong = row.querySelector('[role="cell"] strong.notranslate');
    if (strong) strong.textContent = fmtBRLNbsp(cents);
  }

  function syncHeaderTotal(cart, totalCents) {
    var btn = document.querySelector('button[aria-controls="disclosure_details"]');
    if (!btn) return;
    var strong = btn.querySelector('strong.notranslate, strong._19gi7yt1k');
    if (strong) strong.textContent = fmtBRLNbsp(totalCents);
  }

  function getShippingFromSession() {
    try {
      var raw = sessionStorage.getItem(STORAGE_SHIPPING);
      if (raw == null || raw === '') return 0;
      return parseInt(raw, 10) || 0;
    } catch (e) {
      return 0;
    }
  }

  function syncPageMoney(aside, cart, page) {
    var sub = cart.total_price || 0;
    var table = findMoneyTable(aside);
    setRowAmount(table, 'Subtotal', fmtBRLNbsp(sub), false);

    var shipCents = 0;
    var shipDisplay = '';

    if (page === 'info') {
      shipDisplay = 'Calculado na próxima etapa';
      setRowAmount(table, 'Frete', shipDisplay, true);
      setTotalRow(table, sub);
      syncHeaderTotal(cart, sub);
      return;
    }

    if (page === 'shipping') {
      shipCents = readSelectedShippingCents(cart);
      try {
        sessionStorage.setItem(STORAGE_SHIPPING, String(shipCents));
      } catch (e) {}
      shipDisplay = fmtBRLNbsp(shipCents);
      setRowAmount(table, 'Frete', shipDisplay, false);
      setTotalRow(table, sub + shipCents);
      syncHeaderTotal(cart, sub + shipCents);
      return;
    }

    if (page === 'payment') {
      shipCents = getShippingFromSession();
      if (!shipCents) {
        shipCents = readSelectedShippingCents(cart);
      }
      shipDisplay = fmtBRLNbsp(shipCents);
      setRowAmount(table, 'Frete', shipDisplay, false);
      setTotalRow(table, sub + shipCents);
      syncHeaderTotal(cart, sub + shipCents);
    }
  }

  function patchShippingOptionTexts(cart) {
    if (detectPage() !== 'shipping') return;
    var sub = cart && typeof cart.total_price === 'number' ? cart.total_price : 0;
    var isFree = sub >= SHIPPING_FREE_THRESHOLD;

    document.querySelectorAll('input[name="shipping_methods"]').forEach(function (radio) {
      if (!radio || !radio.id) return;
      var sec = document.getElementById(radio.id + '-secondary');
      var label = document.querySelector('label[for="' + radio.id + '"]');
      if (!sec || !label) return;

      var name = '';
      var p = label.querySelector('p._1tx8jg70');
      if (p) name = p.textContent.replace(/\s+/g, ' ').trim();
      if (!name) name = label.textContent.replace(/\s+/g, ' ').trim();

      if (name.indexOf(ECON_LABEL) !== -1) {
        // Ex: "Mandaê Econômico · 14 dias"
        if (p) p.textContent = ECON_LABEL + ' · ' + ECON_DAYS + ' dias';
        sec.textContent = isFree ? 'Grátis' : fmtBRLNbsp(ECON_PRICE);
      }
      if (name.indexOf(FAST_LABEL) !== -1) {
        if (p) p.textContent = FAST_LABEL + ' · ' + FAST_DAYS + ' dias';
        sec.textContent = fmtBRLNbsp(FAST_PRICE);
      }
    });
  }

  function readSelectedShippingCents(cart) {
    var radio = document.querySelector('input[name="shipping_methods"]:checked');
    if (!radio || !radio.id) return 0;
    var sub = cart && typeof cart.total_price === 'number' ? cart.total_price : 0;
    var sec = document.getElementById(radio.id + '-secondary');
    if (!sec) return 0;
    var label = readSelectedShippingLabel();
    if (label.indexOf(ECON_LABEL) !== -1) {
      return (sub >= SHIPPING_FREE_THRESHOLD) ? 0 : ECON_PRICE;
    }
    if (label.indexOf(FAST_LABEL) !== -1) {
      return FAST_PRICE;
    }
    return parseBRLToCents(sec.textContent);
  }

  function detectPage() {
    var p = location.pathname || '';
    if (p.indexOf('checkout-frete') !== -1) return 'shipping';
    if (p.indexOf('checkout-pagamento') !== -1) return 'payment';
    if (p.indexOf('checkout.html') !== -1 || p.endsWith('/checkout')) return 'info';
    return 'info';
  }

  function attachShippingListeners() {
    if (detectPage() !== 'shipping') return;
    function save() {
      var cart = window.__auraCart || null;
      var c = readSelectedShippingCents(cart);
      var lbl = readSelectedShippingLabel();
      try {
        sessionStorage.setItem(STORAGE_SHIPPING, String(c));
        sessionStorage.setItem(STORAGE_SHIPPING_LABEL, lbl);
      } catch (e) {}
      hydrateReviewRows();
      fetch('/cart.js', { credentials: 'same-origin' })
        .then(function (r) {
          return r.json();
        })
        .then(function (cart) {
          window.__auraCart = cart;
          patchShippingOptionTexts(cart);
          var aside = findOrderAside();
          if (aside) syncPageMoney(aside, cart, 'shipping');
        })
        .catch(function () {});
    }
    document.querySelectorAll('input[name="shipping_methods"]').forEach(function (r) {
      r.addEventListener('change', save);
    });
    save();
  }

  async function init() {
    var cart;
    try {
      var res = await fetch('/cart.js', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('cart');
      cart = await res.json();
    } catch (e) {
      window.location.href = '/cart.html';
      return;
    }

    window.__auraCart = cart;

    if (!cart.item_count) {
      window.location.href = '/cart.html';
      return;
    }

    var page = detectPage();
    hydrateReviewRows();
    try {
      document.documentElement.classList.add('aura-review-hydrated');
    } catch (e) {}

    var aside = findOrderAside();
    if (!aside) return;

    syncLineItems(aside, cart);
    syncPageMoney(aside, cart, page);
    clearMobileDisclosureClone();
    attachFormNavHandlers();
    attachShippingListeners();

    // Atualiza textos de frete com preços/prazos e regra de grátis
    patchShippingOptionTexts(cart);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
