import { useState, useMemo } from 'react';
import {
  salesData,
  uniqueYears,
  uniqueMonths,
  uniqueDays,
  monthNames,
} from './data/salesData';
import {
  BarChart3,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Filter,
  Calendar,
  PieChart as PieChartIcon,
} from 'lucide-react';

const COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

export default function App() {
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');

  const filteredData = useMemo(() => {
    return salesData.filter((record) => {
      if (selectedYear !== 'all' && record.год !== selectedYear) return false;
      if (selectedMonth !== 'all' && record.месяц !== selectedMonth) return false;
      if (selectedDay !== 'all' && record.День !== selectedDay) return false;
      return true;
    });
  }, [selectedYear, selectedMonth, selectedDay]);

  const metrics = useMemo(() => {
    const uniqueChecks = new Set(filteredData.map((r) => r.Чек)).size;
    const totalSum = filteredData.reduce((acc, r) => acc + r.Суммаруч, 0);
    const avgCheck = uniqueChecks > 0 ? totalSum / uniqueChecks : 0;
    const avgItemsPerCheck = uniqueChecks > 0 ? filteredData.length / uniqueChecks : 0;

    return { uniqueChecks, totalSum, avgCheck, avgItemsPerCheck };
  }, [filteredData]);

  const groupData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredData.forEach((r) => {
      grouped[r.Группа] = (grouped[r.Группа] || 0) + r.Суммаруч;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const monthlyData = useMemo(() => {
    const grouped: Record<string, { sum: number; checks: Set<string> }> = {};
    filteredData.forEach((r) => {
      const key = `${r.год}-${String(r.месяц).padStart(2, '0')}`;
      if (!grouped[key]) grouped[key] = { sum: 0, checks: new Set() };
      grouped[key].sum += r.Суммаруч;
      grouped[key].checks.add(r.Чек);
    });
    return Object.entries(grouped)
      .map(([month, data]) => ({
        month: monthNames[parseInt(month.split('-')[1]) - 1] + ' ' + month.split('-')[0],
        выручка: data.sum,
        чеки: data.checks.size,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredData]);

  const dailyData = useMemo(() => {
    if (selectedYear === 'all' || selectedMonth === 'all') return [];
    const grouped: Record<number, { sum: number; checks: Set<string> }> = {};
    filteredData.forEach((r) => {
      if (!grouped[r.День]) grouped[r.День] = { sum: 0, checks: new Set() };
      grouped[r.День].sum += r.Суммаруч;
      grouped[r.День].checks.add(r.Чек);
    });
    return Object.entries(grouped)
      .map(([day, data]) => ({
        day: parseInt(day),
        выручка: data.sum,
        чеки: data.checks.size,
      }))
      .sort((a, b) => a.day - b.day);
  }, [filteredData, selectedYear, selectedMonth]);

  const topItems = useMemo(() => {
    const grouped: Record<string, { qty: number; sum: number }> = {};
    filteredData.forEach((r) => {
      if (!grouped[r.Номенклатура]) grouped[r.Номенклатура] = { qty: 0, sum: 0 };
      grouped[r.Номенклатура].qty += r.Количество;
      grouped[r.Номенклатура].sum += r.Суммаруч;
    });
    return Object.entries(grouped)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.sum - a.sum)
      .slice(0, 10);
  }, [filteredData]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

  const formatNumber = (val: number) =>
    new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(val);

  const totalGroupSum = groupData.reduce((acc, g) => acc + g.value, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Дашборд продаж</h1>
              <p className="text-xs text-slate-400">Аналитика в реальном времени</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>Данные: {salesData.length.toLocaleString('ru-RU')} записей</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
        {/* Фильтры */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-slate-300">Фильтры</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-slate-400 mb-1 block">Год</label>
              <select
                value={selectedYear === 'all' ? 'all' : selectedYear}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedYear(val === 'all' ? 'all' : parseInt(val));
                  setSelectedMonth('all');
                  setSelectedDay('all');
                }}
                className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Все годы</option>
                {uniqueYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-slate-400 mb-1 block">Месяц</label>
              <select
                value={selectedMonth === 'all' ? 'all' : selectedMonth}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedMonth(val === 'all' ? 'all' : parseInt(val));
                  setSelectedDay('all');
                }}
                className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={selectedYear === 'all'}
              >
                <option value="all">Все месяцы</option>
                {uniqueMonths.map((m) => (
                  <option key={m} value={m}>{monthNames[m - 1]}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-slate-400 mb-1 block">День</label>
              <select
                value={selectedDay === 'all' ? 'all' : selectedDay}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDay(val === 'all' ? 'all' : parseInt(val));
                }}
                className="w-full bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={selectedMonth === 'all'}
              >
                <option value="all">Все дни</option>
                {uniqueDays.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedYear('all');
                  setSelectedMonth('all');
                  setSelectedDay('all');
                }}
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 rounded-lg text-sm text-slate-300 transition-colors"
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>

        {/* KPI карточки */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={<Receipt className="w-5 h-5" />}
            title="Уникальные чеки"
            value={formatNumber(metrics.uniqueChecks)}
            color="from-blue-500 to-cyan-500"
          />
          <KPICard
            icon={<ShoppingCart className="w-5 h-5" />}
            title="Наполняемость чека"
            value={formatNumber(metrics.avgItemsPerCheck) + ' поз.'}
            subtitle={`Средний чек: ${formatCurrency(metrics.avgCheck)}`}
            color="from-purple-500 to-pink-500"
          />
          <KPICard
            icon={<TrendingUp className="w-5 h-5" />}
            title="Общая выручка"
            value={formatCurrency(metrics.totalSum)}
            color="from-emerald-500 to-teal-500"
          />
          <KPICard
            icon={<PieChartIcon className="w-5 h-5" />}
            title="Позиций в отчёте"
            value={formatNumber(filteredData.length)}
            subtitle={`${groupData.length} групп товаров`}
            color="from-orange-500 to-amber-500"
          />
        </div>

        {/* Графики */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Доля по видам товаров - Donut Chart */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-purple-400" />
              Доля по видам товаров
            </h3>
            <DonutChart data={groupData} total={totalGroupSum} />
          </div>

          {/* Доля по видам товаров - Horizontal Bar Chart */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Выручка по группам товаров
            </h3>
            <HorizontalBarChart data={groupData} />
          </div>
        </div>

        {/* Динамика */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Динамика по месяцам */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Динамика выручки по месяцам
            </h3>
            <LineChartSVG data={monthlyData} />
          </div>

          {/* Динамика по дням */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Динамика по дням {selectedMonth !== 'all' ? `(${monthNames[selectedMonth - 1]})` : '(выберите месяц)'}
            </h3>
            {dailyData.length > 0 ? (
              <BarChartSVG data={dailyData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">
                Выберите год и месяц для отображения динамики по дням
              </div>
            )}
          </div>
        </div>

        {/* Топ товаров */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-pink-400" />
            Топ-10 товаров по выручке
          </h3>
          <HorizontalBarChart data={topItems.map((item) => ({ name: item.name, value: item.sum }))} />
        </div>

        {/* Таблица по группам */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Детализация по группам товаров
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Группа</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Выручка</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Доля</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium w-1/3">Визуализация</th>
                </tr>
              </thead>
              <tbody>
                {groupData.map((item, index) => {
                  const share = totalGroupSum > 0 ? (item.value / totalGroupSum) * 100 : 0;
                  return (
                    <tr key={item.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-white">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          {item.name}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-white font-mono">
                        {formatCurrency(item.value)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300">
                        {share.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-full bg-slate-700/50 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${share}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-4 text-xs text-slate-500">
          Дашборд продаж • Данные обновляются автоматически • {new Date().toLocaleDateString('ru-RU')}
        </footer>
      </main>
    </div>
  );
}

/* =================== SVG Charts =================== */

function DonutChart({ data, total }: { data: { name: string; value: number }[]; total: number }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 110;
  const innerR = 65;

  let cumulativeAngle = -Math.PI / 2;

  const slices = data.map((item, index) => {
    const fraction = total > 0 ? item.value / total : 0;
    const angle = fraction * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);
    const x3 = cx + innerR * Math.cos(endAngle);
    const y3 = cy + innerR * Math.sin(endAngle);
    const x4 = cx + innerR * Math.cos(startAngle);
    const y4 = cy + innerR * Math.sin(startAngle);

    const largeArc = angle > Math.PI ? 1 : 0;

    const d = [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ');

    return { d, color: COLORS[index % COLORS.length], item, fraction, index };
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice) => (
          <path
            key={slice.index}
            d={slice.d}
            fill={slice.color}
            opacity={hoveredIndex === null || hoveredIndex === slice.index ? 1 : 0.3}
            onMouseEnter={() => setHoveredIndex(slice.index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="cursor-pointer transition-opacity duration-200"
          />
        ))}
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#94a3b8" fontSize="11">
          Итого
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">
          {formatCurrency(total)}
        </text>
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-3 justify-center max-w-[350px]">
        {data.map((item, index) => (
          <div
            key={item.name}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full cursor-pointer transition-all ${
              hoveredIndex === index ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            <span className="truncate max-w-[100px]">{item.name}</span>
            <span className="text-slate-500">{((item.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBarChart({ data }: { data: { name: string; value: number }[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barHeight = 28;
  const gap = 6;
  const labelWidth = 140;
  const chartWidth = 500;
  const barAreaWidth = chartWidth - labelWidth - 80;
  const svgHeight = data.length * (barHeight + gap) + 10;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="overflow-x-auto">
      <svg width="100%" viewBox={`0 0 ${chartWidth} ${svgHeight}`} className="min-w-[400px]">
        {data.map((item, index) => {
          const y = index * (barHeight + gap) + 5;
          const width = (item.value / maxVal) * barAreaWidth;
          const color = COLORS[index % COLORS.length];
          const isHovered = hoveredIndex === index;

          return (
            <g
              key={item.name}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              <text
                x={labelWidth - 8}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                fill={isHovered ? '#fff' : '#94a3b8'}
                fontSize="11"
              >
                {item.name.length > 18 ? item.name.slice(0, 18) + '…' : item.name}
              </text>
              <rect
                x={labelWidth}
                y={y}
                width={width}
                height={barHeight}
                rx={4}
                fill={color}
                opacity={isHovered ? 1 : 0.8}
                className="transition-all duration-200"
              />
              <text
                x={labelWidth + width + 6}
                y={y + barHeight / 2 + 4}
                fill={isHovered ? '#fff' : '#94a3b8'}
                fontSize="10"
              >
                {formatCurrency(item.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function LineChartSVG({ data }: { data: { month: string; выручка: number; чеки: number }[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  if (data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">Нет данных</div>;
  }

  const width = 500;
  const height = 280;
  const padding = { top: 20, right: 20, bottom: 60, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.выручка), 1);
  const stepX = data.length > 1 ? chartW / (data.length - 1) : chartW;

  const points = data.map((d, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + chartH - (d.выручка / maxVal) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padding.top + chartH - t * chartH,
    label: `${((maxVal * t) / 1000000).toFixed(1)}М`,
  }));

  return (
    <div className="overflow-x-auto">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="min-w-[400px]">
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line x1={padding.left} y1={tick.y} x2={width - padding.right} y2={tick.y} stroke="rgba(255,255,255,0.05)" />
            <text x={padding.left - 8} y={tick.y + 4} textAnchor="end" fill="#64748b" fontSize="10">{tick.label}</text>
          </g>
        ))}

        {/* Area */}
        <path d={areaPath} fill="url(#lineGradient)" opacity={0.3} />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)} className="cursor-pointer">
            <circle cx={p.x} cy={p.y} r={hoveredIndex === i ? 5 : 3} fill="#6366f1" stroke="#1e1b4b" strokeWidth={2} />
            {/* X labels */}
            <text
              x={p.x}
              y={padding.top + chartH + 16}
              textAnchor="end"
              fill="#64748b"
              fontSize="9"
              transform={`rotate(-30, ${p.x}, ${padding.top + chartH + 16})`}
            >
              {p.month}
            </text>
            {/* Tooltip */}
            {hoveredIndex === i && (
              <g>
                <rect
                  x={Math.min(p.x - 60, width - padding.right - 130)}
                  y={Math.max(p.y - 50, padding.top)}
                  width={120}
                  height={40}
                  rx={6}
                  fill="#1e293b"
                  stroke="rgba(255,255,255,0.1)"
                />
                <text
                  x={Math.min(p.x, width - padding.right - 70)}
                  y={Math.max(p.y - 32, padding.top + 18)}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {formatCurrency(p.выручка)}
                </text>
                <text
                  x={Math.min(p.x, width - padding.right - 70)}
                  y={Math.max(p.y - 18, padding.top + 32)}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9"
                >
                  Чеков: {p.чеки}
                </text>
              </g>
            )}
          </g>
        ))}

        {/* Gradient */}
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function BarChartSVG({ data }: { data: { day: number; выручка: number; чеки: number }[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  if (data.length === 0) return null;

  const width = 500;
  const height = 280;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.выручка), 1);
  const barWidth = Math.max((chartW / data.length) * 0.7, 4);
  const gap = (chartW / data.length) * 0.3;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padding.top + chartH - t * chartH,
    label: `${((maxVal * t) / 1000).toFixed(0)}К`,
  }));

  return (
    <div className="overflow-x-auto">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="min-w-[400px]">
        {/* Grid */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line x1={padding.left} y1={tick.y} x2={width - padding.right} y2={tick.y} stroke="rgba(255,255,255,0.05)" />
            <text x={padding.left - 8} y={tick.y + 4} textAnchor="end" fill="#64748b" fontSize="10">{tick.label}</text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const x = padding.left + i * (barWidth + gap) + gap / 2;
          const barH = (d.выручка / maxVal) * chartH;
          const y = padding.top + chartH - barH;
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={d.day}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={2}
                fill={isHovered ? '#fbbf24' : '#f59e0b'}
                opacity={isHovered ? 1 : 0.8}
                className="transition-all duration-150"
              />
              {/* X label */}
              {data.length <= 15 || i % 2 === 0 ? (
                <text x={x + barWidth / 2} y={padding.top + chartH + 16} textAnchor="middle" fill="#64748b" fontSize="10">
                  {d.day}
                </text>
              ) : null}
              {/* Tooltip */}
              {isHovered && (
                <g>
                  <rect x={x - 40} y={Math.max(y - 45, padding.top)} width={100} height={38} rx={6} fill="#1e293b" stroke="rgba(255,255,255,0.1)" />
                  <text x={x + 10} y={Math.max(y - 28, padding.top + 17)} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                    {formatCurrency(d.выручка)}
                  </text>
                  <text x={x + 10} y={Math.max(y - 14, padding.top + 31)} textAnchor="middle" fill="#94a3b8" fontSize="9">
                    Чеков: {d.чеки}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* =================== UI Components =================== */

function KPICard({
  icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  color: string;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 hover:bg-white/[0.07] transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">
            {value}
          </p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
