const deviceAliases = {
  эпл: 'apple', аппл: 'apple', айфон: 'iphone', айфоны: 'iphone', аифон: 'iphone', ипхон: 'iphone',
  айпад: 'ipad', айпады: 'ipad', ипад: 'ipad', макбук: 'macbook', макбуки: 'macbook', аймак: 'imac',
  самсунг: 'samsung', самсун: 'samsung', гэлэкси: 'galaxy', галакси: 'galaxy', галэкси: 'galaxy',
  сяоми: 'xiaomi', ксиаоми: 'xiaomi', ксяоми: 'xiaomi', шаоми: 'xiaomi', редми: 'redmi', поко: 'poco',
  хонор: 'honor', онор: 'honor', хуавей: 'huawei', хуавэй: 'huawei', хуавеи: 'huawei',
  реалми: 'realme', рилми: 'realme', текно: 'tecno', техно: 'tecno', инфиникс: 'infinix',
  гугл: 'google', пиксель: 'pixel', пиксел: 'pixel', ванплас: 'oneplus', ванплюс: 'oneplus', уанплас: 'oneplus',
  оппо: 'oppo', виво: 'vivo', сони: 'sony', моторола: 'motorola', мото: 'moto', зте: 'zte', нубия: 'nubia',
  мейзу: 'meizu', мейзю: 'meizu', блэквью: 'blackview', блеквью: 'blackview', укител: 'oukitel',
  насинг: 'nothing', натинг: 'nothing', асус: 'asus', ацер: 'acer', эйсер: 'acer', леново: 'lenovo',
  делл: 'dell', дел: 'dell', эйчпи: 'hp', хп: 'hp', мси: 'msi', мак: 'mac', эйр: 'air', аир: 'air',
  вивобук: 'vivobook', зенбук: 'zenbook', синкпад: 'thinkpad', тинкпад: 'thinkpad', идеапад: 'ideapad',
  легион: 'legion', мейтбук: 'matebook', эирподс: 'airpods', эйрподс: 'airpods',
  вотч: 'watch', плейстейшен: 'playstation', плейстейшн: 'playstation', пс: 'ps', иксбокс: 'xbox', нинтендо: 'nintendo',
  про: 'pro', макс: 'max', плюс: 'plus', ультра: 'ultra', мини: 'mini', лайт: 'lite', лите: 'lite',
  ноутбук: 'laptop', ноутбуки: 'laptop', смартфон: 'phone', смартфоны: 'phone', телефон: 'phone', телефоны: 'phone',
  планшеты: 'планшет', моноблоки: 'моноблок', компьютеры: 'компьютер', приставки: 'приставка',
  джойстики: 'джойстик', геймпады: 'геймпад', колонки: 'колонка', пылесосы: 'пылесос',
};

const modelCodeLetters = { а: 'a', с: 's', м: 'm', р: 'p', х: 'x', е: 'e', в: 'v', з: 'z', г: 'g', й: 'y', т: 't', ф: 'f' };
const latinKeys = 'qwertyuiop[]asdfghjkl;\'zxcvbnm,.';
const russianKeys = 'йцукенгшщзхъфывапролджэячсмитьбю';
const aliasEntries = Object.entries(deviceAliases);
const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
let indexedModels = [];

function modelSearchText(value) {
  const words = String(value || '').toLowerCase().replaceAll('ё', 'е')
    .replaceAll('+', ' plus ').replace(/[^a-zа-я0-9]+/g, ' ')
    .replace(/([a-zа-я])(?=\d)|(\d)(?=[a-zа-я])/g, '$& ')
    .trim().split(/ +/);
  const isRedmi = words.some(word => word === 'redmi' || word === 'редми');
  return words.map((word, index) => {
    if (word === 'ноут') return isRedmi ? 'note' : 'laptop';
    if (/^\d/.test(words[index + 1] || '') && owns(modelCodeLetters, word)) return modelCodeLetters[word];
    return owns(deviceAliases, word) ? deviceAliases[word] : word;
  }).join(' ');
}

function swapSearchLayout(value) {
  const lower = value.toLowerCase();
  const from = /[а-я]/.test(lower) ? russianKeys : latinKeys;
  const to = from === russianKeys ? latinKeys : russianKeys;
  return Array.from(lower, char => to[from.indexOf(char)] || char).join('');
}

function indexModels(models, displayName) {
  indexedModels = models.map(item => {
    const label = modelSearchText(displayName(item));
    const model = modelSearchText(item.model);
    const aliases = String(item.aliases || '').split(/[,;]+/).map(modelSearchText).filter(Boolean);
    const text = [label, modelSearchText(item.brand), ...aliases, item.kind || 'phone'].join(' ');
    const tokens = text.trim().split(/ +/);
    return { item, label, model, aliases, tokens, words: new Set(tokens) };
  });
}

function oneTypingError(a, b) {
  if (a === b || Math.abs(a.length - b.length) > 1 || !/[a-z]{4}|[а-я]{4}/.test(a) || /\d/.test(a + b)) return false;
  if (a.length > b.length) [a, b] = [b, a];
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  if (a.length !== b.length) return a.slice(i) === b.slice(i + 1);
  return a.slice(i + 1) === b.slice(i + 1) ||
    (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
}

function findModels(value, limit = 7) {
  const query = modelSearchText(value);
  if (!query) return [];
  const layoutQuery = modelSearchText(swapSearchLayout(value));

  function rank(search, allowTypo) {
    const terms = search.split(' ').map(term => ({
      term,
      corrections: allowTypo ? aliasEntries.filter(([alias]) => oneTypingError(term, alias)).map(([, canonical]) => canonical) : [],
    }));
    const ranked = [];
    for (const entry of indexedModels) {
      let score = 0;
      let misses = 0;
      for (const { term, corrections } of terms) {
        if (entry.words.has(term)) continue;
        if (term.length >= 3 && !/^\d/.test(term) && entry.tokens.some(word => word.startsWith(term))) {
          score += 2;
        } else if (allowTypo && !misses && (corrections.some(word => entry.words.has(word)) || entry.tokens.some(word => oneTypingError(term, word)))) {
          misses++;
          score += 8;
        } else {
          score = Infinity;
          break;
        }
      }
      if (!Number.isFinite(score)) continue;
      const exact = entry.model === search || entry.label === search;
      if (!exact) score += entry.aliases.includes(search) ? 1 : entry.model.startsWith(search + ' ') || entry.label.startsWith(search + ' ') ? 3 : 5;
      ranked.push({ item: entry.item, label: entry.label, exact, score });
    }
    ranked.sort((a, b) => a.score - b.score || a.label.length - b.label.length);
    const unique = new Map();
    for (const match of ranked) {
      if (!unique.has(match.label)) unique.set(match.label, match);
      if (unique.size === limit) break;
    }
    return [...unique.values()];
  }

  const direct = rank(query, false);
  if (direct.length) return direct;
  const corrected = layoutQuery !== query ? rank(layoutQuery, false) : [];
  return corrected.length ? corrected : rank(query, true);
}
