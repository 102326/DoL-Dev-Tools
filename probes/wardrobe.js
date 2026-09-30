(() => ({
  passage: window.passage?.() ?? window.State?.passage,
  gameUI: window.DoLGameUI?.version ?? null,
  wardrobeOpen: Boolean(document.querySelector('.dgw-shell')),
  performance: window.DoLWardrobeUI?.performance?.report?.() ?? null,
  selectedCategory: [...document.querySelectorAll('.dgw-slots button')]
    .find(button => button.getAttribute('aria-pressed') === 'true')?.textContent?.trim() ?? null,
  listItems: document.querySelectorAll('.dgw-items .dgw-item').length,
  errors: document.querySelectorAll('.error').length,
}))()
