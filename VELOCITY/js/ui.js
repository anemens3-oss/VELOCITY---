/**
 * VELOCITY — Модуль пользовательского интерфейса (ui.js)
 * Отвечает за модальные окна, боковые панели, мобильное меню, удержание фокуса и уведомления.
 */
(function (global) {
  'use strict';

  const VelocityApp = (global.VelocityApp = global.VelocityApp || {});
  const Products = VelocityApp.Products;
  const Cart = VelocityApp.Cart;
  const Favorites = VelocityApp.Favorites;
  const Catalog = VelocityApp.Catalog;

  let activeOverlayEl = null;
  let previousFocusedEl = null;
  let toastTimer = null;

  // Текущее состояние открытого окна быстрого просмотра
  let quickViewState = {
    productId: null,
    selectedSize: null,
    quantity: 1
  };

  const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]):not([hidden]), input:not([disabled]):not([hidden]), select:not([disabled]):not([hidden]), textarea:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"])';

  /**
   * Блокирует или восстанавливает прокрутку фоновой страницы
   */
  function setBodyScrollLocked(locked) {
    if (locked) {
      document.body.classList.add('is-scroll-locked');
    } else {
      document.body.classList.remove('is-scroll-locked');
    }
  }

  /**
   * Показывает ненавязчивое всплывающее уведомление (aria-live="polite")
   */
  function showToast(message, type) {
    const toastEl = document.getElementById('toast-notification');
    const toastText = document.getElementById('toast-message');
    if (!toastEl || !toastText) return;

    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    toastEl.className = 'toast is-visible' + (type === 'error' ? ' toast--error' : '');
    toastText.textContent = message;

    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 3400);
  }

  /**
   * Открывает модальное окно или боковую панель, закрывая предыдущее открытое окно
   */
  function openOverlay(overlayId, triggerEl) {
    const target = document.getElementById(overlayId);
    if (!target) return;

    // Закрываем мобильное меню, если оно было открыто
    closeMobileMenu();

    // Не допускаем наложения нескольких модальных окон поверх друг друга
    if (activeOverlayEl && activeOverlayEl !== target) {
      activeOverlayEl.hidden = true;
      activeOverlayEl.classList.remove('is-open');
      activeOverlayEl.setAttribute('aria-hidden', 'true');
    }

    previousFocusedEl = triggerEl || document.activeElement;
    activeOverlayEl = target;

    target.hidden = false;
    target.setAttribute('aria-hidden', 'false');
    // Запускаем CSS-переход
    requestAnimationFrame(function () {
      target.classList.add('is-open');
    });

    setBodyScrollLocked(true);

    // Переводим фокус внутрь открытого окна
    const closeBtn = target.querySelector('[data-overlay-close]');
    const firstFocusable = closeBtn || target.querySelector(FOCUSABLE_SELECTOR);
    if (firstFocusable && typeof firstFocusable.focus === 'function') {
      setTimeout(function () {
        firstFocusable.focus();
      }, 30);
    }
  }

  /**
   * Закрывает активное модальное окно или панель и возвращает фокус
   */
  function closeActiveOverlay() {
    if (!activeOverlayEl) return;

    const closingEl = activeOverlayEl;
    activeOverlayEl = null;

    closingEl.classList.remove('is-open');
    closingEl.setAttribute('aria-hidden', 'true');
    closingEl.hidden = true;

    setBodyScrollLocked(false);

    if (previousFocusedEl && typeof previousFocusedEl.focus === 'function') {
      try {
        previousFocusedEl.focus();
      } catch (e) {}
    }
    previousFocusedEl = null;
  }

  /**
   * Удержание клавиши Tab внутри открытого модального окна + закрытие по Escape
   */
  function handleGlobalKeydown(event) {
    if (event.key === 'Escape') {
      const mobileNav = document.getElementById('mobile-menu');
      if (mobileNav && !mobileNav.hidden) {
        event.preventDefault();
        closeMobileMenu(true);
        return;
      }
      if (activeOverlayEl) {
        event.preventDefault();
        closeActiveOverlay();
        return;
      }
    }

    if (event.key === 'Tab' && activeOverlayEl) {
      const focusables = Array.prototype.slice
        .call(activeOverlayEl.querySelectorAll(FOCUSABLE_SELECTOR))
        .filter(function (el) {
          return el.offsetParent !== null && !el.hidden;
        });

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  /**
   * Управление мобильным меню
   */
  function toggleMobileMenu() {
    const menuEl = document.getElementById('mobile-menu');
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    if (!menuEl || !toggleBtn) return;

    const isOpen = !menuEl.hidden;
    if (isOpen) {
      closeMobileMenu(true);
    } else {
      menuEl.hidden = false;
      toggleBtn.setAttribute('aria-expanded', 'true');
      toggleBtn.setAttribute('aria-label', 'Закрыть меню навигации');
      setBodyScrollLocked(true);
    }
  }

  function closeMobileMenu(restoreFocus) {
    const menuEl = document.getElementById('mobile-menu');
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    if (!menuEl || menuEl.hidden) return;

    menuEl.hidden = true;
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.setAttribute('aria-label', 'Открыть меню навигации');
      if (restoreFocus) {
        toggleBtn.focus();
      }
    }
    if (!activeOverlayEl) {
      setBodyScrollLocked(false);
    }
  }

  /**
   * Открывает модальное окно быстрого просмотра для выбранного товара
   */
  function openQuickView(productId, triggerEl) {
    const product = Products.getById(productId);
    if (!product) return;

    quickViewState = {
      productId: product.id,
      selectedSize: null,
      quantity: 1
    };

    const imgEl = document.getElementById('qv-image');
    const metaEl = document.getElementById('qv-meta');
    const titleEl = document.getElementById('qv-title');
    const colorEl = document.getElementById('qv-color');
    const specsEl = document.getElementById('qv-specs');
    const priceEl = document.getElementById('qv-price');
    const oldPriceEl = document.getElementById('qv-old-price');
    const discountEl = document.getElementById('qv-discount');
    const descEl = document.getElementById('qv-description');
    const sizesContainer = document.getElementById('qv-sizes');
    const qtyValueEl = document.getElementById('qv-qty-value');
    const feedbackEl = document.getElementById('qv-feedback');
    const favBtn = document.getElementById('qv-fav-btn');
    const favBtnText = document.getElementById('qv-fav-btn-text');

    if (imgEl) {
      const parent = imgEl.parentElement;
      const oldFallback = parent ? parent.querySelector('.product-img-fallback') : null;
      if (oldFallback) oldFallback.remove();
      imgEl.style.display = '';
      imgEl.src = product.image;
      imgEl.alt = 'Кроссовки ' + product.name + ' — ' + product.color;
      imgEl.onerror = function () {
        Catalog.applyImageFallback(imgEl, product);
      };
    }

    if (metaEl) {
      metaEl.textContent =
        product.brand +
        ' · ' +
        product.categoryLabel +
        (product.badge ? ' · ' + product.badge : '');
    }
    if (titleEl) titleEl.textContent = product.name;
    if (colorEl) colorEl.textContent = 'Цвет: ' + product.color;
    if (specsEl) specsEl.textContent = product.specs;
    if (priceEl) priceEl.textContent = Products.formatPrice(product.price);

    const discPercent = Products.getDiscountPercent(product.price, product.oldPrice);
    if (oldPriceEl) {
      if (product.oldPrice && product.oldPrice > product.price) {
        oldPriceEl.textContent = Products.formatPrice(product.oldPrice);
        oldPriceEl.hidden = false;
      } else {
        oldPriceEl.textContent = '';
        oldPriceEl.hidden = true;
      }
    }

    if (discountEl) {
      if (discPercent > 0) {
        discountEl.textContent = 'Скидка −' + discPercent + '%';
        discountEl.hidden = false;
      } else {
        discountEl.textContent = '';
        discountEl.hidden = true;
      }
    }

    if (descEl) descEl.textContent = product.description;
    if (qtyValueEl) qtyValueEl.textContent = '1';

    if (feedbackEl) {
      feedbackEl.textContent = '';
      feedbackEl.className = 'qv-feedback';
      feedbackEl.hidden = true;
    }

    // Отрисовываем кнопки размеров
    if (sizesContainer) {
      while (sizesContainer.firstChild) {
        sizesContainer.removeChild(sizesContainer.firstChild);
      }
      for (let i = 0; i < product.sizes.length; i++) {
        const sizeVal = product.sizes[i];
        const sizeBtn = document.createElement('button');
        sizeBtn.type = 'button';
        sizeBtn.className = 'size-option-btn';
        sizeBtn.setAttribute('data-qv-size', String(sizeVal));
        sizeBtn.setAttribute('aria-pressed', 'false');
        sizeBtn.textContent = String(sizeVal);
        sizesContainer.appendChild(sizeBtn);
      }
    }

    // Синхронизируем кнопку избранного в модальном окне
    syncQuickViewFavoriteButton(product.id, favBtn, favBtnText);

    openOverlay('quick-view-modal', triggerEl);
  }

  function syncQuickViewFavoriteButton(productId, favBtn, favBtnText) {
    const btn = favBtn || document.getElementById('qv-fav-btn');
    const txt = favBtnText || document.getElementById('qv-fav-btn-text');
    if (!btn || !productId) return;

    const isFav = Favorites.has(productId);
    btn.classList.toggle('is-active', isFav);
    btn.setAttribute('aria-pressed', isFav ? 'true' : 'false');
    if (txt) {
      txt.textContent = isFav ? 'В избранном' : 'В избранное';
    }
  }

  function selectQuickViewSize(sizeVal) {
    const numeric = Number(sizeVal);
    if (!Number.isInteger(numeric)) return;
    quickViewState.selectedSize = numeric;

    const buttons = document.querySelectorAll('[data-qv-size]');
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const active = Number(btn.getAttribute('data-qv-size')) === numeric;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }

    const feedbackEl = document.getElementById('qv-feedback');
    const sizesGroup = document.getElementById('qv-sizes-group');
    if (sizesGroup) sizesGroup.classList.remove('has-error');
    if (feedbackEl) {
      feedbackEl.hidden = true;
      feedbackEl.textContent = '';
    }
  }

  function changeQuickViewQuantity(delta) {
    const next = Math.max(1, Math.min(10, quickViewState.quantity + Number(delta)));
    quickViewState.quantity = next;
    const qtyValueEl = document.getElementById('qv-qty-value');
    if (qtyValueEl) {
      qtyValueEl.textContent = String(next);
    }
  }

  function submitQuickViewAddToCart() {
    const feedbackEl = document.getElementById('qv-feedback');
    const sizesGroup = document.getElementById('qv-sizes-group');

    if (!quickViewState.productId) return;

    // Обязательное правило: без выбранного размера добавление блокируется
    if (!quickViewState.selectedSize) {
      if (sizesGroup) sizesGroup.classList.add('has-error');
      if (feedbackEl) {
        feedbackEl.textContent =
          'Пожалуйста, выберите ваш размер EU перед добавлением кроссовок в корзину.';
        feedbackEl.className = 'qv-feedback qv-feedback--error';
        feedbackEl.hidden = false;
      }
      return;
    }

    const res = Cart.addItem(
      quickViewState.productId,
      quickViewState.selectedSize,
      quickViewState.quantity
    );

    if (feedbackEl) {
      feedbackEl.textContent = res.message;
      feedbackEl.className = res.ok
        ? 'qv-feedback qv-feedback--success'
        : 'qv-feedback qv-feedback--error';
      feedbackEl.hidden = false;
    }

    if (res.ok) {
      showToast(res.message, 'success');
    }
  }

  function getQuickViewState() {
    return Object.assign({}, quickViewState);
  }

  /**
   * Отрисовывает содержимое боковой панели корзины и обновляет счётчики в шапке
   */
  function renderCart(summary) {
    const data = summary || Cart.getSummary();
    const headerBadge = document.getElementById('header-cart-count');
    const drawerCount = document.getElementById('cart-drawer-count');
    const listEl = document.getElementById('cart-items-list');
    const emptyEl = document.getElementById('cart-empty-state');
    const footerEl = document.getElementById('cart-drawer-footer');
    const clearBtn = document.getElementById('cart-clear-btn');
    const totalUnitsEl = document.getElementById('cart-total-units');
    const totalDiscountRow = document.getElementById('cart-discount-row');
    const totalDiscountEl = document.getElementById('cart-total-discount');
    const totalAmountEl = document.getElementById('cart-total-amount');

    if (headerBadge) {
      headerBadge.textContent = String(data.totalCount);
      headerBadge.classList.remove('is-bumping');
      void headerBadge.offsetWidth;
      headerBadge.classList.add('is-bumping');
    }

    if (drawerCount) {
      const word = Products.pluralize(data.totalCount, ['товар', 'товара', 'товаров']);
      drawerCount.textContent = data.totalCount + ' ' + word;
    }

    if (clearBtn) {
      clearBtn.hidden = data.isEmpty;
    }

    if (!listEl) return;

    while (listEl.firstChild) {
      listEl.removeChild(listEl.firstChild);
    }

    if (data.isEmpty) {
      listEl.hidden = true;
      if (emptyEl) emptyEl.hidden = false;
      if (footerEl) footerEl.hidden = true;
      return;
    }

    listEl.hidden = false;
    if (emptyEl) emptyEl.hidden = true;
    if (footerEl) footerEl.hidden = false;

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const li = document.createElement('li');
      li.className = 'drawer-item';

      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'drawer-item__thumb';
      const img = document.createElement('img');
      img.src = item.product.image;
      img.alt = item.product.name;
      img.width = 96;
      img.height = 68;
      img.addEventListener('error', function () {
        Catalog.applyImageFallback(img, item.product);
      });
      thumbWrap.appendChild(img);
      li.appendChild(thumbWrap);

      const info = document.createElement('div');
      info.className = 'drawer-item__info';

      const topRow = document.createElement('div');
      topRow.className = 'drawer-item__top';

      const title = document.createElement('h4');
      title.className = 'drawer-item__title';
      title.textContent = item.product.name;
      topRow.appendChild(title);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'drawer-item__remove';
      removeBtn.setAttribute('data-action', 'cart-remove');
      removeBtn.setAttribute('data-product-id', item.productId);
      removeBtn.setAttribute('data-size', String(item.size));
      removeBtn.setAttribute(
        'aria-label',
        'Удалить ' + item.product.name + ' размер ' + item.size + ' из корзины'
      );
      removeBtn.textContent = 'Удалить';
      topRow.appendChild(removeBtn);

      info.appendChild(topRow);

      const meta = document.createElement('p');
      meta.className = 'drawer-item__meta';
      meta.textContent =
        'Размер EU: ' +
        item.size +
        ' · Цена за 1 шт.: ' +
        Products.formatPrice(item.unitPrice);
      info.appendChild(meta);

      const controlsRow = document.createElement('div');
      controlsRow.className = 'drawer-item__controls';

      const stepper = document.createElement('div');
      stepper.className = 'qty-stepper';

      const decBtn = document.createElement('button');
      decBtn.type = 'button';
      decBtn.className = 'qty-stepper__btn';
      decBtn.setAttribute('data-action', 'cart-dec');
      decBtn.setAttribute('data-product-id', item.productId);
      decBtn.setAttribute('data-size', String(item.size));
      decBtn.setAttribute('aria-label', 'Уменьшить количество ' + item.product.name);
      decBtn.textContent = '−';

      const qtySpan = document.createElement('span');
      qtySpan.className = 'qty-stepper__val';
      qtySpan.textContent = String(item.quantity);

      const incBtn = document.createElement('button');
      incBtn.type = 'button';
      incBtn.className = 'qty-stepper__btn';
      incBtn.setAttribute('data-action', 'cart-inc');
      incBtn.setAttribute('data-product-id', item.productId);
      incBtn.setAttribute('data-size', String(item.size));
      incBtn.setAttribute('aria-label', 'Увеличить количество ' + item.product.name);
      incBtn.textContent = '+';

      stepper.appendChild(decBtn);
      stepper.appendChild(qtySpan);
      stepper.appendChild(incBtn);
      controlsRow.appendChild(stepper);

      const sumWrap = document.createElement('div');
      sumWrap.className = 'drawer-item__sum-wrap';

      if (item.unitOldPrice && item.unitOldPrice > item.unitPrice) {
        const oldSum = document.createElement('span');
        oldSum.className = 'drawer-item__old-sum';
        oldSum.textContent = Products.formatPrice(item.lineOldTotal);
        sumWrap.appendChild(oldSum);
      }

      const lineSum = document.createElement('span');
      lineSum.className = 'drawer-item__sum';
      lineSum.textContent = Products.formatPrice(item.lineTotal);
      sumWrap.appendChild(lineSum);

      controlsRow.appendChild(sumWrap);
      info.appendChild(controlsRow);

      li.appendChild(info);
      fragment.appendChild(li);
    }

    listEl.appendChild(fragment);

    if (totalUnitsEl) {
      totalUnitsEl.textContent = data.totalCount + ' шт.';
    }
    if (totalDiscountRow && totalDiscountEl) {
      if (data.totalDiscount > 0) {
        totalDiscountRow.hidden = false;
        totalDiscountEl.textContent = '−' + Products.formatPrice(data.totalDiscount);
      } else {
        totalDiscountRow.hidden = true;
      }
    }
    if (totalAmountEl) {
      totalAmountEl.textContent = Products.formatPrice(data.totalAmount);
    }
  }

  /**
   * Отрисовывает боковую панель избранного и обновляет счётчик в шапке
   */
  function renderFavorites(items) {
    const favItems = items || Favorites.getItems();
    const headerBadge = document.getElementById('header-fav-count');
    const drawerCount = document.getElementById('fav-drawer-count');
    const listEl = document.getElementById('fav-items-list');
    const emptyEl = document.getElementById('fav-empty-state');

    if (headerBadge) {
      headerBadge.textContent = String(favItems.length);
    }
    if (drawerCount) {
      const word = Products.pluralize(favItems.length, ['модель', 'модели', 'моделей']);
      drawerCount.textContent = favItems.length + ' ' + word;
    }

    Catalog.syncFavoriteButtons();
    if (quickViewState.productId) {
      syncQuickViewFavoriteButton(quickViewState.productId);
    }

    if (!listEl) return;

    while (listEl.firstChild) {
      listEl.removeChild(listEl.firstChild);
    }

    if (favItems.length === 0) {
      listEl.hidden = true;
      if (emptyEl) emptyEl.hidden = false;
      return;
    }

    listEl.hidden = false;
    if (emptyEl) emptyEl.hidden = true;

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < favItems.length; i++) {
      const product = favItems[i];
      const li = document.createElement('li');
      li.className = 'drawer-item';

      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'drawer-item__thumb';
      const img = document.createElement('img');
      img.src = product.image;
      img.alt = product.name;
      img.width = 96;
      img.height = 68;
      img.addEventListener('error', function () {
        Catalog.applyImageFallback(img, product);
      });
      thumbWrap.appendChild(img);
      li.appendChild(thumbWrap);

      const info = document.createElement('div');
      info.className = 'drawer-item__info';

      const topRow = document.createElement('div');
      topRow.className = 'drawer-item__top';

      const title = document.createElement('h4');
      title.className = 'drawer-item__title';
      title.textContent = product.name;
      topRow.appendChild(title);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'drawer-item__remove';
      removeBtn.setAttribute('data-action', 'fav-remove');
      removeBtn.setAttribute('data-product-id', product.id);
      removeBtn.setAttribute('aria-label', 'Удалить ' + product.name + ' из избранного');
      removeBtn.textContent = 'Удалить';
      topRow.appendChild(removeBtn);

      info.appendChild(topRow);

      const meta = document.createElement('p');
      meta.className = 'drawer-item__meta';
      meta.textContent = product.brand + ' · ' + product.color;
      info.appendChild(meta);

      const bottomRow = document.createElement('div');
      bottomRow.className = 'drawer-item__controls';

      const priceSpan = document.createElement('span');
      priceSpan.className = 'drawer-item__sum';
      priceSpan.textContent = Products.formatPrice(product.price);
      bottomRow.appendChild(priceSpan);

      const toProductBtn = document.createElement('button');
      toProductBtn.type = 'button';
      toProductBtn.className = 'btn btn--primary btn--sm';
      toProductBtn.setAttribute('data-action', 'quick-view');
      toProductBtn.setAttribute('data-product-id', product.id);
      toProductBtn.textContent = 'Выбрать размер';
      bottomRow.appendChild(toProductBtn);

      info.appendChild(bottomRow);
      li.appendChild(info);
      fragment.appendChild(li);
    }

    listEl.appendChild(fragment);
  }

  /**
   * Открывает модальное окно демонстрационного оформления заказа
   */
  function openCheckoutModal(triggerEl) {
    const summary = Cart.getSummary();
    if (summary.isEmpty) {
      showToast('Корзина пуста. Сначала выберите кроссовки и размер.', 'error');
      return;
    }

    const formView = document.getElementById('checkout-form-view');
    const successView = document.getElementById('checkout-success-view');
    const itemsList = document.getElementById('checkout-summary-items');
    const totalEl = document.getElementById('checkout-summary-total');

    if (formView) formView.hidden = false;
    if (successView) successView.hidden = true;

    // Сбрасываем сообщения об ошибках формы
    clearCheckoutFormErrors();

    if (itemsList) {
      while (itemsList.firstChild) {
        itemsList.removeChild(itemsList.firstChild);
      }
      for (let i = 0; i < summary.items.length; i++) {
        const entry = summary.items[i];
        const li = document.createElement('li');
        li.className = 'checkout-summary__item';

        const left = document.createElement('span');
        left.textContent =
          entry.product.name + ' (EU ' + entry.size + ') × ' + entry.quantity + ' шт.';

        const right = document.createElement('span');
        right.className = 'checkout-summary__price';
        right.textContent = Products.formatPrice(entry.lineTotal);

        li.appendChild(left);
        li.appendChild(right);
        itemsList.appendChild(li);
      }
    }

    if (totalEl) {
      totalEl.textContent = Products.formatPrice(summary.totalAmount);
    }

    openOverlay('checkout-modal', triggerEl);
  }

  function clearCheckoutFormErrors() {
    const errorIds = [
      'err-checkout-name',
      'err-checkout-phone',
      'err-checkout-email',
      'err-checkout-terms'
    ];
    for (let i = 0; i < errorIds.length; i++) {
      const el = document.getElementById(errorIds[i]);
      if (el) {
        el.textContent = '';
        el.hidden = true;
      }
    }
    const inputs = document.querySelectorAll('#checkout-form .form-input');
    for (let j = 0; j < inputs.length; j++) {
      inputs[j].classList.remove('has-error');
    }
  }

  /**
   * Показывает модальное окно с юридической/концептуальной справкой
   */
  function openLegalModal(topic, triggerEl) {
    const titleEl = document.getElementById('legal-modal-title');
    const bodyEl = document.getElementById('legal-modal-body');
    if (!titleEl || !bodyEl) return;

    while (bodyEl.firstChild) {
      bodyEl.removeChild(bodyEl.firstChild);
    }

    if (topic === 'privacy') {
      titleEl.textContent = 'Политика конфиденциальности (Демо-проект)';
      const p1 = document.createElement('p');
      p1.textContent =
        'Сайт VELOCITY является демонстрационным портфолио-проектом фронтенд-разработчика и работает исключительно локально в вашем браузере.';
      const p2 = document.createElement('p');
      p2.textContent =
        '1. Никакие введённые в формы данные (имя, телефон, электронная почта) не передаются на внешние серверы и не сохраняются в сторонних базах данных.';
      const p3 = document.createElement('p');
      p3.textContent =
        '2. Для сохранения выбранных товаров в корзине и списка избранного между перезагрузками страницы используется стандартное локальное хранилище браузера (localStorage) на вашем устройстве.';
      bodyEl.appendChild(p1);
      bodyEl.appendChild(p2);
      bodyEl.appendChild(p3);
    } else {
      titleEl.textContent = 'Условия демонстрационного заказа';
      const p1 = document.createElement('p');
      p1.textContent =
        'Магазин кроссовок VELOCITY — концептуальный некоммерческий проект, созданный для демонстрации навыков веб-разработки (HTML5, CSS3, Vanilla JavaScript).';
      const p2 = document.createElement('p');
      p2.textContent =
        '1. Оформление заказа в интерфейсе носит исключительно демонстрационный характер: оно не порождает договора купли-продажи, не резервирует реальные товары и не вызывает курьерскую доставку.';
      const p3 = document.createElement('p');
      p3.textContent =
        '2. Сайт не запрашивает банковские реквизиты и не проводит финансовых транзакций. После подтверждения демо-заказа вы увидите экран локального подтверждения, а демонстрационная корзина очистится.';
      bodyEl.appendChild(p1);
      bodyEl.appendChild(p2);
      bodyEl.appendChild(p3);
    }

    openOverlay('legal-modal', triggerEl);
  }

  VelocityApp.UI = {
    openOverlay: openOverlay,
    closeActiveOverlay: closeActiveOverlay,
    toggleMobileMenu: toggleMobileMenu,
    closeMobileMenu: closeMobileMenu,
    openQuickView: openQuickView,
    selectQuickViewSize: selectQuickViewSize,
    changeQuickViewQuantity: changeQuickViewQuantity,
    submitQuickViewAddToCart: submitQuickViewAddToCart,
    getQuickViewState: getQuickViewState,
    renderCart: renderCart,
    renderFavorites: renderFavorites,
    openCheckoutModal: openCheckoutModal,
    clearCheckoutFormErrors: clearCheckoutFormErrors,
    openLegalModal: openLegalModal,
    showToast: showToast,
    handleGlobalKeydown: handleGlobalKeydown
  };
})(window);
