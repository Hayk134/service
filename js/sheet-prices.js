/* Read the public workbook in the browser. Prices are labour only. */
(function (global) {
  'use strict';

  const phoneSheets = ['iPhone', 'Samsung', 'Xiaomi', 'Honor', 'Huawei', 'Realme', 'Tecno', 'Infinix', 'Vivo', 'Oppo', 'Google Pixel', 'OnePlus', 'Другие бренды'];
  const phoneIssues = ['Разбит экран', 'Быстро разряжается', 'Не заряжается', 'Проблема со звуком'];
  const norm = value => String(value || '').toLowerCase().replace(/ё/g, 'е').replace(/\+/g, ' plus ').replace(/[^a-zа-я0-9]+/g, ' ').trim();
  const key = (brand, model) => norm(brand) + '|' + norm(model);
  const amount = value => typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;

  function parseWorkbook(book) {
    const models = [];
    const prices = [];
    const seen = new Map();
    const priceIndex = new Map();
    const ambiguous = new Set();
    function addModel(brand, model, aliases) {
      if (!model || typeof model !== 'string') return null;
      const id = key(brand, model);
      if (seen.has(id)) return seen.get(id);
      const item = { brand, model: model.trim(), aliases: String(aliases || '') };
      seen.set(id, item);
      models.push(item);
      return item;
    }
    function addPrice(item, issue, value, from) {
      const price = amount(value);
      if (!item || price === null) return;
      const id = key(item.brand, item.model) + '|' + norm(issue);
      if (priceIndex.has(id)) {
        if (priceIndex.get(id) !== price) ambiguous.add(id);
        return;
      }
      priceIndex.set(id, price);
      prices.push({ brand: item.brand, model: item.model, issue, price, from: !!from });
    }
    function rows(name) {
      return book.Sheets[name] ? XLSX.utils.sheet_to_json(book.Sheets[name], { header: 1, raw: true, defval: null }) : [];
    }

    phoneSheets.forEach(sheet => {
      const data = rows(sheet);
      if (!data.length || norm(data[0][0]) !== norm('Модель телефона') || norm(data[0][2]) !== norm('Стоимость работы (руб)')) return;
      data.slice(2).forEach(row => {
        const name = typeof row[0] === 'string' ? row[0].trim() : '';
        if (!name) return;
        const brand = sheet === 'iPhone' ? 'Apple' : sheet === 'Другие бренды' ? name.split(/\s+/)[0] : sheet === 'Google Pixel' ? 'Google' : sheet;
        const item = addModel(brand, name, row[1]);
        phoneIssues.forEach(issue => addPrice(item, issue, row[2], false));
      });
    });

    const laptopRows = rows('Ноутбуки');
    if (laptopRows.length > 4 && norm(laptopRows[3][0]) === norm('Бренд')) {
      laptopRows.slice(4).forEach(row => {
        const brand = typeof row[0] === 'string' ? row[0].trim() : '';
        const name = typeof row[1] === 'string' ? row[1].trim() : '';
        if (!brand || !name) return;
        const model = name === 'Модели на странице не перечислены' ? 'Ноутбук' : name;
        const item = addModel(brand, model, row[2]);
        const screen = [amount(row[4]), amount(row[5])].filter(value => value !== null);
        addPrice(item, 'Разбит экран', screen.length ? Math.min(...screen) : null, true);
        addPrice(item, 'Быстро разряжается', row[6], true);
        addPrice(item, 'Не заряжается', row[7], true);
        addPrice(item, 'Попадание влаги', row[9], true);
      });
    }

    const otherRows = rows('Другие устройства');
    const serviceIssues = {
      'замена экрана': 'Разбит экран',
      'замена дисплея': 'Разбит экран',
      'замена lcd дисплея': 'Разбит экран',
      'замена матрицы в сборе': 'Разбит экран',
      'замена аккумулятора': 'Быстро разряжается',
      'замена разъема зарядки': 'Не заряжается',
      'замена динамика': 'Проблема со звуком',
      'восстановление после попадания влаги': 'Попадание влаги',
      'чистка после попадания влаги': 'Попадание влаги',
      'чистка после попадания жидкости': 'Попадание влаги'
    };
    const aliases = { 'Планшеты': 'планшет', 'Умные часы': 'часы watch', 'Моноблоки': 'моноблок', 'Компьютеры': 'компьютер пк', 'Игровые приставки': 'приставка', 'Джойстики': 'джойстик геймпад', 'Беспроводные наушники': 'наушники', 'Портативные колонки': 'колонка', 'Роботы-пылесосы': 'робот пылесос' };
    const categoryPrices = new Map();
    if (otherRows.length > 4 && norm(otherRows[3][0]) === norm('Категория устройства')) {
      otherRows.slice(4).forEach(row => {
        const category = typeof row[0] === 'string' ? row[0].trim() : '';
        const issue = serviceIssues[norm(row[2])];
        const price = amount(row[3]);
        if (!category || !issue || price === null) return;
        const item = addModel('', category, aliases[category] || '');
        const id = key('', category) + '|' + issue;
        const previous = categoryPrices.get(id);
        if (!previous || price < previous.price) categoryPrices.set(id, { item, issue, price });
      });
    }
    categoryPrices.forEach(entry => addPrice(entry.item, entry.issue, entry.price, true));
    const unambiguousPrices = prices.filter(item => !ambiguous.has(key(item.brand, item.model) + '|' + norm(item.issue)));
    if (!models.length || !unambiguousPrices.length) throw new Error('В таблице не найдены цены в ожидаемом формате');
    return { models, prices: unambiguousPrices };
  }
  global.parseSheetPrices = parseWorkbook;
})(typeof window === 'undefined' ? globalThis : window);
