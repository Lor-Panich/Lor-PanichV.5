/* ======================================================
   STEP 8.5 — ADMIN FLOW CONTROLLER (V5)
   - Approve / Reject
   - Stock OUT
   - No UI detail
====================================================== */

window.Admin = {};

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
