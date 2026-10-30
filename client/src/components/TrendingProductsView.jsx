import React, { useState } from 'react';
import { 
  Sparkles, 
  ExternalLink, 
  Plus, 
  Copy, 
  Check, 
  TrendingUp, 
  Search, 
  Filter, 
  Tag, 
  ShoppingBag,
  Flame
} from 'lucide-react';
import { trendingGirlProducts } from '../data/trendingProducts';

export default function TrendingProductsView({ onAddProductToShop }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'ទាំងអស់ (All)' },
    { id: 'ខោអាវ / សម្លៀកបំពាក់', label: '👗 សម្លៀកបំពាក់នារី' },
    { id: 'កាបូប / កាតាប', label: '👜 កាបូប Trendy' },
    { id: 'ស្បែកជើង', label: '👠 ស្បែកជើងនារី' },
    { id: 'គ្រឿងសំអាង / ថែរក្សាសម្រស់', label: '💄 គ្រឿងសំអាង & Beauty' },
    { id: 'ផ្សេងៗ', label: '💍 Accessories & ផ្សេងៗ' },
  ];

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredProducts = trendingGirlProducts.filter(item => {
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.chinese_keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Banner / Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-3">
            <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>ទំនិញ Taobao កំពុងពេញនិយមខ្លាំងសម្រាប់នារី (Trending Girl Products)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            មុខទំនិញពេញនិយម & លក់ដាច់ខ្លាំងលើ Taobao
          </h2>
          <p className="text-xs sm:text-sm text-rose-50 mt-2 leading-relaxed">
            បានជ្រើសរើសយ៉ាងសម្រិតសម្រាំងនូវម៉ូដសម្លៀកបំពាក់ កាបូប ស្បែកជើង និងគ្រឿងតុបតែងនារីស្ទីលកូរ៉េ ដែលមានតម្រូវការខ្ពស់នៅកម្ពុជា។ អាចស្វែងរកទិញលើ Taobao ភ្លាមៗ ឬចុចយកមកបញ្ចូលក្នុងហាងរបស់អ្នក!
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedCategory === c.id
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="ស្វែងរកតាមឈ្មោះ ឬពាក្យចិន..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredProducts.map((p) => {
          const taobaoSearchUrl = `https://s.taobao.com/search?q=${encodeURIComponent(p.chinese_keyword)}`;

          return (
            <div 
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col group"
            >
              {/* Product Photo */}
              <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                <img 
                  src={p.image} 
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                />
                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                  {p.tags.map((t, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 text-rose-600 shadow-xs backdrop-blur-xs"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <a
                  href={taobaoSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="ស្វែងរកលើ Taobao ភ្លាមៗ"
                  className="absolute top-2.5 right-2.5 bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1 rounded-md text-xs font-bold flex items-center space-x-1 shadow transition"
                >
                  <span>Taobao</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">{p.category}</div>
                  <h3 className="font-bold text-slate-900 text-sm mt-0.5 leading-snug">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                {/* Chinese Search Keyword with Copy Button */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] text-slate-400 block font-medium">ពាក្យគន្លឹះ Taobao (Chinese Keyword):</span>
                    <span className="font-mono font-bold text-slate-800 text-xs truncate block mt-0.5" title={p.chinese_keyword}>
                      {p.chinese_keyword}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(p.id, p.chinese_keyword)}
                    title="ចម្លងពាក្យចិន"
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition shrink-0"
                  >
                    {copiedId === p.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Price & Projected Profit */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block text-[10px]">ថ្លៃដើម Taobao:</span>
                    <span className="font-bold text-slate-900 text-sm">¥{p.est_cny}</span>
                    <span className="text-slate-400 text-[10px] block">~${p.est_usd}</span>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <span className="text-emerald-700 block text-[10px] font-semibold">តម្លៃលក់ណែនាំ:</span>
                    <span className="font-black text-emerald-700 text-sm">${p.rec_selling_price}</span>
                    <span className="text-emerald-600 text-[10px] font-bold block">+${p.est_profit} ចំណេញ</span>
                  </div>
                </div>

                {/* Quick Add to Shop Button */}
                <button
                  onClick={() => onAddProductToShop(p)}
                  className="w-full py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-200 flex items-center justify-center space-x-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ ជ្រើសរើសយកមកលក់ (Add to Shop)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
