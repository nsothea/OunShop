const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'shop.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
  }
});

// Password helpers
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  if (!stored.includes(':')) {
    return password === stored;
  }
  const [salt, hash] = stored.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Initialize tables
function initDb() {
  db.serialize(() => {
    // Users table for login
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT DEFAULT 'អ្នកគ្រប់គ្រង (Admin)',
        role TEXT DEFAULT 'admin',
        token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default admin user if not exists
    db.get(`SELECT COUNT(*) as count FROM users`, (err, row) => {
      if (!err && row.count === 0) {
        const defaultPass = hashPassword('admin123');
        db.run(
          `INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)`,
          ['admin', defaultPass, 'Admin (Oun Shop)', 'admin'],
          (insertErr) => {
            if (!insertErr) {
              console.log('Default user created: username="admin", password="admin123"');
            }
          }
        );
      }
    });

    // Orders / Products table
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_name TEXT NOT NULL,
        category TEXT DEFAULT 'ផ្សេងៗ',
        image_url TEXT,
        taobao_link TEXT,
        customer_name TEXT,
        customer_phone TEXT,
        customer_contact TEXT,
        customer_address TEXT,
        cost_cny REAL DEFAULT 0,
        exchange_rate REAL DEFAULT 0.14,
        cost_usd REAL DEFAULT 0,
        china_shipping REAL DEFAULT 0,
        cambodia_shipping REAL DEFAULT 0,
        other_expenses REAL DEFAULT 0,
        selling_price REAL DEFAULT 0,
        deposit_amount REAL DEFAULT 0,
        quantity INTEGER DEFAULT 1,
        total_cost REAL DEFAULT 0,
        total_revenue REAL DEFAULT 0,
        total_profit REAL DEFAULT 0,
        stock_status TEXT DEFAULT 'pre_order',
        delivery_status TEXT DEFAULT 'waiting',
        order_date TEXT,
        arrival_date TEXT,
        delivered_date TEXT,
        tracking_number TEXT,
        shipping_company TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migrate new columns if not present
    const addColumnSafe = (col, type) => {
      db.run(`ALTER TABLE orders ADD COLUMN ${col} ${type}`, () => {});
    };
    addColumnSafe('taobao_order_id', 'TEXT');
    addColumnSafe('china_tracking_number', 'TEXT');
    addColumnSafe('facebook_post_link', 'TEXT');

    // Settings table
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Default settings
    const defaultSettings = [
      ['shop_name', 'អូន សប (Oun Shop Online)'],
      ['shop_logo', ''],
      ['facebook_url', ''],
      ['shop_phone', '012 345 678'],
      ['shop_telegram', '@ounshop_admin'],
      ['shop_address', 'រាជធានីភ្នំពេញ, ប្រទេសកម្ពុជា'],
      ['cny_rate', '6.68'],
      ['currency', '$']
    ];

    const stmt = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`);
    defaultSettings.forEach(([k, v]) => stmt.run(k, v));
    stmt.finalize();

    console.log('Database tables verified and initialized successfully.');
  });
}

initDb();

db.hashPassword = hashPassword;
db.verifyPassword = verifyPassword;

module.exports = db;
