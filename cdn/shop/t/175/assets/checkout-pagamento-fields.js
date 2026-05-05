/**
 * checkout-pagamento: máscaras e validação de cartão, CPF/CNPJ, parcelas e bloqueio de submit.
 */
(function () {
  'use strict';

  var numEl = document.getElementById('mock-card-number');
  var expEl = document.getElementById('mock-card-expiry');
  var cvvEl = document.getElementById('mock-card-cvv');
  var nameEl = document.getElementById('mock-card-name');
  var docEl = document.querySelector('input[name="CPF/CNPJ"]');
  var parcelasWrap = document.getElementById('checkout-parcelas-container');
  var parcelasSel = document.getElementById('Select3');
  var billingBlock = document.getElementById('checkout-billing-address-block');

  function digits(v) {
    return String(v || '').replace(/\D/g, '');
  }

  function isAmex(d) {
    var n = d.replace(/\D/g, '');
    return n.indexOf('34') === 0 || n.indexOf('37') === 0;
  }

  function formatCardNumber(d) {
    d = d.replace(/\D/g, '').slice(0, 19);
    if (!d.length) return '';
    if (isAmex(d)) {
      if (d.length <= 4) return d;
      if (d.length <= 10) return d.slice(0, 4) + ' ' + d.slice(4);
      return d.slice(0, 4) + ' ' + d.slice(4, 10) + ' ' + d.slice(10, 15);
    }
    return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  }

  function formatExpiry(d) {
    d = d.slice(0, 4);
    if (d.length <= 2) return d;
    return d.slice(0, 2) + '/' + d.slice(2, 4);
  }

  function formatCvv(d, maxLen) {
    return d.replace(/\D/g, '').slice(0, maxLen);
  }

  function luhnOk(numStr) {
    var d = numStr.replace(/\D/g, '');
    if (d.length < 13 || d.length > 19) return false;
    var sum = 0;
    var alt = false;
    for (var i = d.length - 1; i >= 0; i--) {
      var n = parseInt(d.charAt(i), 10);
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  function expiryOk(mmyy) {
    var d = digits(mmyy);
    if (d.length !== 4) return false;
    var mm = parseInt(d.slice(0, 2), 10);
    var yy = parseInt(d.slice(2, 4), 10);
    if (mm < 1 || mm > 12) return false;
    var now = new Date();
    var yFull = 2000 + yy;
    var expEnd = new Date(yFull, mm, 0, 23, 59, 59);
    return expEnd >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function validateCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    var i;
    var soma = 0;
    for (i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i), 10) * (10 - i);
    var d1 = (soma * 10) % 11;
    if (d1 === 10) d1 = 0;
    if (d1 !== parseInt(cpf.charAt(9), 10)) return false;
    soma = 0;
    for (i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i), 10) * (11 - i);
    var d2 = (soma * 10) % 11;
    if (d2 === 10) d2 = 0;
    return d2 === parseInt(cpf.charAt(10), 10);
  }

  function validateCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
    var tamanho = cnpj.length - 2;
    var numeros = cnpj.substring(0, tamanho);
    var digitos = cnpj.substring(tamanho);
    var soma = 0;
    var pos = tamanho - 7;
    var i;
    for (i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    var resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado != digitos.charAt(0)) return false;
    tamanho += 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    return resultado == digitos.charAt(1);
  }

  function docValid(val) {
    var d = digits(val);
    if (d.length === 11) return validateCPF(d);
    if (d.length === 14) return validateCNPJ(d);
    return false;
  }

  function formatDocBr(raw) {
    var d = digits(raw);
    if (d.length <= 11) {
      d = d.slice(0, 11);
      if (d.length <= 3) return d;
      if (d.length <= 6) return d.slice(0, 3) + '.' + d.slice(3);
      if (d.length <= 9) return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6);
      return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9);
    }
    d = d.slice(0, 14);
    if (d.length <= 2) return d;
    if (d.length <= 5) return d.slice(0, 2) + '.' + d.slice(2);
    if (d.length <= 8) return d.slice(0, 2) + '.' + d.slice(2, 5) + '.' + d.slice(5);
    if (d.length <= 12) return d.slice(0, 2) + '.' + d.slice(2, 5) + '.' + d.slice(5, 8) + '/' + d.slice(8);
    return d.slice(0, 2) + '.' + d.slice(2, 5) + '.' + d.slice(5, 8) + '/' + d.slice(8, 12) + '-' + d.slice(12, 14);
  }

  function errEl(id, afterEl) {
    var e = document.getElementById(id);
    if (e) return e;
    e = document.createElement('p');
    e.id = id;
    e.className = 'checkout-pay-field-msg checkout-pay-field-msg--error';
    e.setAttribute('role', 'alert');
    e.hidden = true;
    var host = afterEl && afterEl.closest ? afterEl.closest('[data-protected-input="true"]') : null;
    if (host && host.parentElement) host.parentElement.appendChild(e);
    else if (afterEl && afterEl.parentElement) {
      var p = afterEl.parentElement;
      if (afterEl.nextSibling) p.insertBefore(e, afterEl.nextSibling);
      else p.appendChild(e);
    }
    return e;
  }

  function showErr(id, afterEl, msg) {
    var e = errEl(id, afterEl);
    e.textContent = msg || '';
    e.hidden = !msg;
  }

  function clearErr(id) {
    var e = document.getElementById(id);
    if (e) {
      e.textContent = '';
      e.hidden = true;
    }
  }


  function cardCompleteLen() {
    var d = digits(numEl && numEl.value);
    if (isAmex(d)) return d.length === 15;
    return d.length >= 13 && d.length <= 19;
  }

  function cvvMax() {
    return isAmex(numEl && numEl.value) ? 4 : 3;
  }

  function isCreditSelected() {
    var r = document.getElementById('basic-creditCards');
    return !!(r && r.checked);
  }

  function cardReadyForParcelas() {
    var dNum = digits(numEl && numEl.value);
    var dExp = digits(expEl && expEl.value);
    var dCvv = digits(cvvEl && cvvEl.value);
    var nameOk = nameEl && String(nameEl.value || '').trim().length >= 2;
    var lenOk = cardCompleteLen();
    var expOk = dExp.length === 4 && expiryOk(dExp);
    var cvvOk = dCvv.length === cvvMax();
    return nameOk && lenOk && expOk && cvvOk && luhnOk(dNum);
  }

  function setParcelasWaitingPlaceholder() {
    if (!parcelasSel) return;
    parcelasFilled = false;
    parcelasSel.innerHTML = '';
    var ph = document.createElement('option');
    ph.value = '';
    ph.disabled = true;
    ph.selected = true;
    ph.textContent = 'Preencha os dados do cartão para ver as parcelas';
    parcelasSel.appendChild(ph);
    parcelasSel.disabled = true;
    parcelasSel.removeAttribute('required');
  }

  function updateParcelasBlock() {
    if (!parcelasWrap || !parcelasSel) return;
    if (!isCreditSelected()) {
      parcelasWrap.hidden = true;
      parcelasWrap.setAttribute('aria-hidden', 'true');
      parcelasSel.removeAttribute('required');
      parcelasSel.disabled = false;
      return;
    }
    parcelasWrap.hidden = false;
    parcelasWrap.setAttribute('aria-hidden', 'false');

    if (cardReadyForParcelas()) {
      parcelasSel.disabled = false;
      parcelasSel.setAttribute('required', 'required');
      fillParcelasIfNeeded();
    } else {
      setParcelasWaitingPlaceholder();
    }
  }

  var parcelasFilled = false;
  function fillParcelasIfNeeded() {
    if (parcelasFilled || !parcelasSel) return;
    fetch('/cart.js', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then(function (r) {
        return r.json();
      })
      .then(function (cart) {
        if (!isCreditSelected() || !cardReadyForParcelas()) {
          parcelasFilled = false;
          return;
        }
        var cents = cart.total_price || 0;
        parcelasSel.innerHTML = '';
        var ph = document.createElement('option');
        ph.value = '';
        ph.disabled = true;
        ph.selected = true;
        ph.textContent = 'Selecione as parcelas';
        parcelasSel.appendChild(ph);
        var i;
        for (i = 1; i <= 12; i++) {
          var per = Math.round(cents / i);
          var opt = document.createElement('option');
          opt.value = String(i);
          opt.textContent =
            i +
            'x de R$ ' +
            (per / 100).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) +
            ' sem juros';
          parcelasSel.appendChild(opt);
        }
        parcelasFilled = true;
      })
      .catch(function () {
        if (!isCreditSelected() || !cardReadyForParcelas()) return;
        if (!parcelasSel.options.length || parcelasSel.options.length < 2) {
          parcelasSel.innerHTML =
            '<option value="" disabled selected>Selecione as parcelas</option>' +
            '<option value="1">1x sem juros</option>';
          parcelasFilled = true;
        }
      });
  }

  function wireInput(el, onInput) {
    if (!el) return;
    el.addEventListener('input', onInput);
    el.addEventListener('blur', onInput);
  }

  if (numEl) {
    wireInput(numEl, function () {
      var cur = numEl.value;
      var masked = formatCardNumber(cur);
      if (masked !== cur) {
        var pos = numEl.selectionStart;
        numEl.value = masked;
        try {
          if (pos != null) {
            var n = digits(cur.slice(0, pos)).length;
            var i;
            var seen = 0;
            for (i = 0; i < masked.length; i++) {
              if (/\d/.test(masked[i])) {
                seen++;
                if (seen >= n) {
                  numEl.setSelectionRange(i + 1, i + 1);
                  break;
                }
              }
            }
          }
        } catch (e) {}
      }
      var d = digits(numEl.value);
      if (d.length >= 13) {
        if (luhnOk(d)) clearErr('err-card-number');
        else showErr('err-card-number', numEl, 'Número do cartão inválido.');
      } else clearErr('err-card-number');
      if (cvvEl) {
        var m = cvvMax();
        var cv = formatCvv(cvvEl.value, m);
        if (cv !== cvvEl.value) cvvEl.value = cv;
      }
      updateParcelasBlock();
    });
  }

  if (expEl) {
    wireInput(expEl, function () {
      var cur = expEl.value;
      var d = digits(cur).slice(0, 4);
      var masked = formatExpiry(d);
      if (masked !== cur) {
        var pos = expEl.selectionStart;
        expEl.value = masked;
        try {
          if (pos != null && digits(cur.slice(0, pos)).length <= 2) {
            expEl.setSelectionRange(Math.min(3, masked.length), Math.min(3, masked.length));
          } else if (pos != null) {
            expEl.setSelectionRange(masked.length, masked.length);
          }
        } catch (e2) {}
      }
      var dd = digits(expEl.value);
      if (dd.length === 4) {
        if (!expiryOk(dd)) showErr('err-card-exp', expEl, 'Data de validade inválida ou expirada.');
        else clearErr('err-card-exp');
      } else clearErr('err-card-exp');
      updateParcelasBlock();
    });
  }

  if (cvvEl) {
    wireInput(cvvEl, function () {
      var m = cvvMax();
      var cv = formatCvv(cvvEl.value, m);
      if (cv !== cvvEl.value) cvvEl.value = cv;
      var d = digits(cvvEl.value);
      if (d.length === m) clearErr('err-card-cvv');
      else if (d.length > 0 && d.length < m) clearErr('err-card-cvv');
      updateParcelasBlock();
    });
  }

  if (nameEl) {
    nameEl.addEventListener('input', updateParcelasBlock);
    nameEl.addEventListener('blur', updateParcelasBlock);
  }

  if (docEl) {
    wireInput(docEl, function () {
      var cur = docEl.value;
      var masked = formatDocBr(cur);
      if (masked !== cur) docEl.value = masked;
      var d = digits(docEl.value);
      if (d.length === 11 || d.length === 14) {
        if (docValid(docEl.value)) clearErr('err-doc');
        else showErr('err-doc', docEl, d.length === 11 ? 'CPF inválido.' : 'CNPJ inválido.');
      } else if (d.length > 0) clearErr('err-doc');
      else clearErr('err-doc');
    });
  }

  document.querySelectorAll('input[name="basic"]').forEach(function (r) {
    r.addEventListener('change', function () {
      updateParcelasBlock();
      parcelasFilled = false;
    });
  });

  window.__checkoutPagamentoValidate = function () {
    var dDoc = docEl ? digits(docEl.value) : '';
    if (docEl && (!dDoc.length || (dDoc.length !== 11 && dDoc.length !== 14) || !docValid(docEl.value))) {
      showErr('err-doc', docEl, 'Informe um CPF ou CNPJ válido.');
      docEl && docEl.focus();
      return false;
    }
    clearErr('err-doc');
    try {
      var info = JSON.parse(sessionStorage.getItem('aura_checkout_info') || '{}');
      info.document = dDoc;
      sessionStorage.setItem('aura_checkout_info', JSON.stringify(info));
    } catch (e) {}

    if (!isCreditSelected()) return true;

    if (!nameEl || String(nameEl.value || '').trim().length < 2) {
      window.alert('Informe o nome impresso no cartão.');
      nameEl && nameEl.focus();
      return false;
    }

    var dNum = digits(numEl && numEl.value);
    if (!cardCompleteLen()) {
      showErr('err-card-number', numEl, 'Número do cartão incompleto.');
      numEl && numEl.focus();
      return false;
    }
    if (!luhnOk(dNum)) {
      showErr('err-card-number', numEl, 'Número do cartão inválido.');
      numEl && numEl.focus();
      return false;
    }
    clearErr('err-card-number');

    var dExp = digits(expEl && expEl.value);
    if (dExp.length !== 4 || !expiryOk(dExp)) {
      showErr('err-card-exp', expEl, 'Validade inválida ou expirada (MM/AA).');
      expEl && expEl.focus();
      return false;
    }
    clearErr('err-card-exp');

    var m = cvvMax();
    var dCvv = digits(cvvEl && cvvEl.value);
    if (dCvv.length !== m) {
      showErr('err-card-cvv', cvvEl, m === 4 ? 'Informe os 4 dígitos do CVV.' : 'Informe os 3 dígitos do CVV.');
      cvvEl && cvvEl.focus();
      return false;
    }
    clearErr('err-card-cvv');

    if (parcelasSel && cardReadyForParcelas()) {
      if (!parcelasSel.value) {
        window.alert('Selecione o número de parcelas.');
        parcelasSel.focus();
        return false;
      }
    }

    return true;
  };

  updateParcelasBlock();
})();
