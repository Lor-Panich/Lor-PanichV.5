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
Viewer._selectedQty = 1;
Viewer._productStep = "idle"; 

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
   OVERLAY GUARD (TEMP DISABLED)
   - overlay state will be handled later
   - prevent tight coupling with UI layer
====================================================== */

Viewer._isOverlayOpen = function () {
  return UI._overlayStack.includes("productSheet")
      || UI._overlayStack.includes("qtySheet");
};

/* ======================================================
   PRODUCT DETAIL ENTRY (STEP 9.1)
====================================================== */

Viewer.openProduct = function (product) {
  if (!product) return;

  Viewer._selectedQty = 1;
  Viewer._productStep = "idle";

  Core.state.viewer.activeProduct = product;

  UI.openProductDetail(
    Render.productDetailSheet(product)
  );

  // 🔴 STEP 9.3 — bind Add to Cart (ENTER QTY STEP ONLY)
  UI.bindAddToCart(() => {
    Viewer.enterQtyStep();
  });
}; // ✅ ปิดตรงนี้

/* ======================================================
   STEP 9.2 — ENTER QTY STEP (MODAL VERSION)
====================================================== */

Viewer.enterQtyStep = function () {
  const product = Core.state.viewer.activeProduct;
  if (!product) return;

  // ❌ guard: สินค้าหมด
  if (product.stock <= 0) {
    UI.showToast("สินค้าหมด", "warning");
    return;
  }

  // ❌ guard: ไม่เข้า step ซ้ำ
  if (Viewer._productStep === "qty") return;

  // 🔑 set step + reset state
  Viewer._productStep = "qty";
  Viewer._selectedQty = 1;

  // 🔥 เปิด Qty Sheet / Modal
  UI.openQtyModal(
    Render.qtyModal(product)
  );

  // 🔑 bind qty interaction กับ modal root โดยตรง
  const qtyRoot = document.getElementById("qtySheet");
  if (!qtyRoot) return;

  // ✅ FIX 1: clear bind guard ทุกครั้งที่เปิด
  delete qtyRoot._qtyBound;

  // ✅ FIX 2: reset DOM qty value กัน state ค้าง
  const valueEl = qtyRoot.querySelector("[data-role='qty-value']");
  if (valueEl) valueEl.textContent = "1";

  UI.bindQtySelector(
    {
      onChange(qty) {
        Viewer._selectedQty = qty;
      },

      onConfirm() {
        // ✅ RESET step ทันที (สำคัญมาก)
        Viewer._productStep = "idle";

        Viewer.confirmQty();
        UI.closeQtyModal();
      },

      onCancel() {
        // ✅ RESET step
        Viewer._productStep = "idle";
        UI.closeQtyModal();
      }
    },
    qtyRoot
  );
};

Viewer.confirmQty = function () {
  const product = Core.state.viewer.activeProduct;
  const qty = Viewer._selectedQty;

  if (!product) return;

  if (qty <= 0 || qty > product.stock) {
    UI.showToast("จำนวนสินค้าไม่ถูกต้อง", "warning");
    return;
  }

  Viewer.addToCart(product, qty);

  UI.showToast(
    `เพิ่ม ${product.name} × ${qty} ลงตะกร้าแล้ว`,
    "success"
  );

  Viewer.closeProduct();
};

/* ======================================================
   STEP 9.4 — ADD TO CART (REAL IMPLEMENTATION)
   - mutate Core.state.cart ONLY
   - no UI here
====================================================== */

Viewer.addToCart = function (product, qty) {
  if (!product || qty <= 0) return;

  const cart = Core.state.cart;
  if (!cart || !Array.isArray(cart.items)) return;

  const productId = product.productId;

  // 🔍 หา item เดิมใน cart
  const existing = cart.items.find(
    it => it.productId === productId
  );

  if (existing) {
    // ✅ มีอยู่แล้ว → บวกจำนวน
    existing.qty += qty;
  } else {
    // ✅ ยังไม่มี → เพิ่มใหม่
    cart.items.push({
      productId: product.productId,
      name: product.name,
      price: product.price,
      qty: qty
    });
  }
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

/* ======================================================
   STEP 7.4 — CREATE ORDER (VIEWER ONLY)
   - API → State → Reset
   - Order = PENDING
   - No stock cut
====================================================== */

Viewer.createOrder = async function () {
  // 🔒 Guard: กันยิงซ้ำ
  if (Core.state.order.isSubmitting) return;

  const items = Core.state.cart.items;
  if (!Array.isArray(items) || items.length === 0) {
    UI.showToast("ตะกร้ายังไม่มีสินค้า", "warning");
    return;
  }

  Core.state.order.isSubmitting = true;
  UI.showLoading("กำลังสร้างใบสั่งซื้อ...");

  try {
    // 🔹 ส่งไป Backend (PENDING)
    const order = await API.createOrder(items);

    // 🔹 เก็บ order ล่าสุด
    Core.state.order.lastCreated = order;

    // 🔹 reset cart
    Core.resetCart();

    // 🔹 ปิด cart sheet
    UI.closeCart();

    // 🔹 feedback
    UI.showToast("สร้างใบสั่งซื้อเรียบร้อยแล้ว", "success");

  } catch (err) {
    console.error("[Viewer.createOrder]", err);

    UI.showToast(
      err.message || "ไม่สามารถสร้างใบสั่งซื้อได้",
      "error"
    );

  } finally {
    Core.state.order.isSubmitting = false;
    UI.hideLoading();
  }
};

/* ======================================================
   STEP 9.2 — CLOSE PRODUCT DETAIL
====================================================== */

Viewer.closeProduct = function () {
  Viewer._selectedQty = 1;
  Viewer._productStep = "idle";
  Core.state.viewer.activeProduct = null;
  UI.closeProductDetail();
};

