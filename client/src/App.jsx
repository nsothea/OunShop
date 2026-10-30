import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StatsCards from './components/StatsCards';
import OrderCard from './components/OrderCard';
import OrderTable from './components/OrderTable';
import OrderModal from './components/OrderModal';
import ReceiptModal from './components/ReceiptModal';
import ImageModal from './components/ImageModal';
import SettingsModal from './components/SettingsModal';
import AnalyticsView from './components/AnalyticsView';
import TrendingProductsView from './components/TrendingProductsView';
import LoginScreen from './components/LoginScreen';

import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Calendar, 
  Plus, 
  PackageX, 
  Boxes,
  Truck,
  RotateCcw
} from 'lucide-react';

export default function App() {
  // Authentication states
  const [token, setToken] = useState(() => localStorage.getItem('ounshop_auth_token') || sessionStorage.getItem('ounshop_auth_token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Main data states
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  // Main Tabs: 'orders' | 'trending' | 'analytics'
  const [activeTab, setActiveTab] = useState('orders');

  // Filters & Views
  const [search, setSearch] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 1. Initial Auth Check & Settings fetch
  useEffect(() => {
    // Always load public settings (for shop name & logo on Login screen)
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(() => {});

    const checkAuth = async () => {
      const savedToken = localStorage.getItem('ounshop_auth_token') || sessionStorage.getItem('ounshop_auth_token');
      if (!savedToken) {
        setToken('');
        setCurrentUser(null);
        setAuthChecked(true);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${savedToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setToken(savedToken);
          setCurrentUser(data.user);
        } else {
          localStorage.removeItem('ounshop_auth_token');
          sessionStorage.removeItem('ounshop_auth_token');
          setToken('');
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Auth verification error:', err);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  // 2. Load Protected Data (orders, stats, settings)
  const loadData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (deliveryFilter !== 'all') params.append('delivery_status', deliveryFilter);
      if (stockFilter !== 'all') params.append('stock_status', stockFilter);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);

      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [ordersRes, statsRes, settingsRes] = await Promise.all([
        fetch(`/api/orders?${params.toString()}`, { headers }),
        fetch('/api/stats', { headers }),
        fetch('/api/settings', { headers })
      ]);

      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, deliveryFilter, stockFilter, fromDate, toDate]);

  // Debounced search
  useEffect(() => {
    if (currentUser) {
      const timer = setTimeout(() => {
        loadData();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search]);

  // Handle Login Success
  const handleLoginSuccess = (newToken, user, rememberMe) => {
    setToken(newToken);
    setCurrentUser(user);
    if (rememberMe) {
      localStorage.setItem('ounshop_auth_token', newToken);
    } else {
      sessionStorage.setItem('ounshop_auth_token', newToken);
    }
    loadData();
  };

  // Handle Logout
  const handleLogout = async () => {
    if (window.confirm('តើអ្នកពិតជាចង់ចាកចេញពីប្រព័ន្ធ (Log Out) មែនទេ?')) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {}

      localStorage.removeItem('ounshop_auth_token');
      sessionStorage.removeItem('ounshop_auth_token');
      setToken('');
      setCurrentUser(null);
    }
  };

  // Save Order (Create or Update)
  const handleSaveOrder = async (orderData) => {
    const isEdit = Boolean(orderToEdit && orderToEdit.id);
    const url = isEdit ? `/api/orders/${orderToEdit.id}` : '/api/orders';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'បរាជ័យក្នុងការរក្សាទុក');
    }

    loadData();
  };

  // Quick Status Change
  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ delivery_status: newStatus })
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  // Delete Order
  const handleDeleteOrder = async (id) => {
    if (!window.confirm('តើអ្នកពិតជាចង់លុបទិន្នន័យនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយបានទេ!')) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Save Settings
  const handleSaveSettings = async (newSettings) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newSettings)
    });
    if (res.ok) {
      setSettings(newSettings);
      loadData();
    }
  };

  // Quick Add Trending Girl Product to Order Modal
  const handleAddTrendingProduct = (product) => {
    const rawRate = parseFloat(settings?.cny_rate) || 6.68;
    const computedUsd = rawRate >= 1 
      ? (product.est_cny / rawRate).toFixed(2) 
      : (product.est_cny * rawRate).toFixed(2);
    setOrderToEdit({
      item_name: product.name,
      category: product.category,
      image_url: product.image,
      taobao_link: `https://s.taobao.com/search?q=${encodeURIComponent(product.chinese_keyword)}`,
      cost_cny: product.est_cny,
      exchange_rate: rawRate,
      cost_usd: computedUsd,
      china_shipping: 0.50,
      cambodia_shipping: 1.50,
      other_expenses: 0,
      selling_price: product.rec_selling_price,
      deposit_amount: 0,
      quantity: 1,
      stock_status: 'pre_order',
      delivery_status: 'waiting',
      notes: `ពាក្យចិន Taobao: ${product.chinese_keyword}`,
      customer_name: ''
    });
    setIsOrderModalOpen(true);
  };

  // Pill filter handler from stats card
  const handleSelectFilter = (type, value) => {
    if (type === 'delivery') {
      setDeliveryFilter(prev => prev === value ? 'all' : value);
    } else if (type === 'stock') {
      setStockFilter(prev => prev === value ? 'all' : value);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setDeliveryFilter('all');
    setStockFilter('all');
    setFromDate('');
    setToDate('');
  };

  const hasActiveFilters = search || deliveryFilter !== 'all' || stockFilter !== 'all' || fromDate || toDate;

  // Show Loading while verifying session
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-300">កំពុងដំណើរការ Oun Shop...</p>
      </div>
    );
  }

  // If not logged in, show Login Screen!
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        settings={settings}
      />
    );
  }

  // Main Authenticated Application
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        settings={settings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAdd={() => {
          setOrderToEdit(null);
          setIsOrderModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefresh={loadData}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Tab 1: Orders & Stock Management */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Financial & Stock Stats Cards */}
            <StatsCards
              stats={stats}
              onSelectFilter={handleSelectFilter}
            />

            {/* Filter and Control Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ស្វែងរកតាមឈ្មោះឥវ៉ាន់, ឈ្មោះភ្ញៀវ, លេខទូរស័ព្ទ, Tracking #, Taobao ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>

                {/* Quick Filter Selectors */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Delivery Filter */}
                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                    <Truck className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
                    <select
                      value={deliveryFilter}
                      onChange={(e) => setDeliveryFilter(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-700 py-1 pr-2 border-0 focus:outline-hidden cursor-pointer"
                    >
                      <option value="all">ស្ថានភាពដឹក: ទាំងអស់</option>
                      <option value="waiting">🟡 រង់ចាំឥវ៉ាន់មកដល់</option>
                      <option value="arrived">🔵 ឥវ៉ាន់មកដល់ហើយ</option>
                      <option value="shipped">🟢 បានផ្ញើជូនភ្ញៀវរួច</option>
                      <option value="completed">🟣 បានបញ្ចប់</option>
                      <option value="cancelled">❌ បានបោះបង់</option>
                    </select>
                  </div>

                  {/* Stock Filter */}
                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                    <Boxes className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
                    <select
                      value={stockFilter}
                      onChange={(e) => setStockFilter(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-700 py-1 pr-2 border-0 focus:outline-hidden cursor-pointer"
                    >
                      <option value="all">ស្តុក: ទាំងអស់</option>
                      <option value="in_stock">📦 មានក្នុងស្តុក</option>
                      <option value="pre_order">⏳ កុម្មង់ទុកមុន (អត់ស្តុក)</option>
                      <option value="out_of_stock">❌ អស់ពីស្តុក</option>
                    </select>
                  </div>

                  {/* Date Filters */}
                  <div className="hidden lg:flex items-center space-x-1 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-xl">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>ពី:</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="bg-transparent text-xs py-0.5 border-0 focus:outline-hidden"
                    />
                    <span>ដល់:</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="bg-transparent text-xs py-0.5 border-0 focus:outline-hidden"
                    />
                  </div>

                  {/* Reset filter button */}
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      title="សម្អាត Filter"
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition text-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  )}

                  {/* View Mode Toggle: Grid vs Table */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setViewMode('grid')}
                      title="ទិដ្ឋភាពកាត (Cards View)"
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      title="ទិដ្ឋភាពតារាង (Table View)"
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        viewMode === 'table'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            </div>

            {/* Content Section: Grid or Table */}
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm font-medium text-slate-500">កំពុងទាញទិន្នន័យ...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto shadow-xs space-y-4">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <PackageX className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">មិនទាន់មានទិន្នន័យឥវ៉ាន់នៅឡើយទេ</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {hasActiveFilters 
                      ? 'មិនមានលទ្ធផលត្រូវនឹងការស្វែងរក ឬ Filter របស់អ្នកទេ។ សូមសាកល្បងចុច Reset Filter!' 
                      : 'សូមចាប់ផ្តើមបញ្ចូលទិន្នន័យទំនិញដំបូងរបស់អ្នក រូបភាព Link Taobao និងព័ត៌មានភ្ញៀវ!'}
                  </p>
                </div>
                {hasActiveFilters ? (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>សម្អាតការស្វែងរក (Reset)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setOrderToEdit(null);
                      setIsOrderModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ បញ្ចូលឥវ៉ាន់ឥឡូវនេះ</span>
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onEdit={(ord) => {
                      setOrderToEdit(ord);
                      setIsOrderModalOpen(true);
                    }}
                    onDelete={handleDeleteOrder}
                    onStatusChange={handleStatusChange}
                    onOpenReceipt={(ord) => {
                      setReceiptOrder(ord);
                      setIsReceiptOpen(true);
                    }}
                    onPreviewImage={(url) => setPreviewImageUrl(url)}
                  />
                ))}
              </div>
            ) : (
              <OrderTable
                orders={orders}
                onEdit={(ord) => {
                  setOrderToEdit(ord);
                  setIsOrderModalOpen(true);
                }}
                onDelete={handleDeleteOrder}
                onStatusChange={handleStatusChange}
                onOpenReceipt={(ord) => {
                  setReceiptOrder(ord);
                  setIsReceiptOpen(true);
                }}
                onPreviewImage={(url) => setPreviewImageUrl(url)}
              />
            )}
          </div>
        )}

        {/* Tab 2: Trending & Popular Girl Products on Taobao */}
        {activeTab === 'trending' && (
          <TrendingProductsView onAddProductToShop={handleAddTrendingProduct} />
        )}

        {/* Tab 3: Financial & Detailed Analytics */}
        {activeTab === 'analytics' && (
          <AnalyticsView stats={stats} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <p>© 2026 {settings?.shop_name || 'Oun Shop'} • ប្រព័ន្ធគ្រប់គ្រងការលក់ និងកុម្មង់ Taobao អនឡាញ</p>
      </footer>

      {/* Modals */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSave={handleSaveOrder}
        orderToEdit={orderToEdit}
        defaultRate={parseFloat(settings?.cny_rate) || 6.68}
      />

      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        order={receiptOrder}
        settings={settings}
      />

      <ImageModal
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl('')}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        token={token}
        currentUser={currentUser}
        onUserUpdated={(updatedUser) => setCurrentUser(updatedUser)}
      />
    </div>
  );
}
