(function () {
  "use strict";

  var SCRIPT = document.currentScript;
  var SCRIPT_BASE_URL = SCRIPT && SCRIPT.src ? SCRIPT.src : window.location.href;
  if (!SCRIPT) {
    return;
  }

  var ATTR_STORE_ID = SCRIPT.getAttribute("store-id") || SCRIPT.dataset.storeId;
  var ATTR_TARGET = SCRIPT.getAttribute("target") || SCRIPT.dataset.target || "#store-widget";
  var ATTR_API = SCRIPT.getAttribute("api-base") || SCRIPT.dataset.apiBase || "/public-api/products.json";
  var ATTR_LOCALE = SCRIPT.getAttribute("locale") || SCRIPT.dataset.locale;
  var ATTR_COLUMNS = parseInt(SCRIPT.getAttribute("columns") || SCRIPT.dataset.columns || "0", 10);

  if (!ATTR_STORE_ID) {
    console.warn("[ProductWidget] Missing required store-id attribute.");
    return;
  }

  var globalConfig = window.ProductWidgetConfig || {};
  var storeConfig = globalConfig[ATTR_STORE_ID] || {};

  var config = {
    storeId: ATTR_STORE_ID,
    targetSelector: storeConfig.targetSelector || ATTR_TARGET,
    apiBase: storeConfig.apiBase || ATTR_API,
    locale: storeConfig.locale || ATTR_LOCALE || "he-IL",
    currency: storeConfig.currency,
    columns: storeConfig.columns || ATTR_COLUMNS || 3,
    theme: {
      primary: (storeConfig.theme && storeConfig.theme.primary) || "#2563eb",
      text: (storeConfig.theme && storeConfig.theme.text) || "#0f172a",
      muted: (storeConfig.theme && storeConfig.theme.muted) || "#475569",
      border: (storeConfig.theme && storeConfig.theme.border) || "#dbe7ff",
      cardBackground: (storeConfig.theme && storeConfig.theme.cardBackground) || "#ffffff"
    }
  };

  var host = document.querySelector(config.targetSelector);
  if (!host) {
    console.warn("[ProductWidget] Target container not found:", config.targetSelector);
    return;
  }

  host.innerHTML = "";

  var root = document.createElement("section");
  root.className = "pmw-root";
  root.setAttribute("data-pmw-store", config.storeId);
  host.appendChild(root);

  injectStyles(root, config);
  renderSkeleton(root);
  loadProducts();

  function buildApiUrl(baseUrl, storeId) {
    var url = new URL(baseUrl, SCRIPT_BASE_URL);
    if (!url.searchParams.has("storeId")) {
      url.searchParams.set("storeId", storeId);
    }
    return url.toString();
  }

  async function loadProducts() {
    var endpoint = buildApiUrl(config.apiBase, config.storeId);

    try {
      var response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("API request failed with status " + response.status);
      }

      var payload = await response.json();
      var normalized = normalizePayload(payload, config.storeId);
      if (!normalized.products.length) {
        renderEmpty(root);
        return;
      }

      if (!config.currency && normalized.currency) {
        config.currency = normalized.currency;
      }

      renderProducts(root, normalized.products, config);
      dispatchWidgetEvent("loaded", {
        storeId: config.storeId,
        total: normalized.products.length,
        products: normalized.products
      });
    } catch (error) {
      console.error("[ProductWidget] Failed to load products", error);
      renderError(root);
      dispatchWidgetEvent("error", {
        storeId: config.storeId,
        message: error && error.message ? error.message : "Unknown error"
      });
    }
  }

  function normalizePayload(payload, storeId) {
    if (Array.isArray(payload.products)) {
      return {
        currency: payload.currency || null,
        products: payload.products
      };
    }

    if (Array.isArray(payload.stores)) {
      var found = payload.stores.find(function (store) {
        return String(store.storeId) === String(storeId);
      });
      return {
        currency: found && found.currency ? found.currency : null,
        products: found && Array.isArray(found.products) ? found.products : []
      };
    }

    return {
      currency: null,
      products: []
    };
  }

  function formatPrice(price, currency) {
    var activeCurrency = currency || "ILS";
    try {
      return new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency: activeCurrency,
        maximumFractionDigits: 2
      }).format(price);
    } catch (e) {
      return Number(price).toFixed(2) + " " + activeCurrency;
    }
  }

  function renderSkeleton(container) {
    container.innerHTML = '<div class="pmw-state">טוען מוצרים…</div>';
  }

  function renderError(container) {
    container.innerHTML = '<div class="pmw-state pmw-state-error">לא הצלחנו לטעון מוצרים כרגע. נסו שוב מאוחר יותר.</div>';
  }

  function renderEmpty(container) {
    container.innerHTML = '<div class="pmw-state">לא נמצאו מוצרים להצגה בחנות זו.</div>';
  }

  function renderProducts(container, products, activeConfig) {
    var grid = document.createElement("div");
    grid.className = "pmw-grid";
    grid.style.setProperty("--pmw-columns", String(Math.max(1, Math.min(activeConfig.columns || 3, 5))));

    products.forEach(function (product) {
      var card = document.createElement("article");
      card.className = "pmw-card";
      card.setAttribute("data-product-id", product.id);

      var image = document.createElement("img");
      image.className = "pmw-image";
      image.src = product.image || "";
      image.alt = product.name || "Product image";
      image.loading = "lazy";

      var body = document.createElement("div");
      body.className = "pmw-body";

      var title = document.createElement("h3");
      title.className = "pmw-title";
      title.textContent = product.name || "מוצר";

      var desc = document.createElement("p");
      desc.className = "pmw-description";
      desc.textContent = product.description || "";

      var price = document.createElement("strong");
      price.className = "pmw-price";
      price.textContent = formatPrice(product.price || 0, activeConfig.currency);

      var button = document.createElement("button");
      button.className = "pmw-button";
      button.type = "button";
      button.textContent = product.buttonText || "הוספה לסל";
      button.addEventListener("click", function () {
        dispatchWidgetEvent("add-to-cart", {
          storeId: activeConfig.storeId,
          product: product
        });
      });

      card.addEventListener("click", function (event) {
        if (event.target === button) {
          return;
        }
        dispatchWidgetEvent("product-click", {
          storeId: activeConfig.storeId,
          product: product
        });
      });

      body.appendChild(title);
      body.appendChild(desc);
      body.appendChild(price);
      body.appendChild(button);

      card.appendChild(image);
      card.appendChild(body);
      grid.appendChild(card);
    });

    container.innerHTML = "";
    container.appendChild(grid);
  }

  function dispatchWidgetEvent(eventName, detail) {
    window.dispatchEvent(
      new CustomEvent("pmw:" + eventName, {
        detail: detail
      })
    );
  }

  function injectStyles(container, activeConfig) {
    var styleId = "pmw-style-" + activeConfig.storeId;
    if (document.getElementById(styleId)) {
      return;
    }

    var style = document.createElement("style");
    style.id = styleId;
    style.textContent =
      '[data-pmw-store="' + activeConfig.storeId + '"]{font-family:Inter,Assistant,Arial,sans-serif;color:' + activeConfig.theme.text + ';}' +
      '[data-pmw-store="' + activeConfig.storeId + '"] .pmw-grid{display:grid;grid-template-columns:repeat(var(--pmw-columns),minmax(0,1fr));gap:14px;}' +
      '[data-pmw-store="' + activeConfig.storeId + '"] .pmw-card{display:grid;grid-template-rows:180px 1fr;background:' + activeConfig.theme.cardBackground + ';border:1px solid ' + activeConfig.theme.border + ';border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(15,23,42,.07);}' +
      '[data-pmw-store="' + activeConfig.storeId + '"] .pmw-image{width:100%;height:100%;object-fit:cover;background:#f1f5f9;}' +
      '[data-pmw-store="' + activeConfig.storeId + '"] .pmw-body{display:grid;gap:10px;padding:14px;align-content:start;}' +
      '[data-pmw-store="' + activeConfig.storeId + '"] .pmw-title{margin:0;font-size:1rem;line-height:1.35;}' +
      '[data-pmw-store="' + activeConfig.storeId + '"] .pmw-description{margin:0;color:' + activeConfig.theme.muted + ';font-size:.9rem;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}' +
      '[data-pmw-store="' + activeConfig.storeId + '"] .pmw-price{font-size:1rem;font-weight:800;}' +
      '[data-pmw-store="' + activeConfig.storeId + '"] .pmw-button{border:0;border-radius:10px;padding:10px 12px;cursor:pointer;background:' + activeConfig.theme.primary + ';color:#fff;font-weight:700;}' +
      '[data-pmw-store="' + activeConfig.storeId + '"] .pmw-state{padding:14px;border:1px dashed ' + activeConfig.theme.border + ';border-radius:12px;background:#f8fafc;color:' + activeConfig.theme.muted + ';}' +
      '[data-pmw-store="' + activeConfig.storeId + '"] .pmw-state-error{border-color:#fecaca;background:#fff1f2;color:#991b1b;}' +
      '@media(max-width:900px){[data-pmw-store="' + activeConfig.storeId + '"] .pmw-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}' +
      '@media(max-width:640px){[data-pmw-store="' + activeConfig.storeId + '"] .pmw-grid{grid-template-columns:1fr;}}';

    container.appendChild(style);
  }
})();
