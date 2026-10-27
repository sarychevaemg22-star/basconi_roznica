// Демо-данные на основе структуры отчета из Google Sheets
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
  Группа: string;
}

const shops = ['Магазин №1', 'Магазин №2', 'Магазин №3'];
const sellers = ['Иванова А.', 'Петрова М.', 'Сидорова Е.', 'Козлова Н.'];
const groups = [
  'Верхняя одежда',
  'Платья',
  'Блузы и рубашки',
  'Брюки и юбки',
  'Трикотаж',
  'Аксессуары',
  'Обувь',
  'Детская одежда',
];
const items: Record<string, string[]> = {
  'Верхняя одежда': ['Куртка зимняя', 'Пальто', 'Жилет', 'Плащ'],
  'Платья': ['Платье вечернее', 'Платье повседневное', 'Сарафан', 'Комбинезон'],
  'Блузы и рубашки': ['Блуза шёлковая', 'Рубашка', 'Топ', 'Туника'],
  'Брюки и юбки': ['Брюки классические', 'Юбка миди', 'Джинсы', 'Шорты'],
  'Трикотаж': ['Свитер', 'Кардиган', 'Джемпер', 'Водолазка'],
  'Аксессуары': ['Шарф', 'Сумка', 'Ремень', 'Перчатки'],
  'Обувь': ['Ботинки', 'Сапоги', 'Туфли', 'Кроссовки'],
  'Детская одежда': ['Куртка детская', 'Комплект', 'Платье детское', 'Штаны'],
};
const characteristics = ['Размер S', 'Размер M', 'Размер L', 'Размер XL', 'Размер XXL', 'Чёрный', 'Синий', 'Красный', 'Бежевый', 'Серый'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateData(): SaleRecord[] {
  const records: SaleRecord[] = [];
  const daysOfWeek = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  
  // Генерируем данные за 2024 и 2025 годы
  const years = [2024, 2025];
  let checkCounter = 1;
  
  for (const year of years) {
    const maxMonth = year === 2025 ? 6 : 12;
    for (let month = 1; month <= maxMonth; month++) {
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const date = new Date(year, month - 1, day);
        const dayOfWeek = daysOfWeek[date.getDay() === 0 ? 6 : date.getDay() - 1];
        
        // Количество чеков в день (5-25)
        const checksPerDay = Math.floor(Math.random() * 20) + 5;
        
        for (let c = 0; c < checksPerDay; c++) {
          const shop = randomChoice(shops);
          const seller = randomChoice(sellers);
          const checkId = `Ч-${String(checkCounter).padStart(6, '0')}`;
          checkCounter++;
          
          // Позиций в чеке (1-5)
          const itemsInCheck = Math.floor(Math.random() * 5) + 1;
          
          for (let i = 0; i < itemsInCheck; i++) {
            const group = randomChoice(groups);
            const item = randomChoice(items[group]);
            const char = randomChoice(characteristics);
            const qty = Math.floor(Math.random() * 3) + 1;
            const price = Math.floor(Math.random() * 15000) + 1500;
            const sum = qty * price;
            const discountAuto = Math.random() > 0.7 ? Math.floor(sum * 0.05) : 0;
            const discountManual = Math.random() > 0.85 ? Math.floor(sum * 0.1) : 0;
            
            // Номер недели
            const startOfYear = new Date(year, 0, 1);
            const diff = date.getTime() - startOfYear.getTime();
            const week = Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7);
            
            records.push({
              Магазин: shop,
              Дата: dateStr,
              Чек: checkId,
              КартаКлиента: Math.random() > 0.4 ? `К-${String(Math.floor(Math.random() * 5000)).padStart(5, '0')}` : '',
              Продавец: seller,
              Номенклатура: item,
              Характеристика: char,
              Количество: qty,
              Цена: price,
              Сумма: sum,
              Суммаавт: sum - discountAuto,
              Суммаруч: sum - discountAuto - discountManual,
              год: year,
              неделя: week,
              День: day,
              месяц: month,
              скидкаавтомат: discountAuto,
              Скидкаручная: discountManual,
              Деньнедели: dayOfWeek,
              Группа: group,
            });
          }
        }
      }
    }
  }
  
  return records;
}

// Генерируем данные один раз
export const salesData: SaleRecord[] = generateData();

// Уникальные значения для фильтров
export const uniqueYears = [...new Set(salesData.map(r => r.год))].sort();
export const uniqueMonths = [...new Set(salesData.map(r => r.месяц))].sort((a, b) => a - b);
export const uniqueDays = [...new Set(salesData.map(r => r.День))].sort((a, b) => a - b);

export const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];
