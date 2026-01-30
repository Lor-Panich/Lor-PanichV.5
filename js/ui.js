/* ======================================================
   V5 UI SKELETON
   - Toast
   - Loading
   - Overlay Stack
   ❌ No business logic
   ❌ No viewer/admin dependency
====================================================== */

window.UI = {};

/* ======================================================
   INTERNAL GUARDS
====================================================== */

UI._isLoading = false;

/* ======================================================
   TOAST SYSTEM
====================================================== */

UI.showToast = function (message = "", type = "info", timeout = 2500) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // limit count
  if (container.children.length > 3) {
    container.removeChild(container.firstChild);
  }

  setTimeout(() => {
    toast.remove();
  }, timeout);
};

/* ======================================================
   LOADING OVERLAY
   - UI ONLY
   - ❌ No Core.state mutation
====================================================== */

UI.showLoading = function (text = "กำลังโหลด...") {
  if (UI._isLoading) return;

  const overlay = document.getElementById("loadingOverlay");
  const label = document.getElementById("loadingText");

  if (!overlay || !label) return;

  label.textContent = text;
  overlay.classList.remove("hidden");

  UI._isLoading = true;
};

UI.hideLoading = function () {
  if (!UI._isLoading) return;

  const overlay = document.getElementById("loadingOverlay");
  if (!overlay) return;

  overlay.classList.add("hidden");

  UI._isLoading = false;
};

/* ======================================================
   OVERLAY STACK SYSTEM (V5 COMPLIANT)
====================================================== */

UI._overlayStack = [];

UI.openOverlay = function (overlayId) {
  const el = document.getElementById(overlayId);
  if (!el) return;

  if (!UI._overlayStack.includes(overlayId)) {
    UI._overlayStack.push(overlayId);
  }

  el.classList.add("show");
  el.classList.remove("hidden");

  UI._syncBackdrop();
};

UI.closeOverlay = function (overlayId) {
  const el = document.getElementById(overlayId);
  if (!el) return;

  UI._overlayStack = UI._overlayStack.filter(id => id !== overlayId);

  el.classList.remove("show");

  UI._syncBackdrop();
};

UI.closeTopOverlay = function () {
if (!UI._overlayStack.length) return;

const topOverlayId =
UI._overlayStack[UI._overlayStack.length - 1];

// 🔴 productSheet ต้องใช้ closeProductDetail เท่านั้น
if (topOverlayId === "productSheet") {
UI.closeProductDetail();
return;
}

// overlay อื่น ปิดตามปกติ
UI.closeOverlay(topOverlayId);
};

UI._syncBackdrop = function () {
  const backdrop = document.getElementById("globalBackdrop");
  if (!backdrop) return;

  if (UI._overlayStack.length > 0) {
    backdrop.classList.remove("hidden");

    // ✅ backdrop ทำหน้าที่เดียว: ปิด overlay บนสุด
    backdrop.onclick = UI.closeTopOverlay;
  } else {
    backdrop.classList.add("hidden");
    backdrop.onclick = null;
  }
};

/* ======================================================
   STEP 9.2 — QTY SHEET CONTROLLER
   - use overlay stack
   - no business logic
====================================================== */

UI.openQtyModal = function (html) {
  const overlay = document.getElementById("qtySheet");
  if (!overlay) return;

  overlay.innerHTML = html;

  // ใช้ระบบ overlay stack เดิม
  UI.openOverlay("qtySheet");

  // lock scroll
  document.body.style.overflow = "hidden";
};

UI.closeQtyModal = function () {
  const overlay = document.getElementById("qtySheet");
  if (!overlay) return;

  // 🔑 FIX สำคัญมาก: reset binding state
  delete overlay._qtyBound;

  UI.closeOverlay("qtySheet");

  document.body.style.overflow = "";

  overlay.innerHTML = "";
};

// ======================================================
// FIX — CART OVERLAY (V5 COMPLIANT)
// ======================================================

// 🔹 Open Cart Sheet
UI.openCart = function (html) {
  const overlay = document.getElementById("cartSheet");
  if (!overlay) return;

  overlay.innerHTML = html;
  UI.openOverlay("cartSheet");

  // 🔒 LOCK background scroll (Cart owns this)
  document.body.style.overflow = "hidden";
};

// 🔹 Close Cart Sheet
UI.closeCart = function () {
  const overlay = document.getElementById("cartSheet");
  if (!overlay) return;

  delete overlay._bound;   // ⭐ เพิ่มบรรทัดนี้

  UI.closeOverlay("cartSheet");
  document.body.style.overflow = "";
  overlay.innerHTML = "";
};

// 🔹 Bind Cart Sheet UI events
UI.bindCartEvents = function (handlers = {}) {
  const sheet = document.getElementById("cartSheet");
  if (!sheet) return;

  // 🔒 guard กัน bind ซ้ำ
  if (sheet._bound) return;
  sheet._bound = true;

  sheet.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const itemEl = btn.closest(".cart-item");

    // ✅ close cart (Empty / Header / CTA)
    if (action === "close-cart") {
      handlers.onClose && handlers.onClose();
      return;
    }

    // ✅ submit order
    if (action === "submit-order") {
      handlers.onSubmit && handlers.onSubmit();
      return;
    }

       // ==================================================
  // 🔥 NEW — Editable QTY Input (UI only)
  // ==================================================

  sheet.addEventListener("change", function (e) {
    const input = e.target;

    // ฟังเฉพาะ qty input
    if (input.dataset.action !== "qty-input") return;

    const itemEl = input.closest(".cart-item");
    if (!itemEl) return;

    let qty = parseInt(input.value, 10);

    // 🔒 normalize
    if (isNaN(qty) || qty < 1) {
      qty = 1;
    }

    // (optional) max stock
    const max = parseInt(input.getAttribute("max"), 10);
    if (!isNaN(max) && qty > max) {
      qty = max;
    }

    // 🔑 sync UI
    input.value = qty;

    // 🚀 ส่งค่าให้ controller (viewer / app layer)
    handlers.onQtyInput &&
      handlers.onQtyInput(itemEl, qty);
  });

    // ==================================================
    // 🔥 STEP 2.6 — Cart Item Interactions (UI only)
    // ==================================================

    // ➕ increase qty
    if (action === "inc") {
      handlers.onIncrease && handlers.onIncrease(itemEl);
      return;
    }

    // ➖ decrease qty
    if (action === "dec") {
      handlers.onDecrease && handlers.onDecrease(itemEl);
      return;
    }

    // ❌ remove item
    if (action === "remove") {
      handlers.onRemove && handlers.onRemove(itemEl);
      return;
    }
  });
};

/* ======================================================
   STEP 10.2 — ORDER SUCCESS UI
   - UI only
   - use overlay stack
   - no business logic
====================================================== */

// 🔹 Open Success Sheet
UI.openOrderSuccess = function (html) {
  const overlay = document.getElementById("orderSuccessSheet");
  if (!overlay) return;

  // inject success HTML
  overlay.innerHTML = html;

  // open via overlay stack
  UI.openOverlay("orderSuccessSheet");
};

UI.closeOrderSuccess = function () {
  const overlay = document.getElementById("orderSuccessSheet");
  if (!overlay) return;

  delete overlay._bound;   // ⭐ สำคัญ
  UI.closeOverlay("orderSuccessSheet");
  overlay.innerHTML = "";
};

// 🔹 Bind Success Screen Actions
UI.bindOrderSuccess = function (handlers = {}) {
  const sheet = document.getElementById("orderSuccessSheet");
  if (!sheet) return;

  // guard กัน bind ซ้ำ
  if (sheet._bound) return;
  sheet._bound = true;

  const closeBtn =
    sheet.querySelector("[data-action='close-success']");

  if (closeBtn) {
    closeBtn.onclick = function () {
      handlers.onClose && handlers.onClose();
    };
  }
};


/* ======================================================
   STEP 8.4 — ADMIN UI WIRING
   - UI only
   - No API
   - No state mutation
====================================================== */

UI.bindAdminOrderActions = function (handlers = {}) {
  const root = document.querySelector(".admin-order-list");
  if (!root) return;

  // 🔒 Optional guard: กัน bind ซ้ำ
  if (root.dataset.bound === "1") return;
  root.dataset.bound = "1";

  root.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const orderId = btn.dataset.orderId;
    if (!orderId) return;

    if (action === "approve-order") {
      handlers.onApprove && handlers.onApprove(orderId);
    }

    if (action === "reject-order") {
      handlers.onReject && handlers.onReject(orderId);
    }
  });
};

/* ======================================================
   STEP 9.1 — PRODUCT DETAIL UI (FIXED)
====================================================== */

UI.openProductDetail = function (html) {
  const overlay = document.getElementById("productSheet");
  if (!overlay) return;

  overlay.innerHTML = html;
  UI.openOverlay("productSheet");

  // ✅ ล็อก body ไม่ให้ scroll
  document.body.style.overflow = "hidden";

  UI._bindProductSwipeDismiss();
};

UI.closeProductDetail = function () {
  const overlay = document.getElementById("productSheet");
  if (!overlay) return;

  // ปิด overlay ผ่าน stack system
  UI.closeOverlay("productSheet");

  // ✅ ปลดล็อก body scroll (สำคัญมาก)
  document.body.style.overflow = "";

  // รีเซ็ต swipe state
  const sheet = overlay.querySelector(".product-detail-sheet");
  if (sheet) {
    sheet.style.transform = "translate(-50%, 0)";
    sheet.style.transition = "";
    sheet._swipeBound = false;

    // 🔧 optional but safe: reset qty binding state
    delete sheet._qtyBound;
  }

  // cleanup DOM
  overlay.innerHTML = "";
};

/* ======================================================
   STEP 9.2 — QTY SELECTOR UI (MODAL / REUSABLE)
   - UI only
   - no business logic
====================================================== */

UI.bindQtySelector = function (handlers = {}, rootEl) {
  const root = rootEl || document;

  // 🔑 bind จาก root โดยตรง
  const valueEl    = root.querySelector("[data-role='qty-value']");
  const btnDec     = root.querySelector("[data-action='qty-decrease']");
  const btnInc     = root.querySelector("[data-action='qty-increase']");
  const btnConfirm = root.querySelector("[data-action='qty-confirm']");
  const btnCancel  = root.querySelector("[data-action='qty-cancel']");

  if (!valueEl) return;

  // 🔒 guard กัน bind ซ้ำ (ผูกกับ root)
  if (root._qtyBound) return;
  root._qtyBound = true;

  let qty = 1;

  const normalizeQty = (value) => {
    const n = parseInt(value, 10);
    return isNaN(n) || n < 1 ? 1 : n;
  };

  const renderQty = (value) => {
    qty = normalizeQty(value);
    valueEl.textContent = qty;   // ✅ center ได้สมบูรณ์
    handlers.onChange && handlers.onChange(qty);
  };

  // − button
  if (btnDec) {
    btnDec.onclick = () => {
      renderQty(qty - 1);
    };
  }

  // + button
  if (btnInc) {
    btnInc.onclick = () => {
      renderQty(qty + 1);
    };
  }

  // confirm
  if (btnConfirm) {
    btnConfirm.onclick = () => {
      handlers.onConfirm && handlers.onConfirm(qty);
    };
  }

  // cancel
  if (btnCancel) {
    btnCancel.onclick = () => {
      handlers.onCancel && handlers.onCancel();
    };
  }

  // init
  renderQty(1);
};

/* ======================================================
   STEP 9.3 — ADD TO CART UI
====================================================== */

UI.bindAddToCart = function (onAdd) {
  const sheet = document.getElementById("productDetailSheet");
  if (!sheet) return;

  const btn = sheet.querySelector("[data-action='add-to-cart']");
  if (!btn || btn._bound) return;

  btn._bound = true;

  btn.addEventListener("click", function () {
    typeof onAdd === "function" && onAdd();
  });
};

UI._bindProductSwipeDismiss = function () {
  const sheet = document.querySelector(".product-detail-sheet");
  if (!sheet || sheet._swipeBound) return;
  sheet._swipeBound = true;

  let startY = 0;
  let currentY = 0;
  let dragging = false;
  const THRESHOLD = 120;

  sheet.addEventListener("touchstart", e => {
    if (sheet.scrollTop > 0) return;
    startY = e.touches[0].clientY;
    dragging = true;
    sheet.style.transition = "none";
  });

sheet.addEventListener("touchmove", e => {
  if (!dragging) return;

  // ❗ กันไม่ให้ page หลัก scroll
  e.preventDefault();

  currentY = e.touches[0].clientY;
  const delta = currentY - startY;

  if (delta > 0) {
    sheet.style.transform = `translate(-50%, ${delta}px)`;
  }
}, { passive: false });

  sheet.addEventListener("touchend", () => {
    if (!dragging) return;
    dragging = false;

    const delta = currentY - startY;
    sheet.style.transition = "transform 280ms cubic-bezier(.2,.8,.2,1)";

    if (delta > THRESHOLD) {
      UI.closeProductDetail();
    } else {
      sheet.style.transform = "translate(-50%, 0)";
    }
  });
};
