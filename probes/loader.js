(() => ({
  passage: window.State?.passage ?? null,
  modCenter: Boolean(window.DoLModCenter),
  modCenterNext: Boolean(window.DMCNext),
  modCenterStorage: Boolean(window.DMCStorage),
  loaderGui: Boolean(window.modLoaderGui),
  loaderController: Boolean(window.modModLoadController),
  dataManager: Boolean(window.modSC2DataManager),
  modUtils: Boolean(window.modUtils),
  loaderKeys: Object.keys(window.modModLoadController ?? {}).slice(0, 30),
  dataManagerKeys: Object.keys(window.modSC2DataManager ?? {}).slice(0, 30),
}))()
