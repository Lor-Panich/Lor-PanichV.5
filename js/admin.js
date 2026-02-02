/* ======================================================
   STEP 8.5 — ADMIN FLOW CONTROLLER (V5)
   - Approve / Reject
   - Stock OUT
   - No UI detail
====================================================== */

window.Admin = {};

/* ======================================================
   PERMISSION GUARD (STEP B)
====================================================== */

Admin.guard = function (permission, message) {
  if (!Core.can(permission)) {
    UI.showToast(
      message || "คุณไม่มีสิทธิ์ดำเนินการนี้",
      "error"
    );
    return false;
  }
  return true;
};

/* ======================================================
   ENTRY
====================================================== */

Admin.init = async function () {
  if (!Core.state.admin.loggedIn || !Core.state.admin.token) {
    UI.showToast("กรุณาเข้าสู่ระบบแอดมิน", "warning");
    return;
  }

  // STEP A1.4 — set default admin view (safe)
  if (!Core.state.admin.view) {
    Core.state.admin.view = "orders";
  }
   
  await Admin.loadOrders();
};

/* ======================================================
   LOAD ORDERS
====================================================== */

Admin.loadOrders = async function () {
  if (!Admin.guard("manageOrders", "คุณไม่มีสิทธิ์เข้าถึงคำสั่งซื้อ")) {
    return;
  }   
   
  UI.showLoading("กำลังโหลดคำสั่งซื้อ...");

  try {
    const orders = await API.fetchOrders(Core.state.admin.token);

    Core.state.admin.orders = Array.isArray(orders) ? orders : [];

    Admin.render();

  } catch (err) {
    console.error("[Admin.loadOrders]", err);
    UI.showToast("โหลดคำสั่งซื้อไม่สำเร็จ", "error");
  } finally {
    UI.hideLoading();
  }
};

/* ======================================================
   RENDER
====================================================== */

Admin.renderOrders = function () {
  const html = Render.adminOrderList(Core.state.admin.orders);

  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = html;

  // bind UI actions
  UI.bindAdminOrderActions({
    onApprove: Admin.confirmApprove,
    onReject: Admin.confirmReject
  });
};

/* ======================================================
   STEP A1.3 — ADMIN VIEW SWITCHER (CENTRAL RENDER)
   - Decide which admin view to render
   - No UI logic
   - No side effect
====================================================== */

Admin.render = function () {
  const view = Core.state.admin.view;
  const app = document.getElementById("app");
  if (!app) return;

  let content = ""; 

  switch (view) {
    case "orders":
      // behavior เดิม
      content = Render.adminOrderList(Core.state.admin.orders);
      break;

    case "products":
  // STEP A2.1 — Products List (read-only)
  content = Render.adminProductsView(
    Core.state.products || []
  );
      break;

     case "timeline":
      content = Render.adminTimelineView(
        Admin.buildTimelineEvents()
      );
      break;

    case "history":
     content = Render.adminHistoryView({
       stockLogs: Admin.getFilteredStockLogs(),
       orders: Core.state.admin.orders
     });
      break;

    default:
      // fallback ปลอดภัย
      Core.state.admin.view = "orders";
      content = Render.adminOrderList(Core.state.admin.orders);
  }
 app.innerHTML = `
   <div class="admin-layout">
     ${Render.adminMenu()}
     <section class="admin-view">
       ${content}
     </section>
   </div>
 `;
  // 🔑 DIFF 5 — bind UI หลัง render เท่านั้น
  if (window.UI) {
    UI.bindAdminMenu();

   // STEP A2 — Products view bindings
   if (Core.state.admin.view === "products") {
     if (typeof UI.bindEditProductButtons === "function") {
       UI.bindEditProductButtons();
     }

   }     
  }   
};

/* ======================================================
   CONFIRM ACTIONS
====================================================== */

Admin.confirmApprove = function (orderId) {
  UI.confirm("ยืนยันการอนุมัติคำสั่งซื้อ?", () => {
    Admin.approveOrder(orderId);
  });
};

Admin.confirmReject = function (orderId) {
  UI.confirm("ยืนยันการปฏิเสธคำสั่งซื้อ?", () => {
    Admin.rejectOrder(orderId);
  });
};

/* ======================================================
   APPROVE / REJECT FLOW
====================================================== */

Admin.approveOrder = async function (orderId) {
 if (!Admin.guard("manageOrders", "คุณไม่มีสิทธิ์อนุมัติคำสั่งซื้อ")) {
   return;
 }
 
  UI.showLoading("กำลังอนุมัติคำสั่งซื้อ...");

  try {
    // 1. approve order
    await API.approveOrder(Core.state.admin.token, orderId);

    UI.showToast("อนุมัติคำสั่งซื้อเรียบร้อย", "success");

    // 2. reload orders (backend is source of truth)
    await Admin.loadOrders();

  } catch (err) {
    console.error("[Admin.approveOrder]", err);
    UI.showToast("อนุมัติคำสั่งซื้อไม่สำเร็จ", "error");
  } finally {
    UI.hideLoading();
  }
};

Admin.rejectOrder = async function (orderId) {
  if (!Admin.guard("manageOrders", "คุณไม่มีสิทธิ์ปฏิเสธคำสั่งซื้อ")) {
    return;
  }
   
  UI.showLoading("กำลังปฏิเสธคำสั่งซื้อ...");

  try {
    await API.rejectOrder(Core.state.admin.token, orderId);

    UI.showToast("ปฏิเสธคำสั่งซื้อเรียบร้อย", "success");

    await Admin.loadOrders();

  } catch (err) {
    console.error("[Admin.rejectOrder]", err);
    UI.showToast("ปฏิเสธคำสั่งซื้อไม่สำเร็จ", "error");
  } finally {
    UI.hideLoading();
  }
};

/* ======================================================
   ADMIN LOGIN FLOW (STEP A)
====================================================== */

Admin.login = async function (username, password) {
  UI.showLoading("กำลังเข้าสู่ระบบ...");

  try {
    const res = await API.adminLogin(username, password);

    // 🔑 frontend role policy (ยังไม่แตะ backend)
    const role =
      res.username === "owner"
        ? "owner"
        : "staff";

    const permissions = Core.mapPermissionsByRole(role);

    Core.state.admin.loggedIn = true;
    Core.state.admin.token = res.token;
    Core.state.admin.user = {
      username: res.username,
      role
    };
    Core.state.admin.permissions = permissions;

    Core.state.mode = "admin";

    UI.showToast("เข้าสู่ระบบสำเร็จ", "success");

    await Admin.init();

  } catch (err) {
    UI.showToast(err.message || "เข้าสู่ระบบไม่สำเร็จ", "error");
  } finally {
    UI.hideLoading();
  }
};

/* ======================================================
   STEP A2.2.2 — SUBMIT ADD PRODUCT
   - Frontend only
   - Call backend addProduct
====================================================== */

Admin.submitAddProduct = async function () {
  if (!Admin.guard("manageProducts", "ไม่มีสิทธิ์เพิ่มสินค้า")) {
    return;
  }

  const idEl = document.getElementById("newProductId");
  const nameEl = document.getElementById("newProductName");
  const priceEl = document.getElementById("newProductPrice");
  const stockEl = document.getElementById("newProductStock");
  const activeEl = document.getElementById("newProductActive");

  if (!idEl || !nameEl || !priceEl || !stockEl) {
    UI.showToast("ฟอร์มไม่สมบูรณ์", "error");
    return;
  }

  const productId = idEl.value.trim();
  const name = nameEl.value.trim();
  const price = Number(priceEl.value);
  const stock = Number(stockEl.value);
  const active = activeEl ? activeEl.checked : false;

  /* ===== BASIC VALIDATION ===== */
  if (!productId || !name) {
    UI.showToast("กรุณากรอก SKU และชื่อสินค้า", "warning");
    return;
  }

  if (!Number.isInteger(price) || price < 0) {
    UI.showToast("ราคาต้องเป็นตัวเลขจำนวนเต็ม ≥ 0", "warning");
    return;
  }

  if (!Number.isInteger(stock) || stock < 0) {
    UI.showToast("สต๊อกต้องเป็นตัวเลขจำนวนเต็ม ≥ 0", "warning");
    return;
  }

  UI.showLoading("กำลังเพิ่มสินค้า...");

  try {
    await API.addProduct(Core.state.admin.token, {
      productId,
      name,
      price,
      stock,
      active
    });

    UI.showToast("เพิ่มสินค้าเรียบร้อย", "success");

    // ปิด sheet
    if (window.UI && typeof UI.closeOverlay === "function") {
      UI.closeOverlay("adminSheet");
    }

    // reload products (viewer source of truth)
    if (typeof Core.loadProducts === "function") {
      await Core.loadProducts();
    }

    // render products view ใหม่
    Admin.render();

  } catch (err) {
    console.error("[Admin.submitAddProduct]", err);
    UI.showToast(
      err.message || "เพิ่มสินค้าไม่สำเร็จ",
      "error"
    );
  } finally {
    UI.hideLoading();
  }
};

/* ======================================================
   STEP A2.2.3 — OPEN ADD PRODUCT SHEET
   - Open overlay
   - Bind submit / cancel
====================================================== */

Admin.openAddProduct = function () {
  if (!Admin.guard("manageProducts", "ไม่มีสิทธิ์เพิ่มสินค้า")) {
    return;
  }

  const overlay = document.getElementById("adminSheet");
  if (!overlay) return;

  // render sheet UI
  overlay.innerHTML = Render.adminAddProductSheet();

  // open overlay via stack system
  UI.openOverlay("adminSheet");

  // 🔑 bind sheet actions AFTER render
  if (window.UI && typeof UI.bindAddProductSheet === "function") {
    UI.bindAddProductSheet({
      onCancel: () => UI.closeOverlay("adminSheet"),
      onSubmit: Admin.submitAddProduct
    });
  }
};

/* ======================================================
   STEP A2.3.1 — OPEN EDIT PRODUCT SHEET
   - Open overlay
   - Render edit sheet
   - Bind submit / cancel
====================================================== */

Admin.openEditProduct = function (productId) {
  if (!Admin.guard("manageProducts", "ไม่มีสิทธิ์แก้ไขสินค้า")) {
    return;
  }

  const products = Core.state.products || [];
  const product = products.find(p => p.productId === productId);

  if (!product) {
    UI.showToast("ไม่พบสินค้า", "error");
    return;
  }

  const overlay = document.getElementById("adminSheet");
  if (!overlay) return;

  // render edit sheet
  overlay.innerHTML = Render.adminEditProductSheet(product);

  // open overlay via stack system
  UI.openOverlay("adminSheet");

  // 🔑 bind edit sheet actions AFTER render
  if (window.UI && typeof UI.bindEditProductSheet === "function") {
    UI.bindEditProductSheet({
      onCancel: () => UI.closeOverlay("adminSheet"),
      onSubmit: Admin.submitEditProduct,
      onOpenStockAdjust: () => {
     Admin.openStockAdjust(product);
   }
    });
  }
};

/* ======================================================
   STEP A2.3.2 — SUBMIT EDIT PRODUCT
   - Frontend only
   - Call backend updateProduct
====================================================== */

Admin.submitEditProduct = async function () {
  if (!Admin.guard("manageProducts", "ไม่มีสิทธิ์แก้ไขสินค้า")) {
    return;
  }

  const idEl = document.getElementById("editProductId");
  const nameEl = document.getElementById("editProductName");
  const priceEl = document.getElementById("editProductPrice");
  const stockEl = document.getElementById("editProductStock");
  const activeEl = document.getElementById("editProductActive");

  if (!idEl || !nameEl || !priceEl || !stockEl) {
    UI.showToast("ฟอร์มไม่สมบูรณ์", "error");
    return;
  }

  const productId = idEl.value;
  const name = nameEl.value.trim();
  const price = Number(priceEl.value);
  const stock = Number(stockEl.value);
  const active = activeEl ? activeEl.checked : false;

  /* ===== BASIC VALIDATION ===== */
  if (!productId || !name) {
    UI.showToast("ข้อมูลสินค้าไม่ครบ", "warning");
    return;
  }

  if (!Number.isInteger(price) || price < 0) {
    UI.showToast("ราคาต้องเป็นตัวเลขจำนวนเต็ม ≥ 0", "warning");
    return;
  }

  if (!Number.isInteger(stock) || stock < 0) {
    UI.showToast("สต๊อกต้องเป็นตัวเลขจำนวนเต็ม ≥ 0", "warning");
    return;
  }

  UI.showLoading("กำลังบันทึกการแก้ไขสินค้า...");

  try {
    let imageUrl;

    // 🔁 upload image first (if selected)
    const sheet = document.querySelector(".admin-sheet");
    if (sheet && sheet.dataset.imageBase64) {
      const base64 = sheet.dataset.imageBase64;
      const filename = sheet.dataset.imageName || "product.jpg";
      const mimeType = sheet.dataset.imageType || "image/jpeg";

      const uploadRes = await API.uploadProductImage(
        Core.state.admin.token,
        base64,
        filename,
        mimeType
      );

      imageUrl = uploadRes.imageUrl;
    }
 
    await API.updateProduct(Core.state.admin.token, {
      productId,
      name,
      price,
      stock,
      active,
      ...(imageUrl ? { image: imageUrl } : {})
    });

    UI.showToast("บันทึกการแก้ไขเรียบร้อย", "success");

    UI.closeOverlay("adminSheet");

    // reload products (viewer source of truth)
    if (typeof Core.loadProducts === "function") {
      await Core.loadProducts();
    }

    // render products view ใหม่
    Admin.render();

  } catch (err) {
    console.error("[Admin.submitEditProduct]", err);
    UI.showToast(
      err.message || "บันทึกการแก้ไขไม่สำเร็จ",
      "error"
    );
  } finally {
    UI.hideLoading();
  }
};

/* ======================================================
   STEP C.6.2 — HISTORY FILTER / SEARCH / SORT
   - Read-only
   - Frontend only
====================================================== */

Admin.getFilteredStockLogs = function () {
  const logs = Core.state.admin.stockLogs || [];
  const filter = Core.state.admin.historyFilter;

  let result = [...logs];

  /* ===== FILTER BY TYPE ===== */
  if (filter.type && filter.type !== "ALL") {
    result = result.filter(log => log.type === filter.type);
  }

  /* ===== SEARCH (productId / orderId / by) ===== */
  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase();

    result = result.filter(log =>
      String(log.productId || "").toLowerCase().includes(kw) ||
      String(log.orderId || "").toLowerCase().includes(kw) ||
      String(log.by || "").toLowerCase().includes(kw)
    );
  }

  /* ===== SORT BY TIMESTAMP ===== */
  result.sort((a, b) => {
    const ta = new Date(a.timestamp).getTime();
    const tb = new Date(b.timestamp).getTime();

    return filter.sort === "ASC"
      ? ta - tb
      : tb - ta;
  });

  return result;
};

/* ======================================================
   STEP C.7.3 — OPEN ORDER DETAIL (READ ONLY)
   - Read from Core.state.admin.orders
   - No API call
   - Permission: viewHistory
====================================================== */

Admin.openOrderDetail = function (orderId) {
  if (!Admin.guard("viewHistory", "ไม่มีสิทธิ์ดูรายละเอียดคำสั่งซื้อ")) {
    return;
  }

  const orders = Core.state.admin.orders || [];
  const order = orders.find(o => o.orderId === orderId);

  if (!order) {
    UI.showToast("ไม่พบคำสั่งซื้อ", "error");
    return;
  }

  Admin.renderOrderDetail(order);
};

/* ======================================================
   STEP C.7.4 — RENDER ORDER DETAIL (DELEGATE ONLY)
====================================================== */

Admin.renderOrderDetail = function (order) {
  const html = Render.adminOrderDetailView(order);

  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = html;

  // UI binding (back button)
  if (window.UI && typeof UI.bindOrderDetail === "function") {
    UI.bindOrderDetail({
      onBack: Admin.renderHistory
    });
  }
};

/* ======================================================
   STEP C.5 — RENDER HISTORY (ENTRY POINT)
   - Render admin history view
   - Bind filter + order links
====================================================== */

Admin.renderHistory = function () {
  if (!Admin.guard("viewHistory", "ไม่มีสิทธิ์ดูประวัติ")) {
    return;
  }

  const filteredLogs = Admin.getFilteredStockLogs();

  const html = Render.adminHistoryView({
    stockLogs: filteredLogs,
    orders: Core.state.admin.orders
  });

  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = html;

  // 🔑 bind UI หลัง render เท่านั้น
  UI.bindHistoryFilter();
  UI.bindOrderLinks();
};

/* ======================================================
   STEP C.9.2 — BUILD TIMELINE EVENTS
   - Merge Stock Logs + Orders
   - Normalize to single schema
   - Sort by time (DESC)
   - Read-only
====================================================== */

Admin.buildTimelineEvents = function () {
  if (!Core.can("viewHistory")) {
    return [];
  }

  const events = [];

  /* ========= STOCK LOGS ========= */
  (Core.state.admin.stockLogs || []).forEach(log => {
    events.push({
      id: log.logId,
      time: new Date(log.timestamp),
      kind: "STOCK",
      type: log.type, // IN | OUT | ADJUST | CREATE
      title: `${log.type} • ${log.productId}`,
      meta: {
        productId: log.productId,
        qty: log.qty,
        before: log.before,
        after: log.after,
        by: log.by
      },
      orderId: log.orderId || null
    });
  });

  /* ========= ORDERS ========= */
  (Core.state.admin.orders || []).forEach(order => {
    if (order.status === "APPROVED" || order.status === "REJECTED") {
      events.push({
        id: order.orderId + "-" + order.status,
        time: new Date(order.updatedAt || order.createdAt),
        kind: "ORDER",
        type: order.status, // APPROVED | REJECTED
        title: `${order.status} • ${order.orderId}`,
        meta: {
          total: order.total,
          by: order.approvedBy || order.rejectedBy
        },
        orderId: order.orderId
      });
    }
  });

/* ========= APPLY TIMELINE FILTER (STEP C.10) ========= */
const scope = Core.state.admin.timelineFilter.scope;

let filteredEvents = events;

if (scope !== "ALL") {
  filteredEvents = events.filter(ev => ev.kind === scope);
}

/* ========= SORT: NEW → OLD ========= */
filteredEvents.sort((a, b) => b.time - a.time);

return filteredEvents;
};

/* ======================================================
   STEP C.9.5 — RENDER TIMELINE (ENTRY POINT)
   - Read-only
   - Permission: viewHistory
   - Use normalized timeline events
====================================================== */

Admin.renderTimeline = function () {
  if (!Admin.guard("viewHistory", "ไม่มีสิทธิ์ดู Timeline")) {
    return;
  }

  const events = Admin.buildTimelineEvents();

  const html = Render.adminTimelineView(events);

  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = html;

  // 🔑 STEP C.10.5 — bind timeline filter AFTER render
  if (window.UI && typeof UI.bindTimelineFilter === "function") {
    UI.bindTimelineFilter();
  }   

  // reuse order drill-down (STEP C.7)
  if (window.UI && typeof UI.bindOrderLinks === "function") {
    UI.bindOrderLinks();
  }

  // 🔑 STEP C.11.5 — bind Export / Print AFTER render
  if (window.UI && typeof UI.bindTimelineActions === "function") {
    UI.bindTimelineActions();
  }   
};

/* ======================================================
   STEP C.11.1 — EXPORT TIMELINE → CSV
   - Use normalized timeline events
   - Respect current timeline filter (scope)
   - Read-only
====================================================== */

Admin.exportTimelineCSV = function () {
  if (!Admin.guard("viewHistory", "ไม่มีสิทธิ์ Export Timeline")) {
    return;
  }

  const events = Admin.buildTimelineEvents();

  if (!Array.isArray(events) || events.length === 0) {
    UI.showToast("ไม่มีข้อมูลให้ Export", "warning");
    return;
  }

    const headers = [
    "time",
    "kind",
    "type", 
    "title",
    "orderId",
    "actor",      // who did this
    "productId",
    "qty",
    "before",
    "after",
    "total"
   ];

  const rows = events.map(ev => ([
  ev.time instanceof Date
   ? ev.time.toLocaleString("th-TH")
   : "",
    ev.kind || "",
    ev.type || "",
    ev.title || "",
    ev.orderId || "",
    ev.meta?.by || "",
    (ev.meta && ev.meta.productId) || "",
    ev.meta && typeof ev.meta.qty === "number" ? ev.meta.qty : "",
    ev.meta && typeof ev.meta.before === "number" ? ev.meta.before : "",
    ev.meta && typeof ev.meta.after === "number" ? ev.meta.after : "",
    ev.meta && typeof ev.meta.total === "number" ? ev.meta.total : ""
  ]));

  const csv = "\uFEFF" + [headers, ...rows]
    .map(row => row.map(Admin._csvEscape).join(","))
    .join("\n");

  Admin._downloadFile(
    csv,
     "timeline_" +
      Core.state.admin.timelineFilter.scope.toLowerCase() +
      "_" + Date.now() + ".csv",
    "text/csv;charset=utf-8;"
  );
};

/* ===== CSV HELPERS (LOCAL ONLY) ===== */

Admin._csvEscape = function (value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return /[",\n]/.test(str)
    ? `"${str.replace(/"/g, '""')}"`
    : str;
};

Admin._downloadFile = function (content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();

  URL.revokeObjectURL(url);
  a.remove();
};

/* ======================================================
   STEP C.11.2 — PRINT TIMELINE
   - Use normalized timeline events
   - Respect current timeline filter (scope)
   - Read-only
====================================================== */

Admin.printTimeline = function () {
  if (!Admin.guard("viewHistory", "ไม่มีสิทธิ์พิมพ์ Timeline")) {
    return;
  }

  const events = Admin.buildTimelineEvents();

  if (!Array.isArray(events) || events.length === 0) {
    UI.showToast("ไม่มีข้อมูลให้พิมพ์", "warning");
    return;
  }

  const html = Render.adminTimelinePrintView(events);

  const app = document.getElementById("app");
  if (!app) return;

  // 🔒 เข้าโหมดเอกสาร (print mode)
  document.body.classList.add("document-mode");

  app.innerHTML = html;

  // 🔔 delay เล็กน้อยให้ DOM พร้อมก่อน print
  setTimeout(() => {
    window.print();
  }, 100);

 // 🧹 cleanup หลังพิมพ์ (สำคัญ)
 const afterPrint = () => {
   document.body.classList.remove("document-mode");
   window.removeEventListener("afterprint", afterPrint);
 };

 window.addEventListener("afterprint", afterPrint);
   
};

/* ======================================================
   STEP A2.4.2.3 — OPEN STOCK ADJUST SHEET
   - Open overlay
   - Render stock adjust sheet
   - Bind cancel / submit (submit ยังไม่ทำก็ได้)
====================================================== */

Admin.openStockAdjust = function (product) {
  Core.state.admin.currentStockProduct = product;
  if (!Admin.guard("manageStock", "ไม่มีสิทธิ์จัดการสต๊อก")) {
    return;
  }

  const overlay = document.getElementById("adminSheet");
  if (!overlay) return;

  overlay.innerHTML = Render.adminStockAdjustSheet(product);

  UI.openOverlay("adminSheet");
  // 🔑 bind stock adjust sheet actions AFTER render
  if (window.UI && typeof UI.bindStockAdjustSheet === "function") {
    UI.bindStockAdjustSheet({
      onCancel: () => UI.closeOverlay("adminSheet"),
      onSubmit: Admin.submitStockAdjust // (ยังไม่ต้อง implement ก็ได้)
    });
  }
};


