/* ======================================================
   V5 CORE
   - Global Config
   - Global State (Single Source of Truth)
   ❌ No UI
   ❌ No API
   ❌ No DOM
====================================================== */

window.Core = {};

/* ======================================================
   APP CONFIG (V5)
====================================================== */

Core.config = Object.freeze({
  appName: "StockBuilder V5",
  locale: "th-TH",

  // mode เริ่มต้น
  defaultMode: "viewer",

  // ใช้สำหรับ debug / log
  debug: true,

  // 🔌 Google Apps Script Web App (V4 backend)
  // 🔒 ใช้เป็น source เดียว ห้าม hardcode ใน api.js
  apiUrl: "https://script.google.com/macros/s/AKfycbywvlsj-_1IbT0iuCUgWM0pgIJ49bed8tGeuezGqPykeiZaDCxB1ktz-OIAO6TFouqwjQ/exec"
});

/* ======================================================
   GLOBAL STATE (V5)
====================================================== */

Core.state = {
  /* ================= APP MODE ================= */
  mode: Core.config.defaultMode, // "viewer" | "admin"

  /* ================= VIEWER ================= */
  viewer: {
    products: [],        // จาก backend เท่านั้น
    search: "",          // keyword search
    activeProduct: null  // product ที่เปิดอยู่
  },

  /* ================= CART ================= */
  cart: {                // 🔴 ADDED
    items: [],           // [{ productId, name, price, qty }]
    total: 0             // คำนวณจาก items เท่านั้น
  },

  /* ================= ORDER ================= */
  order: {               // 🔴 ADDED
    lastCreated: null,   // order ล่าสุด
    isSubmitting: false  // guard createOrder
  },

  /* ================= ADMIN ================= */
  admin: {
    loggedIn: false,
    user: null,
    token: null,

    orders: [],
    stockLogs: []
  },

  /* ================= UI ================= */
  ui: {
    // UI infra (overlay / loading) is owned by ui.js
    // keep this object for future cross-flow UI flags if needed
  }
};

/* ======================================================
   STATE HELPERS
====================================================== */

Core.resetViewerState = function () {
  Core.state.viewer.products = [];
  Core.state.viewer.search = "";
  Core.state.viewer.activeProduct = null;
};

Core.resetCart = function () {          // 🔴 ADDED
  Core.state.cart.items = [];
  Core.state.cart.total = 0;
};

Core.resetOrder = function () {         // 🔴 ADDED
  Core.state.order.lastCreated = null;
  Core.state.order.isSubmitting = false;
};

Core.resetAdminState = function () {
  Core.state.admin.loggedIn = false;
  Core.state.admin.user = null;
  Core.state.admin.token = null;
  Core.state.admin.orders = [];
  Core.state.admin.stockLogs = [];
};

Core.resetAll = function () {
  Core.state.mode = Core.config.defaultMode;

  Core.resetViewerState();
  Core.resetCart();     // 🔴 ADDED
  Core.resetOrder();    // 🔴 ADDED
  Core.resetAdminState();

// UI state is owned by ui.js
// nothing to reset here
};

/* ======================================================
   RULES (DO NOT VIOLATE)
====================================================== */
/*
1. ห้ามไฟล์อื่นสร้าง state ใหม่
2. ห้าม shadow Core.state
3. ui.js / render.js / api.js
   - อ่าน state ได้
   - ❌ ห้าม mutate state โดยตรง
4. mutate state ได้เฉพาะ:
   - viewer.js
   - admin.js
*/

/* ======================================================
   CART PERSISTENCE (localStorage)
   - remember cart across page refresh
   - owned by Core ONLY
====================================================== */

Core._cartStorageKey = "stockbuilder_cart_v5";

Core.saveCart = function () {
  try {
    localStorage.setItem(
      Core._cartStorageKey,
      JSON.stringify(Core.state.cart.items)
    );
  } catch (err) {
    if (Core.config.debug) {
      console.warn("[Core.saveCart]", err);
    }
  }
};

Core.loadCart = function () {
  try {
    const raw = localStorage.getItem(Core._cartStorageKey);
    if (!raw) return;

    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return;

    Core.state.cart.items = items;
  } catch (err) {
    if (Core.config.debug) {
      console.warn("[Core.loadCart]", err);
    }
  }
};

Core.clearSavedCart = function () {
  try {
    localStorage.removeItem(Core._cartStorageKey);
  } catch (err) {
    if (Core.config.debug) {
      console.warn("[Core.clearSavedCart]", err);
    }
  }
};
