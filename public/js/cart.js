/**
 * VELOCITY — Модуль управления корзиной (cart.js)
 * Каждая позиция определяется связкой (productId + size).
 * Итоговые суммы всегда рассчитываются динамически из актуального каталога products.js.
 */
(function (global) {
  'use strict';

  const VelocityApp = (global.VelocityApp = global.VelocityApp || {});
  const Storage = VelocityApp.Storage;
  const Products = VelocityApp.Products;

  const MAX_QUANTITY_PER_ITEM = 15;
  let cartEntries = [];
  const listeners = [];

  /**
   * Валидация и нормализация сохранённого массива позиций корзины
   */
  function sanitizeEntries(rawEntries) {
    if (!Array.isArray(rawEntries)) return [];
    const mergedMap = new Map();

    for (let i = 0; i < rawEntries.length; i++) {
      const entry = rawEntries[i];
      if (!entry || typeof entry !== 'object') continue;

      const productId = typeof entry.productId === 'string' ? entry.productId : '';
      const product = Products.getById(productId);
      if (!product) continue;

      const size = Number(entry.size);
      if (!Number.isInteger(size) || product.sizes.indexOf(size) === -1) continue;

      const rawQty = Number(entry.quantity);
      if (!Number.isFinite(rawQty) || rawQty < 1) continue;

      const quantity = Math.min(Math.floor(rawQty), MAX_QUANTITY_PER_ITEM);
      const key = productId + '__' + size;

      if (mergedMap.has(key)) {
        const existing = mergedMap.get(key);
        existing.quantity = Math.min(existing.quantity + quantity, MAX_QUANTITY_PER_ITEM);
      } else {
        mergedMap.set(key, {
          productId: productId,
          size: size,
          quantity: quantity
        });
      }
    }

    return Array.from(mergedMap.values());
  }

  function load() {
    const stored = Storage.read(Storage.KEYS.CART, [], Array.isArray);
    cartEntries = sanitizeEntries(stored);
    Storage.write(Storage.KEYS.CART, cartEntries);
  }

  function saveAndNotify() {
    Storage.write(Storage.KEYS.CART, cartEntries);
    const summary = getSummary();
    for (let i = 0; i < listeners.length; i++) {
      try {
        listeners[i](summary);
      } catch (e) {}
    }
  }

  /**
   * Добавляет товар с выбранным размером в корзину
   * @param {string} productId
   * @param {number} size
   * @param {number} [quantity=1]
   * @returns {{ ok: boolean, message: string }}
   */
  function addItem(productId, size, quantity) {
    const product = Products.getById(productId);
    if (!product) {
      return { ok: false, message: 'Товар не найден в каталоге.' };
    }

    const numericSize = Number(size);
    if (!Number.isInteger(numericSize) || product.sizes.indexOf(numericSize) === -1) {
      return { ok: false, message: 'Пожалуйста, выберите доступный размер перед добавлением в корзину.' };
    }

    const addQty = Math.max(1, Math.min(Math.floor(Number(quantity) || 1), MAX_QUANTITY_PER_ITEM));

    const existing = cartEntries.find(function (item) {
      return item.productId === productId && item.size === numericSize;
    });

    if (existing) {
      existing.quantity = Math.min(existing.quantity + addQty, MAX_QUANTITY_PER_ITEM);
    } else {
      cartEntries.push({
        productId: productId,
        size: numericSize,
        quantity: addQty
      });
    }

    saveAndNotify();
    return {
      ok: true,
      message: product.name + ' (размер EU ' + numericSize + ') добавлен в корзину.'
    };
  }

  /**
   * Изменяет количество позиции на дельту (+1 / -1)
   */
  function changeQuantity(productId, size, delta) {
    const numericSize = Number(size);
    const idx = cartEntries.findIndex(function (item) {
      return item.productId === productId && item.size === numericSize;
    });

    if (idx === -1) return;

    const nextQty = cartEntries[idx].quantity + Number(delta);
    if (nextQty <= 0) {
      cartEntries.splice(idx, 1);
    } else {
      cartEntries[idx].quantity = Math.min(nextQty, MAX_QUANTITY_PER_ITEM);
    }

    saveAndNotify();
  }

  /**
   * Удаляет конкретную позицию (модель + размер) из корзины
   */
  function removeItem(productId, size) {
    const numericSize = Number(size);
    const next = cartEntries.filter(function (item) {
      return !(item.productId === productId && item.size === numericSize);
    });
    if (next.length !== cartEntries.length) {
      cartEntries = next;
      saveAndNotify();
    }
  }

  /**
   * Полная очистка корзины
   */
  function clear() {
    cartEntries = [];
    saveAndNotify();
  }

  /**
   * Возвращает детальный расчёт корзины на основе цен из products.js
   */
  function getSummary() {
    const detailedItems = [];
    let totalCount = 0;
    let totalAmount = 0;
    let totalOldAmount = 0;
    let totalDiscount = 0;

    for (let i = 0; i < cartEntries.length; i++) {
      const entry = cartEntries[i];
      const product = Products.getById(entry.productId);
      if (!product) continue;

      const unitPrice = Number(product.price) || 0;
      const unitOldPrice =
        product.oldPrice && Number(product.oldPrice) > unitPrice
          ? Number(product.oldPrice)
          : unitPrice;
      const lineTotal = unitPrice * entry.quantity;
      const lineOldTotal = unitOldPrice * entry.quantity;
      const lineDiscount = lineOldTotal - lineTotal;

      totalCount += entry.quantity;
      totalAmount += lineTotal;
      totalOldAmount += lineOldTotal;
      totalDiscount += lineDiscount;

      detailedItems.push({
        key: entry.productId + '__' + entry.size,
        productId: entry.productId,
        size: entry.size,
        quantity: entry.quantity,
        product: product,
        unitPrice: unitPrice,
        unitOldPrice: product.oldPrice && Number(product.oldPrice) > unitPrice ? Number(product.oldPrice) : null,
        lineTotal: lineTotal,
        lineOldTotal: lineOldTotal
      });
    }

    return {
      items: detailedItems,
      totalCount: totalCount,
      totalAmount: totalAmount,
      totalOldAmount: totalOldAmount,
      totalDiscount: totalDiscount,
      isEmpty: detailedItems.length === 0
    };
  }

  function subscribe(fn) {
    if (typeof fn === 'function') {
      listeners.push(fn);
    }
  }

  load();

  VelocityApp.Cart = {
    addItem: addItem,
    changeQuantity: changeQuantity,
    removeItem: removeItem,
    clear: clear,
    getSummary: getSummary,
    subscribe: subscribe
  };
})(window);
