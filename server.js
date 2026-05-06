'use strict';
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = Number.parseInt(process.env.PORT || '', 10) || 8080;
const ROOT = __dirname;

// ─── Pagou ────────────────────────────────────────────────────────────────────
const PAGOU_API_KEY = process.env.PAGOU_API_KEY || '';
const PAGOU_PUBLIC_KEY = process.env.PAGOU_PUBLIC_KEY || '';
const PAGOU_ENV = process.env.PAGOU_ENV || 'sandbox';
const PAGOU_BASE = PAGOU_ENV === 'production'
  ? 'https://api.pagou.ai'
  : 'https://api-sandbox.pagou.ai';

// ─── Utmify ───────────────────────────────────────────────────────────────────
const UTMIFY_TOKEN = process.env.UTMIFY_API_TOKEN || '';
const SITE_URL = process.env.SITE_URL || `http://localhost:${PORT}`;

// ─── Pending orders ───────────────────────────────────────────────────────────
const PENDING_FILE = path.join(ROOT, 'pending_orders.json');
function readPendingOrders() {
  try { return JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8')); } catch { return {}; }
}
function writePendingOrders(data) {
  try { fs.writeFileSync(PENDING_FILE, JSON.stringify(data), 'utf8'); } catch {}
}

// ─── Catalog & cart ───────────────────────────────────────────────────────────
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, 'product_catalog.json'), 'utf8'));
const FREE_SHIPPING_TARGET = 15900;

let cart = {
  token: 'mock_token_aura',
  note: null,
  attributes: {},
  original_total_price: 0,
  total_price: 0,
  total_discount: 0,
  total_weight: 0,
  item_count: 0,
  items: [],
  requires_shipping: true,
  currency: 'BRL',
  items_subtotal_price: 0,
  cart_level_discount_applications: [],
  discount_codes: [],
};

function recalcCart() {
  const sub = cart.items.reduce((s, i) => s + i.line_price, 0);
  cart.original_total_price = sub;
  cart.total_price = sub;
  cart.items_subtotal_price = sub;
  cart.item_count = cart.items.reduce((s, i) => s + i.quantity, 0);
}

function makeCartItem(variantId, quantity = 1) {
  const vid = String(variantId);
  const p = CATALOG[vid];
  if (!p) return null;
  const qty = Math.max(1, quantity);
  return {
    id: p.id, properties: {}, quantity: qty,
    variant_id: p.variant_id, key: `${p.variant_id}:mock`,
    title: p.title, price: p.price, original_price: p.price,
    discounted_price: p.price, line_price: p.price * qty,
    original_line_price: p.price * qty, total_discount: 0, discounts: [],
    sku: p.sku || '', grams: 0, vendor: 'AURA Beauty Club', taxable: true,
    product_id: p.product_id, gift_card: false, final_price: p.price,
    final_line_price: p.price * qty, url: p.url, image: '/' + p.image,
    handle: p.handle, requires_shipping: true, product_type: '',
    product_title: p.title, variant_title: null,
    line_level_discount_codes: [], line_level_total_discount: 0,
  };
}

// ─── Mini-cart rendering ──────────────────────────────────────────────────────
const SVG_CLOSE = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="icon icon-close" fill="none" viewBox="0 0 12 12"><path d="M1 1L11 11" stroke="currentColor" stroke-linecap="round" fill="none"></path><path d="M11 1L1 11" stroke="currentColor" stroke-linecap="round" fill="none"></path></svg>';
const SVG_SPINNER = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="icon icon-spinner" fill="none" viewBox="0 0 66 66"><circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle></svg>';
const SVG_MINUS = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="icon icon-minus" fill="none" viewBox="0 0 10 2"><path fill-rule="evenodd" clip-rule="evenodd" d="M.5 1C.5.7.7.5 1 .5h8a.5.5 0 110 1H1A.5.5 0 01.5 1z" fill="currentColor"></path></svg>';
const SVG_PLUS = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="icon icon-plus" fill="none" viewBox="0 0 10 10"><path fill-rule="evenodd" clip-rule="evenodd" d="M1 4.51a.5.5 0 000 1h3.5l.01 3.5a.5.5 0 001-.01V5.5l3.5-.01a.5.5 0 00-.01-1H5.5L5.49.99a.5.5 0 00-1 .01v3.5l-3.5.01H1z" fill="currentColor"></path></svg>';
const SVG_CLOSE_LARGE = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="icon icon-close" fill="none" viewBox="0 0 18 17"><path d="M.865 15.978a.5.5 0 00.707.707l7.433-7.431 7.579 7.282a.501.501 0 00.846-.37.5.5 0 00-.153-.351L9.712 8.546l7.417-7.416a.5.5 0 10-.707-.708L8.991 7.853 1.413.573a.5.5 0 10-.693.72l7.563 7.268-7.418 7.417z" fill="currentColor"></path></svg>';
const SVG_QUESTION = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="icon icon-question" fill="none" viewBox="0 0 20 20"><path fill-rule="evenodd" clip-rule="evenodd" d="M11 11H9v-.148c0-.876.306-1.499 1-1.852.385-.195 1-.568 1-1a1.001 1.001 0 00-2 0H7c0-1.654 1.346-3 3-3s3 1 3 3-2 2.165-2 3zm-2 4h2v-2H9v2zm1-13a8 8 0 100 16 8 8 0 000-16z" fill="currentColor"></path></svg>';
const SVG_ERROR = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="icon icon-error" fill="none" viewBox="0 0 24 24"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" fill="currentColor"></path></svg>';

function fmtPrice(cents) {
  return [Math.floor(cents / 100), String(cents % 100).padStart(2, '0')];
}

function renderItem(item, idx) {
  const vid = String(item.variant_id);
  const handle = item.handle || '';
  const qty = item.quantity;
  const price = item.final_price !== undefined ? item.final_price : item.price;
  const compare = item.compare_at_price != null ? item.compare_at_price : item.original_price;
  const title = item.title || '';
  const img = item.image || '';
  const productUrl = item.url || `/products/${handle}?variant=${vid}`;
  const [pI, pF] = fmtPrice(price);
  let priceHtml;
  if (compare > price) {
    const [cI, cF] = fmtPrice(compare);
    priceHtml = `<dd class="mini-cart__price-wrap">
                        <dl class="cart-item__discounted-prices">
                        <dt class="visually-hidden">
                          Preço regular
                        </dt>
                        <dd class="price--on-sale">
                          <s class="price price-item--regular">
                            <price-money><bdi><span class="price__prefix">R$</span>${cI}<sup class="price__suffix">,${cF}</sup></bdi></price-money>
                          </s>
                        </dd>
                        <dt class="visually-hidden">
                          Preço de venda
                        </dt>
                        <dd class="price">
                          <price-money><bdi><span class="price__prefix">R$</span>${pI}<sup class="price__suffix">,${pF}</sup></bdi></price-money>
                        </dd>
                      </dl></dd>`;
  } else {
    priceHtml = `<dd class="price">
                          <price-money><bdi><span class="price__prefix">R$</span>${pI}<sup class="price__suffix">,${pF}</sup></bdi></price-money>
                        </dd>`;
  }
  return `            <li data-variant-id="${vid}" data-handle="${handle}" data-quantity="${qty}" data-price="${price}" data-price-compare="${compare}" class="mini-cart__item">
              <div class="loading-overlay hidden">
                <div class="loading-overlay__spinner">
                  ${SVG_SPINNER}
                </div>
              </div>
              <cart-remove-button id="Remove-${idx}" data-index="${idx}">
                <a href="/cart/change?id=${vid}:mock&amp;quantity=0" class="delete-product" aria-label="Remover ${title.replace(/"/g, '&quot;')}" data-no-instant="">
                  ${SVG_CLOSE}
                </a>
              </cart-remove-button>
              <div class="product-container">
                <div>
                  <a href="${productUrl}" class="product-image media-wrapper media-wrapper--small">
                    <div class="media media--adapt" style="--image-ratio-percent: 100.0%;">
                      <img srcset="${img} 1x, ${img} 2x" src="${img}" alt="" width="70" height="70" loading="lazy" is="lazy-image">
                    </div>
                  </a>
                </div>
                <div class="product-description">
                  <div class="product-content">
                    <a href="${productUrl}" class="link product-title">${title}</a>
                  </div><dl></dl><ul class="discounts list-unstyled" role="list" aria-label="Desconto"></ul><div class="product-quantity">
                    <dt><label for="Quantity-${idx}" class="visually-hidden">Quantidade</label>
                        <quantity-input class="quantity">
                          <button class="quantity__button no-js-hidden" name="minus" type="button">
                            <span class="visually-hidden">Diminuir a quantidade de ${title}</span>
                            ${SVG_MINUS}
                          </button>
                          <input class="quantity__input" type="number" name="updates[]" value="${qty}" min="0" aria-label="Quantidade de ${title}" id="Quantity-${idx}" data-index="${idx}" data-quantity-variant-id="${vid}" data-cart-quantity="${qty}">
                          <button class="quantity__button no-js-hidden" name="plus" type="button">
                            <span class="visually-hidden">Aumentar a quantidade de ${title}</span>
                            ${SVG_PLUS}
                          </button>
                        </quantity-input></dt>${priceHtml}</div>
                  <p class="cart-item__error form__message errors" id="Line-item-error-${idx}">
                    <span class="cart-item__error-text"></span>
                  </p>
                </div>
              </div>
            </li>`;
}

function renderCartIcon(count) {
  if (count === 0) return '<div class="shopify-section"></div>';
  return `<div class="shopify-section"><span class="cart-count-bubble"><span aria-hidden="true">${count}</span><span class="visually-hidden">${count} itens</span></span></div>`;
}

function renderMiniCart() {
  const items = cart.items;
  const total = cart.total_price;
  const subtotal = cart.items_subtotal_price;
  const origTot = cart.original_total_price || subtotal;
  const itemsHtml = items.map((item, i) => renderItem(item, i + 1)).join('\n');
  const [tI, tF] = fmtPrice(total);
  const [sI, sF] = fmtPrice(subtotal);
  const formClass = items.length === 0 ? 'mini-cart is-empty' : 'mini-cart';
  const subtotalExtraClass = origTot > total ? ' active' : '';
  const progress = FREE_SHIPPING_TARGET ? Math.min(100, Math.floor(total * 100 / FREE_SHIPPING_TARGET)) : 0;
  const success = total >= FREE_SHIPPING_TARGET;
  const fsTextCls = success ? ' free-shipping__text--success' : '';
  const fsBarCls = success ? ' free-shipping__progress--success' : '';
  let fsText;
  if (success) {
    fsText = '<p>Parabéns, você ganhou <strong>frete grátis</strong></p>';
  } else {
    const need = Math.max(0, FREE_SHIPPING_TARGET - total);
    const [nI, nF] = fmtPrice(need);
    fsText = `<p>Gaste mais <price-money class="price"><bdi><span class="price__prefix">R$</span>${nI}<sup class="price__suffix">,${nF}</sup></bdi></price-money> para alcançar frete grátis</p>`;
  }

  return `<div class="shopify-section">
<form class="${formClass}" action="/cart" method="post" id="cart" autocomplete="off">
  <div class="mini-cart__inner">
    <div class="mini-cart__header" data-animate="" data-animate-delay-1="">
      <drawer-close-button class="header__icon header__icon--summary header__icon--cart">
        <svg class="icon icon-close" aria-hidden="true" focusable="false"><use href="#icon-close"></use></svg>
      </drawer-close-button>
      <div class="title h4">Seu carrinho</div>
<link href="cdn/shop/t/175/assets/component-free-shipping.css" rel="stylesheet" type="text/css" media="all">
<div class="free-shipping typeset0">
    <span class="free-shipping__heading">Frete Grátis acima de R$ 159,00</span>
  <span class="free-shipping__text${fsTextCls}">${fsText}</span><span class="free-shipping__progress${fsBarCls}" style="--progress: ${progress}%;"></span></div>
<span class="mini-cart__border"></span>
    </div>
    <div class="mini-cart__empty center" data-animate="" data-animate-delay-1="">
      <p class="mini-cart__empty-text h3">Seu carrinho está vazio no momento</p>
      <div class="mini-cart__empty-message typeset"><p>Conheça nossa coleção Deusas!</p></div><ul class="mini-cart__empty-collections list-unstyled"><li><a href="/collections/deusas" class="button button--full-width">Deusas</a></li></ul></div><div class="mini-cart__main" id="main-cart-items"><cart-items><ul class="mini-cart__navigation" data-animate="" data-animate-delay-2="">
${itemsHtml}
      </ul>
      </cart-items>
    </div><div class="mini-cart__footer" data-animate="" data-animate-delay-3="">
        <link href="cdn/shop/t/175/assets/cart-coupon.css" rel="stylesheet" type="text/css" media="all">
<cart-coupon class="iscart-drawer" data-costumer-id="" data-currency="BRL" data-currency-symbol="" data-discountsapplied="">
  <div class="cart-coupon__inner"><div class="cart-coupon__heading"><p>Cupom</p></div><input type="text" class="cart-coupon__input" placeholder="Insira seu cupom"><button class="cart-coupon__button button">Aplicar</button></div>
  <div class="cart-coupon__applied"><div class="cart-coupon__heading"><p>Cupom</p></div><p class="cart-coupon__applied-value"></p><button class="cart-coupon__button cart-coupon__applied-remove">Remover</button></div>
  <div class="cart-coupon__message-wrapper"><p class="cart-coupon__message"></p></div>
</cart-coupon>
<div class="mini-cart__actions enabled-border"><style>.mini-cart__footer .mini-cart__action-shipping-calculator,.mini-cart__footer .mini-cart__action-shipping-calculator[open]>summary+*{background-color:#fbf7f2}.mini-cart__footer .mini-cart__action-shipping-calculator summary>span{color:#111111}.mini-cart__footer .mini-cart__action-shipping-calculator .field p{color:#111111}</style>
<div class="shipping__calculator-button-initial"><button class="button">SIMULAR FRETE AQUI</button></div>
<details class="mini-cart__action mini-cart__action-shipping-calculator disclosure-has-popup hidden">
  <summary><span>SIMULAR FRETE AQUI</span><div class="field form__message hidden" id="ShippingCalculatorSuccess"></div></summary>
  <div><button type="button" class="close" onclick="this.closest('details').querySelector('summary').click()">${SVG_CLOSE_LARGE}</button>
    <label for="ShippingCalculatorCountry">Estimar as taxas de envio<span class="mini-cart__question">${SVG_QUESTION}<span class="mini-cart__tooltip">Frete e impostos serão calculados no confira</span></span></label>
    <shipping-calculator class="shipping__calculator" data-type-return="option1"><form-state><div class="field"><input id="ShippingCalculatorZip" class="field__input required" type="text" autocapitalize="characters" autocomplete="postal-code" placeholder="Código postal"><label class="visually-hidden" for="ShippingCalculatorZip">Código postal</label></div><div class="button-content"><button class="button button--full-width" type="button">Calcular</button></div><div class="field form__message errors hidden" id="ShippingCalculatorErrors">${SVG_ERROR}<div class="errors"></div></div></form-state></shipping-calculator>
  </div>
</details>
</div><div class="mini-cart__totals"><div class="mini-cart__totals-content mini-cart__subtotal${subtotalExtraClass}">
            <p class="totals__subtotal h4">Subtotal</p>
            <div class="value price totals__subtotal-value" id="mini-cart-subtotal"><price-money><s><bdi><span class="price__prefix">R$</span> ${sI}<sup class="price__suffix">,${sF}</sup></bdi></s></price-money></div>
          </div>
          <div class="mini-cart__totals-content mini-cart__total active">
            <p class="totals__subtotal h4">Total</p>
            <div class="value price totals__subtotal-value" id="mini-cart-total"><price-money><bdi><span class="price__prefix">R$</span>${tI}<sup class="price__suffix">,${tF}</sup></bdi></price-money></div>
          </div><div class="taxes-discounts"></div>
      </div>
      <div class="button-container"><button class="button" type="button" id="mini-cart-go-checkout" onclick="window.location.href='/checkout.html'">Finalizar compra</button></div>
    </div>
  </div>
</form>
</div>`;
}

function getSections(requested) {
  const count = cart.item_count;
  const mini = renderMiniCart();
  const icon = renderCartIcon(count);
  const empty = '<div class="shopify-section"></div>';
  const base = {
    'mini-cart': mini,
    'cart-icon-bubble': icon,
    'mobile-cart-icon-bubble': icon,
    'main-cart-items': empty,
    'main-cart-footer': empty,
    'cart-live-region-text': empty,
  };
  if (requested && requested.length) {
    const out = {};
    for (const k of requested) out[k] = base[k] || empty;
    return out;
  }
  return base;
}

function parseSections(body) {
  const r = body.sections;
  if (r == null) return null;
  if (Array.isArray(r)) return r.map(String);
  return [String(r)];
}

// ─── Pagou helpers ────────────────────────────────────────────────────────────
function buildPagouProducts(items) {
  if (!items || !items.length) return [{ name: 'Pedido AURA Beauty Club', quantity: 1, price: 1 }];
  return items.map(it => ({
    name: it.product_title || it.title || 'Produto',
    quantity: it.quantity || 1,
    price: Math.round((it.price || 0) / 100),
  }));
}

async function pagouRequest(method, endpoint, body) {
  const url = `${PAGOU_BASE}${endpoint}`;
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PAGOU_API_KEY}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

// ─── Utmify helper ────────────────────────────────────────────────────────────
async function sendToUtmify(payload) {
  if (!UTMIFY_TOKEN) return;
  try {
    await fetch('https://api.utmify.com.br/api-credentials/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': UTMIFY_TOKEN,
      },
      body: JSON.stringify(payload),
    });
  } catch {}
}

function buildUtmifyPayload(orderId, status, customer, items, totalCents, utmData) {
  const totalBrl = totalCents / 100;
  return {
    orderId: String(orderId),
    platform: 'other',
    paymentMethod: 'pix',
    status,
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    approvedDate: status === 'paid' ? new Date().toISOString().replace('T', ' ').slice(0, 19) : null,
    customer: {
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      document: customer.document || '',
    },
    products: (items || []).map(it => ({
      id: String(it.variant_id || it.id || ''),
      name: it.product_title || it.title || 'Produto',
      planId: null,
      planName: null,
      quantity: it.quantity || 1,
      priceInCents: it.price || 0,
    })),
    trackingParameters: utmData || {},
    commission: { totalPriceInCents: totalCents, gatewayFeeInCents: 0, userCommissionInCents: totalCents },
    isTest: PAGOU_ENV !== 'production',
  };
}

// ─── Express middleware ───────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API routes ───────────────────────────────────────────────────────────────

app.get('/api/config', (req, res) => {
  res.json({ publicKey: PAGOU_PUBLIC_KEY, env: PAGOU_ENV });
});

app.post('/api/create-pix', async (req, res) => {
  try {
    const { customer, utmData } = req.body;
    const totalCents = cart.total_price;
    if (!totalCents) return res.status(400).json({ error: 'Carrinho vazio' });

    const pagouBody = {
      method: 'pix',
      amount: totalCents,
      customer: {
        name: customer.name || '',
        email: customer.email || '',
        document: String(customer.document || '').replace(/\D/g, ''),
        phone: String(customer.phone || '').replace(/\D/g, ''),
      },
      products: buildPagouProducts(cart.items),
      notification_url: `${SITE_URL}/api/webhook-pagou`,
    };

    const { ok, data } = await pagouRequest('POST', '/v2/transactions', pagouBody);
    if (!ok || !data.data) {
      return res.status(502).json({ error: data.message || 'Erro ao criar PIX' });
    }

    const txId = data.data.id;
    const qrCode = data.data.pix && data.data.pix.qr_code;
    const pixCode = data.data.pix && data.data.pix.code;

    // Save pending order
    const pending = readPendingOrders();
    pending[txId] = {
      customer,
      items: cart.items,
      totalCents,
      utmData: utmData || {},
      createdAt: Date.now(),
    };
    writePendingOrders(pending);

    // Notify Utmify: waiting_payment
    await sendToUtmify(buildUtmifyPayload(txId, 'waiting_payment', customer, cart.items, totalCents, utmData));

    res.json({ transactionId: txId, qrCode, pixCode });
  } catch (err) {
    console.error('/api/create-pix', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/api/create-card', async (req, res) => {
  try {
    const { customer, cardToken, installments, utmData } = req.body;
    const totalCents = cart.total_price;
    if (!totalCents) return res.status(400).json({ error: 'Carrinho vazio' });

    const pagouBody = {
      method: 'credit_card',
      amount: totalCents,
      customer: {
        name: customer.name || '',
        email: customer.email || '',
        document: String(customer.document || '').replace(/\D/g, ''),
        phone: String(customer.phone || '').replace(/\D/g, ''),
      },
      products: buildPagouProducts(cart.items),
      card: { token: cardToken, installments: Number(installments) || 1 },
      notification_url: `${SITE_URL}/api/webhook-pagou`,
    };

    const { ok, data } = await pagouRequest('POST', '/v2/transactions', pagouBody);
    if (!ok || !data.data) {
      return res.status(502).json({ error: data.message || 'Erro ao processar cartão' });
    }

    const txId = data.data.id;
    const status = data.data.status;

    if (status === 'paid' || status === 'approved') {
      cart.items = [];
      recalcCart();
      await sendToUtmify(buildUtmifyPayload(txId, 'paid', customer, [], totalCents, utmData));
      return res.json({ ok: true, status: 'paid', redirect: '/checkout-obrigado.html' });
    }

    const pending = readPendingOrders();
    pending[txId] = { customer, items: [], totalCents, utmData: utmData || {}, createdAt: Date.now() };
    writePendingOrders(pending);

    await sendToUtmify(buildUtmifyPayload(txId, 'waiting_payment', customer, cart.items, totalCents, utmData));
    res.json({ ok: true, status, transactionId: txId });
  } catch (err) {
    console.error('/api/create-card', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.get('/api/pix-status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ok, data } = await pagouRequest('GET', `/v2/transactions/${id}`);
    if (!ok || !data.data) return res.status(502).json({ error: 'Erro ao consultar status' });

    const status = data.data.status;
    if (status === 'paid' || status === 'approved') {
      const pending = readPendingOrders();
      const order = pending[id];
      if (order) {
        await sendToUtmify(buildUtmifyPayload(id, 'paid', order.customer, order.items, order.totalCents, order.utmData));
        delete pending[id];
        writePendingOrders(pending);
      }
      cart.items = [];
      recalcCart();
    }
    res.json({ status });
  } catch (err) {
    console.error('/api/pix-status', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/api/webhook-pagou', async (req, res) => {
  try {
    const { id, status } = req.body;
    if (!id) return res.sendStatus(400);

    if (status === 'paid' || status === 'approved') {
      const pending = readPendingOrders();
      const order = pending[id];
      if (order) {
        await sendToUtmify(buildUtmifyPayload(id, 'paid', order.customer, order.items, order.totalCents, order.utmData));
        delete pending[id];
        writePendingOrders(pending);
      }
      cart.items = [];
      recalcCart();
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('/api/webhook-pagou', err);
    res.sendStatus(500);
  }
});

// ─── Mock Shopify cart routes ─────────────────────────────────────────────────

app.get('/cart.js', (req, res) => {
  res.json(cart);
});

app.post(['/cart/add.js', '/cart/add'], (req, res) => {
  const data = req.body;
  const toAdd = [];

  if (data.items && Array.isArray(data.items)) {
    toAdd.push(...data.items);
  } else if (data.id) {
    toAdd.push({ id: data.id, quantity: data.quantity || 1 });
  }

  if (!toAdd.length) return res.status(422).json({ status: 422, message: 'Produto não informado' });

  const added = [];
  for (const entry of toAdd) {
    const vid = String(entry.id || '');
    const qty = Math.max(1, parseInt(entry.quantity, 10) || 1);
    const existing = cart.items.find(i => String(i.variant_id) === vid);
    if (existing) {
      existing.quantity += qty;
      existing.line_price = existing.price * existing.quantity;
      existing.final_line_price = existing.line_price;
      added.push(existing);
    } else {
      const item = makeCartItem(vid, qty);
      if (item) { cart.items.push(item); added.push(item); }
    }
  }

  if (!added.length) return res.status(422).json({ status: 422, message: 'Produto não encontrado' });

  recalcCart();
  const sections = parseSections(data);
  const resp = { ...added[0], sections: getSections(sections) };
  res.json(resp);
});

app.all(['/cart/change.js', '/cart/change'], (req, res) => {
  const data = req.method === 'POST' ? req.body : req.query;
  const rawId = String(data.id || '');
  const vid = rawId.includes(':') ? rawId.split(':')[0] : rawId;
  const quantity = parseInt(data.quantity, 10) || 0;
  const line = data.line ? parseInt(data.line, 10) - 1 : null;

  let idx = line;
  if (idx == null || idx < 0 || idx >= cart.items.length) {
    idx = cart.items.findIndex(i => String(i.variant_id) === vid);
  }

  if (idx != null && idx >= 0 && idx < cart.items.length) {
    if (quantity <= 0) {
      cart.items.splice(idx, 1);
    } else {
      const it = cart.items[idx];
      it.quantity = quantity;
      it.line_price = it.price * quantity;
      it.final_line_price = it.line_price;
    }
  }

  recalcCart();
  const sections = parseSections(data);
  res.json({ ...cart, sections: getSections(sections) });
});

app.post(['/cart/update.js', '/cart/update'], (req, res) => {
  const data = req.body;
  const updates = data.updates || {};
  for (const [vid, qty] of Object.entries(updates)) {
    const n = parseInt(qty, 10);
    const idx = cart.items.findIndex(i => String(i.variant_id) === String(vid));
    if (idx === -1) continue;
    if (n <= 0) {
      cart.items.splice(idx, 1);
    } else {
      const it = cart.items[idx];
      it.quantity = n;
      it.line_price = it.price * n;
      it.final_line_price = it.line_price;
    }
  }
  recalcCart();
  const sections = parseSections(data);
  res.json({ ...cart, sections: getSections(sections) });
});

app.post('/checkout/complete', (req, res) => {
  cart.items = [];
  recalcCart();
  res.json({ ok: true, redirect: '/checkout-obrigado.html', sections: getSections() });
});

// ─── Checkout form navigation ─────────────────────────────────────────────────
app.post('/checkout.html', (req, res) => res.redirect(303, '/checkout-frete.html'));
app.post('/checkout-frete.html', (req, res) => res.redirect(303, '/checkout-pagamento.html'));
app.post('/checkout-pagamento.html', (req, res) => {
  cart.items = [];
  recalcCart();
  res.redirect(303, '/checkout-obrigado.html');
});

// ─── Section rendering ────────────────────────────────────────────────────────
app.get('*', (req, res, next) => {
  const sid = req.query.section_id;
  if (sid) {
    if (sid === 'mini-cart') return res.send(renderMiniCart());
    if (sid === 'cart-icon-bubble' || sid === 'mobile-cart-icon-bubble') return res.send(renderCartIcon(cart.item_count));
    return res.send('<div class="shopify-section"></div>');
  }
  next();
});

// ─── Static files with aura-cart-add-fix.js injection ────────────────────────
const INJECT_SCRIPT = '    <script src="/cdn/shop/t/175/assets/aura-cart-add-fix.js" defer></script>\n';
const MARKER = 'aura-cart-add-fix.js';

app.use((req, res, next) => {
  let fsPath = req.path.replace(/^\//, '') || 'index';
  if (!path.extname(path.basename(fsPath))) {
    for (const candidate of [fsPath + '.html', fsPath + '/index.html']) {
      if (fs.existsSync(path.join(ROOT, candidate))) { fsPath = candidate; break; }
    }
  }
  const fullPath = path.join(ROOT, fsPath);
  if (fsPath.endsWith('.html') && fs.existsSync(fullPath)) {
    try {
      let html = fs.readFileSync(fullPath, 'utf8');
      if (!html.includes(MARKER) && html.includes('</body>')) {
        html = html.replace('</body>', INJECT_SCRIPT + '</body>');
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      return res.send(html);
    } catch { return next(); }
  }
  next();
});

app.use(express.static(ROOT, { index: 'index.html' }));

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  AURA Beauty Club — servidor rodando\n  Acesse: http://localhost:${PORT}\n  Ctrl+C para parar\n`);
});
