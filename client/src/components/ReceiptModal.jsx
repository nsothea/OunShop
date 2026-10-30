import React, { useState } from 'react';
import { X, Printer, ShoppingBag, Phone, MapPin, CheckCircle, Truck, Tag, Send } from 'lucide-react';

export default function ReceiptModal({ isOpen, onClose, order, settings }) {
  const [tab, setTab] = useState('receipt'); // 'receipt' | 'label'

  if (!isOpen || !order) return null;

  const shopName = settings?.shop_name || 'អូន សប (Oun Shop)';
  const shopLogo = settings?.shop_logo;
  const facebookUrl = settings?.facebook_url;
  const shopPhone = settings?.shop_phone || '012 345 678';
  const shopTelegram = settings?.shop_telegram || '@ounshop_admin';
  const shopAddress = settings?.shop_address || 'រាជធានីភ្នំពេញ';

  const deposit = order.deposit_amount || 0;
  const balanceDue = (order.total_revenue - deposit).toFixed(2);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 my-8">
        
        {/* Top Controls */}
        <div className="px-6 py-3.5 bg-slate-900 text-white print:hidden space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-rose-400" />
              <span>{tab === 'receipt' ? 'បង្កាន់ដៃកុម្មង់ឥវ៉ាន់ / Invoice' : 'ស្លាកបិទលើកញ្ចប់ឥវ៉ាន់ (Shipping Label)'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex space-x-2 pt-1">
            <button
              onClick={() => setTab('receipt')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                tab === 'receipt' ? 'bg-rose-500 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              បង្កាន់ដៃជូនភ្ញៀវ (Invoice)
            </button>
            <button
              onClick={() => setTab('label')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                tab === 'label' ? 'bg-rose-500 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              ស្លាកបិទលើកញ្ចប់ (Shipping Label Sticker)
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="printable-receipt" className="p-6 sm:p-8 bg-white">
          
          {tab === 'receipt' ? (
            /* Tab 1: Receipt / Invoice */
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center pb-4 border-b border-dashed border-slate-300">
                {shopLogo ? (
                  <img 
                    src={shopLogo} 
                    alt={shopName} 
                    className="w-16 h-16 mx-auto rounded-2xl object-cover border border-slate-200 shadow-sm mb-2" 
                  />
                ) : (
                  <div className="w-12 h-12 mx-auto bg-gradient-to-tr from-rose-500 to-amber-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-md mb-2">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                )}
                <h2 className="text-xl font-extrabold text-slate-900">{shopName}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{shopAddress}</p>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-2">
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{shopPhone}</span>
                  </span>
                  <span>•</span>
                  <span className="text-rose-600 font-semibold">{shopTelegram}</span>
                  {facebookUrl && (
                    <>
                      <span>•</span>
                      <a href={facebookUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold">
                        Facebook Page
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Receipt Info & Customer */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-medium">អតិថិជន (Customer)</span>
                  <span className="font-bold text-slate-900 text-sm block mt-0.5">{order.customer_name || 'អតិថិជន'}</span>
                  <span className="text-slate-600 block">{order.customer_phone || '-'}</span>
                  {order.customer_address && (
                    <span className="text-slate-500 block text-[11px] mt-0.5">{order.customer_address}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-medium">លេខវិក្កយបត្រ (Invoice #)</span>
                  <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">#{String(order.id).padStart(5, '0')}</span>
                  <span className="text-slate-600 block text-[11px]">ថ្ងៃកុម្មង់: {order.order_date || 'N/A'}</span>
                  {order.arrival_date && (
                    <span className="text-amber-700 font-semibold block text-[11px] mt-0.5">
                      ថ្ងៃរំពឹងមកដល់: {order.arrival_date}
                    </span>
                  )}
                </div>
              </div>

              {/* Product Item Display */}
              <div className="flex items-center space-x-4 p-3 border border-slate-200 rounded-2xl">
                {order.image_url ? (
                  <img 
                    src={order.image_url} 
                    alt="" 
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs shrink-0">
                    គ្មានរូប
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{order.item_name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ប្រភេទ: {order.category} | ចំនួន: <strong className="text-slate-800">{order.quantity}</strong>
                  </p>
                  {order.notes && (
                    <p className="text-[11px] text-amber-700 mt-1">ចំណាំ: {order.notes}</p>
                  )}
                  {order.taobao_order_id && (
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Taobao ID: {order.taobao_order_id}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-slate-900 text-base">${order.total_revenue}</div>
                  <div className="text-[11px] text-slate-400">${order.selling_price}/មុខ</div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="space-y-2 text-xs border-t border-slate-200 pt-3">
                <div className="flex justify-between text-slate-600">
                  <span>តម្លៃសរុប (Subtotal):</span>
                  <span className="font-bold text-slate-900">${order.total_revenue}</span>
                </div>

                {deposit > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>បានកក់មុន (Deposit Paid):</span>
                    <span>-${deposit.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 pt-2 border-t border-dashed border-slate-200">
                  <span>ប្រាក់ត្រូវទូទាត់នៅសល់ (Balance Due):</span>
                  <span className="text-rose-600 text-base">${balanceDue}</span>
                </div>
              </div>

              {/* Footer note */}
              <div className="text-center pt-2 text-[11px] text-slate-400">
                <p>សូមអរគុណសម្រាប់ការគាំទ្រ និងទិញឥវ៉ាន់ពី {shopName}!</p>
                <p className="mt-0.5">ទំនិញដែលបានកុម្មង់រួច មិនអាចប្តូរប្រាក់វិញបានទេ</p>
              </div>
            </div>
          ) : (
            /* Tab 2: Shipping Label / Waybill Sticker */
            <div className="border-2 border-slate-900 rounded-2xl p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div className="flex items-center space-x-3">
                  {shopLogo && (
                    <img 
                      src={shopLogo} 
                      alt="" 
                      className="w-10 h-10 rounded-xl object-cover border border-slate-300 shrink-0" 
                    />
                  )}
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-500">អ្នកផ្ញើ (FROM)</div>
                    <div className="text-sm font-extrabold text-slate-900">{shopName}</div>
                    <div className="text-xs text-slate-600">ទូរស័ព្ទ: {shopPhone}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-500">សេវាដឹក:</div>
                  <div className="text-sm font-extrabold text-slate-900">{order.shipping_company || 'VET Express'}</div>
                  {order.tracking_number && (
                    <div className="text-xs font-mono font-bold text-rose-600">#{order.tracking_number}</div>
                  )}
                </div>
              </div>

              {/* Recipient */}
              <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="text-xs font-bold uppercase text-slate-500">អ្នកទទួល (DELIVER TO):</div>
                <div className="text-lg font-black text-slate-900">{order.customer_name || 'អតិថិជន'}</div>
                <div className="text-base font-extrabold text-rose-600 flex items-center space-x-1">
                  <Phone className="w-4 h-4" />
                  <span>{order.customer_phone || 'មិនមានលេខទូរស័ព្ទ'}</span>
                </div>
                <div className="text-xs font-medium text-slate-700 pt-1 leading-relaxed">
                  អាសយដ្ឋាន: {order.customer_address || 'រាជធានីភ្នំពេញ'}
                </div>
              </div>

              {/* Package Details & COD */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t-2 border-slate-900">
                <div>
                  <div className="text-[11px] font-bold text-slate-500">ទំនិញក្នុងកញ្ចប់:</div>
                  <div className="text-xs font-bold text-slate-900 line-clamp-2">{order.item_name}</div>
                  <div className="text-[11px] text-slate-600">ចំនួន: <strong>{order.quantity}</strong></div>
                  {order.notes && <div className="text-[10px] text-amber-800">ចំណាំ: {order.notes}</div>}
                </div>

                <div className="bg-rose-50 border border-rose-300 p-2.5 rounded-xl text-center">
                  <div className="text-[10px] font-extrabold uppercase text-rose-700">ប្រាក់ត្រូវទារ (COD)</div>
                  <div className="text-2xl font-black text-rose-600">${balanceDue}</div>
                  <div className="text-[10px] text-slate-500">{parseFloat(balanceDue) <= 0 ? 'បង់រួច ១០០%' : 'ប្រមូលពីភ្ញៀវ'}</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-semibold transition"
          >
            បិទ
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow transition flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>បោះពុម្ព (Print)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
