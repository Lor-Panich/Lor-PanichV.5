/* ======================================================
   Admin Hidden Entry
   - Tap Anywhere 5 times
   - Guarded
   - iOS-safe
====================================================== */

window.AdminEntry = (() => {
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
    if (!canRegisterTap(e)) return

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
