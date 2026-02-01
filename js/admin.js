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

    Admin.renderOrders();

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

