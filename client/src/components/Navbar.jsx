import React from 'react';
import { 
  Plus, 
  Download, 
  BarChart3, 
  Settings, 
  ShoppingBag, 
  RefreshCw, 
  ExternalLink,
  Flame,
  Package,
  Zap,
  LogOut,
  User as UserIcon
} from 'lucide-react';

export default function Navbar({ 
  onOpenAdd, 
  activeTab, 
  setActiveTab, 
  onOpenSettings, 
  onRefresh, 
  settings,
  currentUser,
  onLogout
}) {
  const shopName = settings?.shop_name || 'អូន សប (Oun Shop)';
  const shopLogo = settings?.shop_logo;
  const facebookUrl = settings?.facebook_url;
  const cnyRate = settings?.cny_rate || '0.14';

  const handleExport = () => {
    window.open('/api/export-csv', '_blank');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Navbar Row */}
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Shop Title */}
          <div className="flex items-center space-x-3">
            {shopLogo ? (
              <img 
                src={shopLogo} 
                alt={shopName} 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-100">
                <ShoppingBag className="w-6 h-6" />
              </div>
            )}
            
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{shopName}</h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  Taobao & Stock
                </span>
              </div>

              {/* Subtitle / Rate & FB Page Link */}
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <button
                  onClick={onOpenSettings}
                  title="ចុចដើម្បីកំណត់ ឬ Update អត្រាប្តូរប្រាក់ស្វ័យប្រវត្តិ"
                  className="inline-flex items-center space-x-1 hover:text-rose-600 transition group cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-semibold text-slate-700">
                    {parseFloat(cnyRate) >= 1 ? `1 $ = ${cnyRate} ¥ (6.68 ¥ = 1 $)` : `1 ¥ = $${cnyRate}`}
                  </span>
                  <Zap className="w-2.5 h-2.5 text-amber-500 fill-current opacity-70 group-hover:opacity-100" />
                </button>
                {facebookUrl && (
                  <>
                    <span>•</span>
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center space-x-0.5 hover:underline"
                    >
                      <span>Facebook Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noreferrer"
                title="ចូលទៅកាន់ Facebook Page"
                className="hidden md:inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>FB Page</span>
              </a>
            )}

            <button
              onClick={handleExport}
              title="ទាញយកឯកសារ Excel"
              className="p-2 sm:px-3 sm:py-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            <button
              onClick={onRefresh}
              title="Refresh ទិន្នន័យ"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSettings}
              title="ការកំណត់ និង Upload Logo"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title={`Logout ចេញពី ${currentUser?.username || 'admin'}`}
                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition flex items-center space-x-1"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline text-xs font-semibold">Logout</span>
              </button>
            )}

            <button
              onClick={onOpenAdd}
              className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-rose-200 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ បញ្ចូលឥវ៉ាន់</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex space-x-2 border-t border-slate-100 pt-2 pb-2.5 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'orders'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>បញ្ជីការកុម្មង់ & ស្តុក (Orders)</span>
          </button>

          <button
            onClick={() => setActiveTab('trending')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'trending'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-rose-600 bg-rose-50/70 hover:bg-rose-100 border border-rose-200/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>ទំនិញ Taobao ពេញនិយម (Trending Girl Items)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">New</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>របាយការណ៍ហិរញ្ញវត្ថុ (Analytics)</span>
          </button>
        </div>

      </div>
    </header>
  );
}
