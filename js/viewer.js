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
   SEARCH STATE (VIEWER OWNS THIS)
====================================================== */

// 🔍 Search State
Viewer._searchOpen = false;
Viewer._searchKeyword = "";

/**
 * เปิด Search Mode
 * - ถูกเรียกจาก UI
 */
Viewer.openSearch = function () {
  Viewer._searchOpen = true;
  Viewer._renderList();
};

/**
 * ปิด Search Mode
 * - reset keyword
 * - re-render list ปกติ
 */
Viewer.closeSearch = function () {
  Viewer._searchOpen = false;
  Viewer._searchKeyword = "";
  Viewer._renderList();
};

/**
 * handle search input change
 */
Viewer._onSearchInput = function (value) {
  Viewer._searchKeyword = value || "";
  Viewer._renderList();
};

/**
 * 🔍 Open Search Mode
 * 🔧 STEP 6 — Viewer controls DOM side-effect
 */
Viewer.openSearch = function () {
  if (Viewer._searchOpen) return;

  Viewer._searchOpen = true;
  document.body.classList.add("search-open");

  // re-render เพื่อแสดง search bar
  Viewer._renderList();

    // 🔵 STEP 7 — bind auto close
  Viewer._bindSearchAutoClose();
   
  // auto focus หลัง render
  setTimeout(() => {
    const input = document.querySelector(".search-input");
    if (input) input.focus();
  }, 0);
};

/**
 * 🔍 Close Search Mode
 */
Viewer.closeSearch = function () {
  if (!Viewer._searchOpen) return;

  Viewer._searchOpen = false;
  Viewer._searchKeyword = "";

  document.body.classList.remove("search-open");

  Viewer._renderList();
};

/* ======================================================
   🔧 STEP 7 — SEARCH AUTO CLOSE (SCROLL / TAP OUTSIDE)
====================================================== */

Viewer._bindSearchAutoClose = function () {
  // ปิดเมื่อ scroll
  Viewer._onSearchScroll = function () {
    Viewer.closeSearch();
  };

  // ปิดเมื่อ tap นอก search bar
  Viewer._onSearchTapOutside = function (e) {
    const searchBar = document.querySelector(".search-bar");
    if (!searchBar) return;

    if (!searchBar.contains(e.target)) {
      Viewer.closeSearch();
    }
  };

  window.addEventListener("scroll", Viewer._onSearchScroll, {
    once: true,
    passive: true
  });

  document.addEventListener(
    "pointerdown",
    Viewer._onSearchTapOutside
  );
};

Viewer._unbindSearchAutoClose = function () {
  if (Viewer._onSearchScroll) {
    window.removeEventListener(
      "scroll",
      Viewer._onSearchScroll
    );
    Viewer._onSearchScroll = null;
  }

  if (Viewer._onSearchTapOutside) {
    document.removeEventListener(
      "pointerdown",
      Viewer._onSearchTapOutside
    );
    Viewer._onSearchTapOutside = null;
  }
};

/**
 * mount html to app root
 * 🔧 STEP 4 — show search bar only when searchOpen = true
 */
Viewer._mount = function (html) {
  const app = document.getElementById("app");
  if (!app) return;

  // mount page
  app.innerHTML = html;

  // 🔍 Toggle search-open class (Viewer controls)
  if (Viewer._searchOpen) {
    document.body.classList.add("search-open");
  } else {
    document.body.classList.remove("search-open");
  }

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
