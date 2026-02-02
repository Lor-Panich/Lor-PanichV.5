/* ======================================================
   V5 API LAYER
   - Google Apps Script Web App
   - Backend เดิม (V4)
   - No mock / No backend change
====================================================== */

window.API = {};

/* ======================================================
   INTERNAL: GAS SAFE POST
   🔍 keyword: API._post
====================================================== */

API._post = async function (params = {}) {
  try {
    const formData = new FormData();

    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        formData.append(key, params[key]);
      }
    });

    const res = await fetch(Core.config.apiUrl, {
      method: "POST",
      body: formData
    });

    // ❗ network-level guard
    if (!res.ok) {
      const err = new Error(`Network error (${res.status})`);
      err.status = res.status;
      throw err;
    }

    let json;
    try {
      json = await res.json();
    } catch (parseErr) {
      const err = new Error("Invalid JSON response");
      err.raw = parseErr;
      throw err;
    }

    // ❗ backend-level error normalize
    if (!json || json.success !== true) {
      const message =
        json?.error ||
        json?.message ||
        "API error";

      const err = new Error(message);
      err.raw = json;        // 🔑 สำคัญที่สุด
      throw err;
    }

    return json.data;

  } catch (err) {
    // 🔍 debug support (V5 way)
  if (Core?.config?.debug) {
    console.error("[API._post]", {
      params,
      message: err.message,
      status: err.status,
      raw: err.raw,
      error: err
    });
  }
  throw err; // ❌ อย่ากลืน error
}
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
  // 🔒 READ-ONLY: ใช้สำหรับ History Viewer เท่านั้น
  // ❌ ห้ามใช้ API นี้กับ action ที่แก้ข้อมูล   
  return await API._post({
    action: "stockLogs",
    token
  });
};

/* ======================================================
   STEP A2.4.1.1 — UPLOAD PRODUCT IMAGE
   - Frontend wrapper only
====================================================== */

API.uploadProductImage = async function (
  token,
  base64Data,
  filename,
  mimeType
) {
  return await API._post({
    action: "uploadProductImage",
    token,
    data: base64Data,
    filename,
    mimeType
  });
};
