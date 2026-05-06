/**
 * Ajustes do checkout para Pix:
 * - Badge "10% OFF" ao lado do label Pix na página /checkout-pagamento.html (espelho estático)
 */
(function () {
  'use strict';

  function ensurePixBadge() {
    // Checkout "espelho": input id="basic-Pix" + label[for="basic-Pix"].
    var label = document.querySelector('label[for="basic-Pix"]');
    if (!label) return;

    // Evita duplicar.
    if (label.querySelector('.aura-pix-badge')) return;

    var badge = document.createElement('span');
    badge.className = 'aura-pix-badge';
    badge.textContent = '10% OFF';
    badge.style.display = 'inline-flex';
    badge.style.alignItems = 'center';
    badge.style.marginLeft = '8px';
    badge.style.padding = '2px 8px';
    badge.style.borderRadius = '999px';
    badge.style.fontSize = '12px';
    badge.style.fontWeight = '700';
    badge.style.lineHeight = '16px';
    badge.style.background = '#E8FFF3';
    badge.style.color = '#0B6B2F';
    badge.style.border = '1px solid #B7F0CE';

    label.appendChild(badge);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensurePixBadge);
  } else {
    ensurePixBadge();
  }
})();

