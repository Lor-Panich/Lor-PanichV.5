/* ======================================================
   V5 RENDER SKELETON
   - HTML only
   - No state mutation
   - No API
   - No event binding
====================================================== */

window.Render = {};

/* ======================================================
   AFTER RENDER HOOK (EXTENSION POINT)
====================================================== */

Render._afterHooks = [];

/**
 * Register after-render hook
 * @param {Function} fn
 */
Render.after = function (fn) {
  if (typeof fn === "function") {
    Render._afterHooks.push(fn);
  }
};

Render.afterRender = function () {
  Render._afterHooks.forEach(fn => {
    try {
      fn();
    } catch (err) {
      console.error("[Render.afterRender]", err);
    }
  });
};

/* ======================================================
   CANONICAL: BASE WRAPPER (USAGE LOCKED)
====================================================== */

Render.page = function ({ header = "", content = "" }) {
  return `
    ${header}
    <section class="page-content">
      ${content}
    </section>
  `;
};

/* ======================================================
   CANONICAL: SHOP HEADER (APP CHROME)
   - side-effect only
====================================================== */

Render.shopHeader = function (title = "", subtitle = "") {
  const headerEl = document.getElementById("appHeader");
  if (!headerEl) return;

  // 🔒 reset previous header completely
  headerEl.textContent = "";

  headerEl.innerHTML = `
    <div class="shop-header-row">
      <div class="shop-header">
        <div class="shop-title">${title}</div>
        ${
          subtitle
            ? `<div class="shop-subtitle">${subtitle}</div>`
            : ""
        }
      </div>

      <button
        class="header-icon-btn"
        id="searchToggleBtn"
        type="button"
        aria-label="ค้นหา"
      >
        🔍
      </button>
    </div>
  `;
};

/* ======================================================
   CANONICAL: ADMIN HEADER
====================================================== */

Render.adminHeader = function (title = "", rightHTML = "") {
  return `
    <div class="admin-header">
      <div class="admin-title">${title}</div>
      <div class="admin-actions">
        ${rightHTML}
      </div>
    </div>
  `;
};

/* ======================================================
   CANONICAL: EMPTY STATE
====================================================== */

Render.empty = function (message = "ไม่มีข้อมูล") {
  return `
    <div class="empty-state">
      ${message}
    </div>
  `;
};

/* ======================================================
   CANONICAL: SEARCH BAR (SUB HEADER)
====================================================== */

Render.searchBar = function () {
  return `
    <div class="search-bar">
      <input
        type="search"
        placeholder="ค้นหาจากชื่อสินค้า หรือรหัสสินค้า"
        class="search-input"
        autocomplete="off"
      />
    </div>
  `;
};

/* ======================================================
   CANONICAL: LOADING PLACEHOLDER
====================================================== */

Render.loading = function (message = "กำลังโหลด...") {
  return `
    <div class="loading-state">
      ${message}
    </div>
  `;
};

/* ======================================================
   CANONICAL: LIST WRAPPER
====================================================== */

Render.list = function (itemsHTML = "") {
  return `
    <div class="list-container">
      ${itemsHTML}
    </div>
  `;
};

/* ======================================================
   CANONICAL: CARD (NEUTRAL)
====================================================== */

Render.card = function (content = "") {
  return `
    <div class="card">
      ${content}
    </div>
  `;
};

// ======================================================
// PRODUCT CARD (V5)
// Read-only / Clickable / No business logic
// ======================================================
Render.productCard = function (product) {
  if (!product) return "";

  const {
    productId,
    name,
    code,
    price,
    stock,
    image
  } = product;

  const inStock = stock > 0;

  return `
    <div class="product-card ${!inStock ? "is-out" : ""}"
         data-action="open-product"
         data-product-id="${productId}">

      <div class="product-thumb">
        <img src="${image}" alt="${name}" loading="lazy" />
      </div>

      <div class="product-info">
        <div class="product-name">${name}</div>
        <div class="product-code">รหัส: ${code}</div>

        <div class="product-price">฿${Number(price).toLocaleString()}</div>

        <div class="product-stock">
          คงเหลือ ${stock}
          ${
            inStock
              ? `<span class="stock-badge ready">พร้อมขาย</span>`
              : `<span class="stock-badge out">หมด</span>`
          }
        </div>
      </div>
    </div>
  `;
};
