/* ======================================================
   V5 UI SKELETON
   - Toast
   - Loading
   - Overlay Stack
   ❌ No business logic
   ❌ No viewer/admin dependency
====================================================== */

window.UI = {};

/* ======================================================
   INTERNAL GUARDS
   🔍 keyword: UI GUARDS
====================================================== */

UI._isLoading = false;

/* ======================================================
   TOAST SYSTEM (SKELETON)
   🔍 keyword: UI.TOAST
====================================================== */

UI.showToast = function (message = "", type = "info", timeout = 2500) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // limit count
  if (container.children.length > 3) {
    container.removeChild(container.firstChild);
  }

  setTimeout(() => {
    toast.remove();
  }, timeout);
};

/* ======================================================
   LOADING OVERLAY (SKELETON)
   🔍 keyword: UI.LOADING
====================================================== */

UI.showLoading = function (text = "กำลังโหลด...") {
  if (UI._isLoading) return;

  const overlay = document.getElementById("loadingOverlay");
  const label = document.getElementById("loadingText");

  if (!overlay || !label) return;

  label.textContent = text;
  overlay.classList.remove("hidden");

  UI._isLoading = true;
  Core.state.ui.loading = true;
};

UI.hideLoading = function () {
  const overlay = document.getElementById("loadingOverlay");
  if (!overlay) return;

  overlay.classList.add("hidden");

  UI._isLoading = false;
  Core.state.ui.loading = false;
};

/* ======================================================
   OVERLAY STACK SYSTEM (SKELETON)
   🔍 keyword: UI.OVERLAY STACK
====================================================== */

UI.openOverlay = function (overlayId) {
  const el = document.getElementById(overlayId);
  if (!el) return;

  if (!Core.state.ui.overlays.includes(overlayId)) {
    Core.state.ui.overlays.push(overlayId);
  }

  el.classList.add("show");
  el.classList.remove("hidden");

  UI._syncBackdrop();
};

UI.closeOverlay = function (overlayId) {
  const el = document.getElementById(overlayId);
  if (!el) return;

  el.classList.remove("show");
  el.classList.add("hidden");

  Core.state.ui.overlays =
    Core.state.ui.overlays.filter(id => id !== overlayId);

  UI._syncBackdrop();
};

UI.closeTopOverlay = function () {
  const stack = Core.state.ui.overlays;
  if (!stack.length) return;

  const topId = stack[stack.length - 1];
  UI.closeOverlay(topId);
};

/* ======================================================
   BACKDROP SYNC
   🔍 keyword: UI BACKDROP
====================================================== */

UI._syncBackdrop = function () {
  const backdrop = document.getElementById("globalBackdrop");
  if (!backdrop) return;

  if (Core.state.ui.overlays.length > 0) {
    backdrop.classList.remove("hidden");
    backdrop.onclick = UI.closeTopOverlay;
  } else {
    backdrop.classList.add("hidden");
    backdrop.onclick = null;
  }
};

/* ======================================================
   HEADER SEARCH STATE (V5)
   - No local state
   - Use body.search-open only
====================================================== */

UI.openHeaderSearch = function () {
  // 🔓 OPEN SEARCH
  document.body.classList.add("search-open");

  // focus input หลัง viewer render
  setTimeout(() => {
    const input = document.querySelector(".search-input");
    if (input) input.focus();
  }, 0);
};

UI.closeHeaderSearch = function () {
  // 🔒 CLOSE SEARCH
  document.body.classList.remove("search-open");
};

/**
 * Bind search header buttons
 * ต้องเรียกหลัง Render.shopHeader()
 */
UI.bindHeaderSearch = function () {
  const header = document.getElementById("appHeader");
  if (!header) return;

  const toggleBtn = header.querySelector("#searchToggleBtn");
  if (!toggleBtn) return;

  toggleBtn.onclick = function () {
    const isOpen = document.body.classList.contains("search-open");

    if (isOpen) {
      // 🔒 CLOSE SEARCH
      document.body.classList.remove("search-open");

      if (typeof Viewer !== "undefined") {
        Viewer._searchKeyword = "";
        Viewer._renderList();
      }

    } else {
      // 🔓 OPEN SEARCH
      document.body.classList.add("search-open");

      if (typeof Viewer !== "undefined") {
        Viewer._renderList();
      }

      // focus input หลัง render
      setTimeout(() => {
        const input = document.querySelector(".search-input");
        if (input) input.focus();
      }, 0);
    }
  };
};


