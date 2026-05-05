/**
 * Corrige adicionar ao carrinho no espelho estático:
 * - getSectionInnerHTML seguro (evita exceção que interrompe o fluxo)
 * - open() do mini-cart tolerante a drawer ausente
 * - action dos formulários normalizada para /cart/add
 * - formulários PDP: POST JSON em /cart/add.js (evita multipart)
 * - botões <add-to-cart> das vitrines: mesmo fluxo JSON com captura antes do tema
 */
(function () {
  'use strict';

  var PATCH = {};

  function safeSectionHtml(html, sel) {
    if (html == null || html === '') return '';
    try {
      var doc = new DOMParser().parseFromString(String(html), 'text/html');
      var node = doc.querySelector(sel || '.shopify-section');
      return node ? node.innerHTML : '';
    } catch (e) {
      return '';
    }
  }

  function patchGetSectionInnerHTML(tag) {
    if (PATCH[tag]) return;
    var Ctor = customElements.get(tag);
    if (!Ctor || !Ctor.prototype) return;
    PATCH[tag] = true;
    Ctor.prototype.getSectionInnerHTML = function (html, sel) {
      return safeSectionHtml(html, sel);
    };
  }

  function patchMiniCartOpen() {
    var Ctor = customElements.get('mini-cart');
    if (!Ctor || !Ctor.prototype || Ctor.prototype._auraOpenPatched) return;
    Ctor.prototype._auraOpenPatched = true;
    var orig = Ctor.prototype.open;
    if (typeof orig !== 'function') return;
    Ctor.prototype.open = function () {
      try {
        if (!this.drawer) {
          this.drawer = document.querySelector('cart-drawer');
        }
        if (!this.drawer) return;
        var det = this.drawer.querySelector('details');
        if (!det) return;
        return orig.call(this);
      } catch (e) {
        console.warn('mini-cart.open:', e);
      }
    };
  }

  function applyPatches() {
    patchGetSectionInnerHTML('mini-cart');
    patchGetSectionInnerHTML('cart-items');
    patchMiniCartOpen();
  }

  customElements.whenDefined('mini-cart').then(applyPatches);
  customElements.whenDefined('cart-items').then(applyPatches);
  applyPatches();

  window.theme = window.theme || {};
  window.theme.shopSettings = window.theme.shopSettings || {};
  if (typeof window.theme.shopSettings.cartDrawer !== 'boolean') {
    window.theme.shopSettings.cartDrawer = true;
  }

  function sectionIdsPayload() {
    var ids = [];
    var mini = document.querySelector('mini-cart');
    if (mini && typeof mini.getSectionsToRender === 'function') {
      try {
        ids = mini.getSectionsToRender().map(function (s) {
          return s.id;
        });
      } catch (e1) {}
    }
    if (!ids.length) {
      ids = ['mini-cart', 'cart-icon-bubble', 'mobile-cart-icon-bubble'];
    }
    return ids;
  }

  function showFormError(form, msg) {
    if (!form) return;
    var pf = form.closest('product-form');
    if (pf && typeof pf.handleErrorMessage === 'function') {
      pf.handleErrorMessage(msg || false);
      if (msg) return;
    }
    var wrap = form.querySelector('.product-form__error-message-wrapper');
    var span = form.querySelector('.product-form__error-message');
    if (wrap && span) {
      wrap.toggleAttribute('hidden', !msg);
      if (msg) span.textContent = msg;
    } else if (msg) window.alert(msg);
  }

  function setUiLoading(ui, on) {
    if (!ui) return;
    var btn = ui.submitBtn;
    var atc = ui.addToCartEl;
    if (on) {
      if (btn) {
        btn.classList.add('loading');
        btn.setAttribute('aria-disabled', 'true');
      }
      if (atc) {
        atc.classList.add('loading');
        atc.setAttribute('disabled', '');
      }
    } else {
      if (btn) {
        btn.classList.remove('loading');
        btn.removeAttribute('aria-disabled');
      }
      if (atc) {
        atc.classList.remove('loading');
        atc.removeAttribute('disabled');
      }
    }
  }

  function performAddVariant(variantId, quantity, ui) {
    var vid = String(variantId || '').trim();
    if (!vid) return;

    ui = ui || {};
    var form = ui.form;
    var mini = document.querySelector('mini-cart');
    var qty = quantity && quantity > 0 ? quantity : 1;

    if (form) showFormError(form, false);
    setUiLoading(ui, true);

    var payload = {
      id: vid,
      quantity: qty,
      sections: sectionIdsPayload(),
      sections_url: window.location.pathname || '/',
    };

    return fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { res: res, data: data };
        });
      })
      .then(function (got) {
        var data = got.data;
        var errMsg = null;

        if (Number(data.status) === 422) {
          errMsg = data.description || data.message || 'Não foi possível adicionar ao carrinho.';
        } else if (data.status && Number(data.status) >= 400) {
          errMsg = data.description || data.message || 'Não foi possível adicionar ao carrinho.';
        } else if (!got.res.ok && data.message) {
          errMsg = data.message;
        }

        if (errMsg) {
          if (form) showFormError(form, errMsg);
          try {
            document.dispatchEvent(
              new CustomEvent('ajaxProduct:error', { detail: { errorMessage: errMsg } })
            );
          } catch (e0) {}
          return;
        }

        try {
          if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
            publish(PUB_SUB_EVENTS.cartUpdate, {
              source: 'aura-cart-add-fix',
              productVariantId: vid,
            });
          }
        } catch (e2) {}

        if (mini && typeof mini.renderContents === 'function' && data && data.sections) {
          try {
            mini.renderContents(data);
          } catch (e3) {
            console.warn('renderContents:', e3);
          }
        }

        try {
          document.dispatchEvent(new CustomEvent('ajaxProduct:added', { detail: { product: data } }));
        } catch (e4) {}
      })
      .catch(function (err) {
        console.error(err);
        if (form) showFormError(form, 'Erro ao adicionar ao carrinho. Tente de novo.');
        try {
          document.dispatchEvent(
            new CustomEvent('ajaxProduct:error', { detail: { errorMessage: 'Erro de rede' } })
          );
        } catch (e5) {}
      })
      .finally(function () {
        setUiLoading(ui, false);
      });
  }

  function normalizeCartFormActions() {
    document.querySelectorAll('form.shopify-product-form[data-type="add-to-cart-form"]').forEach(function (form) {
      if (!form.classList.contains('installment')) {
        form.setAttribute('action', '/cart/add');
      }
    });
  }

  function bindFormCapture(form) {
    if (form._auraSubmitCapture) return;
    form._auraSubmitCapture = true;
    form.addEventListener(
      'submit',
      function (ev) {
        if (form.getAttribute('data-type') !== 'add-to-cart-form') return;
        if (form.classList.contains('installment')) return;
        if (document.body.classList.contains('template-cart')) return;
        var sd = window.theme && window.theme.shopSettings;
        if (sd && sd.cartDrawer === false) return;

        ev.preventDefault();
        ev.stopImmediatePropagation();

        var btn = form.querySelector('button[type="submit"], input[type="submit"]');
        if (btn && btn.classList.contains('loading')) return;

        var idInput = form.querySelector('input[name="id"]');
        if (idInput) idInput.disabled = false;
        var vid = idInput && String(idInput.value || '').trim();
        if (!vid) {
          showFormError(form, 'Selecione uma opção do produto.');
          return;
        }

        var qEl = form.querySelector('input[name="quantity"], select[name="quantity"]');
        var qty = 1;
        if (qEl && qEl.value !== '') {
          var n = parseInt(qEl.value, 10);
          if (!isNaN(n) && n > 0) qty = n;
        }

        performAddVariant(vid, qty, { form: form, submitBtn: btn });
      },
      true
    );
  }

  function bindAddToCart(el) {
    if (!el || el._auraAtcCapture) return;
    el._auraAtcCapture = true;
    el.addEventListener(
      'click',
      function (ev) {
        if (document.body.classList.contains('template-cart')) return;
        var sd = window.theme && window.theme.shopSettings;
        if (sd && sd.cartDrawer === false) return;
        var vid = el.dataset && el.dataset.variantId;
        if (!vid) return;

        ev.preventDefault();
        ev.stopImmediatePropagation();

        performAddVariant(vid, 1, { addToCartEl: el });
      },
      true
    );
  }

  function wireAll() {
    normalizeCartFormActions();
    document.querySelectorAll('form.shopify-product-form[data-type="add-to-cart-form"]').forEach(bindFormCapture);
    document.querySelectorAll('add-to-cart[data-variant-id]').forEach(bindAddToCart);
  }

  wireAll();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireAll);
  }
  try {
    new MutationObserver(wireAll).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e6) {}
})();
