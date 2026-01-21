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
   🔍 keyword: APP CONFIG
====================================================== */

Core.config = {
  appName: "StockBuilder V5",
  locale: "th-TH",

  // mode เริ่มต้น
  defaultMode: "viewer",

  // ใช้สำหรับ debug / log
  debug: true
};

/* ======================================================
   GLOBAL STATE (V5)
   🔍 keyword: GLOBAL STATE
====================================================== */

Core.state = {
  /* ================= APP MODE ================= */
  mode: Core.config.defaultMode, // "viewer" | "admin"

  /* ================= VIEWER ================= */
  viewer: {
    products: [],        // จาก backend เท่านั้น
    cart: [],            // frontend only
    search: "",          // keyword search
    activeProduct: null  // product ที่เปิดอยู่
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
    overlays: [],        // stack ของ overlay ids
    loading: false
  }
};

/* ======================================================
   STATE HELPERS
   🔍 keyword: STATE HELPERS
====================================================== */

/**
 * reset viewer state (ไม่แตะ admin)
 */
Core.resetViewerState = function () {
  Core.state.viewer.cart = [];
  Core.state.viewer.activeProduct = null;
  Core.state.viewer.search = "";
};

/**
 * reset admin session
 */
Core.resetAdminState = function () {
  Core.state.admin.loggedIn = false;
  Core.state.admin.user = null;
  Core.state.admin.token = null;
  Core.state.admin.orders = [];
  Core.state.admin.stockLogs = [];
};

/**
 * full app reset (ใช้ตอน logout / fatal error)
 */
Core.resetAll = function () {
  Core.state.mode = Core.config.defaultMode;
  Core.resetViewerState();
  Core.resetAdminState();
  Core.state.ui.overlays = [];
  Core.state.ui.loading = false;
};

/* ======================================================
   FREEZE RULE (IMPORTANT)
   🔍 keyword: DO NOT VIOLATE
====================================================== */

/**
 * RULES:
 * 1. ห้ามไฟล์อื่นสร้าง state ใหม่
 * 2. ห้าม shadow Core.state
 * 3. api.js / ui.js / render.js อ่าน state ได้ แต่
 *    - mutate ต้องผ่าน flow (viewer / admin)
 */
