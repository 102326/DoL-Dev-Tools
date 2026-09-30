(() => {
  const tabs = [...document.querySelectorAll('#shopCategories .category-tab')];
  const active = tabs.find(tab => tab.classList.contains('active'));
  const selected = document.querySelector('.clothing-item.selected,.clothing-item.dgshop-selected');
  const ui = window.DoLGameUI;
  const experiment = window.DoLShopPageExperiment;
  return {
    passage: window.State?.passage ?? null,
    gameUI: ui?.version ?? null,
    experimentVersion: experiment?.version ?? null,
    experimentEnabled: experiment?.enabled ?? null,
    uiPreference: ui?.getPreferences?.().shopPageExperiment ?? null,
    activeCategory: active?.querySelector('img')?.getAttribute('src')?.split('/').pop() ?? null,
    shopLinks: [...document.querySelectorAll('#clothingShop-div a')].slice(0, 8).map(link => link.textContent?.trim().slice(0, 40)),
    settingTogglePresent: Boolean([...document.querySelectorAll('#dol-midnight-controls label')].find(label => label.textContent?.includes('商店按页生成'))),
    page: window.V?.shopPage ?? null,
    maxPage: window.T?.maxPage ?? null,
    search: document.querySelector('#textbox--shopnamefiltertextbox')?.value ?? null,
    selected: Boolean(selected || Object.prototype.hasOwnProperty.call(window.V ?? {}, 'clothes_choice')),
    pagesInDom: document.querySelectorAll('#shop-list-pages > .clothing-shop-page').length,
    cardsInDom: document.querySelectorAll('#shop-list-pages .clothing-item').length,
    listNodes: document.querySelector('#shop-list-pages')?.querySelectorAll('*').length ?? null,
    bodyErrors: document.querySelectorAll('.error').length,
  };
})()
