const SHEET_URL = 'https://docs.google.com/spreadsheets/d/18DT8BvQXQn9NQDQmUFHgQBaiyboaVxUS/export?format=xlsx';

async function loadPrices() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(SHEET_URL, { cache: 'no-cache', signal: controller.signal });
    if (!response.ok) throw new Error('Таблица недоступна');
    const data = await response.arrayBuffer();
    if (!data.byteLength || data.byteLength > 10000000) throw new Error('Некорректный размер таблицы');

    importScripts('xlsx.mini.min.js', 'sheet-prices.js');
    const workbook = self.XLSX.read(data, { type: 'array', cellFormula: false });
    const result = self.parseSheetPrices(workbook);
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: error.message });
  } finally {
    clearTimeout(timeout);
  }
}

loadPrices();
