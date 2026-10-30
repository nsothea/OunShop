import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Wallet, 
  Package, 
  Truck, 
  Clock, 
  CheckCircle2, 
  Boxes 
} from 'lucide-react';

export default function StatsCards({ stats, onSelectFilter }) {
  const summary = stats?.summary || {
    total_revenue: 0,
    total_cost: 0,
    total_profit: 0,
    total_orders: 0,
    count_waiting: 0,
    count_arrived: 0,
    count_shipped: 0,
    count_completed: 0,
    count_pre_order: 0,
    count_in_stock: 0,
    total_china_shipping: 0,
    total_cambodia_shipping: 0
  };

  const formatMoney = (val) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const profitMargin = summary.total_revenue > 0
    ? ((summary.total_profit / summary.total_revenue) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-4">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ចំណូលសរុប (Revenue)</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              ${formatMoney(summary.total_revenue)}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
              <span>ចំនួនឥវ៉ាន់លក់:</span>
              <strong className="text-slate-700">{summary.total_orders} កុម្មង់</strong>
            </p>
          </div>
        </div>

        {/* Total Cost */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ចំណាយសរុប (Total Cost)</span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              ${formatMoney(summary.total_cost)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span title="ថ្លៃដឹកចិន">ដឹកចិន: ${formatMoney(summary.total_china_shipping)}</span>
              <span>•</span>
              <span title="ថ្លៃដឹកខ្មែរ">ដឹកខ្មែរ: ${formatMoney(summary.total_cambodia_shipping)}</span>
            </div>
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ប្រាក់ចំណេញសុទ្ធ (Net Profit)</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-extrabold ${summary.total_profit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              ${formatMoney(summary.total_profit)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              អត្រាចំណេញ (Margin): <strong className="text-indigo-600 font-semibold">{profitMargin}%</strong>
            </p>
          </div>
        </div>

        {/* Stock / Pre-order Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ស្ថានភាពស្តុក</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <button 
              onClick={() => onSelectFilter?.('stock', 'in_stock')}
              className="p-2 bg-emerald-50/70 hover:bg-emerald-100/70 rounded-xl transition text-left"
            >
              <div className="text-xs text-emerald-700 font-medium">មានក្នុងស្តុក</div>
              <div className="text-lg font-bold text-emerald-800">{summary.count_in_stock}</div>
            </button>
            <button 
              onClick={() => onSelectFilter?.('stock', 'pre_order')}
              className="p-2 bg-amber-50/70 hover:bg-amber-100/70 rounded-xl transition text-left"
            >
              <div className="text-xs text-amber-700 font-medium">កុម្មង់ទុកមុន</div>
              <div className="text-lg font-bold text-amber-800">{summary.count_pre_order}</div>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Delivery Status Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onSelectFilter?.('delivery', 'waiting')}
          className="bg-white p-3 rounded-xl border border-amber-200 hover:border-amber-400 bg-amber-50/30 flex items-center space-x-3 transition group text-left"
        >
          <div className="p-2 bg-amber-100 text-amber-700 rounded-lg group-hover:scale-105 transition">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-500">រង់ចាំឥវ៉ាន់មកដល់</div>
            <div className="text-base font-bold text-amber-700">{summary.count_waiting} មុខ</div>
          </div>
        </button>

        <button
          onClick={() => onSelectFilter?.('delivery', 'arrived')}
          className="bg-white p-3 rounded-xl border border-sky-200 hover:border-sky-400 bg-sky-50/30 flex items-center space-x-3 transition group text-left"
        >
          <div className="p-2 bg-sky-100 text-sky-700 rounded-lg group-hover:scale-105 transition">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-500">ឥវ៉ាន់មកដល់ហើយ</div>
            <div className="text-base font-bold text-sky-700">{summary.count_arrived} មុខ</div>
          </div>
        </button>

        <button
          onClick={() => onSelectFilter?.('delivery', 'shipped')}
          className="bg-white p-3 rounded-xl border border-emerald-200 hover:border-emerald-400 bg-emerald-50/30 flex items-center space-x-3 transition group text-left"
        >
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg group-hover:scale-105 transition">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-500">បានផ្ញើជូនភ្ញៀវ</div>
            <div className="text-base font-bold text-emerald-700">{summary.count_shipped} មុខ</div>
          </div>
        </button>

        <button
          onClick={() => onSelectFilter?.('delivery', 'completed')}
          className="bg-white p-3 rounded-xl border border-purple-200 hover:border-purple-400 bg-purple-50/30 flex items-center space-x-3 transition group text-left"
        >
          <div className="p-2 bg-purple-100 text-purple-700 rounded-lg group-hover:scale-105 transition">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-500">បានបញ្ចប់ទាំងស្រុង</div>
            <div className="text-base font-bold text-purple-700">{summary.count_completed} មុខ</div>
          </div>
        </button>
      </div>
    </div>
  );
}
