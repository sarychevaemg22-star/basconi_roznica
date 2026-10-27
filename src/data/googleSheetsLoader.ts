// Загрузка данных из Google Sheets
// Таблица: https://docs.google.com/spreadsheets/d/1DnKzl93Uw7X_a4T6EoHvU5CHDsrE-JnfXmB6J5SnDLs/edit?pli=1&gid=358257747#gid=358257747

export const SPREADSHEET_ID = '1DnKzl93Uw7X_a4T6EoHvU5CHDsrE-JnfXmB6J5SnDLs';
export const GID = '358257747';

// URL для получения данных в формате CSV (работает для публичных таблиц через CORS)
export const CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;

// Альтернативный URL через export (может блокироваться CORS)
export const EXPORT_CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;

export interface SaleRecord {
  Магазин: string;
  Дата: string;
  Чек: string;
  КартаКлиента: string;
  Продавец: string;
  Номенклатура: string;
  Характеристика: string;
  Количество: number;
  Цена: number;
  Сумма: number;
  Суммаавт: number;
  Суммаруч: number;
  год: number;
  неделя: number;
  День: number;
  месяц: number;
  скидкаавтомат: number;
  Скидкаручная: number;
  Деньнедели: string;
  Чеки: number;
  Колвоуникальныхчеков: number;
  уникчекинеделя: number;
  Естьдопскидка: string;
  Суммачека: number;
  Базоваявыручка: number;
  Группа: string;
}

// Парсинг CSV строки
function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        if (char === '\r') i++; // skip \n after \r
      } else {
        currentField += char;
      }
    }
  }

  // Last field
  currentRow.push(currentField.trim());
  if (currentRow.some(f => f !== '')) {
    rows.push(currentRow);
  }

  return rows;
}

// Нормализация заголовков (убираем пробелы, спецсимволы)
function normalizeHeader(header: string): string {
  return header
    .trim()
    .replace(/\s+/g, '')
    .replace(/[«»""]/g, '')
    .replace(/[-–]/g, '');
}

// Маппинг заголовков из таблицы к полям
const HEADER_MAP: Record<string, keyof SaleRecord> = {
  'Магазин': 'Магазин',
  'Дата': 'Дата',
  'Чек': 'Чек',
  'Картаклиента': 'КартаКлиента',
  'Продавец': 'Продавец',
  'Номенклатура': 'Номенклатура',
  'Характеристика': 'Характеристика',
  'Количество': 'Количество',
  'Цена': 'Цена',
  'Сумма': 'Сумма',
  'Суммаавт': 'Суммаавт',
  'Суммаавт.': 'Суммаавт',
  'Суммаруч': 'Суммаруч',
  'Суммаруч.': 'Суммаруч',
  'год': 'год',
  'неделя': 'неделя',
  'День': 'День',
  'день': 'День',
  'месяц': 'месяц',
  'скидкаавтомат': 'скидкаавтомат',
  'Скидкаавтомат': 'скидкаавтомат',
  'Скидаручная': 'Скидкаручная',
  'Скидкаручная': 'Скидкаручная',
  'скидкаручная': 'Скидкаручная',
  'Деньнедели': 'Деньнедели',
  'Чеки': 'Чеки',
  'Колвоуникальныхчеков': 'Колвоуникальныхчеков',
  'Количествоуникальныхчеков': 'Колвоуникальныхчеков',
  'уникчекинеделя': 'уникчекинеделя',
  'Естьдопскидка': 'Естьдопскидка',
  'Естьдопскидка?': 'Естьдопскидка',
  'Суммачека': 'Суммачека',
  'Базоваявыручка': 'Базоваявыручка',
  'Группа': 'Группа',
};

function parseNumber(val: string): number {
  if (!val || val === '-' || val === '') return 0;
  // Убираем пробелы как разделители тысяч, заменяем запятую на точку
  const cleaned = val.replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseDate(dateStr: string): { год: number; месяц: number; День: number; неделя: number; Деньнедели: string } {
  // Пробуем разные форматы даты
  const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  
  // Формат DD.MM.YYYY или DD/MM/YYYY
  let match = dateStr.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = parseInt(match[3]);
    const date = new Date(year, month - 1, day);
    const startOfYear = new Date(year, 0, 1);
    const diff = date.getTime() - startOfYear.getTime();
    const week = Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7);
    return {
      год: year,
      месяц: month,
      День: day,
      неделя: week,
      Деньнедели: daysOfWeek[date.getDay()],
    };
  }

  // Формат YYYY-MM-DD
  match = dateStr.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (match) {
    const year = parseInt(match[1]);
    const month = parseInt(match[2]);
    const day = parseInt(match[3]);
    const date = new Date(year, month - 1, day);
    const startOfYear = new Date(year, 0, 1);
    const diff = date.getTime() - startOfYear.getTime();
    const week = Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7);
    return {
      год: year,
      месяц: month,
      День: day,
      неделя: week,
      Деньнедели: daysOfWeek[date.getDay()],
    };
  }

  return { год: 0, месяц: 0, День: 0, неделя: 0, Деньнедели: '' };
}

export function parseCSVToRecords(csvText: string): SaleRecord[] {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const normalizedHeaders = headers.map(normalizeHeader);

  // Маппинг индексов колонок
  const colMap: Partial<Record<keyof SaleRecord, number>> = {};
  normalizedHeaders.forEach((header, index) => {
    const mapped = HEADER_MAP[header];
    if (mapped) {
      colMap[mapped] = index;
    }
  });

  const records: SaleRecord[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every(cell => cell === '')) continue;

    const get = (field: keyof SaleRecord): string => {
      const idx = colMap[field];
      if (idx === undefined || idx >= row.length) return '';
      return row[idx] || '';
    };

    const getNum = (field: keyof SaleRecord): number => parseNumber(get(field));

    // Парсим дату
    const dateStr = get('Дата');
    const dateInfo = parseDate(dateStr);

    const record: SaleRecord = {
      Магазин: get('Магазин'),
      Дата: dateStr,
      Чек: get('Чек'),
      КартаКлиента: get('КартаКлиента'),
      Продавец: get('Продавец'),
      Номенклатура: get('Номенклатура'),
      Характеристика: get('Характеристика'),
      Количество: getNum('Количество'),
      Цена: getNum('Цена'),
      Сумма: getNum('Сумма'),
      Суммаавт: getNum('Суммаавт'),
      Суммаруч: getNum('Суммаруч'),
      год: dateInfo.год || getNum('год'),
      неделя: dateInfo.неделя || getNum('неделя'),
      День: dateInfo.День || getNum('День'),
      месяц: dateInfo.месяц || getNum('месяц'),
      скидкаавтомат: getNum('скидкаавтомат'),
      Скидкаручная: getNum('Скидкаручная'),
      Деньнедели: dateInfo.Деньнедели || get('Деньнедели'),
      Чеки: getNum('Чеки'),
      Колвоуникальныхчеков: getNum('Колвоуникальныхчеков'),
      уникчекинеделя: getNum('уникчекинеделя'),
      Естьдопскидка: get('Естьдопскидка'),
      Суммачека: getNum('Суммачека'),
      Базоваявыручка: getNum('Базоваявыручка'),
      Группа: get('Группа'),
    };

    // Пропускаем пустые записи
    if (!record.Чек && !record.Номенклатура && record.Сумма === 0) continue;

    records.push(record);
  }

  return records;
}

// Загрузка данных из Google Sheets
export async function loadFromGoogleSheets(): Promise<SaleRecord[]> {
  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const csvText = await response.text();
    
    // Проверяем, что это не HTML страница ошибки
    if (csvText.trim().startsWith('<!') || csvText.trim().startsWith('<html')) {
      throw new Error('Таблица не опубликована для доступа по ссылке');
    }
    
    const records = parseCSVToRecords(csvText);
    if (records.length === 0) {
      throw new Error('Не удалось распарсить данные из таблицы');
    }
    return records;
  } catch (error) {
    console.error('Ошибка загрузки из Google Sheets:', error);
    throw error;
  }
}

// Загрузка из файла (fallback)
export function parseFileContent(content: string): SaleRecord[] {
  return parseCSVToRecords(content);
}
