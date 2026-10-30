import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Settings as SettingsIcon, 
  AlertCircle, 
  Upload, 
  Image as ImageIcon, 
  ExternalLink, 
  Zap, 
  Check, 
  Lock, 
  User, 
  ShieldCheck,
  Store
} from 'lucide-react';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onSaveSettings, 
  token, 
  currentUser, 
  onUserUpdated 
}) {
  const [activeTab, setActiveTab] = useState('shop'); // 'shop' | 'security'

  // Shop Settings Form
  const [form, setForm] = useState({
    shop_name: '',
    shop_logo: '',
    facebook_url: '',
    shop_phone: '',
    shop_telegram: '',
    shop_address: '',
    cny_rate: '6.68',
    currency: '$'
  });

  // Account Security Form
  const [securityForm, setSecurityForm] = useState({
    name: '',
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [saving, setSaving] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [liveRateInfo, setLiveRateInfo] = useState(null);
  const [message, setMessage] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');

  useEffect(() => {
    if (settings) {
      setForm(prev => ({
        ...prev,
        ...settings,
        shop_logo: settings.shop_logo || '',
        facebook_url: settings.facebook_url || '',
        cny_rate: settings.cny_rate || '6.68'
      }));
    }
  }, [settings, isOpen]);

  useEffect(() => {
    if (currentUser) {
      setSecurityForm({
        name: currentUser.name || 'Admin',
        username: currentUser.username || 'admin',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
    setSecurityError('');
    setSecuritySuccess('');
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  // Fetch Live CNY Rate from API
  const handleFetchLiveRate = async () => {
    try {
      setFetchingRate(true);
      const res = await fetch('/api/exchange-rate/cny');
      if (!res.ok) throw new Error('Cannot fetch rate');
      const data = await res.json();
      
      if (data.usd_to_cny) {
        setForm(prev => ({ ...prev, cny_rate: String(data.usd_to_cny) }));
        setLiveRateInfo(data);
        setMessage(`បានទាញយកអត្រាទីផ្សារបច្ចុប្បន្នជោគជ័យ: 1 $ = ${data.usd_to_cny} ¥ (${data.usd_to_cny} ¥ = 1 $)`);
        setTimeout(() => setMessage(''), 4000);
      } else if (data.cny_to_usd) {
        setForm(prev => ({ ...prev, cny_rate: String((1 / data.cny_to_usd).toFixed(2)) }));
        setLiveRateInfo(data);
        setMessage(`បានទាញយកអត្រាទីផ្សារបច្ចុប្បន្នជោគជ័យ: 1 $ = ${(1 / data.cny_to_usd).toFixed(2)} ¥`);
        setTimeout(() => setMessage(''), 4000);
      }
      setFetchingRate(false);
    } catch (err) {
      console.error(err);
      setFetchingRate(false);
      alert('មិនអាចទាញយកអត្រាប្តូរប្រាក់បច្ចុប្បន្នបានទេ សូមពិនិត្យ Internet');
    }
  };

  // Handle Logo Upload
  const handleLogoFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Failed to upload');

      const data = await res.json();
      setForm(prev => ({ ...prev, shop_logo: data.imageUrl }));
      setUploadingLogo(false);
    } catch (err) {
      console.error(err);
      setUploadingLogo(false);
      alert('បរាជ័យក្នុងការ Upload Logo');
    }
  };

  // Submit Shop Settings
  const handleSubmitShop = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSaveSettings(form);
      setSaving(false);
      setMessage('បានរក្សាទុកការកំណត់ជោគជ័យ!');
      setTimeout(() => {
        setMessage('');
        onClose();
      }, 1000);
    } catch (err) {
      setSaving(false);
      setMessage('មានបញ្ហាក្នុងការរក្សាទុក!');
    }
  };

  // Submit Account & Security Change
  const handleSubmitSecurity = async (e) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (!securityForm.currentPassword) {
      setSecurityError('សូមបញ្ចូលលេខសម្ងាត់ចាស់ដើម្បីផ្ទៀងផ្ទាត់!');
      return;
    }

    if (securityForm.newPassword) {
      if (securityForm.newPassword.length < 4) {
        setSecurityError('លេខសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៤ តួអក្សរ!');
        return;
      }
      if (securityForm.newPassword !== securityForm.confirmPassword) {
        setSecurityError('លេខសម្ងាត់ថ្មី និងការបញ្ជាក់មិនដូចគ្នាទេ!');
        return;
      }
    }

    try {
      setSavingSecurity(true);

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: securityForm.currentPassword,
          newUsername: securityForm.username.trim(),
          newPassword: securityForm.newPassword.trim(),
          newName: securityForm.name.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'បរាជ័យក្នុងការកែប្រែព័ត៌មានគណនី');
      }

      setSavingSecurity(false);
      setSecuritySuccess('បានផ្លាស់ប្តូរ Username និងលេខសម្ងាត់ថ្មីជោគជ័យ!');
      if (onUserUpdated) {
        onUserUpdated(data.user);
      }

      setSecurityForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      setTimeout(() => {
        setSecuritySuccess('');
      }, 4000);
    } catch (err) {
      setSavingSecurity(false);
      setSecurityError(err.message || 'មានបញ្ហាក្នុងការផ្លាស់ប្តូរគណនី');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-rose-500 rounded-lg text-white">
                <SettingsIcon className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base font-bold">ការកំណត់ប្រព័ន្ធ (Settings)</h2>
                <p className="text-xs text-slate-300">ព័ត៌មានហាង, Logo, Facebook និងលេខសម្ងាត់</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 border-t border-slate-800 pt-2.5">
            <button
              onClick={() => setActiveTab('shop')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'shop'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>ព័ត៌មានហាង & អត្រាប្រាក់</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'security'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Username & លេខសម្ងាត់</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Shop & Currency Settings */}
        {activeTab === 'shop' && (
          <form onSubmit={handleSubmitShop} className="p-6 space-y-4 overflow-y-auto flex-1">
            {message && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {/* Shop Logo Upload */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Logo ហាង (Shop Logo)
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-xs shrink-0">
                  {form.shop_logo ? (
                    <img src={form.shop_logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 shadow-xs transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingLogo ? 'កំពុង Upload...' : 'Upload រូប Logo'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoFileChange} />
                  </label>
                  <input
                    type="text"
                    placeholder="ឬ Paste Link URL រូបភាព Logo"
                    value={form.shop_logo}
                    onChange={(e) => setForm(prev => ({ ...prev, shop_logo: e.target.value }))}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Shop Name & Facebook Page */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ឈ្មោះហាង (Shop Name)</label>
              <input
                type="text"
                value={form.shop_name}
                onChange={(e) => setForm(prev => ({ ...prev, shop_name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center space-x-1 text-blue-600 font-bold">
                  <span>Link ទៅកាន់ Facebook Page</span>
                </span>
                {form.facebook_url && (
                  <a 
                    href={form.facebook_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-blue-600 hover:underline flex items-center space-x-1 text-[11px]"
                  >
                    <span>សាកល្បងបើក Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </label>
              <input
                type="url"
                placeholder="https://facebook.com/YourShopName ឬ https://m.me/YourShopName"
                value={form.facebook_url}
                onChange={(e) => setForm(prev => ({ ...prev, facebook_url: e.target.value }))}
                className="w-full px-3 py-2 border border-blue-200 bg-blue-50/20 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">លេខទូរស័ព្ទហាង</label>
                <input
                  type="text"
                  value={form.shop_phone}
                  onChange={(e) => setForm(prev => ({ ...prev, shop_phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Telegram Contact</label>
                <input
                  type="text"
                  value={form.shop_telegram}
                  onChange={(e) => setForm(prev => ({ ...prev, shop_telegram: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">អាសយដ្ឋានហាង</label>
              <input
                type="text"
                value={form.shop_address}
                onChange={(e) => setForm(prev => ({ ...prev, shop_address: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            {/* Currency Rate Box */}
            <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider">
                    អត្រាប្តូរប្រាក់ចិន ¥ ទៅ ដុល្លារ $
                  </label>
                  <p className="text-[11px] text-slate-500">គណនាថ្លៃដើមទំនិញ Taobao ទៅជាប្រាក់ដុល្លារ</p>
                </div>

                <button
                  type="button"
                  onClick={handleFetchLiveRate}
                  disabled={fetchingRate}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>{fetchingRate ? 'កំពុងស្វែងរក...' : 'ទាញយក Live Rate'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    1 $ ស្មើនឹង (... ¥)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-rose-500 text-xs font-bold">¥</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="6.68"
                      value={form.cny_rate}
                      onChange={(e) => setForm(prev => ({ ...prev, cny_rate: e.target.value }))}
                      className="w-full pl-6 pr-3 py-1.5 border border-rose-300 bg-white rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {parseFloat(form.cny_rate) >= 1 ? (
                      <>
                        <strong>{form.cny_rate} ¥ = 1 $</strong> (100 ¥ ≈ ${(100 / parseFloat(form.cny_rate)).toFixed(2)})
                      </>
                    ) : (
                      <>
                        <strong>1 ¥ = ${form.cny_rate}</strong> (100 ¥ = ${(100 * parseFloat(form.cny_rate)).toFixed(2)})
                      </>
                    )}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">រូបិយប័ណ្ណលក់ចេញ</label>
                  <input
                    type="text"
                    value={form.currency}
                    onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {parseFloat(form.cny_rate) >= 1 ? (
                      <span>1 ¥ ≈ ${(1 / parseFloat(form.cny_rate)).toFixed(4)}</span>
                    ) : (
                      <span>1 $ ≈ {(1 / parseFloat(form.cny_rate)).toFixed(2)} ¥</span>
                    )}
                  </span>
                </div>
              </div>

              {liveRateInfo && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center justify-between">
                  <span>អត្រាទីផ្សារ: <strong>1 $ = {liveRateInfo.usd_to_cny} ¥ ({liveRateInfo.usd_to_cny} ¥ = 1 $)</strong></span>
                  <span className="font-bold flex items-center space-x-0.5 text-emerald-600">
                    <Check className="w-3.5 h-3.5" />
                    <span>Live</span>
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'រក្សាទុក...' : 'រក្សាទុកព័ត៌មានហាង'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Account & Password Security Settings */}
        {activeTab === 'security' && (
          <form onSubmit={handleSubmitSecurity} className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center space-x-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  សុវត្ថិភាពគណនី (Account & Password)
                </h3>
                <p className="text-[11px] text-slate-500">
                  ផ្លាស់ប្តូរ Username និងលេខសម្ងាត់ដើម្បីការពារទិន្នន័យហាងរបស់អ្នក
                </p>
              </div>
            </div>

            {securityError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{securityError}</span>
              </div>
            )}

            {securitySuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{securitySuccess}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ឈ្មោះអ្នកគ្រប់គ្រង (Display Name)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="ឧ. Admin (Oun Shop)"
                  value={securityForm.name}
                  onChange={(e) => setSecurityForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username សម្រាប់ Login <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={securityForm.username}
                  onChange={(e) => setSecurityForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-mono"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                ឈ្មោះនេះសម្រាប់ប្រើពេល Log in ចូលប្រព័ន្ធ
              </span>
            </div>

            {/* Current Password */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                លេខសម្ងាត់ចាស់បច្ចុប្បន្ន (Current Password) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="បញ្ចូលលេខសម្ងាត់ចាស់ដើម្បីផ្ទៀងផ្ទាត់"
                  value={securityForm.currentPassword}
                  onChange={(e) => setSecurityForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* New Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  លេខសម្ងាត់ថ្មី (New Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="password"
                    placeholder="ទុកទំនេរ បើមិនចង់ប្តូរ"
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  បញ្ជាក់លេខសម្ងាត់ថ្មី
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="password"
                    placeholder="វាយលេខសម្ងាត់ថ្មីម្តងទៀត"
                    value={securityForm.confirmPassword}
                    onChange={(e) => setSecurityForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                បិទ
              </button>
              <button
                type="submit"
                disabled={savingSecurity}
                className="px-5 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingSecurity ? 'កំពុងផ្លាស់ប្តូរ...' : 'ផ្លាស់ប្តូរ Username & លេខសម្ងាត់'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
