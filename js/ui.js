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

// ======================================================
// FIX — CART OVERLAY (V5 COMPLIANT)
// ======================================================

// 🔹 Open Cart Sheet
UI.openCart = function (html) {
  const overlay = document.getElementById("cartSheet");
  if (!overlay) return;

  // inject cart sheet HTML
  overlay.innerHTML = html;

  // open overlay via stack system
  UI.openOverlay("cartSheet");
};

// 🔹 Close Cart Sheet
UI.closeCart = function () {
  const overlay = document.getElementById("cartSheet");
  if (!overlay) return;

  // close overlay via stack system
  UI.closeOverlay("cartSheet");

  // cleanup content (❗ do NOT remove overlay element)
  overlay.innerHTML = "";
};

// 🔹 Bind Cart Sheet UI events
UI.bindCartEvents = function (handlers = {}) {
  const sheet = document.getElementById("cartSheet");
  if (!sheet) return;

  // Close button / backdrop
  const closeBtn = sheet.querySelector("[data-action='close-cart']");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      handlers.onClose && handlers.onClose();
    });
  }

  // Submit order
  const submitBtn = sheet.querySelector(".cart-submit-btn");
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      handlers.onSubmit && handlers.onSubmit();
    });
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
  }

  // cleanup DOM
  overlay.innerHTML = "";
};

/* ======================================================
   STEP 9.2 — QTY SELECTOR UI
====================================================== */

UI.bindQtySelector = function (onChange) {
  const sheet = document.getElementById("productDetailSheet");
  if (!sheet) return;

    // 🔒 guard: bind ได้ครั้งเดียวต่อ sheet
  if (sheet._qtyBound) return;
  sheet._qtyBound = true;
   
  let qty = 1;
  const max = Number(
    sheet.querySelector(".qty-selector")?.dataset.max
  ) || 1;

  sheet.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    if (btn.dataset.action === "qty-decrease" && qty > 1) {
      qty--;
    }

    if (btn.dataset.action === "qty-increase" && qty < max) {
      qty++;
    }

    const valueEl = sheet.querySelector(".qty-value");
    if (valueEl) valueEl.textContent = qty;

    // update disabled state
    sheet
      .querySelector("[data-action='qty-decrease']")
      .toggleAttribute("disabled", qty <= 1);

    sheet
      .querySelector("[data-action='qty-increase']")
      .toggleAttribute("disabled", qty >= max);

    typeof onChange === "function" && onChange(qty);
  });
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
