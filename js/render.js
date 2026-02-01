/* ======================================================
   V5 RENDER SKELETON
   - HTML only
   - No state mutation
   - No API
   - No event binding
====================================================== */

window.Render = {};

 /* ======================================================
    ADMIN PERMISSION HELPER (RENDER ONLY)
    - Read Core.can()
    - No logic / no fallback
 ====================================================== */
 
 Render.can = function (permission) {
   if (!window.Core || typeof Core.can !== "function") {
     return false;
   }
   return Core.can(permission);
 };

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

      <div class="shop-header-actions">
        <button
          class="header-icon-btn"
          id="searchToggleBtn"
          type="button"
          aria-label="ค้นหา"
        >🔍</button>

        <button
          class="header-icon-btn cart-btn"
          id="cartToggleBtn"
          type="button"
          aria-label="ตะกร้าสินค้า"
        >
          🛒
          <span class="cart-badge" hidden></span>
        </button>
      </div>
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
        ${
          Render.can("manageProducts") ||
          Render.can("manageOrders") ||
          Render.can("manageStock")
            ? rightHTML
            : ""
        }
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

Render.productCard = function (product = {}) {
  if (!product) return "";

  const productId = product.productId || "";
  const name = product.name || "-";
  const price = Number(product.price) || 0;
  const stock = Number(product.stock) || 0;
  const image =
    product.image && typeof product.image === "string"
      ? product.image
      : "assets/placeholder.png";

  const inStock = stock > 0;

  return `
    <div class="product-card ${!inStock ? "is-out" : ""}"
         data-action="open-product"
         data-product-id="${productId}">

      <div class="product-thumb">
        <img
          src="${image}"
          alt="${name || "product image"}"
          loading="lazy"
        />
      </div>

      <div class="product-info">
        <div class="product-name">${name}</div>
        <div class="product-code">รหัส: ${productId}</div>
        <div class="product-price">฿${price.toLocaleString()}</div>

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

/* ======================================================
   STEP 7.2 — CART SHEET (RENDER ONLY)
   - HTML only
   - No state mutation
   - No event binding
====================================================== */

Render.cartSheet = function (items = [], total = 0) {
  // 🔒 HARDEN: ensure items is array
  if (!Array.isArray(items)) {
    items = [];
  }

  const safeTotal = Number(total) || 0;

  return `
    <div class="sheet cart-sheet" id="cartSheet">
      
      <!-- header -->
      <div class="sheet-header">
        <div class="sheet-title">ตะกร้าสินค้า</div>
        <div class="sheet-subtitle">
          ${items.length} รายการ
        </div>
      </div>

      <!-- content -->
      <div class="sheet-content">
        ${
          items.length > 0
            ? items.map(it => Render.cartItem(it)).join("")
            : `
              <div class="cart-empty-state">
                <div class="cart-empty-text">
                  ยังไม่มีสินค้าในตะกร้า
                </div>

                <button
                  class="secondary-btn cart-back-btn"
                  type="button"
                  data-action="close-cart"
                >
                  ← กลับไปเลือกสินค้า
                </button>
              </div>
            `
        }
      </div>

      <!-- footer -->
${Render.cartFooter(safeTotal, items.length)}

    </div>
  `;
};

Render.cartItem = function (item = {}) {
  const productId = item.productId || "";
  const name = item.name || "-";
  const price = Number(item.price) || 0;
  const qty = Number(item.qty) || 0;
  const image =
    item.image && typeof item.image === "string"
      ? item.image
      : "assets/placeholder.png";

  return `
    <div class="cart-item" data-product-id="${productId}">

      <!-- thumbnail -->
      <img
        class="cart-thumb"
        src="${image}"
        alt="${name}"
        loading="lazy"
      />

      <!-- info -->
      <div class="cart-item-info">
        <div class="cart-item-name">${name}</div>
        <div class="cart-item-price">
          ฿${price.toLocaleString()}
        </div>
      </div>

<!-- qty control -->
<div class="cart-qty cart-qty-editable">
  <input
    class="cart-qty-input"
    type="number"
    min="1"
    step="1"
    value="${qty}"
    inputmode="numeric"
    pattern="[0-9]*"
    data-action="qty-input"
    aria-label="จำนวนสินค้า"
  />
</div>

      <!-- remove -->
      <button
        class="cart-remove"
        data-action="remove"
        type="button"
        aria-label="ลบสินค้า"
      >✕</button>

    </div>
  `;
};

Render.cartFooter = function (total = 0, itemCount = 0) {
  // 🔒 Empty cart → no footer at all
  if (!itemCount || itemCount <= 0) {
    return "";
  }

  const safeTotal = Number(total) || 0;

  return `
    <div class="sheet-footer cart-footer">
      <div class="cart-summary">
        <span>ยอดรวม</span>
        <strong>${safeTotal.toLocaleString()} บาท</strong>
      </div>

      <button
        class="primary-btn cart-submit-btn"
        type="button"
        data-action="submit-order"
      >
        สร้างใบสั่งซื้อ
      </button>
    </div>
  `;
};

/* ======================================================
   STEP 9.1 — PRODUCT DETAIL SHEET (RENDER ONLY)
====================================================== */

Render.productDetailSheet = function (product) {
  if (!product) return "";

  return `
    <div class="sheet product-detail-sheet" id="productDetailSheet">
      <div class="sheet-header">
        <div class="sheet-handle"></div>
      </div>

      <div class="sheet-content product-detail">
        <div class="product-image-wrap">
          <img
            src="${product.image || ""}"
            alt="${product.name || ""}"
            loading="lazy"
          />
        </div>

        <div class="product-info">
          <h2 class="product-name">${product.name}</h2>

          <div class="product-price">
            ${Number(product.price).toLocaleString()} บาท
          </div>

          <div class="product-stock">
            คงเหลือ ${product.stock} ชิ้น
          </div>

          <!-- STEP 9.2 SLOT: QTY SELECTOR (lazy render) -->
          <div class="qty-step-slot"
               data-max="${product.stock}">
          </div>

          ${
            product.description
              ? `<div class="product-desc">${product.description}</div>`
              : ""
          }
        </div>
      </div>

      <!-- 🔴 STEP 9.3: ADD TO CART FOOTER -->
      <div class="sheet-footer product-detail-footer">
        <button
          class="primary-btn add-to-cart-btn"
          data-action="add-to-cart"
          type="button"
        >
          เพิ่มลงตะกร้า
        </button>
      </div>
    </div>
  `;
};

/* ======================================================
   STEP 9.2 — QTY SELECTOR (LAZY / SLOT READY)
   - initial render: EMPTY
   - injected later by ui.js
====================================================== */

Render.qtySelector = function () {
  return `
    <div class="qty-selector">
      <button
        class="qty-btn"
        data-action="qty-decrease"
        type="button"
        aria-label="ลดจำนวนสินค้า"
      >−</button>

      <div
        class="qty-value"
        data-role="qty-value"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >1</div>

      <button
        class="qty-btn"
        data-action="qty-increase"
        type="button"
        aria-label="เพิ่มจำนวนสินค้า"
      >+</button>
    </div>

    <button
      class="primary-btn qty-confirm-btn"
      data-action="qty-confirm"
      type="button"
      style="margin-top:16px;width:100%;"
    >
      ยืนยันจำนวน
    </button>
  `;
};

/* ======================================================
   STEP 9.2 — QTY MODAL (RENDER ONLY)
====================================================== */
Render.qtyModal = function (product = {}) {
  return `
    <div class="sheet qty-sheet">
      <div class="sheet-content">

        <!-- subtitle -->
        <div class="sheet-subtitle">
          เลือกจำนวนสินค้า
        </div>

        <!-- product info -->
        <div class="product-name">
          ${product.name || ""}
        </div>

        <div class="product-price">
          ${Number(product.price || 0).toLocaleString()} บาท
        </div>

        <!-- qty selector (SAME STRUCTURE AS Render.qtySelector) -->
        <div class="qty-selector">
          <button
            class="qty-btn"
            data-action="qty-decrease"
            type="button"
            aria-label="ลดจำนวนสินค้า"
          >−</button>

          <div
            class="qty-value"
            data-role="qty-value"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >1</div>

          <button
            class="qty-btn"
            data-action="qty-increase"
            type="button"
            aria-label="เพิ่มจำนวนสินค้า"
          >+</button>
        </div>

        <!-- actions -->
<div class="qty-actions qty-sheet-actions">
  <button
    class="secondary-btn qty-cancel-btn"
    data-action="qty-cancel"
    type="button"
  >
    ยกเลิก
  </button>

  <button
    class="primary-btn qty-confirm-btn"
    data-action="qty-confirm"
    type="button"
  >
    ยืนยันเพิ่มลงตะกร้า
  </button>
</div>

      </div>
    </div>
  `;
};

/* ======================================================
   STEP 10.1 — ORDER SUCCESS SHEET (RENDER ONLY)
====================================================== */

Render.orderSuccessSheet = function (order = {}) {
  const orderId = order.orderId || "-";
  const total   = Number(order.total || 0);

  return `
    <div class="sheet success-sheet" id="orderSuccessSheet">
      <div class="sheet-content success-content">

        <div class="success-icon">✅</div>

        <h2 class="success-title">
          สร้างใบสั่งซื้อสำเร็จ
        </h2>

        <div class="success-info">
          <div class="success-row">
            <span>เลขที่ใบสั่งซื้อ</span>
            <strong>${orderId}</strong>
          </div>

          <div class="success-row">
            <span>ยอดรวม</span>
            <strong>${total.toLocaleString()} บาท</strong>
          </div>
        </div>

        <button
          class="primary-btn success-close-btn"
          type="button"
          data-action="close-success"
        >
          กลับไปเลือกสินค้า
        </button>

      </div>
    </div>
  `;
};

/* ======================================================
   STEP 10.2 — ORDER DOCUMENT (A4 / PRINT READY)
   - HTML only
   - No state
   - No event binding
====================================================== */

Render.orderDocument = function (order = {}, items = []) {
  const hasItems = Array.isArray(items) && items.length > 0;

  return `
    <div class="order-doc-wrapper">

      <!-- =========================
           A4 DOCUMENT (PRINT AREA)
      ========================== -->
      <div class="a4-page order-doc">

        <!-- HEADER -->
        <header class="doc-header">
          <div class="doc-brand">
            <h1>ร้านค้า Lor-Panich</h1>
            <div class="doc-subtitle">ใบสั่งซื้อสินค้า</div>
          </div>
        </header>

        <!-- META -->
        <section class="doc-meta">
          <div>
            <strong>เลขที่ใบสั่งซื้อ:</strong>
            ${order.orderId || "-"}
          </div>
          <div>
            <strong>วันที่:</strong>
            ${
              order.createdAt
                ? new Date(order.createdAt).toLocaleString("th-TH", {
                    dateStyle: "medium",
                    timeStyle: "short"
                  })
                : "-"
            }
          </div>
        </section>

        <!-- ITEMS -->
        <section class="doc-items">

          <div class="doc-table-header">
            <span></span>
            <span>รหัสสินค้า</span>
            <span>ชื่อสินค้า</span>
            <span class="right">ราคา</span>
            <span class="right">จำนวน</span>
          </div>

          ${
            hasItems
              ? items.map(it => `
                  <div class="doc-row">
                 <img
  src="${it.image || "assets/placeholder.png"}"
  class="doc-thumb"
  alt="${it.name || "product"}"
  loading="eager"
/>

                    <span>${it.productId || "-"}</span>
                    <span>${it.name || "-"}</span>
                    <span class="right">
                      ${Number(it.price || 0).toLocaleString()}
                    </span>
                    <span class="right">
                      ${Number(it.qty || 0)}
                    </span>
                  </div>
                `).join("")
              : `
                <div
                  style="
                    padding: 12mm 0;
                    font-size: 13px;
                    color: #555;
                  "
                >
                  ไม่พบรายการสินค้า
                </div>
              `
          }

        </section>

        <!-- SUMMARY -->
        <footer class="doc-summary repeatable">
          <div class="total">
            ยอดรวมทั้งสิ้น:
            <strong>
              ${Number(order.total || 0).toLocaleString()} บาท
            </strong>
          </div>
        </footer>

      </div>

<!-- =========================
     ACTIONS (NON PRINT)
========================== -->
<div class="doc-actions ios-share-sheet no-print">

  <div class="ios-share-panel">

    <button
      class="ios-share-btn ios-share-primary"
      type="button"
      data-action="share-order"
    >
      📤 แชร์ / บันทึกเอกสาร
    </button>

    <button
      class="ios-share-btn ios-share-secondary"
      type="button"
      data-action="finish-order"
    >
      เสร็จสิ้น
    </button>

  </div>

  <div class="ios-share-hint">
    ใช้ปุ่ม Share ของเบราว์เซอร์<br />
    เพื่อบันทึกหรือพิมพ์เอกสาร
  </div>

</div>
`;
};

/* ======================================================
   ADMIN READONLY LABEL (CANONICAL)
====================================================== */

Render.adminReadonly = function (message = "ไม่มีสิทธิ์ดำเนินการ") {
  return `
    <span class="admin-readonly">
      ${message}
    </span>
  `;
};

/* ======================================================
   STEP C.3 — ADMIN HISTORY VIEW (READ ONLY)
====================================================== */

Render.adminHistoryView = function ({ stockLogs = [], orders = [] }) {
  if (!Render.can("viewHistory")) {
    return Render.adminReadonly("ไม่มีสิทธิ์ดูประวัติ");
  }

  return `
    <div class="admin-history">

      ${Render.adminHeader(
        "ประวัติการทำรายการ",
        ""
      )}

     <!-- ===============================
          STEP C.6.3 — HISTORY FILTER BAR
          (Render only / No logic)
     =============================== -->
     
     <div class="history-filter">

       <select id="historyType" class="history-filter-type">
         <option value="ALL">ทั้งหมด</option>
         <option value="IN">รับเข้า</option>
         <option value="OUT">ตัดสต๊อก</option>
         <option value="ADJUST">ปรับยอด</option>
         <option value="CREATE">สร้างสินค้า</option>
       </select>

       <input
         id="historySearch"
         class="history-filter-search"
         type="search"
         placeholder="ค้นหา SKU / Order / ผู้ใช้"
         autocomplete="off"
       />

       <button
         id="historySort"
         class="history-filter-sort"
         type="button"
       >
         ใหม่ → เก่า
       </button>

     </div>

      <section class="admin-history-section">
        <h3>ประวัติสต๊อก</h3>
        ${Render.adminStockLogTable(stockLogs)}
      </section>

      <section class="admin-history-section">
        <h3>ประวัติคำสั่งซื้อ</h3>
        ${Render.adminOrderHistoryTable(orders)}
      </section>

    </div>
  `;
};

Render.adminStockLogTable = function (logs = []) {
  if (!Array.isArray(logs) || logs.length === 0) {
    return Render.empty("ไม่มีประวัติสต๊อก");
  }

  return `
    <table class="admin-table admin-stock-log-table">
      <thead>
        <tr>
          <th>เวลา</th>
          <th>สินค้า</th>
          <th>ประเภท</th>
          <th>จำนวน</th>
          <th>ก่อน</th>
          <th>หลัง</th>
          <th>โดย</th>
          <th>อ้างอิง</th>
        </tr>
      </thead>
      <tbody>
        ${logs.map(Render.adminStockLogRow).join("")}
      </tbody>
    </table>
  `;
};

Render.adminStockLogRow = function (log = {}) {
  return `
    <tr class="log-type-${log.type || ""}">
      <td>
        ${
          log.timestamp
            ? new Date(log.timestamp).toLocaleString("th-TH")
            : "-"
        }
      </td>
      <td>${log.productId || "-"}</td>
      <td>${log.type || "-"}</td>
      <td>${log.qty ?? "-"}</td>
      <td>${log.before ?? "-"}</td>
      <td>${log.after ?? "-"}</td>
      <td>${log.by || "-"}</td>
      <td>${log.orderId || "-"}</td>
    </tr>
  `;
};

Render.adminOrderHistoryTable = function (orders = []) {
  if (!Array.isArray(orders) || orders.length === 0) {
    return Render.empty("ไม่มีประวัติคำสั่งซื้อ");
  }

  return `
    <table class="admin-table admin-order-history-table">
      <thead>
        <tr>
          <th>Order</th>
          <th>สถานะ</th>
          <th>ยอดรวม</th>
          <th>อัปเดตโดย</th>
          <th>เวลา</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map(Render.adminOrderHistoryRow).join("")}
      </tbody>
    </table>
  `;
};

Render.adminOrderHistoryRow = function (order = {}) {
  return `
    <tr>
      <td>${order.orderId || "-"}</td>
      <td>${order.status || "-"}</td>
      <td>${Number(order.total || 0).toLocaleString()}</td>
      <td>
        ${order.approvedBy || order.rejectedBy || "-"}
      </td>
      <td>
        ${
          order.updatedAt || order.createdAt
            ? new Date(
                order.updatedAt || order.createdAt
              ).toLocaleString("th-TH")
            : "-"
        }
      </td>
    </tr>
  `;
};

