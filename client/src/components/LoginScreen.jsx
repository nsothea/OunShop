import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  UserPlus,
  LogIn,
  CheckCircle2
} from 'lucide-react';

export default function LoginScreen({ onLoginSuccess, settings }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  
  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const shopName = settings?.shop_name || 'អូន សប (Oun Shop)';
  const shopLogo = settings?.shop_logo;

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('សូមបញ្ចូលទាំង Username និងលេខសម្ងាត់!');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Username ឬលេខសម្ងាត់មិនត្រឹមត្រូវទេ!');
      }

      onLoginSuccess(data.token, data.user, rememberMe);
    } catch (err) {
      setError(err.message || 'មានបញ្ហាក្នុងការ Login');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regUsername.trim() || !regPassword) {
      setError('សូមបញ្ចូល Username និងលេខសម្ងាត់!');
      return;
    }

    if (regUsername.trim().length < 3) {
      setError('Username ត្រូវមានយ៉ាងតិច ៣ តួអក្សរ!');
      return;
    }

    if (regPassword.length < 4) {
      setError('លេខសម្ងាត់ត្រូវមានយ៉ាងតិច ៤ តួអក្សរ!');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('លេខសម្ងាត់ និងការបញ្ជាក់លេខសម្ងាត់មិនត្រូវគ្នាទេ!');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim() || regUsername.trim(),
          username: regUsername.trim(),
          password: regPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'បរាជ័យក្នុងការចុះឈ្មោះគណនី');
      }

      setSuccessMsg('បានចុះឈ្មោះជោគជ័យ! កំពុងចូលប្រព័ន្ធ...');
      setTimeout(() => {
        onLoginSuccess(data.token, data.user, true);
      }, 1000);
    } catch (err) {
      setError(err.message || 'មានបញ្ហាក្នុងការចុះឈ្មោះ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 flex flex-col justify-center items-center p-4 font-sans select-none">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20">
        
        {/* Logo & Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-block relative">
            {shopLogo ? (
              <img 
                src={shopLogo} 
                alt={shopName} 
                className="w-20 h-20 mx-auto rounded-3xl object-cover border-2 border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-rose-500/30">
                <ShoppingBag className="w-10 h-10" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500 text-white rounded-full shadow-md">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {shopName}
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            ប្រព័ន្ធគ្រប់គ្រងការលក់ និងកុម្មង់ឥវ៉ាន់ Taobao
          </p>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
              setSuccessMsg('');
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>ចូលប្រើប្រាស់ (Log In)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
              setSuccessMsg('');
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>ចុះឈ្មោះ (Register)</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form 1: Log In */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Username (ឈ្មោះចូលប្រើ)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="ឧ. admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                លេខសម្ងាត់ (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                />
                <span>ចងចាំការ Login លើឧបករណ៍នេះ</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/25 flex items-center justify-center space-x-2 transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>កំពុងពិនិត្យ...</span>
                </>
              ) : (
                <>
                  <span>ចូលប្រើប្រាស់ (Log In)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Form 2: Register (Sign Up) */
          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ឈ្មោះពេញ / ឈ្មោះហាង (Full Name)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="ឧ. បង ស្រីនិច"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden transition"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="អក្សរឡាតាំង យ៉ាងតិច ៣ តួ (ឧ. ounshop)"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  autoComplete="username"
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                លេខសម្ងាត់ (Password) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="យ៉ាងតិច ៤ តួអក្សរ"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden transition"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                បញ្ជាក់លេខសម្ងាត់ (Confirm Password) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="វាយលេខសម្ងាត់ម្តងទៀត"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden transition"
                />
              </div>
            </div>

            {/* Register Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/25 flex items-center justify-center space-x-2 transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>កំពុងចុះឈ្មោះ...</span>
                </>
              ) : (
                <>
                  <span>បង្កើតគណនី (Register Now)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-400 space-y-1">
          {mode === 'login' ? (
            <p>
              គណនីដើម: Username: <strong className="text-slate-700 font-mono">admin</strong> | Password: <strong className="text-slate-700 font-mono">admin123</strong>
            </p>
          ) : (
            <p>
              ចុះឈ្មោះរួច ប្រព័ន្ធនឹង Login ចូលផ្ទាំងគ្រប់គ្រងដោយស្វ័យប្រវត្តិ
            </p>
          )}
        </div>

      </div>

      <p className="text-xs text-slate-500 mt-6">
        © 2026 {shopName} • Secure System
      </p>
    </div>
  );
}
