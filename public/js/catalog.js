/**
 * VELOCITY — Модуль каталога, фильтрации, поиска и сортировки (catalog.js)
 * Строит карточки товаров через безопасные DOM-методы (createElement / textContent).
 */
(function (global) {
  'use strict';

  const VelocityApp = (global.VelocityApp = global.VelocityApp || {});
  const Products = VelocityApp.Products;
  const Favorites = VelocityApp.Favorites;

  const DEFAULT_STATE = {
    search: '',
    category: 'all',
    brand: 'all',
    gender: 'all',
    minPrice: null,
    maxPrice: null,
    size: null,
    onlyDiscount: false,
    onlyNew: false,
    sortBy: 'popular'
  };

  const state = Object.assign({}, DEFAULT_STATE);

  /**
   * Создаёт безопасную SVG-иконку сердца для кнопки избранного
   */
  function createHeartSvg() {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute(
      'd',
      'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'
    );
    svg.appendChild(path);
    return svg;
  }

  /**
   * Заменяет недоступное изображение аккуратной векторной студийной заглушкой
   */
  function applyImageFallback(imgEl, product) {
    const wrapper = imgEl.parentElement;
    if (!wrapper || wrapper.querySelector('.product-img-fallback')) return;

    imgEl.style.display = 'none';
    const fallback = document.createElement('div');
    fallback.className = 'product-img-fallback';

    const codeSpan = document.createElement('span');
    codeSpan.className = 'product-img-fallback__code';
    codeSpan.textContent = (product && product.code) || 'VELOCITY';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'product-img-fallback__title';
    titleSpan.textContent = (product && product.name) || 'Изображение недоступно';

    const subSpan = document.createElement('span');
    subSpan.className = 'product-img-fallback__sub';
    subSpan.textContent = 'Студийная визуализация пары';

    fallback.appendChild(codeSpan);
    fallback.appendChild(titleSpan);
    fallback.appendChild(subSpan);
    wrapper.appendChild(fallback);
  }

  /**
   * Нормализует поисковый запрос: убирает лишние пробелы и переводит в нижний регистр
   */
  function normalizeQuery(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  /**
   * Применяет все активные фильтры и поиск к массиву товаров
   */
  function getFilteredAndSortedProducts() {
    const all = Products.getAll();
    const query = normalizeQuery(state.search);

    const filtered = all.filter(function (item) {
      // 1. Категория
      if (state.category !== 'all' && item.category !== state.category) {
        return false;
      }

      // 2. Бренд / линейка
      if (state.brand !== 'all' && item.brand !== state.brand) {
        return false;
      }

      // 3. Пол / коллекция (мужские или женские включают и унисекс-модели)
      if (state.gender === 'мужские' && item.gender !== 'мужские' && item.gender !== 'унисекс') {
        return false;
      }
      if (state.gender === 'женские' && item.gender !== 'женские' && item.gender !== 'унисекс') {
        return false;
      }

      // 4. Минимальная и максимальная цена
      if (state.minPrice !== null && Number.isFinite(state.minPrice) && item.price < state.minPrice) {
        return false;
      }
      if (state.maxPrice !== null && Number.isFinite(state.maxPrice) && item.price > state.maxPrice) {
        return false;
      }

      // 5. Размер
      if (state.size !== null && Number.isInteger(state.size)) {
        if (!Array.isArray(item.sizes) || item.sizes.indexOf(state.size) === -1) {
          return false;
        }
      }

      // 6. Наличие скидки
      if (state.onlyDiscount) {
        if (!item.oldPrice || item.oldPrice <= item.price) {
          return false;
        }
      }

      // 7. Только новинки
      if (state.onlyNew && !item.isNew) {
        return false;
      }

      // 8. Поиск по названию, категории, бренду, цвету и описанию
      if (query.length > 0) {
        const haystack = [
          item.name,
          item.category,
          item.categoryLabel,
          item.brand,
          item.color,
          item.description,
          item.specs
        ]
          .join(' ')
          .toLowerCase();

        const words = query.split(' ');
        for (let i = 0; i < words.length; i++) {
          if (haystack.indexOf(words[i]) === -1) {
            return false;
          }
        }
      }

      return true;
    });

    // Сортировка результатов фильтрации
    filtered.sort(function (a, b) {
      switch (state.sortBy) {
        case 'new':
          if (Boolean(b.isNew) !== Boolean(a.isNew)) {
            return b.isNew ? 1 : -1;
          }
          return b.popularity - a.popularity;
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return a.name.localeCompare(b.name, 'ru');
        case 'discount-desc': {
          const discA = Products.getDiscountPercent(a.price, a.oldPrice);
          const discB = Products.getDiscountPercent(b.price, b.oldPrice);
          if (discB !== discA) return discB - discA;
          return a.price - b.price;
        }
        case 'popular':
        default:
          return b.popularity - a.popularity;
      }
    });

    return filtered;
  }

  /**
   * Строит DOM-элемент карточки товара
   */
  function createProductCard(product) {
    const article = document.createElement('article');
    article.className = 'product-card';
    article.setAttribute('data-product-id', product.id);

    // Верхняя зона медиа
    const mediaBox = document.createElement('div');
    mediaBox.className = 'product-card__media';

    // Кнопка открытия быстрого просмотра по клику на фото
    const imgTrigger = document.createElement('button');
    imgTrigger.type = 'button';
    imgTrigger.className = 'product-card__image-btn';
    imgTrigger.setAttribute('data-action', 'quick-view');
    imgTrigger.setAttribute('data-product-id', product.id);
    imgTrigger.setAttribute('aria-label', 'Быстрый просмотр кроссовок ' + product.name);

    const img = document.createElement('img');
    img.className = 'product-card__img';
    img.src = product.image;
    img.alt = 'Кроссовки ' + product.name + ' — цвет ' + product.color;
    img.loading = 'lazy';
    img.width = 400;
    img.height = 280;
    img.addEventListener('error', function () {
      applyImageFallback(img, product);
    });
    imgTrigger.appendChild(img);
    mediaBox.appendChild(imgTrigger);

    // Текстовая отметка (Новинка / Хит / Sale + скидка)
    const discountPercent = Products.getDiscountPercent(product.price, product.oldPrice);
    if (product.badge || discountPercent > 0) {
      const statusLine = document.createElement('div');
      statusLine.className = 'product-card__status';
      if (product.badge) {
        const badgeText = document.createElement('span');
        badgeText.className =
          product.badge === 'Sale'
            ? 'product-card__tag product-card__tag--accent'
            : 'product-card__tag';
        badgeText.textContent = product.badge;
        statusLine.appendChild(badgeText);
      }
      if (discountPercent > 0) {
        if (product.badge) {
          const sep = document.createElement('span');
          sep.className = 'product-card__sep';
          sep.setAttribute('aria-hidden', 'true');
          sep.textContent = '·';
          statusLine.appendChild(sep);
        }
        const discSpan = document.createElement('span');
        discSpan.className = 'product-card__discount';
        discSpan.textContent = '−' + discountPercent + '%';
        statusLine.appendChild(discSpan);
      }
      mediaBox.appendChild(statusLine);
    }

    // Кнопка избранного (отдельно от кнопки фото, чтобы не открывать модальное окно)
    const isFav = Favorites.has(product.id);
    const favBtn = document.createElement('button');
    favBtn.type = 'button';
    favBtn.className = 'product-card__fav-btn' + (isFav ? ' is-active' : '');
    favBtn.setAttribute('data-action', 'toggle-favorite');
    favBtn.setAttribute('data-product-id', product.id);
    favBtn.setAttribute('aria-pressed', isFav ? 'true' : 'false');
    favBtn.setAttribute(
      'aria-label',
      (isFav ? 'Удалить из избранного: ' : 'Добавить в избранное: ') + product.name
    );
    favBtn.appendChild(createHeartSvg());
    mediaBox.appendChild(favBtn);

    article.appendChild(mediaBox);

    // Тело карточки
    const body = document.createElement('div');
    body.className = 'product-card__body';

    // Метаданные без капсул (Zero-Pill Discipline)
    const meta = document.createElement('div');
    meta.className = 'product-card__meta';
    const brandSpan = document.createElement('span');
    brandSpan.textContent = product.brand;
    const dotSpan = document.createElement('span');
    dotSpan.setAttribute('aria-hidden', 'true');
    dotSpan.textContent = '·';
    const catSpan = document.createElement('span');
    catSpan.textContent = product.categoryLabel;
    meta.appendChild(brandSpan);
    meta.appendChild(dotSpan);
    meta.appendChild(catSpan);
    body.appendChild(meta);

    // Название модели
    const title = document.createElement('h3');
    title.className = 'product-card__title';
    const titleBtn = document.createElement('button');
    titleBtn.type = 'button';
    titleBtn.className = 'product-card__title-btn';
    titleBtn.setAttribute('data-action', 'quick-view');
    titleBtn.setAttribute('data-product-id', product.id);
    titleBtn.textContent = product.name;
    title.appendChild(titleBtn);
    body.appendChild(title);

    // Цвет и размеры
    const colorP = document.createElement('p');
    colorP.className = 'product-card__color';
    colorP.textContent = product.color;
    body.appendChild(colorP);

    const sizesP = document.createElement('p');
    sizesP.className = 'product-card__sizes';
    sizesP.textContent = 'Размеры EU: ' + product.sizes.join(', ');
    body.appendChild(sizesP);

    // Блок цены и кнопок действий
    const bottom = document.createElement('div');
    bottom.className = 'product-card__bottom';

    const priceWrap = document.createElement('div');
    priceWrap.className = 'product-card__price-wrap';

    const currentPrice = document.createElement('span');
    currentPrice.className = 'product-card__price';
    currentPrice.textContent = Products.formatPrice(product.price);
    priceWrap.appendChild(currentPrice);

    if (product.oldPrice && product.oldPrice > product.price) {
      const oldPrice = document.createElement('span');
      oldPrice.className = 'product-card__old-price';
      oldPrice.textContent = Products.formatPrice(product.oldPrice);
      priceWrap.appendChild(oldPrice);
    }

    bottom.appendChild(priceWrap);

    const actionsRow = document.createElement('div');
    actionsRow.className = 'product-card__actions';

    const quickBtn = document.createElement('button');
    quickBtn.type = 'button';
    quickBtn.className = 'btn btn--ghost btn--sm product-card__quick-btn';
    quickBtn.setAttribute('data-action', 'quick-view');
    quickBtn.setAttribute('data-product-id', product.id);
    quickBtn.textContent = 'Быстрый просмотр';

    const selectBtn = document.createElement('button');
    selectBtn.type = 'button';
    selectBtn.className = 'btn btn--primary btn--sm product-card__select-btn';
    selectBtn.setAttribute('data-action', 'quick-view');
    selectBtn.setAttribute('data-product-id', product.id);
    selectBtn.textContent = 'Выбрать размер';

    actionsRow.appendChild(quickBtn);
    actionsRow.appendChild(selectBtn);
    bottom.appendChild(actionsRow);

    body.appendChild(bottom);
    article.appendChild(body);

    return article;
  }

  /**
   * Подсчитывает число активных фильтров для индикатора
   */
  function getActiveFilterCount() {
    let count = 0;
    if (normalizeQuery(state.search).length > 0) count++;
    if (state.category !== 'all') count++;
    if (state.brand !== 'all') count++;
    if (state.gender !== 'all') count++;
    if (state.minPrice !== null) count++;
    if (state.maxPrice !== null) count++;
    if (state.size !== null) count++;
    if (state.onlyDiscount) count++;
    if (state.onlyNew) count++;
    return count;
  }

  /**
   * Отрисовывает сетку каталога, счётчик и состояние «Ничего не найдено»
   */
  function render() {
    const gridEl = document.getElementById('catalog-grid');
    const countEl = document.getElementById('catalog-count');
    const emptyEl = document.getElementById('catalog-empty');
    const clearSearchBtn = document.getElementById('search-clear-btn');
    const mobileFilterCount = document.getElementById('mobile-filter-count');

    if (!gridEl) return;

    const results = getFilteredAndSortedProducts();

    // Обновляем счётчик найденных моделей
    if (countEl) {
      const word = Products.pluralize(results.length, ['модель', 'модели', 'моделей']);
      countEl.textContent = 'Найдено: ' + results.length + ' ' + word;
    }

    // Показываем/скрываем кнопку очистки поиска
    if (clearSearchBtn) {
      clearSearchBtn.hidden = state.search.trim().length === 0;
    }

    // Обновляем счётчик активных фильтров на мобильной кнопке
    const activeCount = getActiveFilterCount();
    if (mobileFilterCount) {
      mobileFilterCount.textContent = activeCount > 0 ? '(' + activeCount + ')' : '';
    }

    // Очищаем контейнер сетки
    while (gridEl.firstChild) {
      gridEl.removeChild(gridEl.firstChild);
    }

    if (results.length === 0) {
      gridEl.hidden = true;
      if (emptyEl) emptyEl.hidden = false;
      return;
    }

    gridEl.hidden = false;
    if (emptyEl) emptyEl.hidden = true;

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < results.length; i++) {
      fragment.appendChild(createProductCard(results[i]));
    }
    gridEl.appendChild(fragment);
  }

  /**
   * Синхронизирует состояние кнопок избранного на всех карточках без полной перерисовки
   */
  function syncFavoriteButtons() {
    const buttons = document.querySelectorAll('[data-action="toggle-favorite"]');
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const productId = btn.getAttribute('data-product-id');
      const product = Products.getById(productId);
      const active = Favorites.has(productId);
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (product) {
        btn.setAttribute(
          'aria-label',
          (active ? 'Удалить из избранного: ' : 'Добавить в избранное: ') + product.name
        );
      }
    }
  }

  /**
   * Синхронизирует DOM-контролы фильтров с объектом state
   */
  function syncFilterControlsToState() {
    const searchInput = document.getElementById('catalog-search');
    if (searchInput && searchInput.value !== state.search) {
      searchInput.value = state.search;
    }

    const catButtons = document.querySelectorAll('[data-filter-category]');
    for (let i = 0; i < catButtons.length; i++) {
      const btn = catButtons[i];
      const val = btn.getAttribute('data-filter-category');
      const isActive = val === state.category;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }

    const genderButtons = document.querySelectorAll('[data-filter-gender]');
    for (let i = 0; i < genderButtons.length; i++) {
      const btn = genderButtons[i];
      const val = btn.getAttribute('data-filter-gender');
      const isActive = val === state.gender;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }

    const brandSelect = document.getElementById('filter-brand');
    if (brandSelect) brandSelect.value = state.brand;

    const sortSelect = document.getElementById('catalog-sort');
    if (sortSelect) sortSelect.value = state.sortBy;

    const minPriceInput = document.getElementById('filter-min-price');
    if (minPriceInput) {
      minPriceInput.value = state.minPrice !== null ? String(state.minPrice) : '';
    }

    const maxPriceInput = document.getElementById('filter-max-price');
    if (maxPriceInput) {
      maxPriceInput.value = state.maxPrice !== null ? String(state.maxPrice) : '';
    }

    const sizeButtons = document.querySelectorAll('[data-filter-size]');
    for (let i = 0; i < sizeButtons.length; i++) {
      const btn = sizeButtons[i];
      const val = Number(btn.getAttribute('data-filter-size'));
      const isActive = state.size === val;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }

    const discountCheckbox = document.getElementById('filter-discount');
    if (discountCheckbox) discountCheckbox.checked = Boolean(state.onlyDiscount);

    const newCheckbox = document.getElementById('filter-new');
    if (newCheckbox) newCheckbox.checked = Boolean(state.onlyNew);
  }

  function setFilter(patch) {
    Object.assign(state, patch);
    syncFilterControlsToState();
    render();
  }

  function resetFilters() {
    Object.assign(state, DEFAULT_STATE);
    syncFilterControlsToState();
    render();
  }

  function getState() {
    return Object.assign({}, state);
  }

  VelocityApp.Catalog = {
    render: render,
    setFilter: setFilter,
    resetFilters: resetFilters,
    getState: getState,
    syncFavoriteButtons: syncFavoriteButtons,
    applyImageFallback: applyImageFallback
  };
})(window);
