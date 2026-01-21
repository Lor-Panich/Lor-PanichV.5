/* ======================================================
   V5 API LAYER
   - Google Apps Script Web App
   - Backend เดิม (V4)
   - No mock / No backend change
====================================================== */

window.API = {};

/* ======================================================
   CONFIG
   🔍 keyword: API.CONFIG
====================================================== */

// 🔒 ใช้ URL เดิมของคุณ (จาก V4)
API.URL = "https://script.google.com/macros/s/AKfycbywvlsj-_1IbT0iuCUgWM0pgIJ49bed8tGeuezGqPykeiZaDCxB1ktz-OIAO6TFouqwjQ/exec";

/* ======================================================
   INTERNAL: GAS SAFE POST
   🔍 keyword: API._post
====================================================== */

API._post = async function (params = {}) {
  const formData = new FormData();

  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      formData.append(key, params[key]);
    }
  });

  const res = await fetch(API.URL, {
    method: "POST",
    body: formData
  });

  const json = await res.json();

  if (!json || json.success !== true) {
    throw new Error(json?.error || json?.message || "API error");
  }

  return json.data;
};

/* ======================================================
   PUBLIC API (VIEWER)
   🔍 keyword: PUBLIC API
====================================================== */

/** ดึงรายการสินค้า */
API.fetchProducts = async function () {
  return await API._post({
    action: "products"
  });
};

/** สร้าง Order */
API.createOrder = async function (items, total) {
  return await API._post({
    action: "createOrder",
    items: JSON.stringify(items),
    total
  });
};

/* ======================================================
   ADMIN AUTH
   🔍 keyword: ADMIN AUTH
====================================================== */

API.adminLogin = async function (username, password) {
  return await API._post({
    action: "adminLogin",
    username,
    password
  });
};

API.adminLogout = async function (token) {
  return await API._post({
    action: "adminLogout",
    token
  });
};

/* ======================================================
   ADMIN DATA
   🔍 keyword: ADMIN API
====================================================== */

API.fetchOrders = async function (token) {
  return await API._post({
    action: "orders",
    token
  });
};

API.approveOrder = async function (token, orderId) {
  return await API._post({
    action: "approveOrder",
    token,
    orderId
  });
};

API.rejectOrder = async function (token, orderId) {
  return await API._post({
    action: "rejectOrder",
    token,
    orderId
  });
};

API.stockIn = async function (token, productId, qty, reason = "") {
  return await API._post({
    action: "stockIn",
    token,
    productId,
    qty,
    reason
  });
};

API.stockAdjust = async function (token, productId, newQty, reason = "") {
  return await API._post({
    action: "stockAdjust",
    token,
    productId,
    newQty,
    reason
  });
};

API.fetchStockLogs = async function (token) {
  return await API._post({
    action: "stockLogs",
    token
  });
};
