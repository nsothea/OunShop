import React from 'react';
import { 
  ExternalLink, 
  Calendar, 
  Phone, 
  FileText, 
  Edit3, 
  Trash2,
  Clock,
  PackageCheck,
  Truck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function OrderTable({ orders, onEdit, onDelete, onStatusChange, onOpenReceipt, onPreviewImage }) {
  const deliveryStatusConfig = {
    waiting: { label: 'រង់ចាំឥវ៉ាន់', badge: 'bg-amber-100 text-amber-800' },
    arrived: { label: 'មកដល់ហើយ', badge: 'bg-sky-100 text-sky-800' },
    shipped: { label: 'បានផ្ញើជូនភ្ញៀវ', badge: 'bg-emerald-100 text-emerald-800' },
    completed: { label: 'បានបញ្ចប់', badge: 'bg-purple-100 text-purple-800' },
    cancelled: { label: 'បានបោះបង់', badge: 'bg-rose-100 text-rose-800' }
  };

  const stockBadgeConfig = {
    in_stock: { label: 'មានក្នុងស្តុក', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    pre_order: { label: 'កុម្មង់ទុកមុន', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    out_of_stock: { label: 'អស់ពីស្តុក', badge: 'bg-slate-100 text-slate-600 border-slate-200' }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[11px] font-bold text-slate-500 tracking-wider">
            <tr>
              <th className="px-4 py-3">រូបភាព & ឥវ៉ាន់</th>
              <th className="px-3 py-3">Link Taobao</th>
              <th className="px-3 py-3">ស្ថានភាពស្តុក</th>
              <th className="px-3 py-3">ស្ថានភាពដឹក</th>
              <th className="px-3 py-3">អតិថិជន</th>
              <th className="px-3 py-3">ថ្ងៃមកដល់</th>
              <th className="px-3 py-3 text-right">ថ្លៃដើម($)</th>
              <th className="px-3 py-3 text-right">ដឹកចិន+ខ្មែរ</th>
              <th className="px-3 py-3 text-right">តម្លៃលក់($)</th>
              <th className="px-3 py-3 text-right">ចំណេញសុទ្ធ($)</th>
              <th className="px-4 py-3 text-center">សកម្មភាព</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => {
              const currentDelivery = deliveryStatusConfig[o.delivery_status] || deliveryStatusConfig.waiting;
              const currentStock = stockBadgeConfig[o.stock_status] || stockBadgeConfig.pre_order;
              const totalShipping = ((o.china_shipping || 0) + (o.cambodia_shipping || 0)).toFixed(2);

              return (
                <tr key={o.id} className="hover:bg-slate-50/80 transition">
                  {/* Image & Product Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        onClick={() => o.image_url && onPreviewImage(o.image_url)}
                        className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 cursor-pointer border border-slate-200 hover:scale-105 transition"
                      >
                        {o.image_url ? (
                          <img src={o.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">
                            គ្មានរូប
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 line-clamp-1">{o.item_name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                          <span>{o.category}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700">ចំនួន: {o.quantity}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Taobao Link */}
                  <td className="px-3 py-3">
                    {o.taobao_link ? (
                      <a 
                        href={o.taobao_link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center space-x-1 text-orange-600 hover:text-orange-700 font-semibold text-xs"
                      >
                        <span>Taobao</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Stock Status */}
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${currentStock.badge}`}>
                      {currentStock.label}
                    </span>
                  </td>

                  {/* Delivery Status (Interactive Dropdown) */}
                  <td className="px-3 py-3">
                    <select
                      value={o.delivery_status}
                      onChange={(e) => onStatusChange(o.id, e.target.value)}
                      className={`text-xs font-bold rounded-md px-2 py-1 border-0 focus:ring-2 focus:ring-slate-400 cursor-pointer ${currentDelivery.badge}`}
                    >
                      <option value="waiting">🟡 រង់ចាំឥវ៉ាន់</option>
                      <option value="arrived">🔵 មកដល់ហើយ</option>
                      <option value="shipped">🟢 បានផ្ញើជូនភ្ញៀវ</option>
                      <option value="completed">🟣 បានបញ្ចប់</option>
                      <option value="cancelled">❌ បានបោះបង់</option>
                    </select>
                  </td>

                  {/* Customer */}
                  <td className="px-3 py-3">
                    <div className="font-semibold text-slate-900">{o.customer_name || 'អតិថិជន'}</div>
                    {o.customer_phone && (
                      <div className="text-indigo-600 flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>{o.customer_phone}</span>
                      </div>
                    )}
                  </td>

                  {/* Arrival Date */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    {o.arrival_date ? (
                      <span className="font-medium text-slate-800">{o.arrival_date}</span>
                    ) : (
                      <span className="text-slate-400 italic">មិនកំណត់</span>
                    )}
                  </td>

                  {/* Cost */}
                  <td className="px-3 py-3 text-right">
                    <span className="font-medium text-slate-700">${o.cost_usd}</span>
                    {o.cost_cny > 0 && (
                      <div className="text-[10px] text-slate-400">¥{o.cost_cny}</div>
                    )}
                  </td>

                  {/* Shipping: China + Cambodia */}
                  <td className="px-3 py-3 text-right font-medium text-slate-700">
                    <div>${totalShipping}</div>
                    <div className="text-[10px] text-slate-400">
                      ចិន: ${o.china_shipping} | ខ្មែរ: ${o.cambodia_shipping}
                    </div>
                  </td>

                  {/* Selling Price */}
                  <td className="px-3 py-3 text-right">
                    <div className="font-extrabold text-slate-900">${o.total_revenue}</div>
                    <div className="text-[10px] text-slate-400">(${o.selling_price}/មុខ)</div>
                  </td>

                  {/* Net Profit */}
                  <td className="px-3 py-3 text-right">
                    <span className={`font-extrabold ${o.total_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      +${o.total_profit}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onOpenReceipt(o)}
                        title="ចេញបង្កាន់ដៃ"
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(o)}
                        title="កែប្រែ"
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(o.id)}
                        title="លុប"
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
