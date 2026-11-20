const OFFERS_URL = 'https://docs.google.com/spreadsheets/d/14wsmgXQd-2okC8ZHsOORt9YU0PVI6owt/export?format=xlsx';

async function loadOffers() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(OFFERS_URL, { cache: 'no-cache', signal: controller.signal });
    if (!response.ok) throw new Error('Таблица акций недоступна');
    const data = await response.arrayBuffer();
    if (!data.byteLength || data.byteLength > 5000000) throw new Error('Некорректный размер таблицы акций');
    importScripts('xlsx.mini.min.js');
    const workbook = XLSX.read(data, { type: 'array', cellFormula: false });
    const sheet = workbook.Sheets['Акции'];
    if (!sheet) throw new Error('Лист «Акции» не найден');
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });
    const expected = ['Показывать', 'Название', 'Условия акции', 'Кнопка', 'Дата окончания'];
    if (!expected.every((name, index) => String(rows[0]?.[index] || '').trim() === name)) {
      throw new Error('Неизвестный формат таблицы акций');
    }
    self.postMessage({ rows: rows.slice(1) });
  } catch (error) {
    self.postMessage({ error: error.message });
  } finally {
    clearTimeout(timeout);
  }
}

loadOffers();
