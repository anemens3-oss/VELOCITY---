/**
 * VELOCITY — Каталог демонстрационных товаров (products.js)
 * Все цены хранятся как числа для точных расчётов и сортировки.
 */
(function (global) {
  'use strict';

  const VelocityApp = (global.VelocityApp = global.VelocityApp || {});

  const PRODUCTS = [
    {
      id: 'vel-01',
      code: 'VL-01',
      name: 'Aero-X Carbon Pro',
      category: 'беговые',
      categoryLabel: 'Беговые',
      brand: 'AERO SERIES',
      gender: 'унисекс',
      price: 18990,
      oldPrice: 22490,
      color: 'Графит / Электрический оранжевый',
      sizes: [38, 39, 40, 41, 42, 43, 44, 45],
      image: 'assets/images/product-01.svg',
      badge: 'Хит',
      isNew: true,
      popularity: 99,
      specs: 'Вес: 218 г · Перепад: 8 мм · Карбоновая пластина',
      description:
        'Флагманская беговая модель с двухслойной пеной Nitro-Pebax и полноразмерной карбоновой пластиной для упругого возврата энергии на асфальте и темповых тренировках.'
    },
    {
      id: 'vel-02',
      code: 'VL-02',
      name: 'Monolith V2 Low',
      category: 'lifestyle',
      categoryLabel: 'Lifestyle',
      brand: 'MONOLITH',
      gender: 'мужские',
      price: 16490,
      oldPrice: null,
      color: 'Матовый чёрный / Оранжевый акцент',
      sizes: [40, 41, 42, 43, 44, 45, 46],
      image: 'assets/images/product-02.svg',
      badge: 'Новинка',
      isNew: true,
      popularity: 95,
      specs: 'Вес: 340 г · Подошва Vibram® · Нубук и баллистический нейлон',
      description:
        'Архитектурный городской силуэт с массивной скульптурной подошвой, многослойным верхом из матового нубука и плотного нейлона Cordura для ежедневного комфорта.'
    },
    {
      id: 'vel-03',
      code: 'VL-03',
      name: 'Terra Form Suede',
      category: 'повседневные',
      categoryLabel: 'Повседневные',
      brand: 'TERRA DIVISION',
      gender: 'женские',
      price: 13990,
      oldPrice: 16990,
      color: 'Песочный травертин / Карамель',
      sizes: [36, 37, 38, 39, 40, 41],
      image: 'assets/images/product-03.svg',
      badge: 'Sale',
      isNew: false,
      popularity: 91,
      specs: 'Вес: 285 г · Мягкая замша · Анатомическая стелька OrthoLite',
      description:
        'Повседневные кроссовки в тёплой природной палитре из фактурной замши премиальной выделки с дышащими сетчатыми вставками и цепкой каучуковой подмёткой.'
    },
    {
      id: 'vel-04',
      code: 'VL-04',
      name: 'Pulse Nitro Elite',
      category: 'беговые',
      categoryLabel: 'Беговые',
      brand: 'AERO SERIES',
      gender: 'женские',
      price: 17490,
      oldPrice: null,
      color: 'Молочный белый / Сигнальный оранжевый',
      sizes: [36, 37, 38, 39, 40, 41, 42],
      image: 'assets/images/product-04.svg',
      badge: 'Новинка',
      isNew: true,
      popularity: 94,
      specs: 'Вес: 196 г · Перепад: 6 мм · Полупрозрачный рипстоп',
      description:
        'Сверхлёгкая пара для скоростных забегов и длительных дистанций. Бесшовный верх из армированного моно-рипстопа мгновенно отводит влагу и фиксирует стопу.'
    },
    {
      id: 'vel-05',
      code: 'VL-05',
      name: 'Kinetic Court 88',
      category: 'повседневные',
      categoryLabel: 'Повседневные',
      brand: 'VELOCITY LAB',
      gender: 'унисекс',
      price: 11990,
      oldPrice: 14990,
      color: 'Меловой белый / Графитовый серый',
      sizes: [37, 38, 39, 40, 41, 42, 43, 44],
      image: 'assets/images/product-05.svg',
      badge: 'Sale',
      isNew: false,
      popularity: 88,
      specs: 'Вес: 310 г · Гладкая кожа · Прошитая чашечная подошва',
      description:
        'Переосмысленная корт-классика с чистыми геометрическими линиями, перфорацией в носочной части и скрытой амортизирующей вставкой в пятке.'
    },
    {
      id: 'vel-06',
      code: 'VL-06',
      name: 'Apex Trail Gore',
      category: 'беговые',
      categoryLabel: 'Беговые',
      brand: 'TERRA DIVISION',
      gender: 'мужские',
      price: 19490,
      oldPrice: 23990,
      color: 'Оливковый сланец / Оранжевый',
      sizes: [40, 41, 42, 43, 44, 45, 46],
      image: 'assets/images/product-06.svg',
      badge: 'Sale',
      isNew: false,
      popularity: 89,
      specs: 'Вес: 315 г · Протектор 5 мм · Влагозащитная мембрана',
      description:
        'Трейловые кроссовки для пересечённой местности и непогоды. Агрессивный разнонаправленный протектор, защита мыска от камней и система быстрой шнуровки.'
    },
    {
      id: 'vel-07',
      code: 'VL-07',
      name: 'Vortex Knit Runner',
      category: 'повседневные',
      categoryLabel: 'Повседневные',
      brand: 'VELOCITY LAB',
      gender: 'унисекс',
      price: 12990,
      oldPrice: null,
      color: 'Тёмный индиго / Кобальт',
      sizes: [37, 38, 39, 40, 41, 42, 43, 44, 45],
      image: 'assets/images/product-07.svg',
      badge: null,
      isNew: false,
      popularity: 84,
      specs: 'Вес: 245 г · Эластичный трикотаж 3D-Knit · Без язычка',
      description:
        'Ультракомфортная городская модель с цельновязаным верхом, облегающим стопу подобно носку. Идеальный выбор для долгих прогулок и путешествий.'
    },
    {
      id: 'vel-08',
      code: 'VL-08',
      name: 'Strata Retro 94',
      category: 'lifestyle',
      categoryLabel: 'Lifestyle',
      brand: 'VELOCITY LAB',
      gender: 'унисекс',
      price: 14490,
      oldPrice: 17990,
      color: 'Светлый камень / Терракотовый',
      sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44],
      image: 'assets/images/product-08.svg',
      badge: 'Хит',
      isNew: false,
      popularity: 96,
      specs: 'Вес: 305 г · Замша и крупная сетка · Стабилизатор пятки TPU',
      description:
        'Винтажная беговая эстетика 90-х годов в современном исполнении: объёмные замшевые панели, открытая дышащая сетка и современная пена двойной плотности.'
    },
    {
      id: 'vel-09',
      code: 'VL-09',
      name: 'Shadow Stealth GTX',
      category: 'lifestyle',
      categoryLabel: 'Lifestyle',
      brand: 'MONOLITH',
      gender: 'мужские',
      price: 20990,
      oldPrice: null,
      color: 'Угольный чёрный / Титан',
      sizes: [40, 41, 42, 43, 44, 45, 46],
      image: 'assets/images/product-09.svg',
      badge: 'Новинка',
      isNew: true,
      popularity: 93,
      specs: 'Вес: 355 г · Водоотталкивающий верх · Светоотражающие нити 3M',
      description:
        'Монохромный силуэт для индустриальной среды. Защищённые от влаги швы, термополиуретановый каркас пятки и выразительная геометрия подошвы.'
    },
    {
      id: 'vel-10',
      code: 'VL-10',
      name: 'Solaris Tempo',
      category: 'беговые',
      categoryLabel: 'Беговые',
      brand: 'AERO SERIES',
      gender: 'унисекс',
      price: 15990,
      oldPrice: 18990,
      color: 'Электрический оранжевый / Чёрный',
      sizes: [38, 39, 40, 41, 42, 43, 44],
      image: 'assets/images/product-10.svg',
      badge: 'Sale',
      isNew: true,
      popularity: 90,
      specs: 'Вес: 228 г · Перепад: 8 мм · Геометрия Rocker-Sole',
      description:
        'Яркие темповые кроссовки со скошенным профилем подошвы для плавного переката с пятки на носок и снижения ударной нагрузки на суставы.'
    },
    {
      id: 'vel-11',
      code: 'VL-11',
      name: 'Drift Minimal Evo',
      category: 'повседневные',
      categoryLabel: 'Повседневные',
      brand: 'VELOCITY LAB',
      gender: 'женские',
      price: 10990,
      oldPrice: 13490,
      color: 'Тёплый известняк / Хвойный зелёный',
      sizes: [36, 37, 38, 39, 40, 41],
      image: 'assets/images/product-11.svg',
      badge: 'Sale',
      isNew: false,
      popularity: 86,
      specs: 'Вес: 260 г · Органический хлопок и замша · Гибкая подошва',
      description:
        'Лаконичный низкий профиль с мягким кантом вокруг щиколотки, спокойными природными акцентами и лёгкой амортизацией на каждый день.'
    },
    {
      id: 'vel-12',
      code: 'VL-12',
      name: 'Nomad Urban High',
      category: 'lifestyle',
      categoryLabel: 'Lifestyle',
      brand: 'TERRA DIVISION',
      gender: 'мужские',
      price: 18490,
      oldPrice: null,
      color: 'Тёмный базальт / Янтарный оранжевый',
      sizes: [40, 41, 42, 43, 44, 45],
      image: 'assets/images/product-12.svg',
      badge: 'Новинка',
      isNew: true,
      popularity: 87,
      specs: 'Вес: 365 г · Усиленная поддержка голеностопа · Подмётка All-Terrain',
      description:
        'Гибрид городских кроссовок и аутдор-обуви с повышенной линией воротника, металлическими люверсами и цепкой подошвой для межсезонья.'
    }
  ];

  /**
   * Форматирует число в рублёвую цену: 18990 -> "18 990 ₽"
   * @param {number} value
   * @returns {string}
   */
  function formatPrice(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) return '0 ₽';
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
  }

  /**
   * Вычисляет процент скидки, если указана корректная старая цена
   * @param {number} price
   * @param {number|null} oldPrice
   * @returns {number}
   */
  function getDiscountPercent(price, oldPrice) {
    const p = Number(price);
    const old = Number(oldPrice);
    if (!Number.isFinite(p) || !Number.isFinite(old) || old <= p || old <= 0) {
      return 0;
    }
    return Math.round(((old - p) / old) * 100);
  }

  /**
   * Возвращает копию массива всех товаров
   * @returns {Array}
   */
  function getAllProducts() {
    return PRODUCTS.slice();
  }

  /**
   * Находит товар по его уникальному id
   * @param {string} id
   * @returns {Object|null}
   */
  function getProductById(id) {
    if (typeof id !== 'string') return null;
    return PRODUCTS.find(function (item) {
      return item.id === id;
    }) || null;
  }

  /**
   * Склонение существительных после числительных (1 модель, 2 модели, 12 моделей)
   * @param {number} count
   * @param {Array<string>} forms [одна, две, пять]
   * @returns {string}
   */
  function pluralize(count, forms) {
    const n = Math.abs(Number(count)) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
  }

  VelocityApp.Products = {
    getAll: getAllProducts,
    getById: getProductById,
    formatPrice: formatPrice,
    getDiscountPercent: getDiscountPercent,
    pluralize: pluralize
  };
})(window);
