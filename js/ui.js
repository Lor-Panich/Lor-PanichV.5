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
====================================================== */

UI._isLoading = false;

/* ======================================================
   TOAST SYSTEM
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
   LOADING OVERLAY
   - UI ONLY
   - ❌ No Core.state mutation
====================================================== */

UI.showLoading = function (text = "กำลังโหลด...") {
  if (UI._isLoading) return;

  const overlay = document.getElementById("loadingOverlay");
  const label = document.getElementById("loadingText");

  if (!overlay || !label) return;

  label.textContent = text;
  overlay.classList.remove("hidden");

  UI._isLoading = true;
};

UI.hideLoading = function () {
  if (!UI._isLoading) return;

  const overlay = document.getElementById("loadingOverlay");
  if (!overlay) return;

  overlay.classList.add("hidden");

  UI._isLoading = false;
};

/* ======================================================
   OVERLAY STACK SYSTEM
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

/* ======================================================
   CLOSE OVERLAY (SAFE / STACK-AWARE)
====================================================== */

UI.closeOverlay = function (overlayId) {
  const stack = Core.state.ui.overlays;

  // 🔒 Guard: overlay ต้องอยู่ใน stack เท่านั้น
  if (!stack.includes(overlayId)) return;

  const el = document.getElementById(overlayId);
  if (!el) return;

  el.classList.remove("show");
  el.classList.add("hidden");

  // 🔒 remove เฉพาะตัวที่มีอยู่จริง
  Core.state.ui.overlays = stack.filter(id => id !== overlayId);

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

