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

Viewer._mountSearchBar = function () {
  const slot = document.getElementById("searchBarSlot");
  if (!slot || slot._mounted) return;

  slot.innerHTML = Render.searchBar();
  slot._mounted = true;

  const input = slot.querySelector(".search-input");
  if (input) {
    input.oninput = e =>
      Viewer._onSearchInput(e.target.value);
  }
};

Viewer.enter = async function () {
  Core.state.mode = "viewer";

  Viewer._shopHeader();
  Viewer._mountSearchBar(); // ✅ สำคัญมาก

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

  // 🔒 state only
  Viewer._searchOpen = true;
  document.body.classList.add("search-open");

  // ❌ ห้ามเรียก _renderList ที่นี่อีก
  // เพราะ search-bar ไม่ได้อยู่ใน Render.page แล้ว

  // 🎯 focus input ที่มีอยู่จริงใน DOM
  const input = document.querySelector("#searchBarSlot .search-input");
  if (input) {
    input.focus();
  }

  // 🔒 bind auto-close แค่ครั้งเดียว
  Viewer._bindSearchAutoClose();
};

/**
 * 🔍 Close Search Mode
 */
Viewer.closeSearch = function () {
  if (!Viewer._searchOpen) return;

  Viewer._searchOpen = false;
  document.body.classList.remove("search-open");

  // ❌ ไม่ต้อง render อะไรเพิ่ม
};

/* ======================================================
   🔧 SEARCH AUTO CLOSE (STABLE)
====================================================== */

Viewer._bindSearchAutoClose = function () {
  const header = document.getElementById("appHeader");
  if (!header) return;

  if (Viewer._onSearchTapHeader) return; // guard ซ้ำ

  Viewer._onSearchTapHeader = function (e) {
    if (Viewer._isTypingSearch) return;
    if (e.target.closest(".search-input")) return;
    if (e.target.closest("#searchToggleBtn")) return;

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

/* ======================================================
   MOUNT PAGE (VIEWER)
   🔒 search-open class is controlled ONLY by
   openSearch / closeSearch
====================================================== */

Viewer._mount = function (html) {
  const app = document.getElementById("app");
  if (!app) return;

  // mount page
  app.innerHTML = html;

  // ❌ DO NOT touch search-open class here
  // search-open is controlled by openSearch / closeSearch ONLY

  Render.afterRender();
  Viewer.bindHeaderSearch();
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
   PRODUCT LIST + SEARCH (VIEWER) — FIXED V5
   - ❌ No search-bar render here
   - ❌ No input binding here
====================================================== */

Viewer._renderList = function (products) {
  const allProducts = Array.isArray(products)
    ? products
    : Core.state.viewer.products;

  // mount app header (global chrome)
  Viewer._shopHeader();

  // EMPTY STATE handled here
  if (!Array.isArray(allProducts) || allProducts.length === 0) {
    Viewer._mount(
      Render.page({
        subHeader: "", // 🔒 search-bar NOT rendered here
        content: Render.empty("ยังไม่มีสินค้าในระบบ")
      })
    );
    return;
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

  Viewer._mount(
    Render.page({
      subHeader: "", // 🔒 search-bar NOT rendered here
      content: filteredProducts.length
        ? Render.list(
            filteredProducts
              .map(p => Render.productCard(p))
              .join("")
          )
        : Render.empty("ไม่พบสินค้าที่ค้นหา")
    })
  );
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




