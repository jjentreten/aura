/**
 * aura-utm-capture.js
 * Captura UTMs e parâmetros de rastreamento da URL e persiste em localStorage.
 * Estratégia: last-touch — substitui se a URL contiver novos parâmetros;
 * mantém os anteriores caso a URL esteja limpa.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'aura_utm_params';
  var TRACKED = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck'];

  function fromUrl() {
    var result = {};
    try {
      var q = new URLSearchParams(window.location.search);
      TRACKED.forEach(function (k) {
        var v = q.get(k);
        if (v && v.trim()) result[k] = v.trim();
      });
    } catch (e) {}
    return result;
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  var urlParams = fromUrl();
  if (Object.keys(urlParams).length > 0) {
    save(urlParams);
  }

  // Expõe globalmente para os scripts de checkout lerem
  window.__auraUtmParams = function () {
    return load();
  };
})();
