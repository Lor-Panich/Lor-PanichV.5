/* ======================================================
   V5 VIEWER FLOW
   - Skeleton + Real Flow
   - No Cart
   - Loading / Empty / Error ครบ
====================================================== */

window.Viewer = {};

/* ======================================================
   VIEWER INIT
   🔍 keyword: VIEWER INIT
   🔴 CHANGED
====================================================== */

Viewer.init = async function () {
  // init ควรทำหน้าที่เบาที่สุด
  // เผื่ออนาคตมี bind event / restore ui
  await Viewer.enter();
};

/* ======================================================
   VIEWER ENTER (ENTRY POINT)
   🔍 keyword: VIEWER ENTER
   ➕ ADDED
====================================================== */

Viewer.enter = async function () {
  Core.state.mode = "viewer";

  Viewer._renderLoading();
  await Viewer.loadProducts();
};

/* ======================================================
   LOAD PRODUCTS FLOW
   🔍 keyword: LOAD PRODUCTS
====================================================== */

Viewer.loadProducts = async function () {
  try {
    UI.showLoading("กำลังโหลดสินค้า...");

    const products = await API.fetchProducts();

    if (!Array.isArray(products)) {
      throw new Error("รูปแบบข้อมูลสินค้าไม่ถูกต้อง");
    }

    Core.state.viewer.products = products;

    UI.hideLoading();

    if (products.length === 0) {
      Viewer._renderEmpty();
    } else {
      Viewer._renderList(products);
    }

  } catch (err) {
    console.error("[Viewer.loadProducts]", err);

    UI.hideLoading();
    Viewer._renderError(
      err.message || "ไม่สามารถโหลดข้อมูลสินค้าได้"
    );
  }
};

/* ======================================================
   RENDER STATES
   🔍 keyword: VIEWER RENDER STATES
====================================================== */

Viewer._mount = function (html) {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = html;
  Render.afterRender();
};

/* ---------- Shared Header ---------- */
Viewer._shopHeader = function () {
  return Render.shopHeader(
    "ร้านค้า Lor-Panich",
    "สินค้าทั้งหมด • พร้อมขาย"
  );
};

/* ---------- Loading ---------- */
Viewer._renderLoading = function () {
  Viewer._mount(
    Render.page({
      header: Viewer._shopHeader(),
      content: Render.loading("กำลังเตรียมข้อมูล...")
    })
  );
};

/* ---------- Empty ---------- */
Viewer._renderEmpty = function () {
  Viewer._mount(
    Render.page({
      header: Viewer._shopHeader(),
      content: Render.empty("ยังไม่มีสินค้าในระบบ")
    })
  );
};

/* ---------- Error ---------- */
Viewer._renderError = function (message) {
  UI.showToast(message, "error");

  Viewer._mount(
    Render.page({
      header: Render.shopHeader(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถโหลดข้อมูลได้"
      ),
      content: Render.empty("ไม่สามารถโหลดข้อมูลได้")
    })
  );
};

/* ---------- Product List ---------- */
Viewer._renderList = function (products) {
  // ใช้ state เป็นหลัก ถ้า param ไม่ถูกต้อง
  const list = Array.isArray(products)
    ? products
    : Core.state.viewer.products;

  // guard empty / invalid
  if (!Array.isArray(list) || list.length === 0) {
    return Viewer._renderEmpty();
  }

  const itemsHTML = list
    .map(p => Render.productCard(p))
    .join("");

  Viewer._mount(
    Render.page({
      header: Viewer._shopHeader(),
      content: Render.list(itemsHTML)
    })
  );
};
