/* ======================================================
   V5 INIT
   - App Bootstrap
   - Start Viewer Immediately
====================================================== */

(function () {
  /* ====================================================
     INIT GUARD
     🔍 keyword: INIT GUARD
  ==================================================== */

  if (!window.Core) {
    console.error("[INIT] Core not found");
    return;
  }
  if (!window.API) {
    console.error("[INIT] API not found");
    return;
  }
  if (!window.UI) {
    console.error("[INIT] UI not found");
    return;
  }
  if (!window.Render) {
    console.error("[INIT] Render not found");
    return;
  }
  if (!window.Viewer) {
    console.error("[INIT] Viewer not found");
    return;
  }

/* ====================================================
   APP START
   🔍 keyword: APP BOOTSTRAP
==================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    if (Core.config.debug) {
      console.log("[INIT] StockBuilder V5 starting...");
    }

    // เข้า Viewer ทันที (Canonical Entry)
    await Viewer.enter();

  } catch (err) {
    console.error("[INIT] Fatal error", err);
    UI.showToast("ระบบไม่พร้อมใช้งาน", "error");
  }
});

})();
