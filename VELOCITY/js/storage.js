/**
 * VELOCITY — Модуль безопасной работы с localStorage (storage.js)
 * Защищает приложение от повреждённого JSON, недоступности хранилища и некорректных типов.
 */
(function (global) {
  'use strict';

  const VelocityApp = (global.VelocityApp = global.VelocityApp || {});

  const STORAGE_VERSION = 'v1';
  const KEYS = {
    CART: 'velocity_cart_' + STORAGE_VERSION,
    FAVORITES: 'velocity_favorites_' + STORAGE_VERSION
  };

  // Резервное хранилище в памяти, если localStorage заблокирован браузером
  const memoryFallback = {};

  function isLocalStorageAvailable() {
    try {
      const testKey = '__velocity_test__';
      global.localStorage.setItem(testKey, '1');
      global.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  const canUseStorage = isLocalStorageAvailable();

  /**
   * Безопасное чтение и валидация данных из localStorage
   * @param {string} key
   * @param {*} defaultValue
   * @param {Function} [validator]
   * @returns {*}
   */
  function read(key, defaultValue, validator) {
    try {
      const raw = canUseStorage
        ? global.localStorage.getItem(key)
        : Object.prototype.hasOwnProperty.call(memoryFallback, key)
        ? memoryFallback[key]
        : null;

      if (raw === null || raw === undefined || raw === '') {
        return defaultValue;
      }

      const parsed = JSON.parse(raw);
      if (typeof validator === 'function') {
        return validator(parsed) ? parsed : defaultValue;
      }
      return parsed !== null && parsed !== undefined ? parsed : defaultValue;
    } catch (err) {
      // Если JSON повреждён вручную, сбрасываем повреждённый ключ и возвращаем значение по умолчанию
      try {
        if (canUseStorage) {
          global.localStorage.removeItem(key);
        } else {
          delete memoryFallback[key];
        }
      } catch (ignore) {}
      return defaultValue;
    }
  }

  /**
   * Безопасная запись данных в localStorage
   * @param {string} key
   * @param {*} value
   * @returns {boolean}
   */
  function write(key, value) {
    try {
      const serialized = JSON.stringify(value);
      if (canUseStorage) {
        global.localStorage.setItem(key, serialized);
      } else {
        memoryFallback[key] = serialized;
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Удаление ключа из хранилища
   * @param {string} key
   */
  function remove(key) {
    try {
      if (canUseStorage) {
        global.localStorage.removeItem(key);
      } else {
        delete memoryFallback[key];
      }
    } catch (err) {}
  }

  VelocityApp.Storage = {
    KEYS: KEYS,
    read: read,
    write: write,
    remove: remove
  };
})(window);
