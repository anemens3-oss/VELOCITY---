/**
 * VELOCITY — Модуль управления избранным (favorites.js)
 * Сохраняет уникальные ID товаров в localStorage, исключает дубликаты и несуществующие модели.
 */
(function (global) {
  'use strict';

  const VelocityApp = (global.VelocityApp = global.VelocityApp || {});
  const Storage = VelocityApp.Storage;
  const Products = VelocityApp.Products;

  let favoriteIds = [];
  const listeners = [];

  function sanitizeIds(rawList) {
    if (!Array.isArray(rawList)) return [];
    const seen = new Set();
    const clean = [];
    for (let i = 0; i < rawList.length; i++) {
      const id = rawList[i];
      if (typeof id === 'string' && !seen.has(id) && Products.getById(id)) {
        seen.add(id);
        clean.push(id);
      }
    }
    return clean;
  }

  function load() {
    const stored = Storage.read(Storage.KEYS.FAVORITES, [], Array.isArray);
    favoriteIds = sanitizeIds(stored);
    // Перезаписываем очищенный список, если были удалены устаревшие или дублирующиеся ID
    Storage.write(Storage.KEYS.FAVORITES, favoriteIds);
  }

  function saveAndNotify() {
    Storage.write(Storage.KEYS.FAVORITES, favoriteIds);
    for (let i = 0; i < listeners.length; i++) {
      try {
        listeners[i](getItems(), favoriteIds.slice());
      } catch (e) {}
    }
  }

  function has(productId) {
    return favoriteIds.indexOf(productId) !== -1;
  }

  /**
   * Переключает состояние избранного для товара
   * @param {string} productId
   * @returns {boolean} true если добавлен, false если удалён
   */
  function toggle(productId) {
    if (!Products.getById(productId)) return false;
    const idx = favoriteIds.indexOf(productId);
    let added = false;
    if (idx === -1) {
      favoriteIds.push(productId);
      added = true;
    } else {
      favoriteIds.splice(idx, 1);
      added = false;
    }
    saveAndNotify();
    return added;
  }

  function remove(productId) {
    const idx = favoriteIds.indexOf(productId);
    if (idx !== -1) {
      favoriteIds.splice(idx, 1);
      saveAndNotify();
    }
  }

  function clear() {
    favoriteIds = [];
    saveAndNotify();
  }

  function getIds() {
    return favoriteIds.slice();
  }

  function getItems() {
    const result = [];
    for (let i = 0; i < favoriteIds.length; i++) {
      const product = Products.getById(favoriteIds[i]);
      if (product) result.push(product);
    }
    return result;
  }

  function getCount() {
    return favoriteIds.length;
  }

  function subscribe(fn) {
    if (typeof fn === 'function') {
      listeners.push(fn);
    }
  }

  load();

  VelocityApp.Favorites = {
    has: has,
    toggle: toggle,
    remove: remove,
    clear: clear,
    getIds: getIds,
    getItems: getItems,
    getCount: getCount,
    subscribe: subscribe
  };
})(window);
