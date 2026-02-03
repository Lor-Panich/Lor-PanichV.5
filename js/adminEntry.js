/* ======================================================
   Admin Hidden Entry
   - Tap Anywhere 5 times
   - Guarded
   - iOS-safe
====================================================== */

window.AdminEntry = (() => {
  console.log('[AdminEntry] loaded')
  const REQUIRED_TAPS = 5
  const WINDOW_MS = 2000
  const COOLDOWN_MS = 20000

  let tapCount = 0
  let lastTapTime = 0
  let cooldownUntil = 0
  let active = false

  function isCooldown() {
    return Date.now() < cooldownUntil
  }

  function reset() {
    tapCount = 0
    lastTapTime = 0
  }

  /* ---------- Guard Conditions ---------- */

  function isHomePage() {
    // ปรับตาม routing ของคุณ
   if (!window.Core || !Core.state) return false
   return !Core.state.view || Core.state.view === 'home'
  }

  function isBlockedTarget(target) {
    return !!target.closest('button, a, input, textarea, select')
  }

  function isOverlayOpen() {
    return Core.state.modalOpen || Core.state.sheetOpen
  }

  function canRegisterTap(e) {
    if (isCooldown()) return false
    if (!isHomePage()) return false
    if (isOverlayOpen()) return false
    if (isBlockedTarget(e.target)) return false
    return true
  }

  /* ---------- Tap Logic ---------- */

  function handleTap(e) {
    console.log('[AdminEntry] tap detected', e.target)
    if (!canRegisterTap(e)) {
   console.warn('[AdminEntry] blocked', {
     cooldown: isCooldown(),
     home: isHomePage(),
     overlay: isOverlayOpen(),
     blockedTarget: isBlockedTarget(e.target),
     view: Core?.state?.view
   })
   return
 }

    const now = Date.now()

    if (now - lastTapTime <= WINDOW_MS) {
      tapCount++
    } else {
      tapCount = 1
    }

    lastTapTime = now

    if (tapCount === REQUIRED_TAPS) {
      trigger()
    }
  }

  function trigger() {
  reset()
  cooldownUntil = Date.now() + COOLDOWN_MS

  console.info('[AdminEntry] Triggered')

  // 🔑 STOP listening immediately after trigger
  unmount()

  if (window.UI?.openAdminLogin) {
    UI.openAdminLogin()
  } else {
    console.warn('[AdminEntry] UI.openAdminLogin not found')
  }
 }

  /* ---------- Lifecycle ---------- */

  function mount() {
    if (active) return
    active = true
    console.log('[AdminEntry] mounted') 
    document.addEventListener('click', handleTap, true)
  }

  function unmount() {
    if (!active) return
    active = false
    document.removeEventListener('click', handleTap, true)
    reset()
  }

  return {
    mount,
    unmount
  }
})()

// auto-mount on load (safe)
window.AdminEntry.mount()
