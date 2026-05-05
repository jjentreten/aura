(function () {
  'use strict';

  function fmtBRL(cents) {
    return (Number(cents) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function lineItemRow(it) {
    const img = String(it.image || '').replace(/"/g, '&quot;');
    const qty = it.quantity || 1;
    const title = it.product_title || it.title || 'Produto';
    const price = fmtBRL(it.final_line_price != null ? it.final_line_price : (it.line_price || 0));
    return (
      '<div class="LoadingShellLine">' +
        '<div class="LoadingShellLineImageWrapper">' +
          '<img class="CheckoutLineImage LoadingShellLineImage--border-full LoadingShellLineImage--corner-radius-base" src="' + img + '" alt="" width="64" height="64" loading="lazy"/>' +
          '<span class="LoadingShellLineQuantity">' + esc(String(qty)) + '</span>' +
        '</div>' +
        '<div class="LoadingShellLineContent">' +
          '<div class="BlockStack BlockStack--spacing-small500">' +
            '<span class="Text Text--size-small">' + esc(title) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="LoadingShellLinePrice">' +
          '<span class="Text Text--size-small">' + price + '</span>' +
        '</div>' +
      '</div>'
    );
  }

  function totalsBlock(cart) {
    const sub = fmtBRL(cart.items_subtotal_price || cart.total_price);
    const total = fmtBRL(cart.total_price);
    const ship = 'A calcular';
    return (
      '<div class="BlockStack BlockStack--spacing-small100">' +
        '<div class="InlineStack InlineStack--spacing-base InlineStack--block-alignment-start InlineStack--inline-alignment-spaceBetween">' +
          '<span class="Text Text--size-small">Subtotal</span>' +
          '<span class="Text Text--size-small">' + sub + '</span>' +
        '</div>' +
        '<div class="InlineStack InlineStack--spacing-base InlineStack--block-alignment-start InlineStack--inline-alignment-spaceBetween">' +
          '<span class="Text Text--size-small">Frete</span>' +
          '<span class="Text Text--size-small">' + ship + '</span>' +
        '</div>' +
        '<div class="InlineStack InlineStack--spacing-base InlineStack--block-alignment-start InlineStack--inline-alignment-spaceBetween">' +
          '<span class="Text Text--size-small">Impostos</span>' +
          '<span class="Text Text--size-small">Inclusos</span>' +
        '</div>' +
        '<div class="InlineStack InlineStack--spacing-base InlineStack--block-alignment-start InlineStack--inline-alignment-spaceBetween">' +
          '<span class="Text Text--size-large">Total</span>' +
          '<span class="Text Text--size-large">' + total + '</span>' +
        '</div>' +
      '</div>'
    );
  }

  function mainForm() {
    return (
      '<div class="CheckoutForm">' +
        '<p class="CheckoutNote">Ambiente local: os dados abaixo são apenas para demonstração do layout. Nenhum pagamento real é processado.</p>' +
        '<div class="BlockStack BlockStack--spacing-base">' +
          '<h2 class="CheckoutSectionTitle">Contato</h2>' +
          '<div class="CheckoutField"><label for="co-email">E-mail</label><input id="co-email" name="email" type="email" autocomplete="email" required placeholder="seu@email.com"/></div>' +
          '<div class="CheckoutField"><label for="co-phone">Telefone</label><input id="co-phone" name="phone" type="tel" autocomplete="tel" placeholder="(00) 00000-0000"/></div>' +
        '</div>' +
        '<div class="Divider"></div>' +
        '<div class="BlockStack BlockStack--spacing-base">' +
          '<h2 class="CheckoutSectionTitle">Entrega</h2>' +
          '<div class="CheckoutField"><label for="co-name">Nome completo</label><input id="co-name" name="name" type="text" autocomplete="name" required/></div>' +
          '<div class="CheckoutField"><label for="co-cep">CEP</label><input id="co-cep" name="cep" type="text" autocomplete="postal-code" required placeholder="00000-000"/></div>' +
          '<div class="CheckoutField"><label for="co-address">Endereço</label><input id="co-address" name="address" type="text" autocomplete="street-address" required/></div>' +
          '<div class="CheckoutField"><label for="co-city">Cidade</label><input id="co-city" name="city" type="text" autocomplete="address-level2" required/></div>' +
          '<div class="CheckoutField"><label for="co-state">Estado</label><select id="co-state" name="state" required><option value="">Selecione</option><option value="SP">SP</option><option value="RJ">RJ</option><option value="MG">MG</option><option value="PR">PR</option><option value="RS">RS</option><option value="OUTRO">Outro</option></select></div>' +
        '</div>' +
        '<div class="Divider"></div>' +
        '<div class="BlockStack BlockStack--spacing-base">' +
          '<h2 class="CheckoutSectionTitle">Observações</h2>' +
          '<div class="CheckoutField"><label for="co-note">Deixe uma nota para a loja (opcional)</label><textarea id="co-note" name="note" placeholder="Instruções de entrega, presente, etc."></textarea></div>' +
        '</div>' +
        '<button type="submit" class="CheckoutSubmit" id="co-submit">Pagar e finalizar pedido</button>' +
      '</div>'
    );
  }

  async function init() {
    let cart;
    try {
      const res = await fetch('/cart.js', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('cart');
      cart = await res.json();
    } catch (e) {
      window.location.href = '/cart.html';
      return;
    }

    if (!cart.item_count) {
      window.location.href = '/cart.html';
      return;
    }

    document.body.classList.remove('Loading');
    document.body.classList.add('checkout-loaded');

    const disc = document.querySelector('.LoadingShellDisclosureButtonContent');
    if (disc) {
      disc.innerHTML =
        '<span class="Text Text--size-small">' +
        esc(String(cart.item_count)) + (cart.item_count === 1 ? ' item' : ' itens') +
        '</span><span class="Text Text--size-large">' + fmtBRL(cart.total_price) + '</span>';
    }

    const bj = document.querySelector('.LoadingShellBuyerJourneyContent');
    if (bj) {
      bj.innerHTML =
        '<nav class="CheckoutBreadcrumb" aria-label="Etapas do checkout">' +
        '<ol>' +
        '<li><a href="/cart.html">Carrinho</a></li>' +
        '<li aria-current="step">Informações</li>' +
        '<li>Frete</li>' +
        '<li>Pagamento</li>' +
        '</ol></nav>';
    }

    const main = document.querySelector('.LoadingShellMainContentPrimary');
    if (main) {
      main.innerHTML =
        '<div class="BlockStack BlockStack--spacing-large200">' +
          '<div class="BlockStack BlockStack--spacing-base">' +
            '<p class="Text Text--size-large" style="margin:0;font-weight:600;">Pagamento rápido</p>' +
            '<p class="CheckoutNote">Apple Pay, Google Pay e cartão ficam desativados nesta cópia local do site.</p>' +
          '</div>' +
          '<div class="ExpressCheckoutDivider"><div class="Divider"></div></div>' +
          '<form id="checkout-form" class="BlockStack BlockStack--spacing-large200" novalidate>' +
            mainForm() +
          '</form>' +
        '</div>';
    }

    const wrap = document.querySelector('.LoadingShellOrderSummaryContentPrimary .BlockStack--spacing-large200');
    if (wrap) {
      const h2 = wrap.querySelector('h2.VisuallyHidden');
      wrap.innerHTML = '';
      if (h2) {
        h2.textContent = 'Resumo do pedido';
        wrap.appendChild(h2);
      }
      const lines = document.createElement('div');
      lines.className = 'LoadingShellLineItems';
      lines.innerHTML = (cart.items || []).map(lineItemRow).join('');
      wrap.appendChild(lines);
      const totals = document.createElement('div');
      totals.innerHTML = totalsBlock(cart);
      wrap.appendChild(totals.firstElementChild);
    }

    const form = document.getElementById('checkout-form');
    const submitBtn = document.getElementById('co-submit');
    if (form && submitBtn) {
      form.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        if (!form.reportValidity()) return;
        submitBtn.disabled = true;
        try {
          const res = await fetch('/checkout/complete', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ ok: true }),
          });
          const data = await res.json();
          if (data.redirect) {
            window.location.href = data.redirect;
            return;
          }
        } catch (err) {
          console.error(err);
        }
        submitBtn.disabled = false;
        alert('Não foi possível concluir. Verifique se o servidor local está rodando.');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
