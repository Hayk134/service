(() => {
  const section = document.getElementById('offers');
  const grid = document.getElementById('offersGrid');
  const dialog = document.getElementById('offerDialog');
  const calculator = document.getElementById('calculator');
  const rostovDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit'
  });
  let rows = [];
  let worker = null;
  let lastAttempt = 0;
  let timeout;

  function isoDate(value) {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 2958465) {
      return new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000).toISOString().slice(0, 10);
    }
    if (typeof value !== 'string') return null;
    const input = value.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input) || /^(\d{2})[./](\d{2})[./](\d{4})$/.exec(input);
    if (!match) return null;
    const [year, month, day] = match[1].length === 4 ? match.slice(1) : [match[3], match[2], match[1]];
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    const result = `${year}-${month}-${day}`;
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === result ? result : null;
  }

  function showOfferDialog(title) {
    const message = 'Здравствуйте! Хочу уточнить условия акции «' + title + '».';
    const encoded = encodeURIComponent(message);
    document.getElementById('offerDialogName').textContent = title;
    document.getElementById('offerTelegram').href = 'https://t.me/good_service161?text=' + encoded;
    document.getElementById('offerMax').href = 'https://max.ru/:share?text=' + encoded;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else window.open('https://t.me/good_service161?text=' + encoded, '_blank', 'noopener,noreferrer');
  }

  function render() {
    const today = rostovDate.format(new Date());
    const active = [];
    for (const row of rows) {
      const [enabled, title, description, label, end] = row;
      const clean = value => typeof value === 'string' ? value.trim() : '';
      if (clean(enabled).toLowerCase() !== 'да' || !clean(title) || !clean(description)) continue;
      const endDate = end === null || end === undefined || end === '' ? '' : isoDate(end);
      if (endDate === null || (endDate && endDate < today)) continue;
      active.push({ title: clean(title), description: clean(description), label: clean(label) || 'Уточнить условия', endDate });
      if (active.length === 3) break;
    }
    grid.replaceChildren();
    for (const offer of active) {
      const card = document.createElement('article');
      card.className = 'offer-card';
      const label = document.createElement('span');
      label.className = 'offer-badge';
      label.textContent = offer.endDate ? 'До ' + offer.endDate.split('-').reverse().join('.') + ' включительно' : 'Акция';
      const title = document.createElement('h3');
      title.textContent = offer.title;
      const description = document.createElement('p');
      description.textContent = offer.description;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn-pill btn-pill-primary offer-button';
      button.textContent = offer.label;
      button.addEventListener('click', () => showOfferDialog(offer.title));
      card.append(label, title, description, button);
      grid.appendChild(card);
    }
    section.hidden = !active.length;
  }

  function load() {
    if (worker || Date.now() - lastAttempt < 60000) return;
    lastAttempt = Date.now();
    try {
      worker = new Worker('js/offers-worker.js');
      timeout = setTimeout(() => finish(), 15000);
      worker.onmessage = event => finish(event.data.rows);
      worker.onerror = () => finish();
    } catch {
      finish();
    }
  }

  function finish(result) {
    clearTimeout(timeout);
    worker?.terminate();
    worker = null;
    if (Array.isArray(result)) rows = result;
    render();
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        load();
      }
    }, { rootMargin: '400px 0px' });
    observer.observe(calculator);
    calculator.addEventListener('focusin', load, { once: true });
  } else {
    load();
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && lastAttempt) {
      render();
      load();
    }
  });
  setInterval(() => {
    if (!document.hidden && lastAttempt) {
      render();
      load();
    }
  }, 300000);
})();
