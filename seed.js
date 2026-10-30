const db = require('./database');

const sampleOrders = [
  {
    item_name: 'អាវយឺតដៃវែង Fashion ស្ទីលកូរ៉េ (Korean Oversize Tee)',
    category: 'ខោអាវ / សម្លៀកបំពាក់',
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    taobao_link: 'https://item.taobao.com/item.htm?id=689123456789',
    customer_name: 'បង ស្រីនិច',
    customer_phone: '012 889 977',
    customer_contact: 'Sreynich Cute (Facebook)',
    customer_address: 'ផ្ទះលេខ 24 ផ្លូវ 271 សង្កាត់បឹងទំពុន ខណ្ឌមានជ័យ រាជធានីភ្នំពេញ',
    cost_cny: 35.0,
    exchange_rate: 0.14,
    cost_usd: 4.90,
    china_shipping: 0.50,
    cambodia_shipping: 1.20,
    other_expenses: 0,
    selling_price: 12.00,
    deposit_amount: 5.00,
    quantity: 2,
    total_cost: 13.20,
    total_revenue: 24.00,
    total_profit: 10.80,
    stock_status: 'pre_order',
    delivery_status: 'waiting',
    order_date: '2026-10-25',
    arrival_date: '2026-11-05',
    delivered_date: '',
    tracking_number: 'CN-KH-992014',
    shipping_company: 'ZTO Express Cambodia',
    notes: 'ពណ៌ស 1, ពណ៌ខ្មៅ 1 ទំហំ L'
  },
  {
    item_name: 'ស្បែកជើងប៉ាតា Sneaker Vintage ពណ៌ស-បៃតង',
    category: 'ស្បែកជើង',
    image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80',
    taobao_link: 'https://item.taobao.com/item.htm?id=699876543210',
    customer_name: 'បង វ៉ាន់ដា',
    customer_phone: '098 765 432',
    customer_contact: '@vanda_phnompenh',
    customer_address: 'បុរីប៉េងហួតបឹងស្នោ ច្បារអំពៅ',
    cost_cny: 68.0,
    exchange_rate: 0.14,
    cost_usd: 9.52,
    china_shipping: 1.00,
    cambodia_shipping: 2.50,
    other_expenses: 0,
    selling_price: 24.00,
    deposit_amount: 10.00,
    quantity: 1,
    total_cost: 13.02,
    total_revenue: 24.00,
    total_profit: 10.98,
    stock_status: 'in_stock',
    delivery_status: 'arrived',
    order_date: '2026-10-20',
    arrival_date: '2026-10-30',
    delivered_date: '',
    tracking_number: 'VET-88291038',
    shipping_company: 'Virak Buntham',
    notes: 'Size 41 យកប្រអប់ដើម'
  },
  {
    item_name: 'កាបូបស្ពាយចំហៀងស្បែក PU គុណភាពខ្ពស់ ស្ទីល Minimal',
    category: 'កាបូប / កាតាប',
    image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80',
    taobao_link: 'https://item.taobao.com/item.htm?id=701234567890',
    customer_name: 'កញ្ញា សុជាតា',
    customer_phone: '088 123 4567',
    customer_contact: 'Socheata Official',
    customer_address: 'ក្រុងសៀមរាប ជិតផ្សារលើ',
    cost_cny: 45.0,
    exchange_rate: 0.14,
    cost_usd: 6.30,
    china_shipping: 0.80,
    cambodia_shipping: 1.50,
    other_expenses: 0,
    selling_price: 16.50,
    deposit_amount: 16.50,
    quantity: 1,
    total_cost: 8.60,
    total_revenue: 16.50,
    total_profit: 7.90,
    stock_status: 'pre_order',
    delivery_status: 'shipped',
    order_date: '2026-10-15',
    arrival_date: '2026-10-26',
    delivered_date: '2026-10-28',
    tracking_number: 'JT-88771122',
    shipping_company: 'J&T Express',
    notes: 'ពណ៌ត្នោត កក់លុយរួច ១០០%'
  },
  {
    item_name: 'កាស Bluetooth Wireless Stereo Bass ធន់ថ្ម',
    category: 'គ្រឿងអេឡិចត្រូនិច / Gadget',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    taobao_link: 'https://item.taobao.com/item.htm?id=712398471201',
    customer_name: 'បង រិទ្ធី',
    customer_phone: '077 554 433',
    customer_contact: '@rithy_tech',
    customer_address: 'ខេត្តបាត់ដំបង',
    cost_cny: 50.0,
    exchange_rate: 0.14,
    cost_usd: 7.00,
    china_shipping: 0.50,
    cambodia_shipping: 1.80,
    other_expenses: 0,
    selling_price: 18.00,
    deposit_amount: 0,
    quantity: 3,
    total_cost: 27.90,
    total_revenue: 54.00,
    total_profit: 26.10,
    stock_status: 'in_stock',
    delivery_status: 'completed',
    order_date: '2026-10-10',
    arrival_date: '2026-10-22',
    delivered_date: '2026-10-24',
    tracking_number: 'CAP-99120',
    shipping_company: 'Capitol Transport',
    notes: 'ពណ៌ខ្មៅ 2, ស 1'
  }
];

db.serialize(() => {
  // Check if orders table is empty
  db.get(`SELECT COUNT(*) as count FROM orders`, (err, row) => {
    if (err) {
      console.error(err);
      return;
    }
    if (row.count === 0) {
      const stmt = db.prepare(`
        INSERT INTO orders (
          item_name, category, image_url, taobao_link,
          customer_name, customer_phone, customer_contact, customer_address,
          cost_cny, exchange_rate, cost_usd, china_shipping, cambodia_shipping,
          other_expenses, selling_price, deposit_amount, quantity,
          total_cost, total_revenue, total_profit,
          stock_status, delivery_status,
          order_date, arrival_date, delivered_date,
          tracking_number, shipping_company, notes
        ) VALUES (
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?,
          ?, ?, ?,
          ?, ?, ?
        )
      `);

      sampleOrders.forEach((o) => {
        stmt.run(
          o.item_name, o.category, o.image_url, o.taobao_link,
          o.customer_name, o.customer_phone, o.customer_contact, o.customer_address,
          o.cost_cny, o.exchange_rate, o.cost_usd, o.china_shipping, o.cambodia_shipping,
          o.other_expenses, o.selling_price, o.deposit_amount, o.quantity,
          o.total_cost, o.total_revenue, o.total_profit,
          o.stock_status, o.delivery_status,
          o.order_date, o.arrival_date, o.delivered_date,
          o.tracking_number, o.shipping_company, o.notes
        );
      });

      stmt.finalize(() => {
        console.log('Sample orders seeded successfully!');
        process.exit(0);
      });
    } else {
      console.log('Database already has data (' + row.count + ' records). Skipping seed.');
      process.exit(0);
    }
  });
});
