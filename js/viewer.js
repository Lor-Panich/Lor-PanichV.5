/* ======================================================
   V5 VIEWER FLOW
   - Skeleton + Real Flow
   - No Cart
   - Loading / Empty / Error ครบ
====================================================== */

window.Viewer = {};

/* ======================================================
   VIEWER INIT
====================================================== */

Viewer.init = async function () {
  await Viewer.enter();
};

/* ======================================================
   VIEWER ENTER
====================================================== */

Viewer.enter = async function () {
  Core.state.mode = "viewer";

  Viewer._renderLoading();
  await Viewer.loadProducts();
};

/* ======================================================
   LOAD PRODUCTS
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
====================================================== */

// 🔍 Search State
Viewer._searchOpen = false;
Viewer._searchKeyword = "";

/**
 * handle search input change
 */
Viewer._onSearchInput = function (value) {
  Viewer._searchKeyword = value || "";
  Viewer._renderList();
};

/**
 * mount html to app root
 */
Viewer._mount = function (html) {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = html;
  Render.afterRender();
};

/* ======================================================
   APP HEADER (SIDE-EFFECT ONLY)
====================================================== */

Viewer._shopHeader = function () {
  Render.shopHeader(
    "ร้านค้า Lor-Panich",
    "สินค้าทั้งหมด • พร้อมขาย"
  );
};

/* ======================================================
   LOADING
====================================================== */

Viewer._renderLoading = function () {
  Viewer._shopHeader();

  Viewer._mount(
    Render.page({
      content: Render.loading("กำลังเตรียมข้อมูล...")
    })
  );

  UI.bindHeaderSearch();
};

/* ======================================================
   EMPTY
====================================================== */

Viewer._renderEmpty = function () {
  Viewer._shopHeader();

  Viewer._mount(
    Render.page({
      content: Render.empty("ยังไม่มีสินค้าในระบบ")
    })
  );

  UI.bindHeaderSearch();
};

/* ======================================================
   ERROR
====================================================== */

Viewer._renderError = function (message) {
  UI.showToast(message, "error");

  Render.shopHeader(
    "เกิดข้อผิดพลาด",
    "ไม่สามารถโหลดข้อมูลได้"
  );

  Viewer._mount(
    Render.page({
      content: Render.empty("ไม่สามารถโหลดข้อมูลได้")
    })
  );

  UI.bindHeaderSearch();
};

/* ======================================================
   PRODUCT LIST + SEARCH
====================================================== */

Viewer._renderList = function (products) {
  const allProducts = Array.isArray(products)
    ? products
    : Core.state.viewer.products;

  if (!Array.isArray(allProducts) || allProducts.length === 0) {
    return Viewer._renderEmpty();
  }

  const keyword = Viewer._searchKeyword.trim().toLowerCase();

  const filteredProducts = keyword
    ? allProducts.filter(p => {
        const name = (p.name || "").toLowerCase();
        const id = (p.productId || "").toLowerCase();
        return name.includes(keyword) || id.includes(keyword);
      })
    : allProducts;

  const isSearchOpen =
    document.body.classList.contains("search-open");

  Viewer._shopHeader();

  Viewer._mount(
    Render.page({
      // 🔽 Search bar แสดงเฉพาะตอน search-open
      header: isSearchOpen
        ? Render.searchBar(Viewer._searchKeyword)
        : "",

      content: filteredProducts.length
        ? Render.list(
            filteredProducts
              .map(p => Render.productCard(p))
              .join("")
          )
        : Render.empty("ไม่พบสินค้าที่ค้นหา")
    })
  );

  // bind input
  if (isSearchOpen) {
    const input = document.querySelector(".search-input");
    if (input) {
      input.oninput = e =>
        Viewer._onSearchInput(e.target.value);
      input.focus();
    }
  }

  UI.bindHeaderSearch();
};
