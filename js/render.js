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
   CANONICAL: HEADER (SHOP STYLE)
   🔴 CHANGED
====================================================== */

Render.header = function (title = "", subtitle = "") {
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
