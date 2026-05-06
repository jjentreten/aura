/**
 * Cupom no carrinho (mini-cart + /cart.html)
 * - Aplica via POST /cart/coupon.js { code, sections }
 * - Remove via POST /cart/coupon/clear.js
 * - Mostra aviso se subtotal < R$ 199,90 (AURA/AURA40)
 */
(function () {
  'use strict';

  function qs(root, sel) { return (root || document).querySelector(sel); }

  function fmtBRL(cents) {
    var s = (Number(cents || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return 'R$ ' + s;
  }

  function setMessage(root, msg, isError) {
    var wrap = qs(root, '.cart-coupon__message-wrapper');
    var p = qs(root, '.cart-coupon__message');
    if (!wrap || !p) return;
    p.textContent = msg || '';
    wrap.style.display = msg ? '' : 'none';
    wrap.style.color = isError ? '#b00020' : '#0b6b2f';
  }

  function setApplied(root, code) {
    var inner = qs(root, '.cart-coupon__inner');
    var applied = qs(root, '.cart-coupon__applied');
    var appliedVal = qs(root, '.cart-coupon__applied-value');
    if (inner) inner.style.display = code ? 'none' : '';
    if (applied) applied.style.display = code ? '' : 'none';
    if (appliedVal) appliedVal.textContent = code ? code : '';
  }

  function getSections() {
    // mantém compatível com aura-cart-add-fix
    return ['mini-cart', 'cart-icon-bubble', 'mobile-cart-icon-bubble'];
  }

  function renderSectionsFromResponse(data) {
    if (!data || !data.sections) return;
    try {
      var mini = document.querySelector('mini-cart');
      if (mini && typeof mini.renderContents === 'function') {
        mini.renderContents(data);
      }
    } catch (e) {}
    // fallback simples pro bubble
    try {
      var icon = document.getElementById('cart-icon-bubble');
      if (icon && data.sections['cart-icon-bubble']) {
        var doc = new DOMParser().parseFromString(String(data.sections['cart-icon-bubble']), 'text/html');
        var node = doc.querySelector('.shopify-section');
        if (node) icon.innerHTML = node.innerHTML;
      }
      var mob = document.getElementById('mobile-cart-icon-bubble');
      if (mob && data.sections['mobile-cart-icon-bubble']) {
        var doc2 = new DOMParser().parseFromString(String(data.sections['mobile-cart-icon-bubble']), 'text/html');
        var node2 = doc2.querySelector('.shopify-section');
        if (node2) mob.innerHTML = node2.innerHTML;
      }
    } catch (e2) {}
  }

  async function applyCoupon(root, code) {
    setMessage(root, '', false);
    var payload = { code: code, sections: getSections(), sections_url: window.location.pathname || '/' };
    var res = await fetch('/cart/coupon.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });
    var data = await res.json().catch(function () { return {}; });
    renderSectionsFromResponse(data);

    if (!res.ok) {
      var msg = data && data.message ? data.message : 'Não foi possível aplicar o cupom.';
      setMessage(root, msg, true);
      setApplied(root, '');
      return;
    }
    setApplied(root, (code || '').toUpperCase());
    setMessage(root, 'Cupom aplicado!', false);
  }

  async function clearCoupon(root) {
    setMessage(root, '', false);
    var payload = { sections: getSections(), sections_url: window.location.pathname || '/' };
    var res = await fetch('/cart/coupon/clear.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });
    var data = await res.json().catch(function () { return {}; });
    renderSectionsFromResponse(data);
    setApplied(root, '');
  }

  function bind(root) {
    if (!root || root._auraCouponBound) return;
    root._auraCouponBound = true;

    var input = qs(root, '.cart-coupon__input');
    var btn = qs(root, '.cart-coupon__button');
    var removeBtn = qs(root, '.cart-coupon__applied-remove');

    if (btn) {
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        var code = input ? String(input.value || '').trim() : '';
        if (!code) {
          setMessage(root, 'Digite um cupom.', true);
          return;
        }
        applyCoupon(root, code);
      });
    }
    if (removeBtn) {
      removeBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        clearCoupon(root);
      });
    }
  }

  function init() {
    document.querySelectorAll('cart-coupon, .cart-coupon__main-cart').forEach(bind);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Re-bind após render do mini-cart
  document.addEventListener('ajaxProduct:added', function () { setTimeout(init, 50); });
})();

