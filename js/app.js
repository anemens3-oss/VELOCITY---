/**
 * VELOCITY — Главный модуль инициализации приложения (app.js)
 * Связывает каталог, корзину, избранное, фильтры, модальные окна и форму демо-заказа.
 */
(function (global) {
  'use strict';

  const VelocityApp = (global.VelocityApp = global.VelocityApp || {});
  const Products = VelocityApp.Products;
  const Catalog = VelocityApp.Catalog;
  const Cart = VelocityApp.Cart;
  const Favorites = VelocityApp.Favorites;
  const UI = VelocityApp.UI;

  /**
   * Плавная прокрутка к секции с учётом prefers-reduced-motion и высоты фиксированной шапки
   */
  function scrollToSection(sectionId) {
    const target = document.getElementById(sectionId);
    if (!target) return;

    const prefersReducedMotion =
      global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const headerEl = document.querySelector('.site-header');
    const headerOffset = headerEl ? headerEl.offsetHeight + 12 : 80;
    const rect = target.getBoundingClientRect();
    const offsetTop = rect.top + global.pageYOffset - headerOffset;

    global.scrollTo({
      top: Math.max(0, offsetTop),
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  }

  /**
   * Применяет навигационный пресет (Каталог / Новинки / Мужчинам / Женщинам / Sale / Беговые)
   * и плавно прокручивает страницу к разделу каталога
   */
  function applyNavPreset(preset) {
    UI.closeMobileMenu();
    UI.closeActiveOverlay();

    Catalog.resetFilters();

    if (preset === 'new') {
      Catalog.setFilter({ onlyNew: true, sortBy: 'new' });
    } else if (preset === 'men') {
      Catalog.setFilter({ gender: 'мужские' });
    } else if (preset === 'women') {
      Catalog.setFilter({ gender: 'женские' });
    } else if (preset === 'sale') {
      Catalog.setFilter({ onlyDiscount: true, sortBy: 'discount-desc' });
    } else if (preset === 'running') {
      Catalog.setFilter({ category: 'беговые' });
    }

    scrollToSection('catalog');
  }

  /**
   * Инициализация контролов фильтрации и поиска в каталоге
   */
  function initCatalogControls() {
    const searchInput = document.getElementById('catalog-search');
    const clearSearchBtn = document.getElementById('search-clear-btn');
    const brandSelect = document.getElementById('filter-brand');
    const sortSelect = document.getElementById('catalog-sort');
    const minPriceInput = document.getElementById('filter-min-price');
    const maxPriceInput = document.getElementById('filter-max-price');
    const discountCheckbox = document.getElementById('filter-discount');
    const newCheckbox = document.getElementById('filter-new');
    const filterPanelToggle = document.getElementById('mobile-filter-toggle');
    const filterPanel = document.getElementById('catalog-filters-panel');

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        Catalog.setFilter({ search: searchInput.value });
      });
    }

    if (clearSearchBtn && searchInput) {
      clearSearchBtn.addEventListener('click', function () {
        Catalog.setFilter({ search: '' });
        searchInput.focus();
      });
    }

    if (brandSelect) {
      brandSelect.addEventListener('change', function () {
        Catalog.setFilter({ brand: brandSelect.value });
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        Catalog.setFilter({ sortBy: sortSelect.value });
      });
    }

    function handlePriceChange() {
      const rawMin = minPriceInput ? minPriceInput.value.trim() : '';
      const rawMax = maxPriceInput ? maxPriceInput.value.trim() : '';

      let minVal = rawMin !== '' ? Math.max(0, Number(rawMin)) : null;
      let maxVal = rawMax !== '' ? Math.max(0, Number(rawMax)) : null;

      if (minVal !== null && !Number.isFinite(minVal)) minVal = null;
      if (maxVal !== null && !Number.isFinite(maxVal)) maxVal = null;

      Catalog.setFilter({
        minPrice: minVal,
        maxPrice: maxVal
      });
    }

    if (minPriceInput) {
      minPriceInput.addEventListener('input', handlePriceChange);
    }
    if (maxPriceInput) {
      maxPriceInput.addEventListener('input', handlePriceChange);
    }

    if (discountCheckbox) {
      discountCheckbox.addEventListener('change', function () {
        Catalog.setFilter({ onlyDiscount: discountCheckbox.checked });
      });
    }

    if (newCheckbox) {
      newCheckbox.addEventListener('change', function () {
        Catalog.setFilter({ onlyNew: newCheckbox.checked });
      });
    }

    if (filterPanelToggle && filterPanel) {
      filterPanelToggle.addEventListener('click', function () {
        const isExpanded = filterPanelToggle.getAttribute('aria-expanded') === 'true';
        const nextState = !isExpanded;
        filterPanelToggle.setAttribute('aria-expanded', nextState ? 'true' : 'false');
        filterPanel.classList.toggle('is-open', nextState);
      });
    }
  }

  /**
   * Валидация и обработка формы демонстрационного заказа
   */
  function initCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      UI.clearCheckoutFormErrors();

      const summary = Cart.getSummary();
      if (summary.isEmpty) {
        UI.showToast('Невозможно оформить заказ: корзина пуста.', 'error');
        return;
      }

      const nameInput = document.getElementById('checkout-name');
      const phoneInput = document.getElementById('checkout-phone');
      const emailInput = document.getElementById('checkout-email');
      const deliverySelect = document.getElementById('checkout-delivery');
      const termsCheckbox = document.getElementById('checkout-terms');

      const nameVal = nameInput ? nameInput.value.trim() : '';
      const phoneVal = phoneInput ? phoneInput.value.trim() : '';
      const emailVal = emailInput ? emailInput.value.trim() : '';
      const deliveryVal = deliverySelect
        ? deliverySelect.options[deliverySelect.selectedIndex].text
        : 'Самовывоз из концепт-стора (демо)';
      const termsAccepted = termsCheckbox ? termsCheckbox.checked : false;

      let hasError = false;

      function setFieldError(inputEl, errId, msg) {
        hasError = true;
        if (inputEl) inputEl.classList.add('has-error');
        const errEl = document.getElementById(errId);
        if (errEl) {
          errEl.textContent = msg;
          errEl.hidden = false;
        }
      }

      // 1. Проверка имени
      if (nameVal.length < 2) {
        setFieldError(nameInput, 'err-checkout-name', 'Укажите имя получателя (минимум 2 символа).');
      }

      // 2. Проверка телефона (минимум 10 цифр, допустимы +, пробелы, скобки, дефисы)
      const digitsOnly = phoneVal.replace(/\D/g, '');
      const validPhoneChars = /^[+\d\s()-]{10,22}$/.test(phoneVal);
      if (!validPhoneChars || digitsOnly.length < 10 || digitsOnly.length > 15) {
        setFieldError(
          phoneInput,
          'err-checkout-phone',
          'Введите корректный номер телефона, например: +7 (999) 123-45-67.'
        );
      }

      // 3. Проверка email (если поле заполнено)
      if (emailVal.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(emailVal)) {
          setFieldError(
            emailInput,
            'err-checkout-email',
            'Введите корректный адрес электронной почты или оставьте поле пустым.'
          );
        }
      }

      // 4. Согласие с условиями демонстрационного заказа
      if (!termsAccepted) {
        setFieldError(
          termsCheckbox,
          'err-checkout-terms',
          'Подтвердите согласие с условиями демонстрационного режима.'
        );
      }

      if (hasError) {
        return;
      }

      // Формируем локальное подтверждение демонстрационного заказа
      const orderCode = 'VEL-' + String(Math.floor(1000 + Math.random() * 9000));
      const orderCodeEl = document.getElementById('checkout-order-code');
      const orderRecipientEl = document.getElementById('checkout-order-recipient');
      const orderDeliveryEl = document.getElementById('checkout-order-delivery');
      const orderTotalEl = document.getElementById('checkout-order-total');
      const formView = document.getElementById('checkout-form-view');
      const successView = document.getElementById('checkout-success-view');

      if (orderCodeEl) orderCodeEl.textContent = orderCode;
      if (orderRecipientEl) {
        orderRecipientEl.textContent =
          nameVal + ', ' + phoneVal + (emailVal ? ' (' + emailVal + ')' : '');
      }
      if (orderDeliveryEl) orderDeliveryEl.textContent = deliveryVal;
      if (orderTotalEl) orderTotalEl.textContent = Products.formatPrice(summary.totalAmount);

      // Очищаем корзину и сбрасываем форму после успешного формирования демо-заказа
      Cart.clear();
      form.reset();

      if (formView) formView.hidden = true;
      if (successView) successView.hidden = false;

      UI.showToast('Демонстрационный заказ ' + orderCode + ' сформирован локально.', 'success');
    });
  }

  /**
   * Делегирование всех кликов по интерактивным элементам интерфейса
   */
  function initGlobalClickDelegation() {
    document.addEventListener('click', function (event) {
      const target = event.target;
      if (!target || typeof target.closest !== 'function') return;

      // 1. Закрытие модального окна по кнопке закрытия или по клику на затемнённый фон
      const closeTrigger = target.closest('[data-overlay-close]');
      if (closeTrigger) {
        event.preventDefault();
        UI.closeActiveOverlay();
        return;
      }

      if (target.classList && target.classList.contains('overlay-backdrop')) {
        UI.closeActiveOverlay();
        return;
      }

      // 2. Мобильное меню
      const mobileToggle = target.closest('#mobile-menu-toggle');
      if (mobileToggle) {
        event.preventDefault();
        UI.toggleMobileMenu();
        return;
      }

      // 3. Навигационные пресеты (Каталог, Новинки, Мужчинам, Женщинам, Sale)
      const navPresetBtn = target.closest('[data-nav-preset]');
      if (navPresetBtn) {
        event.preventDefault();
        const preset = navPresetBtn.getAttribute('data-nav-preset');
        applyNavPreset(preset);
        return;
      }

      // 4. Кнопка поиска в шапке — прокрутка и фокус на поле поиска каталога
      const headerSearchBtn = target.closest('#header-search-btn');
      if (headerSearchBtn) {
        event.preventDefault();
        UI.closeMobileMenu();
        scrollToSection('catalog');
        const searchInput = document.getElementById('catalog-search');
        if (searchInput) {
          setTimeout(function () {
            searchInput.focus();
          }, 250);
        }
        return;
      }

      // 5. Открытие панели избранного
      const openFavBtn = target.closest('[data-action="open-favorites"]');
      if (openFavBtn) {
        event.preventDefault();
        UI.renderFavorites();
        UI.openOverlay('favorites-drawer', openFavBtn);
        return;
      }

      // 6. Открытие панели корзины
      const openCartBtn = target.closest('[data-action="open-cart"]');
      if (openCartBtn) {
        event.preventDefault();
        UI.renderCart();
        UI.openOverlay('cart-drawer', openCartBtn);
        return;
      }

      // 7. Кнопки фильтра категорий в каталоге
      const catBtn = target.closest('[data-filter-category]');
      if (catBtn) {
        event.preventDefault();
        Catalog.setFilter({ category: catBtn.getAttribute('data-filter-category') });
        return;
      }

      // 8. Кнопки фильтра по полу/коллекции
      const genderBtn = target.closest('[data-filter-gender]');
      if (genderBtn) {
        event.preventDefault();
        Catalog.setFilter({ gender: genderBtn.getAttribute('data-filter-gender') });
        return;
      }

      // 9. Кнопки фильтра по размеру в каталоге
      const sizeFilterBtn = target.closest('[data-filter-size]');
      if (sizeFilterBtn) {
        event.preventDefault();
        const clickedSize = Number(sizeFilterBtn.getAttribute('data-filter-size'));
        const currentSize = Catalog.getState().size;
        Catalog.setFilter({ size: currentSize === clickedSize ? null : clickedSize });
        return;
      }

      // 10. Сброс фильтров каталога
      const resetFiltersBtn = target.closest('[data-action="reset-filters"]');
      if (resetFiltersBtn) {
        event.preventDefault();
        Catalog.resetFilters();
        UI.showToast('Фильтры сброшены. Показан полный каталог.', 'success');
        return;
      }

      // 11. Добавление / удаление из избранного на карточке товара
      const favToggleBtn = target.closest('[data-action="toggle-favorite"]');
      if (favToggleBtn) {
        event.preventDefault();
        event.stopPropagation();
        const productId = favToggleBtn.getAttribute('data-product-id');
        const product = Products.getById(productId);
        const added = Favorites.toggle(productId);
        if (product) {
          UI.showToast(
            added
              ? product.name + ' добавлен в избранное'
              : product.name + ' удалён из избранного',
            'success'
          );
        }
        return;
      }

      // 12. Удаление из списка внутри панели избранного
      const favRemoveBtn = target.closest('[data-action="fav-remove"]');
      if (favRemoveBtn) {
        event.preventDefault();
        const productId = favRemoveBtn.getAttribute('data-product-id');
        Favorites.remove(productId);
        return;
      }

      // 13. Открытие модального окна быстрого просмотра товара
      const quickViewBtn = target.closest('[data-action="quick-view"]');
      if (quickViewBtn) {
        event.preventDefault();
        const productId = quickViewBtn.getAttribute('data-product-id');
        UI.openQuickView(productId, quickViewBtn);
        return;
      }

      // 14. Выбор размера внутри быстрого просмотра
      const qvSizeBtn = target.closest('[data-qv-size]');
      if (qvSizeBtn) {
        event.preventDefault();
        UI.selectQuickViewSize(qvSizeBtn.getAttribute('data-qv-size'));
        return;
      }

      // 15. Изменение количества в быстром просмотре
      const qvQtyBtn = target.closest('[data-qv-qty]');
      if (qvQtyBtn) {
        event.preventDefault();
        const delta = Number(qvQtyBtn.getAttribute('data-qv-qty'));
        UI.changeQuickViewQuantity(delta);
        return;
      }

      // 16. Добавление в корзину из быстрого просмотра
      const qvAddBtn = target.closest('#qv-add-to-cart-btn');
      if (qvAddBtn) {
        event.preventDefault();
        UI.submitQuickViewAddToCart();
        return;
      }

      // 17. Избранное внутри быстрого просмотра
      const qvFavBtn = target.closest('#qv-fav-btn');
      if (qvFavBtn) {
        event.preventDefault();
        const qvState = UI.getQuickViewState();
        if (qvState.productId) {
          const product = Products.getById(qvState.productId);
          const added = Favorites.toggle(qvState.productId);
          if (product) {
            UI.showToast(
              added
                ? product.name + ' добавлен в избранное'
                : product.name + ' удалён из избранного',
              'success'
            );
          }
        }
        return;
      }

      // 18. Действия внутри корзины (+, -, удалить позицию, очистить всю корзину)
      const cartIncBtn = target.closest('[data-action="cart-inc"]');
      if (cartIncBtn) {
        event.preventDefault();
        Cart.changeQuantity(
          cartIncBtn.getAttribute('data-product-id'),
          Number(cartIncBtn.getAttribute('data-size')),
          1
        );
        return;
      }

      const cartDecBtn = target.closest('[data-action="cart-dec"]');
      if (cartDecBtn) {
        event.preventDefault();
        Cart.changeQuantity(
          cartDecBtn.getAttribute('data-product-id'),
          Number(cartDecBtn.getAttribute('data-size')),
          -1
        );
        return;
      }

      const cartRemoveBtn = target.closest('[data-action="cart-remove"]');
      if (cartRemoveBtn) {
        event.preventDefault();
        Cart.removeItem(
          cartRemoveBtn.getAttribute('data-product-id'),
          Number(cartRemoveBtn.getAttribute('data-size'))
        );
        return;
      }

      const cartClearBtn = target.closest('#cart-clear-btn');
      if (cartClearBtn) {
        event.preventDefault();
        Cart.clear();
        UI.showToast('Корзина очищена.', 'success');
        return;
      }

      // 19. Переход к оформлению заказа из корзины
      const checkoutOpenBtn = target.closest('[data-action="open-checkout"]');
      if (checkoutOpenBtn) {
        event.preventDefault();
        UI.openCheckoutModal(checkoutOpenBtn);
        return;
      }

      // 20. Переход к каталогу из пустых состояний корзины или избранного
      const goToCatalogBtn = target.closest('[data-action="go-to-catalog"]');
      if (goToCatalogBtn) {
        event.preventDefault();
        UI.closeActiveOverlay();
        scrollToSection('catalog');
        return;
      }

      // 21. Модальное окно условий демо-заказа и политики конфиденциальности
      const legalBtn = target.closest('[data-legal-topic]');
      if (legalBtn) {
        event.preventDefault();
        UI.openLegalModal(legalBtn.getAttribute('data-legal-topic'), legalBtn);
        return;
      }

      // 22. Раскрытие вопросов в блоке FAQ
      const faqBtn = target.closest('.faq-item__trigger');
      if (faqBtn) {
        event.preventDefault();
        const expanded = faqBtn.getAttribute('aria-expanded') === 'true';
        const panelId = faqBtn.getAttribute('aria-controls');
        const panel = panelId ? document.getElementById(panelId) : null;
        faqBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        if (panel) {
          panel.hidden = expanded;
        }
        return;
      }

      // 23. Плавная прокрутка по якорным ссылкам (#catalog, #about, #faq, #top)
      const scrollLink = target.closest('[data-scroll-to]');
      if (scrollLink) {
        event.preventDefault();
        UI.closeMobileMenu();
        const sectionId = scrollLink.getAttribute('data-scroll-to');
        if (sectionId === 'top') {
          const prefersReducedMotion =
            global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
          global.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        } else {
          scrollToSection(sectionId);
        }
      }
    });
  }

  /**
   * Плавное появление секций при прокрутке с помощью IntersectionObserver
   */
  function initScrollReveal() {
    const revealEls = document.querySelectorAll('.reveal-on-scroll');
    if (!revealEls.length) return;

    const prefersReducedMotion =
      global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !('IntersectionObserver' in global)) {
      for (let i = 0; i < revealEls.length; i++) {
        revealEls[i].classList.add('is-revealed');
      }
      return;
    }

    const observer = new IntersectionObserver(
      function (entries, obs) {
        for (let i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            entries[i].target.classList.add('is-revealed');
            obs.unobserve(entries[i].target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    for (let j = 0; j < revealEls.length; j++) {
      observer.observe(revealEls[j]);
    }
  }

  /**
   * Установка текущего года в подвале сайта
   */
  function initFooterYear() {
    const yearEl = document.getElementById('current-year');
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  /**
   * Главная точка входа при загрузке DOM
   */
  function init() {
    initFooterYear();
    Catalog.render();
    UI.renderCart();
    UI.renderFavorites();

    Cart.subscribe(function (summary) {
      UI.renderCart(summary);
    });

    Favorites.subscribe(function (items) {
      UI.renderFavorites(items);
    });

    initCatalogControls();
    initCheckoutForm();
    initGlobalClickDelegation();
    document.addEventListener('keydown', UI.handleGlobalKeydown);
    initScrollReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
