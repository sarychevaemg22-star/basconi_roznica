import { useState, useMemo } from 'react';
import {
  salesData,
  uniqueYears,
  uniqueMonths,
  uniqueDays,
  monthNames,
  type SaleRecord,
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
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';

const COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

export default function App() {
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');

  // Фильтрация данных
  const filteredData = useMemo(() => {
    return salesData.filter((record) => {
      if (selectedYear !== 'all' && record.год !== selectedYear) return false;
      if (selectedMonth !== 'all' && record.месяц !== selectedMonth) return false;
      if (selectedDay !== 'all' && record.День !== selectedDay) return false;
      return true;
    });
  }, [selectedYear, selectedMonth, selectedDay]);

  // Метрики
  const metrics = useMemo(() => {
    const uniqueChecks = new Set(filteredData.map((r) => r.Чек)).size;
    const totalSum = filteredData.reduce((acc, r) => acc + r.Суммаруч, 0);
    const avgCheck = uniqueChecks > 0 ? totalSum / uniqueChecks : 0;
    const avgItemsPerCheck = uniqueChecks > 0 ? filteredData.length / uniqueChecks : 0;

    return {
      uniqueChecks,
      totalSum,
      avgCheck,
      avgItemsPerCheck,
    };
  }, [filteredData]);

  // Доля по видам товаров
  const groupData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredData.forEach((r) => {
      grouped[r.Группа] = (grouped[r.Группа] || 0) + r.Суммаруч;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Динамика по месяцам
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

  // Динамика по дням (для выбранного месяца)
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

  // Топ товаров
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
          {/* Доля по видам товаров - Pie Chart */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-purple-400" />
              Доля по видам товаров
            </h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={groupData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                    labelLine={true}
                  >
                    {groupData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Доля по видам товаров - Bar Chart */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Выручка по группам товаров
            </h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    type="number"
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}М`}
                    stroke="#94a3b8"
                    fontSize={11}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    width={120}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {groupData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
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
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    fontSize={10}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}М`}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'выручка' ? formatCurrency(value) : formatNumber(value),
                      name === 'выручка' ? 'Выручка' : 'Чеки',
                    ]}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="выручка"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Динамика по дням */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Динамика по дням {selectedMonth !== 'all' ? `(${monthNames[selectedMonth - 1]})` : '(выберите месяц)'}
            </h3>
            {dailyData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}К`}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        name === 'выручка' ? formatCurrency(value) : formatNumber(value),
                        name === 'выручка' ? 'Выручка' : 'Чеки',
                      ]}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="выручка" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItems} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  type="number"
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}К`}
                  stroke="#94a3b8"
                  fontSize={11}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  width={150}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'sum') return [formatCurrency(value), 'Выручка'];
                    return [formatNumber(value), 'Количество'];
                  }}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="sum" fill="#ec4899" radius={[0, 4, 4, 0]} name="sum" />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
                  const totalGroupSum = groupData.reduce((acc, g) => acc + g.value, 0);
                  const share = totalGroupSum > 0 ? (item.value / totalGroupSum) * 100 : 0;
                  return (
                    <tr key={item.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-white flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full inline-block"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        {item.name}
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

// KPI Card компонент
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
