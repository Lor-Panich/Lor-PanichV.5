/* ======================================================
   V5 VIEWER FLOW
   - Skeleton + Real Flow
   - No Cart
   - Loading / Empty / Error ครบ
====================================================== */

window.Viewer = {};

/* ======================================================
   VIEWER ENTRY
   🔍 keyword: VIEWER INIT
====================================================== */

Viewer.init = async function () {
  // ตั้งโหมดแอป
  Core.state.mode = "viewer";

  // render โครงเริ่มต้น
  Viewer._renderLoading();

  // โหลดข้อมูลจริง
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

    // บังคับ type safety
    if (!Array.isArray(products)) {
      throw new Error("รูปแบบข้อมูลสินค้าไม่ถูกต้อง");
    }

    // เก็บลง state (viewer เท่านั้น)
    Core.state.viewer.products = products;

    UI.hideLoading();

    // ตัดสินใจ render
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

/* ---------- Loading ---------- */
Viewer._renderLoading = function () {
  Viewer._mount(
    Render.page({
      header: Render.header("รายการสินค้า"),
      content: Render.loading("กำลังเตรียมข้อมูล...")
    })
  );
};

/* ---------- Empty ---------- */
Viewer._renderEmpty = function () {
  Viewer._mount(
    Render.page({
      header: Render.header(
        "Lor-Panich",
        "สินค้าทั้งหมด • พร้อมขาย"
      ),
      content: Render.empty("ยังไม่มีสินค้าในระบบ")
    })
  );
};

/* ---------- Error ---------- */
Viewer._renderError = function (message) {
  UI.showToast(message, "error");

  Viewer._mount(
    Render.page({
      header: Render.header("เกิดข้อผิดพลาด"),
      content: Render.empty("ไม่สามารถโหลดข้อมูลได้")
    })
  );
};

/* ---------- Product List ---------- */
Viewer._renderList = function (products) {
  const itemsHTML = products.map(p => `
    <div class="product-card">
      <img
        class="product-thumb"
        src="${p.image || ""}"
        alt="${p.name || ""}"
      />

      <div class="product-info">
        <div class="product-name">
          ${p.name || "-"}
        </div>

        <div class="product-code">
          รหัส: ${p.productId || "-"}
        </div>

        <div class="product-price">
          ฿${p.price ?? 0}
        </div>

        <div class="product-meta">
          <span class="stock-text">
            คงเหลือ ${p.stock ?? 0}
          </span>
          <span class="badge-ready">
            พร้อมขาย
          </span>
        </div>
      </div>
    </div>
  `).join("");

  Viewer._mount(
    Render.page({
      header: Render.header(
        "Lor-Panich",
        "สินค้าทั้งหมด • พร้อมขาย"
      ),
      content: Render.list(itemsHTML)
    })
  );
};
