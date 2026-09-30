(() => ({
  passage: window.State?.passage ?? null,
  gameUI: window.DoLGameUI?.version ?? null,
  shopUI: window.DoLShopUI ? {
    counts: window.DoLShopUI.getLifecycleCounts?.() ?? null,
    open: Boolean(document.querySelector('#clothingShop-div')),
    enabled: window.DoLShopUI.getEnabled?.() ?? null,
  } : null,
  cheatReboot: window.DoLCheatReboot?.version ?? null,
  modCenter: window.DoLModCenter?.version ?? null,
  viewport: [innerWidth, innerHeight],
  bodyErrors: document.querySelectorAll('.error').length,
}))()
