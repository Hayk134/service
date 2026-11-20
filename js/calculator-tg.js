const issues = ['Разбит экран', 'Быстро разряжается', 'Не заряжается', 'Не включается', 'Проблема со звуком', 'Попадание влаги'];
let models = [], selectedModel = null, selectedIssue = '', customProblem = '';
let manualModel = false;
let selectedOffer = '';
let priceIndex = new Map();
let catalogLoading = true;
let pricesLoading = true;
const $ = id => document.getElementById(id);
const normalize = value => String(value || '').toLowerCase().replace(/ё/g, 'е').replace(/\+/g, ' plus ').replace(/[^a-zа-я0-9]+/g, ' ').trim();
const deviceName = item => item.model.toLowerCase().startsWith(item.brand.toLowerCase()) ? item.model : `${item.brand} ${item.model}`;
const modelKey = item => normalize(item.brand) + '|' + normalize(item.model);
const catalogKey = item => modelSearchText(deviceName(item));
const priceKey = (item, issue) => modelKey(item) + '|' + normalize(issue);

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
  const row = priceIndex.get(priceKey(selectedModel, selectedIssue));
  return row && Number.isFinite(Number(row.price)) && Number(row.price) > 0 ? row : null;
}
function message(topic) {
  const parts = ['Здравствуйте! Хочу уточнить стоимость ремонта в GoodService.'];
  if (topic) parts.push(topic);
  if (selectedModel) parts.push('Устройство: ' + deviceName(selectedModel));
  else if ($('calcGlobalSearchInput').value.trim()) parts.push('Устройство: ' + $('calcGlobalSearchInput').value.trim());
  if (customProblem) parts.push('Проблема: ' + customProblem);
  else if (selectedIssue) parts.push('Проблема: ' + selectedIssue);
  if (selectedOffer) parts.push('Выбранная акция: ' + selectedOffer);
  const price = getPriceRecord();
  if (price) parts.push('Ориентировочная стоимость работы: ' + (price.from ? 'от ' : '≈ ') + Number(price.price).toLocaleString('ru-RU') + ' ₽');
  return parts.join('\n');
}
function updateResult() {
  const input = $('calcGlobalSearchInput').value.trim();
  $('resDeviceLine').textContent = selectedModel ? deviceName(selectedModel) : input || 'Устройство не указано';
  $('resServiceLine').textContent = customProblem || selectedIssue || 'Выберите неисправность';
  const price = getPriceRecord();
  $('resPriceNum').textContent = price ? (price.from ? 'от ' : '≈ ') + Number(price.price).toLocaleString('ru-RU') + ' ₽' : pricesLoading && selectedModel && selectedIssue ? 'Загружаем цены…' : 'Уточните у мастера';
  const text = encodeURIComponent(message());
  $('btnDirectTelegram').href = 'https://t.me/good_service161?text=' + text;
}
window.setSelectedOffer = function(title) {
  selectedOffer = title || '';
  $('selectedOffer').hidden = !selectedOffer;
  $('selectedOfferName').textContent = selectedOffer;
  updateResult();
};
function acceptModel(item = null) {
  selectedModel = item;
  manualModel = !item;
  if (item) $('calcGlobalSearchInput').value = deviceName(item);
  $('calcLiveDropdown').hidden = true;
  updateResult();
  $('calcIssueTitle').focus({ preventScroll: true });
}

function renderSuggestions(value) {
  const dropdown = $('calcLiveDropdown');
  dropdown.replaceChildren();
  if (!value.trim()) {
    dropdown.hidden = true;
    return;
  }
  const matches = findModels(value);
  if (!matches.length) {
    const empty = document.createElement('div');
    empty.className = 'calc-live-empty';
    empty.textContent = catalogLoading ? 'Загружаем список моделей…' : 'Модели нет в списке. Мастер уточнит стоимость по заявке.';
    dropdown.appendChild(empty);
  }
  for (const { item } of matches) {
    addSuggestion(deviceName(item), () => acceptModel(item));
  }
  addSuggestion('Продолжить с введённой моделью', () => acceptModel(), true);
  dropdown.hidden = false;

  function addSuggestion(label, select, manual = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'calc-live-result-item model-suggestion';
    if (manual) button.classList.add('model-suggestion-manual');
    button.textContent = label;
    button.addEventListener('click', select);
    dropdown.appendChild(button);
  }
}
function selectCustomProblem() { $('customProblemCard').classList.add('active'); }
function handleCustomProblemInput(value) { customProblem = value.trim(); if (customProblem) selectedIssue = ''; renderIssues(); updateResult(); }
function clearGlobalSearch() {
  $('calcGlobalSearchInput').value = '';
  selectedModel = null;
  manualModel = false;
  $('calcLiveDropdown').hidden = true;
  $('calcSearchClearBtn').style.display = 'none';
  updateResult();
  $('calcGlobalSearchInput').focus();
}
window.openDirectChat = function(topic) { window.open('https://t.me/good_service161?text=' + encodeURIComponent(message(topic)), '_blank', 'noopener,noreferrer'); };
function setupMessengerDialog(service) {
  const isMax = service === 'max';
  const button = $(isMax ? 'btnDirectMaxi' : 'btnDirectTelegram');
  const dialog = $(service + 'Dialog');
  if (typeof dialog.showModal !== 'function') return;

  const draft = $(service + 'Message');
  const status = $(service + 'CopyStatus');
  const chat = $(service + 'Chat');
  if (isMax) chat.href = button.href;
  button.setAttribute('aria-haspopup', 'dialog');
  button.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    draft.value = message();
    if (!isMax) chat.href = 'https://t.me/good_service161?text=' + encodeURIComponent(draft.value);
    status.textContent = '';
    dialog.showModal();
  });
  $(service + 'Copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(draft.value);
      status.textContent = 'Текст скопирован. Откройте чат GoodService и вставьте сообщение.';
    } catch {
      draft.focus();
      draft.select();
      status.textContent = 'Скопируйте выделенный текст, затем вставьте его в чате GoodService.';
    }
  });
}

function startCatalog(input, calculator) {
  let started = false;
  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) start();
      }, { rootMargin: '240px 0px' })
    : null;

  function refresh() {
    if (!selectedModel && !manualModel && !suggestions.hidden && document.activeElement === input) renderSuggestions(input.value);
    updateResult();
  }

  function mergeModels(incoming, preferred) {
    const entries = preferred ? [...models, ...incoming] : [...incoming, ...models];
    const merged = new Map();
    for (const item of entries) {
      const key = catalogKey(item);
      const previous = merged.get(key);
      const aliases = [previous?.aliases, item.aliases].filter(Boolean).join(', ');
      merged.set(key, { ...previous, ...item, aliases });
    }
    models = [...merged.values()];
    if (selectedModel) selectedModel = merged.get(catalogKey(selectedModel)) || selectedModel;
    indexModels(models, deviceName);
  }

  async function loadLocalModels() {
    try {
      const response = await fetch('data/models.json');
      if (response.ok) mergeModels(await response.json(), false);
    } catch {
      // A customer can still enter a model by hand.
    } finally {
      catalogLoading = false;
      refresh();
    }
  }

  function start() {
    if (started) return;
    started = true;
    observer?.disconnect();
    loadLocalModels();
    loadLivePrices(mergeModels, refresh);
  }

  calculator.addEventListener('focusin', start, { once: true });
  if (observer) observer.observe(calculator);
  else start();
}

function loadLivePrices(mergeModels, refresh) {
  let worker;
  let timeout;

  function finish(result) {
    clearTimeout(timeout);
    worker?.terminate();
    if (result) {
      mergeModels(result.models, true);
      priceIndex = new Map(result.prices.map(row => [priceKey(row, row.issue), row]));
    } else {
      $('priceUpdated').textContent = 'Цены временно недоступны. Уточните у мастера.';
    }
    pricesLoading = false;
    refresh();
  }

  try {
    worker = new Worker('js/price-worker.js');
    timeout = setTimeout(() => finish(), 15000);
    worker.onmessage = ({ data }) => finish(data.result);
    worker.onerror = () => finish();
  } catch {
    finish();
  }
}

const searchInput = $('calcGlobalSearchInput');
const suggestions = $('calcLiveDropdown');
renderIssues();
updateResult();
setupMessengerDialog('max');
setupMessengerDialog('telegram');
$('clearSelectedOffer').addEventListener('click', () => window.setSelectedOffer(''));
startCatalog(searchInput, $('calculator'));
searchInput.addEventListener('input', () => {
  selectedModel = null;
  manualModel = false;
  $('calcSearchClearBtn').style.display = searchInput.value ? 'flex' : 'none';
  renderSuggestions(searchInput.value);
  updateResult();
});
searchInput.addEventListener('focus', () => {
  if (!selectedModel && !manualModel) renderSuggestions(searchInput.value);
});
searchInput.addEventListener('keydown', event => {
  if (event.isComposing) return;
  if (event.key === 'ArrowDown' && !suggestions.hidden) {
    event.preventDefault();
    suggestions.querySelector('button')?.focus();
  } else if (event.key === 'Enter' && searchInput.value.trim()) {
    event.preventDefault();
    if (selectedModel || manualModel) {
      $('calcIssueTitle').focus({ preventScroll: true });
      return;
    }
    const exact = findModels(searchInput.value).filter(match => match.exact);
    acceptModel(exact.length === 1 ? exact[0].item : null);
  }
});
suggestions.closest('.calc-search-engine-wrap').addEventListener('keydown', event => {
  if (event.key === 'Escape' && !suggestions.hidden) {
    event.preventDefault();
    searchInput.focus();
    suggestions.hidden = true;
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.calc-search-engine-wrap')) suggestions.hidden = true;
});
