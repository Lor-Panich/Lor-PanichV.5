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
Viewer._searchDebounceTimer = null;
Viewer._isTypingSearch = false;

/**
 * handle search input change (debounced)
 * 🔧 STEP 8 — reduce re-render
 * 🔒 DO NOT re-render search bar while typing
 */
Viewer._onSearchInput = function (value) {
  // 🔒 mark typing state (IMPORTANT)
  Viewer._isTypingSearch = true;

  // 🔑 single source of truth
  Core.state.viewer.search = value || "";

  // clear previous debounce
  if (Viewer._searchDebounceTimer) {
    clearTimeout(Viewer._searchDebounceTimer);
  }

  // debounce list update only
  Viewer._searchDebounceTimer = setTimeout(() => {
    // typing finished
    Viewer._isTypingSearch = false;

    // 🔒 update list without touching subHeader
    Viewer._renderList(null, { skipSubHeader: true });
  }, 180);
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

  // 🔵 STEP 7 — cleanup
  Viewer._unbindSearchAutoClose(); 

  Viewer._renderList();
};

/* ======================================================
   🔧 STEP 3 — SEARCH AUTO CLOSE (FIXED)
   - Close only when user INTENDS to tap header
   - ❌ Do not auto-close while typing
====================================================== */

Viewer._bindSearchAutoClose = function () {
  const header = document.getElementById("appHeader");
  if (!header) return;

  Viewer._onSearchTapHeader = function (e) {
    // 🔒 GUARD: do not auto-close while typing
    if (Viewer._isTypingSearch) return;

    // ❌ ไม่ปิด ถ้ากดที่ search input
    if (e.target.closest(".search-input")) return;

    // ❌ ไม่ปิด ถ้ากดปุ่มแว่นขยาย
    if (e.target.closest("#searchToggleBtn")) return;

    // ✅ ปิดเฉพาะตอน search เปิดอยู่
    if (Viewer._searchOpen) {
      Viewer.closeSearch();
    }
  };

  header.addEventListener(
    "pointerdown",
    Viewer._onSearchTapHeader
  );
};

Viewer._unbindSearchAutoClose = function () {
  const header = document.getElementById("appHeader");
  if (!header || !Viewer._onSearchTapHeader) return;

  header.removeEventListener(
    "pointerdown",
    Viewer._onSearchTapHeader
  );

  Viewer._onSearchTapHeader = null;
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
  Viewer.bindHeaderSearch(); // 🔴 ADD
};

/* ======================================================
   APP HEADER (VIEWER OWNS MOUNT)
====================================================== */

Viewer._shopHeader = function () {
  const headerEl = document.getElementById("appHeader");
  if (!headerEl) return;

  headerEl.innerHTML = Render.shopHeader(
    "ร้านค้า Lor-Panich",
    "สินค้าทั้งหมด • พร้อมขาย"
  );
};

/* ======================================================
   LOADING STATE (VIEWER)
====================================================== */

Viewer._renderLoading = function () {
  // mount app header (global chrome)
  Viewer._shopHeader();

  // mount page content (no subHeader in loading)
  Viewer._mount(
    Render.page({
      subHeader: "",
      content: Render.loading("กำลังเตรียมข้อมูล...")
    })
  );
};

/* ======================================================
   EMPTY STATE (VIEWER)
====================================================== */

Viewer._renderEmpty = function () {
  // mount app header (global chrome)
  Viewer._shopHeader();

  // mount page content (no subHeader in empty state)
  Viewer._mount(
    Render.page({
      subHeader: "",
      content: Render.empty("ยังไม่มีสินค้าในระบบ")
    })
  );
};

/* ======================================================
   ERROR STATE (VIEWER)
====================================================== */

Viewer._renderError = function (message) {
  // show error feedback
  UI.showToast(message, "error");

  // mount app header (error context)
  const headerEl = document.getElementById("appHeader");
  if (headerEl) {
    headerEl.innerHTML = Render.shopHeader(
      "เกิดข้อผิดพลาด",
      "ไม่สามารถโหลดข้อมูลได้"
    );
  }

  // mount page content (no subHeader in error state)
  Viewer._mount(
    Render.page({
      subHeader: "",
      content: Render.empty("ไม่สามารถโหลดข้อมูลได้")
    })
  );
};

/* ======================================================
   PRODUCT LIST + SEARCH (VIEWER)
====================================================== */

Viewer._renderList = function (products, options = {}) {
  const { skipSubHeader = false } = options;

  const allProducts = Array.isArray(products)
    ? products
    : Core.state.viewer.products;

  if (!Array.isArray(allProducts) || allProducts.length === 0) {
    return Viewer._renderEmpty();
  }

  const keyword = (Core.state.viewer.search || "")
    .trim()
    .toLowerCase();

  const filteredProducts = keyword
    ? allProducts.filter(p => {
        const name = (p.name || "").toLowerCase();
        const id = (p.productId || "").toLowerCase();
        return name.includes(keyword) || id.includes(keyword);
      })
    : allProducts;

  const isSearchOpen =
    document.body.classList.contains("search-open");

  // mount app header (global chrome)
  Viewer._shopHeader();

  Viewer._mount(
    Render.page({
      // 🔒 render search bar เฉพาะตอน "เปิดครั้งแรก"
      subHeader:
        !skipSubHeader && isSearchOpen
          ? Render.searchBar()
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

  // 🔍 bind input เฉพาะตอน render search bar
  if (!skipSubHeader && isSearchOpen) {
    const input = document.querySelector(".search-input");
    if (input) {
      input.value = Core.state.viewer.search || "";
      input.oninput = e =>
        Viewer._onSearchInput(e.target.value);
      input.focus();
    }
  }
};

/* ======================================================
   HEADER SEARCH BIND (VIEWER OWNS THIS)
====================================================== */

Viewer.bindHeaderSearch = function () {
  const btn = document.getElementById("searchToggleBtn");
  if (!btn) return;

  // 🔒 guard กัน bind ซ้ำ
  if (btn._searchBound) return;
  btn._searchBound = true;

  btn.onclick = function (e) {
    e.stopPropagation();
    if (Viewer._searchOpen) {
      Viewer.closeSearch();
    } else {
      Viewer.openSearch();
    }
  };
};




