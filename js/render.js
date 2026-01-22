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
   🔍 keyword: AFTER RENDER HOOK
====================================================== */

Render._afterHooks = [];

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
   CANONICAL: BASE WRAPPER
   🔍 keyword: CANONICAL COMPONENT
====================================================== */

/**
 * แม่แบบโครงหน้า (ใช้ทั้ง Viewer / Admin)
 */
Render.page = function ({ header = "", content = "" }) {
  return `
    ${header}
    <section class="page-content">
      ${content}
    </section>
  `;
};

/* ======================================================
   CANONICAL: SHOP HEADER (VIEWER)
   🔍 keyword: CANONICAL SHOP HEADER
====================================================== */

Render.shopHeader = function (title = "", subtitle = "") {
  return `
    <div class="shop-header">
      <div class="shop-title">${title}</div>
      ${
        subtitle
          ? `<div class="shop-subtitle">${subtitle}</div>`
          : ""
      }
    </div>
  `;
};

/* ======================================================
   CANONICAL: ADMIN HEADER
   🔍 keyword: CANONICAL ADMIN HEADER
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

/**
 * การ์ดกลาง ใช้ได้ทั้ง viewer / admin
 * content = HTML ด้านใน
 */
Render.card = function (content = "") {
  return `
    <div class="card">
      ${content}
    </div>
  `;
};

/* ======================================================
   CANONICAL: PRODUCT CARD (VIEWER)
   🔍 keyword: CANONICAL PRODUCT CARD
====================================================== */

/**
 * Product Card มาตรฐานสำหรับ Viewer
 * @param {Object} p - product data
 */
Render.productCard = function (p = {}) {
  return `
    <div class="product-card">
      <img
        class="product-thumb"
        src="${p.image || ""}"
        alt="${p.name || ""}"
        loading="lazy"
      />

      <div class="product-info">
        <div class="product-name">
          ${p.name || "-"}
        </div>

        <div class="product-sku">
          รหัส: ${p.productId || "-"}
        </div>

        <div class="product-price">
          ฿${p.price ?? 0}
        </div>

        <div class="product-meta">
          <div class="product-stock">
            คงเหลือ ${p.stock ?? 0}
          </div>

          <div class="badge-ready">
            พร้อมขาย
          </div>
        </div>
      </div>
    </div>
  `;
};

