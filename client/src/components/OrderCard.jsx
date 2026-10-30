import React, { useState } from 'react';
import { 
  ExternalLink, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  Truck, 
  DollarSign, 
  FileText, 
  Edit3, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  PackageCheck,
  ChevronDown,
  Layers
} from 'lucide-react';

export default function OrderCard({ order, onEdit, onDelete, onStatusChange, onOpenReceipt, onPreviewImage }) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  // Calculate days difference for arrival date
  const getArrivalNotice = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const arrival = new Date(dateStr);
    arrival.setHours(0, 0, 0, 0);

    const diffDays = Math.round((arrival - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { text: 'មកដល់ថ្ងៃនេះ!', color: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' };
    } else if (diffDays > 0) {
      return { text: `នៅសល់ ${diffDays} ថ្ងៃទៀតមកដល់`, color: 'bg-amber-50 text-amber-700 border-amber-200' };
    } else {
      return { text: `បានមកដល់កាលពី ${Math.abs(diffDays)} ថ្ងៃមុន`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  const arrivalNotice = getArrivalNotice(order.arrival_date);

  // Delivery status colors
  const deliveryStatusConfig = {
    waiting: {
      label: 'រង់ចាំឥវ៉ាន់',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: Clock
    },
    arrived: {
      label: 'ឥវ៉ាន់មកដល់ហើយ',
      badge: 'bg-sky-100 text-sky-800 border-sky-200',
      icon: PackageCheck
    },
    shipped: {
      label: 'បានផ្ញើជូនភ្ញៀវ',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: Truck
    },
    completed: {
      label: 'បានបញ្ចប់',
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: CheckCircle2
    },
    cancelled: {
      label: 'បានបោះបង់',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: AlertCircle
    }
  };

  const currentDelivery = deliveryStatusConfig[order.delivery_status] || deliveryStatusConfig.waiting;
  const DeliveryIcon = currentDelivery.icon;

  const stockBadgeConfig = {
    in_stock: { label: 'មានក្នុងស្តុក', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    pre_order: { label: 'កុម្មង់ទុកមុន', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    out_of_stock: { label: 'អស់ពីស្តុក', badge: 'bg-slate-100 text-slate-600 border-slate-200' }
  };
  const currentStock = stockBadgeConfig[order.stock_status] || stockBadgeConfig.pre_order;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col group">
      
      {/* Top Image & Floating Badges */}
      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
        {order.image_url ? (
          <img 
            src={order.image_url} 
            alt={order.item_name}
            onClick={() => onPreviewImage(order.image_url)}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300 cursor-pointer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
            <Layers className="w-10 h-10 stroke-1 mb-1" />
            <span className="text-xs">គ្មានរូបភាព</span>
          </div>
        )}

        {/* Stock Status Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border backdrop-blur-md shadow-xs ${currentStock.badge}`}>
            {currentStock.label}
          </span>
        </div>

        {/* Taobao Link Button */}
        {order.taobao_link && (
          <a
            href={order.taobao_link}
            target="_blank"
            rel="noreferrer"
            title="បើកមើលលើ Taobao"
            className="absolute top-2.5 right-2.5 bg-white/90 hover:bg-white text-orange-600 hover:text-orange-700 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 shadow-sm backdrop-blur-xs transition"
          >
            <span>Taobao</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        {/* Quick Delivery Status Pill */}
        <div className="absolute bottom-2.5 left-2.5">
          <div className="relative">
            <button
              onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-xs backdrop-blur-md transition ${currentDelivery.badge}`}
            >
              <DeliveryIcon className="w-3.5 h-3.5" />
              <span>{currentDelivery.label}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Status Dropdown */}
            {statusMenuOpen && (
              <div className="absolute bottom-full mb-1 left-0 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-20 w-44">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">ប្តូរស្ថានភាពដឹក</div>
                {Object.entries(deliveryStatusConfig).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        onStatusChange(order.id, key);
                        setStatusMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quantity Badge */}
        {order.quantity > 1 && (
          <div className="absolute bottom-2.5 right-2.5 bg-slate-900/80 text-white text-[11px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
            x{order.quantity}
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        {/* Title & Category */}
        <div>
          <div className="text-[11px] font-medium text-rose-600 mb-0.5">{order.category || 'ទូទៅ'}</div>
          <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
            {order.item_name}
          </h3>
        </div>

        {/* Arrival Date notice */}
        {order.arrival_date ? (
          <div className="flex items-center space-x-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">មកដល់:</span>
            <span className="font-semibold text-slate-700">{order.arrival_date}</span>
            {arrivalNotice && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${arrivalNotice.color}`}>
                {arrivalNotice.text}
              </span>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">មិនទាន់កំណត់ថ្ងៃមកដល់</div>
        )}

        {/* Customer Information */}
        <div className="p-2.5 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-600 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{order.customer_name || 'អតិថិជន'}</span>
            </span>
            {order.customer_phone && (
              <a 
                href={`tel:${order.customer_phone}`} 
                className="text-indigo-600 font-semibold hover:underline flex items-center space-x-1"
              >
                <Phone className="w-3 h-3" />
                <span>{order.customer_phone}</span>
              </a>
            )}
          </div>

          {order.customer_address && (
            <div className="text-[11px] text-slate-500 truncate flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{order.customer_address}</span>
            </div>
          )}

          {order.notes && (
            <div className="text-[11px] text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded mt-1">
              ចំណាំ: {order.notes}
            </div>
          )}

          {/* Taobao Order ID & China Tracking & FB link */}
          {(order.taobao_order_id || order.china_tracking_number || order.facebook_post_link) && (
            <div className="pt-1 mt-1 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5 text-[10px]">
              {order.taobao_order_id && (
                <span className="bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded font-mono" title="លេខកូដ Taobao">
                  TB: {order.taobao_order_id}
                </span>
              )}
              {order.china_tracking_number && (
                <span className="bg-amber-100/80 text-amber-800 px-1.5 py-0.5 rounded font-mono" title="លេខដឹកចិន">
                  🇨🇳 {order.china_tracking_number}
                </span>
              )}
              {order.facebook_post_link && (
                <a
                  href={order.facebook_post_link}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-50 text-blue-600 hover:text-blue-700 px-1.5 py-0.5 rounded font-semibold inline-flex items-center space-x-0.5"
                >
                  <span>FB Post</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Pricing & Profit Grid */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">ថ្លៃដើម + ដឹក:</span>
            <span className="font-semibold text-slate-700" title={`ដើម: $${order.cost_usd} | ដឹកចិន: $${order.china_shipping} | ដឹកខ្មែរ: $${order.cambodia_shipping}`}>
              ${order.total_cost}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">តម្លៃលក់:</span>
            <span className="font-extrabold text-slate-900 text-sm">
              ${order.total_revenue}
            </span>
          </div>

          <div className="flex items-center justify-between bg-emerald-50/70 p-2 rounded-lg text-emerald-800">
            <span className="font-medium text-[11px]">ចំណេញសុទ្ធ:</span>
            <span className="font-extrabold text-sm">
              +${order.total_profit}
            </span>
          </div>
        </div>

        {/* Card Actions */}
        <div className="pt-2 flex items-center justify-between space-x-1 border-t border-slate-100">
          <button
            onClick={() => onOpenReceipt(order)}
            className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>បង្កាន់ដៃ</span>
          </button>

          <button
            onClick={() => onEdit(order)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="កែប្រែ"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(order.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="លុប"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
