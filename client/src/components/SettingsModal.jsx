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
  Store,
  Users,
  UserPlus,
  Trash2,
  Shield,
  Clock
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
  const [activeTab, setActiveTab] = useState('shop'); // 'shop' | 'security' | 'users'

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

  // Account Security Form (Current logged-in user profile update)
  const [securityForm, setSecurityForm] = useState({
    name: '',
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Admin User Management Form
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('staff'); // 'staff' | 'admin'

  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [usersError, setUsersError] = useState('');
  const [usersSuccess, setUsersSuccess] = useState('');

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

  // Fetch Users when modal opens or users tab selected
  const fetchUsers = async () => {
    if (!token) return;
    try {
      setLoadingUsers(true);
      setUsersError('');
      const res = await fetch('/api/auth/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'បរាជ័យក្នុងការទាញយកអ្នកប្រើប្រាស់');
      setUsersList(data.users || []);
    } catch (err) {
      setUsersError(err.message || 'មានបញ្ហាក្នុងការទាញយកអ្នកប្រើប្រាស់');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isOpen && (activeTab === 'users' || currentUser?.role === 'admin')) {
      fetchUsers();
    }
  }, [isOpen, activeTab]);

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
      setMessage('បានរក្សាទុកការកំណត់ហាងជោគជ័យ!');
      setTimeout(() => {
        setMessage('');
        onClose();
      }, 1000);
    } catch (err) {
      setSaving(false);
      setMessage('មានបញ្ហាក្នុងការរក្សាទុក!');
    }
  };

  // Submit Account & Security Change (Current User)
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

  // Admin: Create New User Account
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUsersError('');
    setUsersSuccess('');

    if (!newUserUsername.trim() || !newUserPassword) {
      setUsersError('សូមបញ្ចូលទាំង Username និងលេខសម្ងាត់!');
      return;
    }

    if (newUserUsername.trim().length < 3) {
      setUsersError('Username ត្រូវមានយ៉ាងតិច ៣ តួអក្សរ!');
      return;
    }

    if (newUserPassword.length < 4) {
      setUsersError('លេខសម្ងាត់ត្រូវមានយ៉ាងតិច ៤ តួអក្សរ!');
      return;
    }

    try {
      setCreatingUser(true);
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newUserName.trim() || newUserUsername.trim(),
          username: newUserUsername.trim(),
          password: newUserPassword,
          role: newUserRole
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'បរាជ័យក្នុងការបង្កើតគណនី');
      }

      setUsersSuccess(`បានបង្កើតគណនី "${data.user.username}" ជោគជ័យ!`);
      setNewUserName('');
      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserRole('staff');
      fetchUsers();

      setTimeout(() => {
        setUsersSuccess('');
      }, 4000);
    } catch (err) {
      setUsersError(err.message || 'មានបញ្ហាក្នុងការបង្កើតគណនី');
    } finally {
      setCreatingUser(false);
    }
  };

  // Admin: Delete User Account
  const handleDeleteUser = async (userId, targetUsername) => {
    if (!window.confirm(`តើអ្នកពិតជាចង់លុបគណនី "${targetUsername}" នេះមែនទេ?`)) {
      return;
    }

    try {
      setDeletingUserId(userId);
      setUsersError('');
      const res = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'បរាជ័យក្នុងការលុបគណនី');
      }

      setUsersSuccess(`បានលុបគណនី "${targetUsername}" ជោគជ័យ!`);
      fetchUsers();

      setTimeout(() => {
        setUsersSuccess('');
      }, 3000);
    } catch (err) {
      setUsersError(err.message || 'មានបញ្ហាក្នុងការលុបគណនី');
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-rose-500 rounded-lg text-white">
                <SettingsIcon className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base font-bold">ការកំណត់ប្រព័ន្ធ (Settings)</h2>
                <p className="text-xs text-slate-300">ព័ត៌មានហាង, លេខសម្ងាត់ និងការគ្រប់គ្រងគណនី</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1.5 border-t border-slate-800 pt-2.5 overflow-x-auto pb-0.5">
            <button
              onClick={() => setActiveTab('shop')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>គណនីរបស់ខ្ញុំ</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>គ្រប់គ្រង User / បង្កើតគណនី</span>
              {usersList.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-white/20 text-white text-[10px] rounded-full">
                  {usersList.length}
                </span>
              )}
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
                required
                value={form.shop_name}
                onChange={(e) => setForm(prev => ({ ...prev, shop_name: e.target.value }))}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Link ផេក Facebook (សម្រាប់បោះពុម្ពវិក្កយបត្រ)</label>
              <input
                type="text"
                placeholder="https://facebook.com/your-shop-page"
                value={form.facebook_url}
                onChange={(e) => setForm(prev => ({ ...prev, facebook_url: e.target.value }))}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-blue-600"
              />
            </div>

            {/* Exchange Rate Setup */}
            <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-amber-900">អត្រាប្តូរប្រាក់ យ៉ន់ (CNY Rate)</h4>
                  <p className="text-[11px] text-amber-700">រូបមន្តស្ដង់ដារ: 1 $ = {form.cny_rate || '6.68'} ¥ ({form.cny_rate || '6.68'} ¥ = 1 $)</p>
                </div>
                <button
                  type="button"
                  onClick={handleFetchLiveRate}
                  disabled={fetchingRate}
                  className="px-2.5 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 rounded-xl text-xs font-bold text-amber-900 shadow-xs flex items-center space-x-1 transition cursor-pointer"
                >
                  <Zap className={`w-3.5 h-3.5 text-amber-600 ${fetchingRate ? 'animate-spin' : ''}`} />
                  <span>{fetchingRate ? 'កំពុងទាញយក...' : 'ទាញយកតម្លៃទីផ្សារ Live'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ចំនួន យ៉ន់ ក្នុង 1 ដុល្លារ (¥ / 1 USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.cny_rate}
                  onChange={(e) => setForm(prev => ({ ...prev, cny_rate: e.target.value }))}
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-bold"
                />
              </div>
            </div>

            {/* Contacts & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">លេខទូរស័ព្ទហាង</label>
                <input
                  type="text"
                  placeholder="012 345 678"
                  value={form.shop_phone}
                  onChange={(e) => setForm(prev => ({ ...prev, shop_phone: e.target.value }))}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Telegram ហាង</label>
                <input
                  type="text"
                  placeholder="@yourshop"
                  value={form.shop_telegram}
                  onChange={(e) => setForm(prev => ({ ...prev, shop_telegram: e.target.value }))}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">អាសយដ្ឋានហាង</label>
              <textarea
                rows={2}
                placeholder="រាជធានីភ្នំពេញ"
                value={form.shop_address}
                onChange={(e) => setForm(prev => ({ ...prev, shop_address: e.target.value }))}
                className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 shrink-0">
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
                className="px-5 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកការកំណត់'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: My Account & Password Change */}
        {activeTab === 'security' && (
          <form onSubmit={handleSubmitSecurity} className="p-6 space-y-4 overflow-y-auto flex-1">
            {securitySuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{securitySuccess}</span>
              </div>
            )}

            {securityError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{securityError}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-sm">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">{currentUser?.name || 'User'}</h4>
                <p className="text-[11px] text-slate-400">@{currentUser?.username || 'user'} • តួនាទី: <span className="font-semibold text-rose-600">{currentUser?.role === 'admin' ? 'Admin (អ្នកគ្រប់គ្រង)' : 'Staff (បុគ្គលិក)'}</span></p>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ឈ្មោះបង្ហាញ (Display Name)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  value={securityForm.name}
                  onChange={(e) => setSecurityForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username ចូលប្រើ
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  value={securityForm.username}
                  onChange={(e) => setSecurityForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-mono"
                />
              </div>
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
                <span>{savingSecurity ? 'កំពុងផ្លាស់ប្តូរ...' : 'ផ្លាស់ប្តូរគណនីខ្ញុំ'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Admin User Management & Create Account */}
        {activeTab === 'users' && (
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Header info */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-rose-500" />
                  <span>គ្រប់គ្រងគណនីបុគ្គលិក និងអ្នកប្រើប្រាស់</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  មានតែ Admin ទេដែលអាចបង្កើតគណនី និងគ្រប់គ្រងអ្នកប្រើប្រាស់បាន
                </p>
              </div>
            </div>

            {/* Alert Messages */}
            {usersSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{usersSuccess}</span>
              </div>
            )}

            {usersError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{usersError}</span>
              </div>
            )}

            {/* Form: Create New User */}
            <form onSubmit={handleCreateUser} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <UserPlus className="w-3.5 h-3.5 text-rose-500" />
                <span>បង្កើតគណនីថ្មី (Create New User)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ឈ្មោះបុគ្គលិក / អ្នកប្រើ (Name)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ឧ. បង ស្រីនិច"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Username ចូលប្រើ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ឧ. sreynich (អក្សរឡាតាំង)"
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    លេខសម្ងាត់ (Password) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="យ៉ាងតិច ៤ តួអក្សរ"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    តួនាទី (Role)
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="staff">បុគ្គលិក (Staff) - លក់ & កុម្មង់ទូទៅ</option>
                    <option value="admin">អ្នកគ្រប់គ្រង (Admin) - សិទ្ធិពេញលេញ</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{creatingUser ? 'កំពុងបង្កើត...' : 'បង្កើតគណនីថ្មី'}</span>
                </button>
              </div>
            </form>

            {/* Users List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">
                  បញ្ជីគណនីទាំងអស់ក្នុងប្រព័ន្ធ ({usersList.length})
                </h4>
                <button
                  type="button"
                  onClick={fetchUsers}
                  className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                >
                  Refresh បញ្ជី
                </button>
              </div>

              {loadingUsers ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  កំពុងទាញយកបញ្ជីគណនី...
                </div>
              ) : usersList.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  មិនទាន់មានគណនីផ្សេងទៀតនៅឡើយទេ
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
                  {usersList.map((u) => {
                    const isSelf = currentUser && currentUser.id === u.id;
                    const isPrimaryAdmin = u.id === 1;

                    return (
                      <div key={u.id} className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            u.role === 'admin' 
                              ? 'bg-rose-100 text-rose-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-slate-800">{u.name}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                u.role === 'admin'
                                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                  : 'bg-blue-50 text-blue-600 border border-blue-200'
                              }`}>
                                {u.role === 'admin' ? 'Admin' : 'Staff'}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md border border-emerald-200 font-medium">
                                  អ្នកផ្ទាល់ (You)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">
                              @{u.username}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-2">
                          {isSelf || isPrimaryAdmin ? (
                            <span className="text-[10px] text-slate-400 italic px-2">
                              {isPrimaryAdmin ? 'មេ Admin' : 'កំពុង Login'}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              disabled={deletingUserId === u.id}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="លុបគណនីនេះ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                បិទផ្ទាំង
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
