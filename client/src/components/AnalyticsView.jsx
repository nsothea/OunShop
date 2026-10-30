import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Truck, 
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export default function AnalyticsView({ stats }) {
  const summary = stats?.summary || {};
  const monthly = stats?.monthly || [];

  const formatMoney = (val) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const totalRev = summary.total_revenue || 0;
  const totalCost = summary.total_cost || 0;
  const totalProfit = summary.total_profit || 0;

  // Shipping % of total cost
  const prodCost = summary.total_product_cost || 0;
  const chinaShip = summary.total_china_shipping || 0;
  const khShip = summary.total_cambodia_shipping || 0;
  const totalShip = chinaShip + khShip;

  const prodCostPct = totalCost > 0 ? ((prodCost / totalCost) * 100).toFixed(1) : 0;
  const shipPct = totalCost > 0 ? ((totalShip / totalCost) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">របាយការណ៍ហិរញ្ញវត្ថុ និងចំណូល-ចំណាយលម្អិត</h2>
            <p className="text-xs text-slate-500">តាមដានដើមទុន ថ្លៃដឹកជញ្ជូនចិន-ខ្មែរ និងប្រាក់ចំណេញសុទ្ធ</p>
          </div>
        </div>
      </div>

      {/* Expense Breakdown Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>ថ្លៃដើមទំនិញ (Products)</span>
            <span>{prodCostPct}% នៃចំណាយ</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900">${formatMoney(prodCost)}</div>
          <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${prodCostPct}%` }}></div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>ថ្លៃដឹកចិន (China Shipping)</span>
            <span>${formatMoney(chinaShip)}</span>
          </div>
          <div className="text-xl font-extrabold text-amber-700">${formatMoney(chinaShip)}</div>
          <p className="text-[11px] text-slate-400 mt-1">ដឹកពីហាង Taobao ទៅកាន់ឃ្លាំងចិន</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>ថ្លៃដឹកខ្មែរ (Cambodia Shipping)</span>
            <span>${formatMoney(khShip)}</span>
          </div>
          <div className="text-xl font-extrabold text-sky-700">${formatMoney(khShip)}</div>
          <p className="text-[11px] text-slate-400 mt-1">ដឹកពីឃ្លាំងចិនមកកាន់ភ្នំពេញ/ខេត្ត</p>
        </div>
      </div>

      {/* Monthly Performance Table */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center space-x-1.5">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>ស្ថិតិប្រចាំខែ (Monthly Performance)</span>
        </h3>

        {monthly.length > 0 ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">ខែ (Month)</th>
                  <th className="px-4 py-2.5 text-center">ចំនួនកុម្មង់</th>
                  <th className="px-4 py-2.5 text-right">ចំណូលសរុប</th>
                  <th className="px-4 py-2.5 text-right">ចំណាយសរុប</th>
                  <th className="px-4 py-2.5 text-right">ប្រាក់ចំណេញសុទ្ធ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthly.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 font-bold text-slate-800">{m.month}</td>
                    <td className="px-4 py-2.5 text-center font-medium text-slate-600">{m.orders_count} កុម្មង់</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-900">${formatMoney(m.revenue)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">${formatMoney(m.cost)}</td>
                    <td className="px-4 py-2.5 text-right font-extrabold text-emerald-600">+${formatMoney(m.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
            មិនទាន់មានទិន្នន័យខែនៅឡើយទេ។ សូមបន្ថែមការកុម្មង់ដើម្បីមើលស្ថិតិ!
          </div>
        )}
      </div>
    </div>
  );
}
