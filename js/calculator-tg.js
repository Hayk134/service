const MAX_URL = 'https://max.ru/u/f9LHodD0cOLmx9khVkXjQy_EYaKk7mGxK-8x_1GXfViMjwrmJvpe3ZB1IVQ';
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/18DT8BvQXQn9NQDQmUFHgQBaiyboaVxUS/export?format=xlsx';
const issues = ['Разбит экран', 'Быстро разряжается', 'Не заряжается', 'Не включается', 'Проблема со звуком', 'Попадание влаги'];
let models = [], prices = [], selectedModel = null, selectedIssue = '', customProblem = '';
let pricesLoading = true;
const $ = id => document.getElementById(id);
const normalize = value => String(value || '').toLowerCase().replace(/ё/g, 'е').replace(/\+/g, ' plus ').replace(/[^a-zа-я0-9]+/g, ' ').trim();
const transliterate = value => normalize(value).replace(/айфон/g, 'iphone').replace(/самсунг/g, 'samsung').replace(/сяоми/g, 'xiaomi').replace(/редми/g, 'redmi').replace(/поко/g, 'poco').replace(/хонор/g, 'honor').replace(/хуавей/g, 'huawei').replace(/реалми/g, 'realme');
const deviceName = item => item.model.toLowerCase().startsWith(item.brand.toLowerCase()) ? item.model : `${item.brand} ${item.model}`;

function renderIssues() {
  const grid = $('calcServicesGrid');
  grid.replaceChildren();
  issues.forEach(issue => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'service-pick-card issue-button' + (selectedIssue === issue && !customProblem ? ' active' : '');
    button.textContent = issue;
    button.setAttribute('aria-pressed', String(selectedIssue === issue && !customProblem));
    button.addEventListener('click', () => { selectedIssue = issue; customProblem = ''; $('customProblemInput').value = ''; $('customProblemCard').classList.remove('active'); renderIssues(); updateResult(); });
    grid.appendChild(button);
  });
}
function getPriceRecord() {
  if (!selectedModel || !selectedIssue || customProblem) return null;
  const row = prices.find(item => normalize(item.brand) === normalize(selectedModel.brand) && normalize(item.model) === normalize(selectedModel.model) && normalize(item.issue) === normalize(selectedIssue));
  return row && Number.isFinite(Number(row.price)) && Number(row.price) > 0 ? row : null;
}
function message(topic) {
  const parts = ['Здравствуйте! Хочу уточнить стоимость ремонта в GoodService.'];
  if (topic) parts.push(topic);
  if (selectedModel) parts.push('Устройство: ' + deviceName(selectedModel));
  else if ($('calcGlobalSearchInput').value.trim()) parts.push('Устройство: ' + $('calcGlobalSearchInput').value.trim());
  if (customProblem) parts.push('Проблема: ' + customProblem);
  else if (selectedIssue) parts.push('Проблема: ' + selectedIssue);
  const price = getPriceRecord();
  if (price) parts.push('Ориентировочная стоимость работы: ' + (price.from ? 'от ' : '≈ ') + Number(price.price).toLocaleString('ru-RU') + ' ₽');
  return parts.join('\n');
}
function updateResult() {
  const input = $('calcGlobalSearchInput').value.trim();
  $('resDeviceLine').textContent = selectedModel ? deviceName(selectedModel) : input || 'Устройство не указано';
  $('resServiceLine').textContent = customProblem || selectedIssue || 'Выберите неисправность';
  const price = getPriceRecord();
  $('resPriceNum').textContent = price ? (price.from ? 'от ' : '≈ ') + Number(price.price).toLocaleString('ru-RU') + ' ₽' : pricesLoading ? 'Загружаем цены…' : 'Уточните у мастера';
  const text = encodeURIComponent(message());
  $('btnDirectTelegram').href = 'https://t.me/good_service161?text=' + text;
  $('btnDirectMaxi').href = MAX_URL + '?text=' + text;
}
function itemLength(item) { return item.model.length; }
function renderSuggestions(value) {
  const dropdown = $('calcLiveDropdown');
  dropdown.replaceChildren();
  const query = transliterate(value);
  if (!query) { dropdown.style.display = 'none'; return; }
  const terms = query.split(' ');
  const matches = models.filter(item => { const haystack = transliterate(`${item.brand} ${item.model} ${item.aliases || ''}`); return terms.every(term => haystack.includes(term)); }).sort((a, b) => { const score = item => transliterate(item.model) === query || transliterate(deviceName(item)) === query ? 0 : transliterate(item.model).startsWith(query) ? 1 : 2; return score(a) - score(b) || itemLength(a) - itemLength(b); }).slice(0, 8);
  if (!matches.length) {
    const empty = document.createElement('div'); empty.className = 'calc-live-empty'; empty.textContent = 'Модель не найдена. Укажите её в поле и опишите проблему — мастер поможет.'; dropdown.appendChild(empty);
  } else matches.forEach(item => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'calc-live-result-item model-suggestion'; button.textContent = deviceName(item);
    button.addEventListener('click', () => { selectedModel = item; $('calcGlobalSearchInput').value = deviceName(item); dropdown.style.display = 'none'; updateResult(); });
    dropdown.appendChild(button);
  });
  dropdown.style.display = 'flex';
}
function selectCustomProblem() { $('customProblemCard').classList.add('active'); }
function handleCustomProblemInput(value) { customProblem = value.trim(); if (customProblem) selectedIssue = ''; renderIssues(); updateResult(); }
function clearGlobalSearch() { $('calcGlobalSearchInput').value = ''; selectedModel = null; $('calcLiveDropdown').style.display = 'none'; $('calcSearchClearBtn').style.display = 'none'; updateResult(); $('calcGlobalSearchInput').focus(); }
window.openDirectChat = function(topic) { window.open('https://t.me/good_service161?text=' + encodeURIComponent(message(topic)), '_blank', 'noopener,noreferrer'); };
document.addEventListener('DOMContentLoaded', async () => {
  renderIssues(); updateResult();
  const input = $('calcGlobalSearchInput');
  input.addEventListener('input', () => { selectedModel = null; $('calcSearchClearBtn').style.display = input.value ? 'flex' : 'none'; renderSuggestions(input.value); updateResult(); });
  document.addEventListener('click', event => { if (!event.target.closest('.calc-search-engine-wrap')) $('calcLiveDropdown').style.display = 'none'; });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    if (typeof XLSX === 'undefined' || typeof parseSheetPrices !== 'function') throw new Error('Не загружен модуль таблицы');
    const response = await fetch(SHEET_URL, { cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error('Таблица недоступна');
    const data = await response.arrayBuffer();
    if (!data.byteLength || data.byteLength > 10000000) throw new Error('Некорректный размер таблицы');
    const result = parseSheetPrices(XLSX.read(data, { type: 'array', cellFormula: false }));
    models = result.models;
    prices = result.prices;
    $('priceUpdated').textContent = 'Цены загружены из Google Таблицы.';
  } catch (error) {
    console.warn('Цены из таблицы недоступны:', error);
    $('priceUpdated').textContent = 'Цены временно недоступны. Уточните у мастера.';
    try {
      const fallback = await fetch('data/models.json');
      if (fallback.ok) models = await fallback.json();
    } catch (_) { /* The visitor can still enter a model and contact the master. */ }
  } finally {
    clearTimeout(timeout);
    pricesLoading = false;
    if (input.value) renderSuggestions(input.value);
    updateResult();
  }
});
