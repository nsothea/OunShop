import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  ExternalLink, 
  Calculator, 
  Image as ImageIcon, 
  User, 
  Truck, 
  Calendar, 
  AlertCircle,
  Zap
} from 'lucide-react';

export default function OrderModal({ isOpen, onClose, onSave, orderToEdit, defaultRate = 0.14 }) {
  const initialForm = {
    item_name: '',
    category: 'ខោអាវ / សម្លៀកបំពាក់',
    image_url: '',
    taobao_link: '',
    taobao_order_id: '',
    china_tracking_number: '',
    facebook_post_link: '',
    customer_name: '',
    customer_phone: '',
    customer_contact: '',
    customer_address: '',
    cost_cny: '',
    exchange_rate: defaultRate,
    cost_usd: '',
    china_shipping: '',
    cambodia_shipping: '',
    other_expenses: '',
    selling_price: '',
    deposit_amount: '',
    quantity: 1,
    stock_status: 'pre_order',
    delivery_status: 'waiting',
    order_date: new Date().toISOString().split('T')[0],
    arrival_date: '',
    delivered_date: '',
    tracking_number: '',
    shipping_company: 'Virak Buntham (VET)',
    notes: ''
  };

  const [form, setForm] = useState(initialForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [error, setError] = useState('');

  // Fetch Live CNY Rate
  const handleFetchLiveRate = async () => {
    try {
      setFetchingRate(true);
      const res = await fetch('/api/exchange-rate/cny');
      if (!res.ok) throw new Error('Failed to fetch rate');
      const data = await res.json();
      if (data.usd_to_cny) {
        handleRateChange(data.usd_to_cny);
      } else if (data.cny_to_usd) {
        handleRateChange(data.cny_to_usd);
      }
      setFetchingRate(false);
    } catch (err) {
      setFetchingRate(false);
      alert('មិនអាចទាញយកអត្រាប្តូរប្រាក់បច្ចុប្បន្នបានទេ');
    }
  };

  useEffect(() => {
    if (orderToEdit) {
      setForm({
        ...initialForm,
        ...orderToEdit,
        exchange_rate: orderToEdit.exchange_rate || defaultRate
      });
      setPreviewUrl(orderToEdit.image_url || '');
    } else {
      setForm({
        ...initialForm,
        exchange_rate: defaultRate
      });
      setPreviewUrl('');
    }
    setSelectedFile(null);
    setError('');
  }, [orderToEdit, isOpen, defaultRate]);

  if (!isOpen) return null;

  // Helper to compute USD from CNY using rate
  const computeUsd = (cnyVal, rateVal) => {
    const cny = parseFloat(cnyVal);
    const rate = parseFloat(rateVal);
    if (isNaN(cny) || cny <= 0 || isNaN(rate) || rate <= 0) return '';
    // If rate >= 1 (e.g. 6.68), formula is: CNY / rate
    // If rate < 1 (e.g. 0.1498), formula is: CNY * rate
    if (rate >= 1) {
      return (cny / rate).toFixed(2);
    } else {
      return (cny * rate).toFixed(2);
    }
  };

  // Handle CNY change -> auto update USD
  const handleCnyChange = (val) => {
    const rate = form.exchange_rate || defaultRate;
    const computedUsd = computeUsd(val, rate);
    setForm(prev => ({ ...prev, cost_cny: val, cost_usd: computedUsd }));
  };

  // Handle Rate change -> update USD
  const handleRateChange = (val) => {
    const computedUsd = computeUsd(form.cost_cny, val);
    setForm(prev => ({ ...prev, exchange_rate: val, cost_usd: computedUsd }));
  };

  // Handle file select
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const objUrl = URL.createObjectURL(file);
      setPreviewUrl(objUrl);
    }
  };

  // Live calculations
  const qty = parseInt(form.quantity, 10) || 1;
  const costUsd = parseFloat(form.cost_usd) || 0;
  const chinaShip = parseFloat(form.china_shipping) || 0;
  const khShip = parseFloat(form.cambodia_shipping) || 0;
  const otherExp = parseFloat(form.other_expenses) || 0;
  const sellPrice = parseFloat(form.selling_price) || 0;
  const deposit = parseFloat(form.deposit_amount) || 0;

  const totalCostPerUnit = costUsd + chinaShip + khShip + otherExp;
  const totalCost = (totalCostPerUnit * qty).toFixed(2);
  const totalRevenue = (sellPrice * qty).toFixed(2);
  const totalProfit = (totalRevenue - totalCost).toFixed(2);
  const remainingDue = (totalRevenue - deposit).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.item_name.trim()) {
      setError('សូមបញ្ចូលឈ្មោះឥវ៉ាន់!');
      return;
    }

    try {
      setUploading(true);
      let finalImageUrl = form.image_url;

      // If user uploaded a new image file, send it first
      if (selectedFile) {
        const formData = new FormData();
        formData.append('image', selectedFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) {
          throw new Error('បរាជ័យក្នុងការ Upload រូបភាព');
        }

        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.imageUrl;
      }

      const payload = {
        ...form,
        image_url: finalImageUrl,
        quantity: qty,
        cost_cny: parseFloat(form.cost_cny) || 0,
        cost_usd: costUsd,
        exchange_rate: parseFloat(form.exchange_rate) || defaultRate,
        china_shipping: chinaShip,
        cambodia_shipping: khShip,
        other_expenses: otherExp,
        selling_price: sellPrice,
        deposit_amount: deposit
      };

      await onSave(payload);
      setUploading(false);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ');
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-8 border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-rose-500 rounded-lg text-white">
              <ImageIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">
                {orderToEdit ? 'កែប្រែព័ត៌មានឥវ៉ាន់' : 'បញ្ចូលព័ត៌មានឥវ៉ាន់ថ្មី'}
              </h2>
              <p className="text-xs text-slate-300">បញ្ចូលរូបភាព តម្លៃដឹកចិន-ខ្មែរ ឈ្មោះភ្ញៀវ និងថ្ងៃមកដល់</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Product Photos & Taobao Link */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-6 border-b border-slate-200">
            {/* Image Upload Area */}
            <div className="md:col-span-4 flex flex-col items-center">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 self-start">
                រូបភាពឥវ៉ាន់ (Upload រូប)
              </label>
              
              <div className="w-full aspect-square relative rounded-2xl border-2 border-dashed border-slate-300 hover:border-rose-400 bg-slate-50 flex flex-col items-center justify-center overflow-hidden transition group">
                {previewUrl ? (
                  <>
                    <img 
                      src={previewUrl} 
                      alt="Product preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <label className="cursor-pointer bg-white text-slate-900 px-3 py-1.5 rounded-lg text-xs font-semibold shadow hover:bg-slate-100">
                        ផ្លាស់ប្តូររូប
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 text-center">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-full mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-slate-700">ចុចដើម្បី Upload រូបឥវ៉ាន់</span>
                    <span className="text-[11px] text-slate-400 mt-1">PNG, JPG, WEBP រហូតដល់ 10MB</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                )}
              </div>

              {/* Or manual URL */}
              <div className="w-full mt-2">
                <input
                  type="text"
                  placeholder="ឬ Paste Image URL ផ្ទាល់"
                  value={form.image_url}
                  onChange={(e) => {
                    setForm(prev => ({ ...prev, image_url: e.target.value }));
                    if (!selectedFile) setPreviewUrl(e.target.value);
                  }}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Product Details & Taobao Link */}
            <div className="md:col-span-8 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ឈ្មោះឥវ៉ាន់ / ទំនិញ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ឧ. អាវយឺតកវែងរចនាបថកូរ៉េ, កាបូបស្ពាយ Taobao..."
                  value={form.item_name}
                  onChange={(e) => setForm(prev => ({ ...prev, item_name: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-sm"
                />
              </div>

              {/* Taobao Link & Order ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Link Taobao / 1688</span>
                    {form.taobao_link && (
                      <a 
                        href={form.taobao_link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-rose-600 hover:text-rose-700 flex items-center space-x-1 text-xs"
                      >
                        <span>បើកមើល Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://item.taobao.com/..."
                      value={form.taobao_link}
                      onChange={(e) => setForm(prev => ({ ...prev, taobao_link: e.target.value }))}
                      className="w-full pl-3.5 pr-8 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-xs"
                    />
                    <div className="absolute right-2.5 top-2.5 text-slate-400">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    លេខកុម្មង់ Taobao (订单号 / Order ID)
                  </label>
                  <input
                    type="text"
                    placeholder="លេខកូដក្នុង Purchased items"
                    value={form.taobao_order_id}
                    onChange={(e) => setForm(prev => ({ ...prev, taobao_order_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-xs"
                  />
                </div>
              </div>

              {/* China Courier Tracking & Facebook Post Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    លេខដឹកក្នុងស្រុកចិន (运单号 / China Tracking)
                  </label>
                  <input
                    type="text"
                    placeholder="ZTO, SF, YTO tracking..."
                    value={form.china_tracking_number}
                    onChange={(e) => setForm(prev => ({ ...prev, china_tracking_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Link Post លើ Facebook Page
                  </label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/..."
                    value={form.facebook_post_link}
                    onChange={(e) => setForm(prev => ({ ...prev, facebook_post_link: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-xs"
                  />
                </div>
              </div>

              {/* Category, Quantity & Stock Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ប្រភេទឥវ៉ាន់</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  >
                    <option value="ខោអាវ / សម្លៀកបំពាក់">ខោអាវ / សម្លៀកបំពាក់</option>
                    <option value="ស្បែកជើង">ស្បែកជើង</option>
                    <option value="កាបូប / កាតាប">កាបូប / កាតាប</option>
                    <option value="គ្រឿងសំអាង / ថែរក្សាសម្រស់">គ្រឿងសំអាង</option>
                    <option value="គ្រឿងអេឡិចត្រូនិច / Gadget">គ្រឿងអេឡិចត្រូនិច</option>
                    <option value="សម្ភារៈផ្ទះបាយ / ប្រើប្រាស់">សម្ភារៈប្រើប្រាស់</option>
                    <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ចំនួន (Quantity)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ស្ថានភាពស្តុក</label>
                  <select
                    value={form.stock_status}
                    onChange={(e) => setForm(prev => ({ ...prev, stock_status: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  >
                    <option value="pre_order">⏳ កុម្មង់ទុកមុន (អត់ស្តុក)</option>
                    <option value="in_stock">📦 មានក្នុងស្តុកស្រាប់</option>
                    <option value="out_of_stock">❌ អស់ពីស្តុក</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Shipping Breakdown */}
          <div className="pb-6 border-b border-slate-200">
            <div className="flex items-center space-x-2 mb-3">
              <Calculator className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                ការគណនាតម្លៃ និងថ្លៃដឹក ចិន-ខ្មែរ ($)
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Cost in CNY */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ថ្លៃដើមចិន (¥)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 text-xs">¥</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.cost_cny}
                    onChange={(e) => handleCnyChange(e.target.value)}
                    className="w-full pl-6 pr-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Rate */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    1 $ = ... ¥
                  </label>
                  <button
                    type="button"
                    onClick={handleFetchLiveRate}
                    disabled={fetchingRate}
                    title="ទាញយកអត្រាទីផ្សារផ្ទាល់ (6.68 ¥ = 1 $)"
                    className="text-[10px] text-amber-600 hover:text-amber-700 font-bold inline-flex items-center space-x-0.5 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-2.5 h-2.5 fill-current" />
                    <span>{fetchingRate ? '...' : 'Live'}</span>
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-bold">¥</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="6.68"
                    value={form.exchange_rate}
                    onChange={(e) => handleRateChange(e.target.value)}
                    className="w-full pl-6 pr-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-bold text-slate-800"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {parseFloat(form.exchange_rate) >= 1 
                    ? `${form.exchange_rate} ¥ = 1 $` 
                    : `1 ¥ = $${form.exchange_rate}`}
                </span>
              </div>

              {/* Cost in USD */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ថ្លៃដើម ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.cost_usd}
                    onChange={(e) => setForm(prev => ({ ...prev, cost_usd: e.target.value }))}
                    className="w-full pl-6 pr-2 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* China Shipping */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ថ្លៃដឹកក្នុងស្រុកចិន ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.china_shipping}
                    onChange={(e) => setForm(prev => ({ ...prev, china_shipping: e.target.value }))}
                    className="w-full pl-6 pr-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Cambodia Shipping */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ថ្លៃដឹកមកខ្មែរ ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.cambodia_shipping}
                    onChange={(e) => setForm(prev => ({ ...prev, cambodia_shipping: e.target.value }))}
                    className="w-full pl-6 pr-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-xs font-semibold text-rose-700 mb-1">តម្លៃលក់ចេញ ($) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-rose-500 text-xs font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={form.selling_price}
                    onChange={(e) => setForm(prev => ({ ...prev, selling_price: e.target.value }))}
                    className="w-full pl-6 pr-2 py-1.5 border border-rose-300 bg-rose-50/40 font-bold text-slate-900 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="mt-3 p-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">ចំណាយសរុប:</span>
                <span className="font-bold text-amber-300">${totalCost}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">ចំណូលសរុប ({qty} មុខ):</span>
                <span className="font-bold text-emerald-400">${totalRevenue}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">ប្រាក់ចំណេញសុទ្ធ:</span>
                <span className={`font-extrabold ${parseFloat(totalProfit) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${totalProfit}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Customer Information */}
          <div className="pb-6 border-b border-slate-200">
            <div className="flex items-center space-x-2 mb-3">
              <User className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                ព័ត៌មានភ្ញៀវដែលបានកុម្មង់ ឬទិញ
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ឈ្មោះភ្ញៀវ</label>
                <input
                  type="text"
                  placeholder="ឧ. បង ស្រីលីន"
                  value={form.customer_name}
                  onChange={(e) => setForm(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">លេខទូរស័ព្ទ</label>
                <input
                  type="text"
                  placeholder="012 345 678"
                  value={form.customer_phone}
                  onChange={(e) => setForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">FB / Telegram Contact</label>
                <input
                  type="text"
                  placeholder="ឈ្មោះ FB ឬ @telegram"
                  value={form.customer_contact}
                  onChange={(e) => setForm(prev => ({ ...prev, customer_contact: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ប្រាក់កក់មុន ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.deposit_amount}
                  onChange={(e) => setForm(prev => ({ ...prev, deposit_amount: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">អាសយដ្ឋានដឹកជញ្ជូនជូនភ្ញៀវ</label>
              <input
                type="text"
                placeholder="ផ្ទះលេខ..., ផ្លូវ..., សង្កាត់..., ខណ្ឌ... ឬខេត្ត..."
                value={form.customer_address}
                onChange={(e) => setForm(prev => ({ ...prev, customer_address: e.target.value }))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Section 4: Dates & Delivery Status */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Truck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                កាលបរិច្ឆេទ និងស្ថានភាពដឹកជញ្ជូន
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ថ្ងៃកុម្មង់ (Order Date)</label>
                <input
                  type="date"
                  value={form.order_date}
                  onChange={(e) => setForm(prev => ({ ...prev, order_date: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-700 mb-1">ថ្ងៃមកដល់របស់ឥវ៉ាន់ (Arrival)</label>
                <input
                  type="date"
                  value={form.arrival_date}
                  onChange={(e) => setForm(prev => ({ ...prev, arrival_date: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-amber-300 bg-amber-50/50 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ស្ថានភាពដឹកជូនភ្ញៀវ</label>
                <select
                  value={form.delivery_status}
                  onChange={(e) => setForm(prev => ({ ...prev, delivery_status: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="waiting">🟡 រង់ចាំឥវ៉ាន់មកដល់</option>
                  <option value="arrived">🔵 ឥវ៉ាន់មកដល់ហើយ (ត្រៀមផ្ញើ)</option>
                  <option value="shipped">🟢 បានផ្ញើជូនភ្ញៀវរួចរាល់</option>
                  <option value="completed">🟣 បានទូទាត់រួចរាល់ (Completed)</option>
                  <option value="cancelled">❌ បានបោះបង់ (Cancelled)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ក្រុមហ៊ុនដឹក / សេវាដឹក</label>
                <input
                  type="text"
                  placeholder="Virak Buntham, J&T, etc."
                  value={form.shipping_company}
                  onChange={(e) => setForm(prev => ({ ...prev, shipping_company: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">លេខកូដតាមដាន (Tracking Number)</label>
                <input
                  type="text"
                  placeholder="លេខកូដកញ្ចប់ឥវ៉ាន់ ឬ Bill Tracking"
                  value={form.tracking_number}
                  onChange={(e) => setForm(prev => ({ ...prev, tracking_number: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">កំណត់ចំណាំបន្ថែម</label>
                <input
                  type="text"
                  placeholder="ពណ៌, ទំហំ (Size), ចំណាំពិសេស..."
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-medium transition"
            >
              បោះបង់
            </button>

            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-200 transition disabled:opacity-50"
            >
              {uploading ? 'កំពុងរក្សាទុក...' : orderToEdit ? 'កែប្រែទិន្នន័យ' : 'រក្សាទុកឥវ៉ាន់'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
