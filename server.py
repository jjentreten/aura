#!/usr/bin/env python3
"""
Servidor mock Shopify para aurabeautyclub.com.br (clone local).
Uso: python3 server.py
Acesse: http://localhost:8080
"""
import http.server
import json
import os
import urllib.parse
import socketserver
from email import policy
from email.parser import BytesParser

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 8080

# ─── Catálogo de produtos ─────────────────────────────────────────────────────

with open(os.path.join(ROOT, 'product_catalog.json')) as f:
    CATALOG = json.load(f)

# ─── Estado do carrinho (em memória) ──────────────────────────────────────────

cart = {
    "token": "mock_token_aura",
    "note": None,
    "attributes": {},
    "original_total_price": 0,
    "total_price": 0,
    "total_discount": 0,
    "total_weight": 0.0,
    "item_count": 0,
    "items": [],
    "requires_shipping": True,
    "currency": "BRL",
    "items_subtotal_price": 0,
    "cart_level_discount_applications": [],
    "discount_codes": [],
}

# ─── Helpers ──────────────────────────────────────────────────────────────────

def recalculate_cart():
    subtotal = sum(i['line_price'] for i in cart['items'])
    cart['original_total_price'] = subtotal
    cart['total_price'] = subtotal
    cart['items_subtotal_price'] = subtotal
    cart['item_count'] = sum(i['quantity'] for i in cart['items'])

def make_cart_item(variant_id, quantity=1):
    vid = str(variant_id)
    p = CATALOG.get(vid)
    if not p:
        return None
    qty = max(1, quantity)
    return {
        "id": p['id'],
        "properties": {},
        "quantity": qty,
        "variant_id": p['variant_id'],
        "key": f"{p['variant_id']}:mock",
        "title": p['title'],
        "price": p['price'],
        "original_price": p['price'],
        "discounted_price": p['price'],
        "line_price": p['price'] * qty,
        "original_line_price": p['price'] * qty,
        "total_discount": 0,
        "discounts": [],
        "sku": p.get('sku', ''),
        "grams": 0,
        "vendor": "AURA Beauty Club",
        "taxable": True,
        "product_id": p['product_id'],
        "gift_card": False,
        "final_price": p['price'],
        "final_line_price": p['price'] * qty,
        "url": p['url'],
        "image": '/' + p['image'],
        "handle": p['handle'],
        "requires_shipping": True,
        "product_type": "",
        "product_title": p['title'],
        "variant_title": None,
        "line_level_discount_codes": [],
        "line_level_total_discount": 0,
    }

def fmt_price(cents):
    return cents // 100, f"{cents % 100:02d}"

# ─── SVGs inline ──────────────────────────────────────────────────────────────

SVG_CLOSE = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="icon icon-close" fill="none" viewBox="0 0 12 12"><path d="M1 1L11 11" stroke="currentColor" stroke-linecap="round" fill="none"></path><path d="M11 1L1 11" stroke="currentColor" stroke-linecap="round" fill="none"></path></svg>'
SVG_SPINNER = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="icon icon-spinner" fill="none" viewBox="0 0 66 66"><circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle></svg>'
SVG_MINUS = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="icon icon-minus" fill="none" viewBox="0 0 10 2"><path fill-rule="evenodd" clip-rule="evenodd" d="M.5 1C.5.7.7.5 1 .5h8a.5.5 0 110 1H1A.5.5 0 01.5 1z" fill="currentColor"></path></svg>'
SVG_PLUS = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="icon icon-plus" fill="none" viewBox="0 0 10 10"><path fill-rule="evenodd" clip-rule="evenodd" d="M1 4.51a.5.5 0 000 1h3.5l.01 3.5a.5.5 0 001-.01V5.5l3.5-.01a.5.5 0 00-.01-1H5.5L5.49.99a.5.5 0 00-1 .01v3.5l-3.5.01H1z" fill="currentColor"></path></svg>'

# ─── Renderização do mini-cart ────────────────────────────────────────────────

FREE_SHIPPING_TARGET = 15900  # R$ 159,00 em centavos

SVG_CLOSE_LARGE = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="icon icon-close" fill="none" viewBox="0 0 18 17"><path d="M.865 15.978a.5.5 0 00.707.707l7.433-7.431 7.579 7.282a.501.501 0 00.846-.37.5.5 0 00-.153-.351L9.712 8.546l7.417-7.416a.5.5 0 10-.707-.708L8.991 7.853 1.413.573a.5.5 0 10-.693.72l7.563 7.268-7.418 7.417z" fill="currentColor"></path></svg>'
SVG_QUESTION = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="icon icon-question" fill="none" viewBox="0 0 20 20"><path fill-rule="evenodd" clip-rule="evenodd" d="M11 11H9v-.148c0-.876.306-1.499 1-1.852.385-.195 1-.568 1-1a1.001 1.001 0 00-2 0H7c0-1.654 1.346-3 3-3s3 1 3 3-2 2.165-2 3zm-2 4h2v-2H9v2zm1-13a8 8 0 100 16 8 8 0 000-16z" fill="currentColor"></path></svg>'
SVG_ERROR = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="icon icon-error" fill="none" viewBox="0 0 24 24"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" fill="currentColor"></path></svg>'

def render_item(item, idx):
    vid     = item['variant_id']
    handle  = item['handle']
    qty     = item['quantity']
    price   = item['final_price']
    orig    = item['original_price']
    img     = item['image']
    title   = item['title']
    compare = item.get('compare_at_price', orig)

    pi, pc = fmt_price(price)

    # Preço: mostra preço riscado + preço de venda quando há desconto
    if orig > price:
        oi, oc = fmt_price(orig)
        price_html = f"""<dd class="mini-cart__price-wrap">
                        <dl class="cart-item__discounted-prices">
                        <dt class="visually-hidden">
                          Preço regular
                        </dt>
                        <dd class="price--on-sale">
                          <s class="price price-item--regular">
                            <price-money><bdi><span class="price__prefix">R$</span>{oi}<sup class="price__suffix">,{oc}</sup></bdi></price-money>
                          </s>
                        </dd>
                        <dt class="visually-hidden">
                          Preço de venda
                        </dt>
                        <dd class="price">
                          <price-money><bdi><span class="price__prefix">R$</span>{pi}<sup class="price__suffix">,{pc}</sup></bdi></price-money>
                        </dd>
                      </dl></dd>"""
    else:
        price_html = f"""<dd class="price">
                          <price-money><bdi><span class="price__prefix">R$</span>{pi}<sup class="price__suffix">,{pc}</sup></bdi></price-money>
                        </dd>"""

    return f"""            <li data-variant-id="{vid}" data-handle="{handle}" data-quantity="{qty}" data-price="{price}" data-price-compare="{compare}" class="mini-cart__item">
              <div class="loading-overlay hidden">
                <div class="loading-overlay__spinner">
                  {SVG_SPINNER}
                </div>
              </div>
              <cart-remove-button id="Remove-{idx}" data-index="{idx}">
                <a href="/cart/change?id={vid}:mock&amp;quantity=0" class="delete-product" aria-label="Remover {title}" data-no-instant="">
                  {SVG_CLOSE}
                </a>
              </cart-remove-button>
              <div class="product-container">
                <div>
                  <a href="/products/{handle}?variant={vid}" class="product-image media-wrapper media-wrapper--small">
                    <div class="media media--adapt" style="--image-ratio-percent: 100.0%;">
                      <img srcset="{img} 1x, {img} 2x" src="{img}" alt="" width="70" height="70" loading="lazy" is="lazy-image">
                    </div>
                  </a>
                </div>
                <div class="product-description">
                  <div class="product-content">
                    <a href="/products/{handle}?variant={vid}" class="link product-title">{title}</a>
                  </div><dl></dl><ul class="discounts list-unstyled" role="list" aria-label="Desconto"></ul><div class="product-quantity">
                    <dt><label for="Quantity-{idx}" class="visually-hidden">Quantidade</label>
                        <quantity-input class="quantity">
                          <button class="quantity__button no-js-hidden" name="minus" type="button">
                            <span class="visually-hidden">Diminuir a quantidade de {title}</span>
                            {SVG_MINUS}
                          </button>
                          <input class="quantity__input" type="number" name="updates[]" value="{qty}" min="0" aria-label="Quantidade de {title}" id="Quantity-{idx}" data-index="{idx}">
                          <button class="quantity__button no-js-hidden" name="plus" type="button">
                            <span class="visually-hidden">Aumentar a quantidade de {title}</span>
                            {SVG_PLUS}
                          </button>
                        </quantity-input></dt>{price_html}</div>
                  <p class="cart-item__error form__message errors" id="Line-item-error-{idx}">
                    <span class="cart-item__error-text"></span>
                  </p>
                </div>
              </div>
            </li>"""

def render_mini_cart():
    items      = cart['items']
    total      = cart['total_price']
    subtotal   = cart['items_subtotal_price']
    orig_tot   = cart.get('original_total_price', subtotal)
    items_html = ''.join(render_item(item, i+1) for i, item in enumerate(items))
    ti, tc     = fmt_price(total)
    si, sc     = fmt_price(subtotal)

    form_class = 'mini-cart is-empty' if not items else 'mini-cart'
    subtotal_extra_class = ' active' if orig_tot > total else ''

    # Barra de frete grátis (mesmo markup da loja: price-money dentro do parágrafo)
    progress = min(100, int(total * 100 / FREE_SHIPPING_TARGET)) if FREE_SHIPPING_TARGET else 0
    success = total >= FREE_SHIPPING_TARGET
    fs_text_cls = ' free-shipping__text--success' if success else ''
    fs_bar_cls = ' free-shipping__progress--success' if success else ''
    if success:
        fs_text = '<p>Parabéns, você ganhou <strong>frete grátis</strong></p>'
    else:
        need = max(0, FREE_SHIPPING_TARGET - total)
        ni, nc = fmt_price(need)
        fs_text = f'''<p>Gaste mais <price-money class="price"><bdi><span class="price__prefix">R$</span>{ni}<sup class="price__suffix">,{nc}</sup></bdi></price-money> para alcançar frete grátis</p>'''

    return f"""<div class="shopify-section">
<form class="{form_class}" action="/cart" method="post" id="cart" autocomplete="off">
  <div class="mini-cart__inner">
    <div class="mini-cart__header" data-animate="" data-animate-delay-1="">
      <drawer-close-button class="header__icon header__icon--summary header__icon--cart">
        <svg class="icon icon-close" aria-hidden="true" focusable="false">
          <use href="#icon-close"></use>
        </svg>
      </drawer-close-button>
      <div class="title h4">Seu carrinho</div>

<link href="cdn/shop/t/175/assets/component-free-shipping.css" rel="stylesheet" type="text/css" media="all">
<div class="free-shipping typeset0">
    <span class="free-shipping__heading">
      Frete Grátis acima de R$ 159,00
    </span>
  <span class="free-shipping__text{fs_text_cls}">{fs_text}</span><span class="free-shipping__progress{fs_bar_cls}" style="--progress: {progress}%;"></span></div>
<span class="mini-cart__border"></span>
    </div>
    <div class="mini-cart__empty center" data-animate="" data-animate-delay-1="">
      <p class="mini-cart__empty-text h3">Seu carrinho está vazio no momento</p>
      <div class="mini-cart__empty-message typeset"><p>Conheça nossa coleção Deusas!</p></div><ul class="mini-cart__empty-collections list-unstyled"><li>
              <a href="/collections/deusas" class="button button--full-width">Deusas</a>
            </li></ul></div><div class="mini-cart__main" id="main-cart-items"><cart-items><ul class="mini-cart__navigation" data-animate="" data-animate-delay-2="">
{items_html}
      </ul>
      </cart-items>
    </div><div class="mini-cart__footer" data-animate="" data-animate-delay-3="">
      
      
        <link href="cdn/shop/t/175/assets/cart-coupon.css" rel="stylesheet" type="text/css" media="all">



<cart-coupon class="iscart-drawer" data-costumer-id="" data-currency="BRL" data-currency-symbol="" data-discountsapplied="">
  <div class="cart-coupon__inner">
    <div class="cart-coupon__heading">
      <p>Cupom</p>
    </div>
    <input type="text" class="cart-coupon__input" placeholder="Insira seu cupom">
    <button class="cart-coupon__button button">Aplicar</button>
  </div>
  <div class="cart-coupon__applied">
    <div class="cart-coupon__heading">
      <p>Cupom</p>
    </div>
    <p class="cart-coupon__applied-value"></p>
    <button class="cart-coupon__button cart-coupon__applied-remove">Remover</button>
  </div>
  <div class="cart-coupon__message-wrapper">
    <p class="cart-coupon__message"></p>
  </div>
</cart-coupon>

<div class="mini-cart__actions enabled-border"><style>
              .mini-cart__footer .mini-cart__action-shipping-calculator,
              .mini-cart__footer .mini-cart__action-shipping-calculator[open]>summary+* {{
                background-color: #fbf7f2;
              }}

              .mini-cart__footer .mini-cart__action-shipping-calculator summary>span {{
                color: #111111;
              }}
    
              .mini-cart__footer .mini-cart__action-shipping-calculator .field p {{
                color: #111111;
              }}
            </style>

              <!-- Botão Continuar Comprando -->
              

            <div class="shipping__calculator-button-initial">
  <button class="button">SIMULAR FRETE AQUI</button>
</div>

<details class="mini-cart__action mini-cart__action-shipping-calculator disclosure-has-popup hidden">
  <summary>
    <span>
      
      SIMULAR FRETE AQUI
    </span>
    <div class="field form__message hidden" id="ShippingCalculatorSuccess"></div>
  </summary>
  <div>
    <button type="button" class="close" onclick="this.closest('details').querySelector('summary').click()">
      {SVG_CLOSE_LARGE}
    </button>
    <label for="ShippingCalculatorCountry">
      Estimar as taxas de envio
      <span class="mini-cart__question">
        {SVG_QUESTION}
        <span class="mini-cart__tooltip">Frete e impostos serão calculados no confira</span>
      </span>
    </label>
    <shipping-calculator class="shipping__calculator" data-type-return="option1">
      <form-state>
        <div class="field">
          <input id="ShippingCalculatorZip" class="field__input required" type="text" autocapitalize="characters" autocomplete="postal-code" placeholder="Código postal">
          <label class="visually-hidden" for="ShippingCalculatorZip">Código postal</label>
        </div>
        <div class="button-content">
          <button class="button button--full-width" type="button">Calcular</button>
        </div>
        <div class="field form__message errors hidden" id="ShippingCalculatorErrors">
          {SVG_ERROR}
          <div class="errors"></div>
        </div>
      </form-state>
    </shipping-calculator>
  </div>
</details>

</div><div class="mini-cart__totals"><div class="mini-cart__totals-content mini-cart__subtotal{subtotal_extra_class}">
            <p class="totals__subtotal h4">Subtotal</p>
            <div class="value price totals__subtotal-value" id="mini-cart-subtotal">
              <price-money><s><bdi>
                   <span class="price__prefix">R$</span> {si}<sup class="price__suffix">,{sc}</sup>
                  </bdi></s></price-money>
            </div>
          </div>
          <div class="mini-cart__totals-content mini-cart__total active">
            <p class="totals__subtotal h4">Total</p>
            <div class="value price totals__subtotal-value" id="mini-cart-total">
              <price-money><bdi><span class="price__prefix">R$</span>{ti}<sup class="price__suffix">,{tc}</sup></bdi></price-money>
            </div>
          </div><div class="taxes-discounts">
        </div>
      </div>

      <div class="button-container">
        <button class="button" type="button" id="mini-cart-go-checkout" onclick="window.location.href='/checkout.html'">
          Finalizar compra
        </button></div>
    </div>
  </div>
</form>
</div>"""

def render_cart_icon(count):
    if count == 0:
        return '<div class="shopify-section"></div>'
    return f'<div class="shopify-section"><span class="cart-count-bubble"><span aria-hidden="true">{count}</span><span class="visually-hidden">{count} itens</span></span></div>'

def get_sections(requested=None):
    count = cart['item_count']
    mini = render_mini_cart()
    icon = render_cart_icon(count)
    empty = '<div class="shopify-section"></div>'
    base = {
        'mini-cart':               mini,
        'cart-icon-bubble':        icon,
        'mobile-cart-icon-bubble': icon,
        # Seções da página /cart (fallback vazio se não renderizadas)
        'main-cart-items':         empty,
        'main-cart-footer':        empty,
        'cart-live-region-text':   empty,
    }
    if requested:
        return {k: base.get(k, empty) for k in requested}
    return base

# ─── Handler HTTP ─────────────────────────────────────────────────────────────

class AuraHandler(http.server.SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        print(f"  [{self.address_string()}] {fmt % args}")

    # ── Respostas helpers ──────────────────────────────────────────────────────

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def send_html(self, html, status=200):
        body = html.encode()
        self.send_response(status)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        return self.rfile.read(length)

    # ── GET ────────────────────────────────────────────────────────────────────

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)
        path = parsed.path

        # Cart JSON
        if path == '/cart.js':
            self.send_json(cart)
            return

        # Section rendering (mini-cart drawer content)
        if 'section_id' in qs:
            sid = qs['section_id'][0]
            if sid == 'mini-cart':
                self.send_html(render_mini_cart())
                return
            if sid in ('cart-icon-bubble', 'mobile-cart-icon-bubble'):
                self.send_html(render_cart_icon(cart['item_count']))
                return

        # Rota sem extensão → tenta .html
        fs_path = path.strip('/')
        if fs_path == '':
            fs_path = 'index'

        if '.' not in os.path.basename(fs_path):
            for candidate in (fs_path + '.html', fs_path + '/index.html'):
                if os.path.exists(os.path.join(ROOT, candidate)):
                    self.path = '/' + candidate
                    break

        html_file = None
        if '.' not in os.path.basename(fs_path):
            for candidate in (fs_path + '.html', fs_path + '/index.html'):
                p = os.path.join(ROOT, candidate)
                if os.path.isfile(p):
                    html_file = p
                    break
        else:
            p = os.path.join(ROOT, fs_path.replace('/', os.sep))
            if p.endswith('.html') and os.path.isfile(p):
                html_file = p

        if html_file and os.path.isfile(html_file):
            marker = 'aura-cart-add-fix.js'
            try:
                with open(html_file, 'r', encoding='utf-8', errors='replace') as hf:
                    html = hf.read()
                if marker not in html and '</body>' in html:
                    inject = '    <script src="/cdn/shop/t/175/assets/aura-cart-add-fix.js" defer></script>\n'
                    html = html.replace('</body>', inject + '</body>', 1)
                    out = html.encode('utf-8')
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                    self.send_header('Cache-Control', 'no-store')
                    self.send_header('Content-Length', str(len(out)))
                    self.end_headers()
                    self.wfile.write(out)
                    return
            except OSError:
                pass

        super().do_GET()

    # ── POST ───────────────────────────────────────────────────────────────────

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        if len(path) > 1 and path.endswith('/'):
            path = path.rstrip('/')

        if path == '/checkout.html':
            self.send_response(303)
            self.send_header('Location', '/checkout-frete.html')
            self.end_headers()
            return

        if path == '/checkout-frete.html':
            self.send_response(303)
            self.send_header('Location', '/checkout-pagamento.html')
            self.end_headers()
            return

        if path == '/checkout-pagamento.html':
            cart['items'].clear()
            recalculate_cart()
            self.send_response(303)
            self.send_header('Location', '/checkout-obrigado.html')
            self.end_headers()
            return

        if path == '/checkout/complete':
            self._checkout_complete()
            return

        # Aceita /cart/add.js e /cart/add (mesma lógica)
        if path in ('/cart/add.js', '/cart/add'):
            self._cart_add()
        elif path in ('/cart/change.js', '/cart/change'):
            self._cart_change()
        elif path in ('/cart/update.js', '/cart/update'):
            self._cart_update()
        else:
            self.send_error(404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    # ── Lógica do carrinho ─────────────────────────────────────────────────────

    def _parse_body(self):
        body = self.read_body()
        ct = self.headers.get('Content-Type', '')
        if 'application/json' in ct:
            try:
                return json.loads(body), 'json'
            except Exception:
                return {}, 'json'
        if 'multipart/form-data' in ct and body:
            try:
                msg_data = b'Content-Type: ' + ct.encode('ascii', errors='replace') + b'\r\n\r\n' + body
                msg = BytesParser(policy=policy.default).parsebytes(msg_data)
                data = {}
                if msg.is_multipart():
                    for part in msg.iter_parts():
                        if part.get_content_disposition() != 'form-data':
                            continue
                        if part.get_filename():
                            continue
                        name = part.get_param('name', header='content-disposition')
                        if not name:
                            continue
                        payload = part.get_content()
                        if isinstance(payload, bytes):
                            payload = payload.decode('utf-8', errors='replace')
                        data.setdefault(name, []).append(payload)
                return data, 'form'
            except Exception:
                return {}, 'form'
        try:
            return urllib.parse.parse_qs(body.decode('utf-8', errors='replace')), 'form'
        except Exception:
            return {}, 'form'

    def _requested_sections(self, data, fmt):
        """Extrai lista de section ids do JSON ou do form (FormData pode vir como string com vírgulas)."""
        if fmt == 'json':
            r = data.get('sections')
            if r is None:
                return None
            if isinstance(r, list):
                return [str(x) for x in r if x is not None]
            return [str(r)]
        vals = data.get('sections') or []
        out = []
        for v in vals:
            for part in str(v).split(','):
                p = part.strip()
                if p:
                    out.append(p)
        return out or None

    def _cart_add(self):
        data, fmt = self._parse_body()
        to_add = []

        if fmt == 'json':
            if 'items' in data:
                to_add = data['items']
            elif 'id' in data:
                to_add = [{'id': data['id'], 'quantity': data.get('quantity', 1)}]
        else:
            vid = data.get('id', [None])[0]
            qty = int((data.get('quantity', ['1'])[0]) or 1)
            if vid:
                to_add = [{'id': vid, 'quantity': qty}]

        added = []
        for entry in to_add:
            vid = str(entry.get('id', ''))
            qty = int(entry.get('quantity', 1))
            existing = next((i for i in cart['items'] if str(i['variant_id']) == vid), None)
            if existing:
                existing['quantity'] += qty
                existing['line_price'] = existing['price'] * existing['quantity']
                existing['final_line_price'] = existing['line_price']
                added.append(existing)
            else:
                item = make_cart_item(vid, qty)
                if item:
                    cart['items'].append(item)
                    added.append(item)

        if not added:
            self.send_json({'status': 422, 'message': 'Produto não encontrado'}, 422)
            return

        recalculate_cart()
        requested_sections = self._requested_sections(data, fmt)
        resp = dict(added[0])
        resp['sections'] = get_sections(requested_sections)
        self.send_json(resp)

    def _cart_change(self):
        data, fmt = self._parse_body()
        # Também aceita params na query string (links de remoção usam href)
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)

        if fmt == 'json':
            item_id = str(data.get('id', ''))
            quantity = int(data.get('quantity', 0))
            line = data.get('line')
        else:
            item_id = (data.get('id', qs.get('id', ['']))[0])
            quantity = int((data.get('quantity', qs.get('quantity', ['0']))[0]) or 0)
            line = (data.get('line', qs.get('line', [None]))[0])

        vid = item_id.split(':')[0] if ':' in str(item_id) else str(item_id)

        # Localiza o item
        target_idx = None
        if line:
            try:
                target_idx = int(line) - 1
            except ValueError:
                pass

        if target_idx is None:
            for i, item in enumerate(cart['items']):
                if str(item['variant_id']) == vid:
                    target_idx = i
                    break

        if target_idx is not None and 0 <= target_idx < len(cart['items']):
            if quantity <= 0:
                cart['items'].pop(target_idx)
            else:
                it = cart['items'][target_idx]
                it['quantity'] = quantity
                it['line_price'] = it['price'] * quantity
                it['final_line_price'] = it['line_price']

        recalculate_cart()
        requested_sections = self._requested_sections(data, fmt)
        resp = dict(cart)
        resp['sections'] = get_sections(requested_sections)
        self.send_json(resp)

    def _cart_update(self):
        data, fmt = self._parse_body()

        if fmt == 'json':
            updates = data.get('updates', {})
        else:
            updates = {}
            for k, v in data.items():
                # updates[variant_id] = qty
                if k.startswith('updates['):
                    vid = k[8:].rstrip(']')
                    updates[vid] = int(v[0])

        for vid, qty in updates.items():
            for item in list(cart['items']):
                if str(item['variant_id']) == str(vid):
                    if qty <= 0:
                        cart['items'].remove(item)
                    else:
                        item['quantity'] = qty
                        item['line_price'] = item['price'] * qty
                        item['final_line_price'] = item['line_price']
                    break

        recalculate_cart()
        requested_sections = self._requested_sections(data, fmt)
        resp = dict(cart)
        resp['sections'] = get_sections(requested_sections)
        self.send_json(resp)

    def _checkout_complete(self):
        """Finaliza pedido mock: esvazia o carrinho e devolve URL de obrigado."""
        cart['items'].clear()
        recalculate_cart()
        self.send_json({
            'ok': True,
            'redirect': '/checkout-obrigado.html',
            'sections': get_sections(),
        })


# ─── Inicialização ────────────────────────────────────────────────────────────

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('', PORT), AuraHandler) as httpd:
        print(f"")
        print(f"  AURA Beauty Club — servidor local rodando")
        print(f"  Acesse: http://localhost:{PORT}")
        print(f"  Ctrl+C para parar")
        print(f"")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Servidor encerrado.")
