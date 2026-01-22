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

Viewer._searchKeyword = "";
Viewer._isSearchOpen = false;

Viewer._onSearchInput = function (value) {
  Viewer._searchKeyword = value || "";
  Viewer._renderList();
};

Viewer._mount = function (html) {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = html;
  Render.afterRender();
};

/* ---------- Shared Header (SIDE-EFFECT ONLY) ---------- */
/*
  ⚠️ V5 RULE
  - function นี้มีหน้าที่ "render App Header" เท่านั้น
  - ไม่คืนค่า
  - ห้ามนำไปใช้เป็น content
*/
Viewer._shopHeader = function () {
  Render.shopHeader(
    "ร้านค้า Lor-Panich",
    "สินค้าทั้งหมด • พร้อมขาย"
  );
};

/* ---------- Loading ---------- */
Viewer._renderLoading = function () {
  Render.shopHeader(
    "ร้านค้า Lor-Panich",
    "สินค้าทั้งหมด • พร้อมขาย"
  );

  Viewer._mount(
    Render.page({
      content: Render.loading("กำลังเตรียมข้อมูล...")
    })
  );

  UI.bindHeaderSearch(); // 🔵 STEP C
};

/* ---------- Empty ---------- */
Viewer._renderEmpty = function () {
  // 🔵 App Header (SIDE-EFFECT)
  Viewer._shopHeader();

  Viewer._mount(
    Render.page({
      content: Render.empty("ยังไม่มีสินค้าในระบบ")
    })
  );

  // 🔵 STEP C — bind search interaction
  UI.bindHeaderSearch();
};

/* ---------- Error ---------- */
Viewer._renderError = function (message) {
  UI.showToast(message, "error");

  // 🔵 App Header (SIDE-EFFECT)
  Render.shopHeader(
    "เกิดข้อผิดพลาด",
    "ไม่สามารถโหลดข้อมูลได้"
  );

  Viewer._mount(
    Render.page({
      content: Render.empty("ไม่สามารถโหลดข้อมูลได้")
    })
  );

  // 🔵 STEP C — bind search interaction
  UI.bindHeaderSearch();
};

Viewer._renderList = function (products) {
  // ใช้ state เป็นหลัก ถ้า param ไม่ถูกต้อง
  const allProducts = Array.isArray(products)
    ? products
    : Core.state.viewer.products;

  // guard invalid
  if (!Array.isArray(allProducts) || allProducts.length === 0) {
    return Viewer._renderEmpty();
  }

  // 🔍 SEARCH FILTER
  const keyword = Viewer._searchKeyword.trim().toLowerCase();

  const filteredProducts = keyword
    ? allProducts.filter(p => {
        const name = (p.name || "").toLowerCase();
        const id = (p.productId || "").toLowerCase();
        return name.includes(keyword) || id.includes(keyword);
      })
    : allProducts;

  // 🔵 App Header (SIDE-EFFECT ONLY)
  Viewer._shopHeader();

  Viewer._mount(
    Render.page({
      // ✅ แสดง search bar เฉพาะตอนเปิด search
      header: Viewer._isSearchOpen
        ? Render.searchBar(Viewer._searchKeyword)
        : "",

      // 📦 Content
      content: filteredProducts.length
        ? Render.list(
            filteredProducts
              .map(p => Render.productCard(p))
              .join("")
          )
        : Render.empty("ไม่พบสินค้าที่ค้นหา")
    })
  );

  // 🔗 bind search input → viewer state
  if (Viewer._isSearchOpen) {
    const input = document.querySelector(".search-input");
    if (input) {
      input.oninput = e => Viewer._onSearchInput(e.target.value);
      input.focus(); // UX แบบ iOS
    }
  }

  // 🔵 bind header search icon
  UI.bindHeaderSearch();
};
