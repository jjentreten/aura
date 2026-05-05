
    (function() {
      var preconnectOrigins = ["https://cdn.shopify.com"];
      var scripts = ["/cdn/shopifycloud/checkout-web/assets/c1/polyfills-legacy.LxWgrnBi.js","/cdn/shopifycloud/checkout-web/assets/c1/app-legacy.Dp34PSYX.js","/cdn/shopifycloud/checkout-web/assets/c1/esnext-vendor-legacy.Bsbg8ceH.js","/cdn/shopifycloud/checkout-web/assets/c1/browser-legacy.DnoFauJO.js","/cdn/shopifycloud/checkout-web/assets/c1/FullScreenBackground-legacy.4R-cEdNd.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useReplaceShopPayInHistory-legacy.EsxfGv1A.js","/cdn/shopifycloud/checkout-web/assets/c1/utilities-shop-discount-offer-legacy.Dl7C_tn3.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShopPayProgressIntercepts-legacy.CbcaAPmG.js","/cdn/shopifycloud/checkout-web/assets/c1/phone-phoneCountryCode-legacy.BvQNP-rY.js","/cdn/shopifycloud/checkout-web/assets/c1/extensibility-shared-legacy.BjDpgeLo.js","/cdn/shopifycloud/checkout-web/assets/c1/consent-manager-shared-legacy.ChpFTzkd.js","/cdn/shopifycloud/checkout-web/assets/c1/helpers-setAddressErrors-legacy.DCuByeJY.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useHasOrdersFromMultipleShops-legacy.AJ10gEKW.js","/cdn/shopifycloud/checkout-web/assets/c1/events-shared-legacy.B2Jg1n0V.js","/cdn/shopifycloud/checkout-web/assets/c1/images-flag-icon-legacy.Bfupgm8k.js","/cdn/shopifycloud/checkout-web/assets/c1/images-payment-icon-legacy.BbBFqdfu.js","/cdn/shopifycloud/checkout-web/assets/c1/locale-pt-BR-legacy.C_2Mgd93.js","/cdn/shopifycloud/checkout-web/assets/c1/page-Information-legacy.BYigHR05.js","/cdn/shopifycloud/checkout-web/assets/c1/MarketsProDisclaimer-legacy.PWDfsNvN.js","/cdn/shopifycloud/checkout-web/assets/c1/CrossBorderConsolidation-legacy.Br1bSwPq.js","/cdn/shopifycloud/checkout-web/assets/c1/ShopPayLogo-legacy.DmnhoyR8.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useShopPayInstallmentsUkHoldoutExperiment-legacy.DC4l0Otp.js","/cdn/shopifycloud/checkout-web/assets/c1/AmazonPayButton-legacy.DpyHWpYF.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useForceShopPayUrl-legacy.CJAufO04.js","/cdn/shopifycloud/checkout-web/assets/c1/ShippingGroupsSummaryLine-legacy.DFuh2Zr1.js","/cdn/shopifycloud/checkout-web/assets/c1/StackedMerchandisePreview-legacy.CnTihuIe.js","/cdn/shopifycloud/checkout-web/assets/c1/PickupPointCarrierLogo-legacy.BHbQ4IJz.js","/cdn/shopifycloud/checkout-web/assets/c1/hooks-useSubscribeMessenger-legacy.DSNbvbVG.js","/cdn/shopifycloud/checkout-web/assets/c1/AutocompleteField-hooks-legacy.sbGM9j8r.js","/cdn/shopifycloud/checkout-web/assets/c1/Page-legacy.TimDxWKV.js","/cdn/shopifycloud/checkout-web/assets/c1/PaymentButtons-legacy.CQx3-SEI.js"];
      var styles = [];
      var fontPreconnectUrls = [];
      var fontPrefetchUrls = [];
      var imgPrefetchUrls = ["https://cdn.shopify.com/s/files/1/0664/9937/9368/files/logo_preto_x320.png?v=1723062299"];

      function preconnect(url, callback) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch preconnect';
        link.href = url;
        link.crossOrigin = '';
        link.onload = link.onerror = callback;
        document.head.appendChild(link);
      }

      function preconnectAssets() {
        var resources = preconnectOrigins.concat(fontPreconnectUrls);
        var index = 0;
        (function next() {
          var res = resources[index++];
          if (res) preconnect(res, next);
        })();
      }

      function prefetch(url, as, callback) {
        var link = document.createElement('link');
        if (link.relList.supports('prefetch')) {
          link.rel = 'prefetch';
          link.fetchPriority = 'low';
          link.as = as;
          if (as === 'font') link.type = 'font/woff2';
          link.href = url;
          link.crossOrigin = '';
          link.onload = link.onerror = callback;
          document.head.appendChild(link);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onloadend = callback;
          xhr.send();
        }
      }

      function prefetchAssets() {
        var resources = [].concat(
          scripts.map(function(url) { return [url, 'script']; }),
          styles.map(function(url) { return [url, 'style']; }),
          fontPrefetchUrls.map(function(url) { return [url, 'font']; }),
          imgPrefetchUrls.map(function(url) { return [url, 'image']; })
        );
        var index = 0;
        function run() {
          var res = resources[index++];
          if (res) prefetch(res[0], res[1], next);
        }
        var next = (self.requestIdleCallback || setTimeout).bind(self, run);
        next();
      }

      function onLoaded() {
        try {
          if (parseFloat(navigator.connection.effectiveType) > 2 && !navigator.connection.saveData) {
            preconnectAssets();
            prefetchAssets();
          }
        } catch (e) {}
      }

      if (document.readyState === 'complete') {
        onLoaded();
      } else {
        addEventListener('load', onLoaded);
      }
    })();
  