/**
 * CEP: máscara 00000-000, ViaCEP + BrasilAPI, modal de carregamento.
 * Telefone: máscara (00) 00000-0000 / (00) 0000-0000.
 */
(function () {
  'use strict';

  var form = document.getElementById('Form0');
  if (!form) return;

  var cepInput =
    form.querySelector('input#postalCode:not([tabindex="-1"])') ||
    form.querySelector('input[name="postalCode"]:not([tabindex="-1"])');
  var phoneInput =
    form.querySelector('input[name="phone"]:not([tabindex="-1"])') ||
    form.querySelector('input#TextField7');

  var street = form.querySelector('[name="streetName"]');
  var neighborhood = form.querySelector('[name="neighborhood"]');
  var city = form.querySelector('[name="city"]');
  var zone = form.querySelector('select[name="zone"]');

  var fetchGen = 0;
  var currentAbort = null;

  var modal = document.createElement('div');
  modal.id = 'checkout-cep-modal';
  modal.className = 'checkout-cep-modal';
  modal.setAttribute('hidden', '');
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML =
    '<div class="checkout-cep-modal__backdrop" aria-hidden="true"></div>' +
    '<div class="checkout-cep-modal__panel" role="dialog" aria-modal="true" aria-labelledby="checkout-cep-modal-title">' +
    '  <div class="checkout-cep-modal__spinner" aria-hidden="true"></div>' +
    '  <p id="checkout-cep-modal-title" class="checkout-cep-modal__title">Buscando endereço…</p>' +
    '  <p class="checkout-cep-modal__msg" hidden></p>' +
    '</div>';
  document.body.appendChild(modal);

  var modalTitle = modal.querySelector('.checkout-cep-modal__title');
  var modalMsg = modal.querySelector('.checkout-cep-modal__msg');
  var modalSpinner = modal.querySelector('.checkout-cep-modal__spinner');
  var modalBackdrop = modal.querySelector('.checkout-cep-modal__backdrop');

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', function () {
      if (modalSpinner && modalSpinner.style.display === 'none') {
        hideCepModal();
      }
    });
  }

  function showCepModal(mode, titleText, messageText) {
    modal.removeAttribute('hidden');
    modal.setAttribute('aria-hidden', 'false');
    if (modalTitle) modalTitle.textContent = titleText || '';
    if (mode === 'loading') {
      if (modalSpinner) modalSpinner.style.display = '';
      if (modalMsg) {
        modalMsg.hidden = true;
        modalMsg.textContent = '';
      }
    } else {
      if (modalSpinner) modalSpinner.style.display = 'none';
      if (modalMsg) {
        modalMsg.hidden = !messageText;
        modalMsg.textContent = messageText || '';
      }
    }
  }

  function hideCepModal() {
    modal.setAttribute('hidden', '');
    modal.setAttribute('aria-hidden', 'true');
    if (modalSpinner) modalSpinner.style.display = '';
    if (modalMsg) {
      modalMsg.hidden = true;
      modalMsg.textContent = '';
    }
  }

  function digitsOnly(v) {
    return String(v || '').replace(/\D/g, '');
  }

  function formatCepMask(d) {
    if (d.length <= 5) return d;
    return d.slice(0, 5) + '-' + d.slice(5, 8);
  }

  /** (00) 00000-0000 com 11 dígitos; (00) 0000-0000 com 10 (fixo). */
  function formatPhoneBr(d) {
    d = d.slice(0, 11);
    if (!d.length) return '';
    if (d.length <= 2) return '(' + d;
    var ddd = d.slice(0, 2);
    var rest = d.slice(2);
    if (!rest.length) return '(' + ddd + ') ';
    if (d.length <= 6) return '(' + ddd + ') ' + rest;
    if (d.length <= 10) {
      return '(' + ddd + ') ' + rest.slice(0, 4) + (rest.length > 4 ? '-' + rest.slice(4, 8) : '');
    }
    return '(' + ddd + ') ' + rest.slice(0, 5) + '-' + rest.slice(5, 9);
  }

  function setFieldsBusy(busy) {
    [street, neighborhood, city].forEach(function (el) {
      if (!el) return;
      el.readOnly = busy;
      el.classList.toggle('checkout-cep-field--locked', busy);
      el.setAttribute('aria-busy', busy ? 'true' : 'false');
    });
    if (zone) {
      if (busy) {
        zone.style.pointerEvents = 'none';
        zone.setAttribute('tabindex', '-1');
        zone.setAttribute('aria-disabled', 'true');
      } else {
        zone.style.pointerEvents = '';
        zone.removeAttribute('tabindex');
        zone.removeAttribute('aria-disabled');
      }
    }
    if (cepInput) cepInput.readOnly = busy;
  }

  function syncHiddenProvinceUf(uf) {
    if (!uf) return;
    form.querySelectorAll('input[name="province"]').forEach(function (inp) {
      inp.value = uf;
    });
    form.querySelectorAll('input[name="address-level1"]').forEach(function (inp) {
      if (inp.id && inp.id.indexOf('autofill') === 0) inp.value = uf;
    });
  }

  function applyViaCep(data) {
    if (!data || data.erro) return false;
    if (street) street.value = data.logradouro || '';
    if (neighborhood) neighborhood.value = data.bairro || '';
    if (city) city.value = data.localidade || '';
    var uf = String(data.uf || '').toUpperCase();
    if (zone && uf) {
      zone.value = uf;
      zone.dispatchEvent(new Event('change', { bubbles: true }));
    }
    syncHiddenProvinceUf(uf);
    return true;
  }

  function applyBrasilApi(data) {
    if (!data || data.errors) return false;
    if (street) street.value = data.street || '';
    if (neighborhood) neighborhood.value = data.neighborhood || '';
    if (city) city.value = data.city || '';
    var uf = String(data.state || '').toUpperCase();
    if (zone && uf) {
      zone.value = uf;
      zone.dispatchEvent(new Event('change', { bubbles: true }));
    }
    syncHiddenProvinceUf(uf);
    return true;
  }

  function scheduleLookup() {
    var d = cepInput ? digitsOnly(cepInput.value) : '';
    if (d.length !== 8) {
      if (currentAbort) {
        currentAbort.abort();
        currentAbort = null;
      }
      setFieldsBusy(false);
      hideCepModal();
      return;
    }
    clearTimeout(scheduleLookup._t);
    scheduleLookup._t = setTimeout(function () {
      runFetch(d);
    }, 450);
  }

  async function runFetch(cep8) {
    if (currentAbort) currentAbort.abort();
    var myGen = ++fetchGen;
    currentAbort = new AbortController();
    var sig = currentAbort.signal;

    setFieldsBusy(true);
    showCepModal('loading', 'Buscando endereço…', null);

    try {
      try {
        var r = await fetch('https://viacep.com.br/ws/' + cep8 + '/json/', {
          signal: sig,
          credentials: 'omit',
        });
        var j = await r.json();
        if (myGen !== fetchGen) return;
        if (j && !j.erro && j.cep) {
          applyViaCep(j);
          hideCepModal();
          return;
        }
      } catch (e) {
        if (e.name === 'AbortError') return;
      }

      try {
        var r2 = await fetch('https://brasilapi.com.br/api/cep/v1/' + cep8, {
          signal: sig,
          credentials: 'omit',
        });
        if (!r2.ok) throw new Error('brasilapi');
        var j2 = await r2.json();
        if (myGen !== fetchGen) return;
        if (applyBrasilApi(j2)) {
          hideCepModal();
          return;
        }
      } catch (e2) {
        if (e2.name === 'AbortError') return;
      }

      if (myGen !== fetchGen) return;
      showCepModal('error', 'CEP não encontrado', 'Não encontramos este CEP. Verifique os números ou preencha o endereço manualmente.');
      setTimeout(function () {
        if (fetchGen === myGen) hideCepModal();
      }, 3800);
    } finally {
      if (myGen === fetchGen) setFieldsBusy(false);
    }
  }

  if (cepInput) {
    cepInput.addEventListener('input', function () {
      var cur = cepInput.value;
      var d = digitsOnly(cur);
      if (d.length > 8) d = d.slice(0, 8);
      var masked = formatCepMask(d);
      if (masked !== cur) {
        var pos = cepInput.selectionStart;
        cepInput.value = masked;
        try {
          if (pos != null && typeof pos === 'number') {
            var n = digitsOnly(cur.slice(0, pos)).length;
            var newPos = n <= 5 ? n : Math.min(n + 1, masked.length);
            cepInput.setSelectionRange(newPos, newPos);
          }
        } catch (err) {}
      }
      scheduleLookup();
    });

    cepInput.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') {
        var d = digitsOnly(cepInput.value);
        if (d.length === 8) {
          clearTimeout(scheduleLookup._t);
          runFetch(d);
        }
      }
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      var cur = phoneInput.value;
      var d = digitsOnly(cur);
      var masked = formatPhoneBr(d);
      if (masked !== cur) {
        var pos = phoneInput.selectionStart;
        phoneInput.value = masked;
        try {
          if (pos != null && typeof pos === 'number') {
            var n = digitsOnly(cur.slice(0, pos)).length;
            var newPos = 0;
            var i;
            var seen = 0;
            for (i = 0; i < masked.length; i++) {
              if (/\d/.test(masked[i])) {
                seen++;
                if (seen >= n) {
                  newPos = i + 1;
                  break;
                }
              }
            }
            if (n === 0) newPos = 0;
            phoneInput.setSelectionRange(newPos, newPos);
          }
        } catch (err2) {}
      }
    });

    phoneInput.addEventListener('blur', function () {
      var d = digitsOnly(phoneInput.value);
      if (d.length >= 10) {
        phoneInput.value = formatPhoneBr(d);
      }
    });
  }
})();
