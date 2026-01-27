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
Viewer._searchDebounceTimer = null;

/**
 * handle search input change (debounced)
 * 🔧 STEP 8 — reduce re-render
 */
Viewer._onSearchInput = function (value) {
  Viewer._searchKeyword = value || "";

  // clear previous debounce
  if (Viewer._searchDebounceTimer) {
    clearTimeout(Viewer._searchDebounceTimer);
  }

  // debounce render
  Viewer._searchDebounceTimer = setTimeout(() => {
    Viewer._renderList();
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
   🔧 STEP B — SEARCH AUTO CLOSE (SAFE TAP ONLY)
   - ❌ no scroll close
   - ✅ close only when tap header background
====================================================== */

Viewer._bindSearchAutoClose = function () {
  const header = document.getElementById("appHeader");
  if (!header) return;

  Viewer._onSearchTapHeader = function (e) {
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
  Viewer._bindProductCardClick(); // 🔴 ADD
  Viewer.bindHeaderSearch(); // 🔴 ADD
};

/* ======================================================
   PRODUCT CARD INTERACTION
   - central dispatcher
====================================================== */

Viewer._bindProductCardClick = function () {
  const app = document.getElementById("app");
  if (!app) return;

  // 🔒 guard กัน bind ซ้ำ
  if (app._productCardBound) return;
  app._productCardBound = true;

  app.addEventListener("click", function (e) {

    // 🔒 GUARD: block interaction when overlay is open
    if (Viewer._isOverlayOpen()) return;

    const card = e.target.closest(".product-card");
    if (!card) return;

    const productId = card.dataset.productId;
    if (!productId) return;

    const product = Core.state.viewer.products.find(
      p => p.productId === productId
    );
    if (!product) return;

    Viewer.openProduct(product);
  });
 };

/* ======================================================
   OVERLAY GUARD
   - prevent click-through when overlay is open
====================================================== */

Viewer._isOverlayOpen = function () {
  return (
    Array.isArray(Core.state.ui.overlays) &&
    Core.state.ui.overlays.length > 0
  );
};

/* ======================================================
   PRODUCT DETAIL ENTRY
====================================================== */

Viewer.openProduct = function (product) {
  if (!product) return;

  Core.state.viewer.activeProduct = product;

  UI.openOverlay("product-detail"); // overlay id ที่คุณจะใช้
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
    // 🔧 FIX 2 — sync ค่าเพียงครั้งเดียว (ไม่เขียนทับตอนพิมพ์)
    if (input.value !== Viewer._searchKeyword) {
      input.value = Viewer._searchKeyword;
    }

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




