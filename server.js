const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (allowed.test(ext) || allowed.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('អនុញ្ញាតត្រឹមតែឯកសាររូបភាព (JPG, PNG, WEBP, GIF)!'));
    }
  }
});

// Helper to compute financial metrics
function calculateTotals(data) {
  const qty = parseInt(data.quantity, 10) || 1;
  const costCny = parseFloat(data.cost_cny) || 0;
  const rawRate = parseFloat(data.exchange_rate) || 6.68;
  
  // Support both "1 $ = 6.68 ¥" (rate >= 1) and "1 ¥ = 0.1498 $" (rate < 1)
  let rateMultiplier = 1 / 6.68;
  if (rawRate >= 1) {
    rateMultiplier = 1 / rawRate;
  } else if (rawRate > 0) {
    rateMultiplier = rawRate;
  }
  
  // If cost_usd was not explicitly provided or is 0, but cost_cny is set, compute from CNY
  let costUsd = parseFloat(data.cost_usd);
  if ((isNaN(costUsd) || costUsd === 0) && costCny > 0) {
    costUsd = parseFloat((costCny * rateMultiplier).toFixed(2));
  } else if (isNaN(costUsd)) {
    costUsd = 0;
  }

  const chinaShipping = parseFloat(data.china_shipping) || 0;
  const cambodiaShipping = parseFloat(data.cambodia_shipping) || 0;
  const otherExpenses = parseFloat(data.other_expenses) || 0;
  const sellingPrice = parseFloat(data.selling_price) || 0;

  const costPerUnit = costUsd + chinaShipping + cambodiaShipping + otherExpenses;
  const totalCost = parseFloat((costPerUnit * qty).toFixed(2));
  const totalRevenue = parseFloat((sellingPrice * qty).toFixed(2));
  const totalProfit = parseFloat((totalRevenue - totalCost).toFixed(2));

  return {
    quantity: qty,
    cost_cny: costCny,
    exchange_rate: rawRate,
    cost_usd: costUsd,
    china_shipping: chinaShipping,
    cambodia_shipping: cambodiaShipping,
    other_expenses: otherExpenses,
    selling_price: sellingPrice,
    total_cost: totalCost,
    total_revenue: totalRevenue,
    total_profit: totalProfit,
    deposit_amount: parseFloat(data.deposit_amount) || 0
  };
}

// 1. Upload Image Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'សូមជ្រើសរើសរូបភាពដើម្បី Upload' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, imageUrl, filename: req.file.filename });
});

// Live China Yuan (CNY) Exchange Rate Endpoint
app.get('/api/exchange-rate/cny', async (req, res) => {
  try {
    let rate = null;
    let provider = '';
    let date = new Date().toISOString().slice(0, 10);

    // Try primary open.er-api.com
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/CNY');
      const data = await response.json();
      if (data && data.rates && data.rates.USD) {
        rate = data.rates.USD;
        provider = 'open.er-api';
        date = data.time_last_update_utc ? new Date(data.time_last_update_utc).toISOString().slice(0, 10) : date;
      }
    } catch (e) {
      console.warn('Primary exchange API error, trying fallback...', e.message);
    }

    // Try fallback Frankfurter API
    if (!rate) {
      try {
        const fbResponse = await fetch('https://api.frankfurter.app/latest?from=CNY&to=USD');
        const fbData = await fbResponse.json();
        if (fbData && fbData.rates && fbData.rates.USD) {
          rate = fbData.rates.USD;
          provider = 'frankfurter';
          date = fbData.date;
        }
      } catch (e) {
        console.warn('Fallback API error:', e.message);
      }
    }

    if (!rate) {
      return res.status(500).json({ error: 'មិនអាចទាញយកអត្រាប្តូរប្រាក់បានទេ' });
    }

    const rateRounded = parseFloat(rate.toFixed(4));
    const usdToCny = parseFloat((1 / rate).toFixed(2));

    res.json({
      success: true,
      cny_to_usd: rateRounded,
      usd_to_cny: usdToCny,
      date,
      provider
    });
  } catch (error) {
    console.error('Error in exchange rate endpoint:', error);
    res.status(500).json({ error: 'មានបញ្ហាក្នុងការទាញយកអត្រាប្តូរប្រាក់' });
  }
});

// ==================== TAOBAO / 1688 PRODUCT & COLOR EXTRACTOR ====================
// Extract product images and color variants from Taobao/1688 link
app.post('/api/taobao/extract', async (req, res) => {
  const { url } = req.body;
  if (!url || !url.trim()) {
    return res.status(400).json({ error: 'សូមបញ្ចូល Link Taobao ឬ 1688!' });
  }

  const rawInput = url.trim();

  // Extract clean URL from share text (e.g. "【淘宝】https://m.tb.cn/h.5xyz 标题...")
  const urlMatch = rawInput.match(/https?:\/\/[^\s"'<>]+/i);
  const targetUrl = urlMatch ? urlMatch[0] : rawInput;

  // Extract Item ID
  let itemId = null;
  const idMatch = targetUrl.match(/[?&]id=(\d+)/i) || 
                  targetUrl.match(/\/item\/(\d+)\.htm/i) || 
                  targetUrl.match(/\/offer\/(\d+)\.html/i);
  if (idMatch) {
    itemId = idMatch[1];
  }

  // Extract Title from share text if available
  let extractedTitle = '';
  const titleBracketMatch = rawInput.match(/「([^」]+)」/);
  const titleShareMatch = rawInput.match(/【[^】]+】\s*https?:\/\/[^\s]+\s*(.+)/);
  if (titleBracketMatch) {
    extractedTitle = titleBracketMatch[1].trim();
  } else if (titleShareMatch && titleShareMatch[1]) {
    extractedTitle = titleShareMatch[1].trim();
  }

  const images = [];
  const seen = new Set();

  function addImage(imgUrl) {
    if (!imgUrl) return;
    let clean = imgUrl.trim();
    if (clean.startsWith('//')) clean = 'https:' + clean;
    if (!clean.startsWith('http')) return;

    // Filter out common scripts, styles, icons
    if (/\.(ico|svg|gif|js|css)$/i.test(clean)) return;
    if (clean.includes('/tps/') || clean.includes('/tfs/')) return;

    // Filter out small navigation icons like tps-56-56
    const smallTps = clean.match(/tps-(\d+)-(\d+)/i);
    if (smallTps && (parseInt(smallTps[1]) < 200 || parseInt(smallTps[2]) < 200)) return;

    // Only keep product images from alicdn, tbcdn, 1688
    if (!clean.includes('/imgextra/') && !clean.includes('/bao/uploaded/')) {
      if (!/(?:alicdn|tbcdn|1688|taobao)/i.test(clean)) return;
    }

    if (!/\.(jpg|jpeg|png|webp)/i.test(clean)) return;

    // Clean resize / thumbnail suffixes to get full HD image
    let hd = clean.replace(/_\d+x\d+.*?\.(jpg|png|webp|jpeg)/i, '');
    hd = hd.replace(/_\.webp/i, '');
    hd = hd.replace(/_Q\d+\.jpg/i, '');

    if (!seen.has(hd)) {
      seen.add(hd);
      images.push(hd);
    }
  }

  try {
    const fetchUrls = [];
    if (itemId) {
      fetchUrls.push(`https://world.taobao.com/item/${itemId}.htm`);
      fetchUrls.push(`https://item.taobao.com/item.htm?id=${itemId}`);
    } else {
      fetchUrls.push(targetUrl);
    }

    for (const fUrl of fetchUrls) {
      try {
        const response = await fetch(fUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
          },
          signal: AbortSignal.timeout(6000)
        });

        const html = await response.text();

        // Extract title from HTML if not yet extracted
        if (!extractedTitle) {
          const tMatch = html.match(/<title>([^<]+)<\/title>/i);
          if (tMatch && !tMatch[1].includes('淘宝') && !tMatch[1].includes('登录')) {
            extractedTitle = tMatch[1].trim();
          }
        }

        // Extract alicdn image links
        const rawImgs = html.match(/(?:https?:)?\/\/[^"'\s\)]+alicdn\.com\/[^"'\s\)]+/gi) || [];
        for (const raw of rawImgs) {
          addImage(raw);
        }

        if (images.length > 0) break;
      } catch (err) {}
    }
  } catch (err) {}

  res.json({
    success: true,
    itemId,
    title: extractedTitle,
    url: targetUrl,
    images: images.slice(0, 20)
  });
});

// Download an external image URL to local uploads folder
app.post('/api/taobao/save-image', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl || !imageUrl.startsWith('http')) {
    return res.status(400).json({ error: 'Image URL មិនត្រឹមត្រូវ!' });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://www.taobao.com/'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const ext = path.extname(imageUrl.split('?')[0]) || '.jpg';
    const filename = `taobao-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    res.json({
      success: true,
      imageUrl: `/uploads/${filename}`,
      originalUrl: imageUrl
    });
  } catch (err) {
    console.error('Error saving image:', err.message);
    // If saving locally fails, return original image URL so frontend still works
    res.json({
      success: true,
      imageUrl: imageUrl,
      warning: 'Used external CDN URL'
    });
  }
});

// ==================== AUTHENTICATION ROUTES ====================

// Auth Middleware Helper
function authenticateUser(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'សូម Login ដើម្បីបន្ត' });
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return res.status(401).json({ error: 'Token មិនត្រឹមត្រូវ' });
  }

  db.get(`SELECT id, username, name, role, created_at FROM users WHERE token = ?`, [token], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Session ផុតកំណត់ ឬមិនត្រឹមត្រូវ សូម Login ឡើងវិញ' });
    }
    req.user = user;
    next();
  });
}

// 1. Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'សូមបញ្ចូល Username និងលេខសម្ងាត់!' });
  }

  db.get(`SELECT * FROM users WHERE username = ? COLLATE NOCASE`, [username.trim()], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'មានបញ្ហាក្នុងការពិនិត្យគណនី' });
    }
    if (!user || !db.verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Username ឬលេខសម្ងាត់មិនត្រឹមត្រូវទេ!' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    db.run(`UPDATE users SET token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [token, user.id], (upErr) => {
      if (upErr) {
        return res.status(500).json({ error: 'បរាជ័យក្នុងការបង្កើត Session' });
      }
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        }
      });
    });
  });
});

// Auth: Public Register is DISABLED (Only Admin can create users in Settings)
app.post('/api/auth/register', (req, res) => {
  return res.status(403).json({ 
    error: 'ការចុះឈ្មោះជាសាធារណៈត្រូវបានបិទ។ មានតែ Admin ទេដែលអាចបង្កើតគណនីបានក្នុង Setting។' 
  });
});

// Admin: Get all users
app.get('/api/auth/users', authenticateUser, (req, res) => {
  db.all(`SELECT id, username, name, role, created_at, updated_at FROM users ORDER BY id ASC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'បរាជ័យក្នុងការទាញយកបញ្ជីអ្នកប្រើប្រាស់' });
    }
    res.json({ success: true, users: rows || [] });
  });
});

// Admin: Create new user account
app.post('/api/auth/users', authenticateUser, (req, res) => {
  const { name, username, password, role } = req.body;
  if (!username || !username.trim() || !password) {
    return res.status(400).json({ error: 'សូមបញ្ចូលទាំង Username និងលេខសម្ងាត់!' });
  }

  const cleanUsername = username.trim();
  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: 'Username ត្រូវមានយ៉ាងតិច ៣ តួអក្សរ!' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'លេខសម្ងាត់ត្រូវមានយ៉ាងតិច ៤ តួអក្សរ!' });
  }

  db.get(`SELECT id FROM users WHERE username = ? COLLATE NOCASE`, [cleanUsername], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: 'មានបញ្ហាក្នុងការពិនិត្យគណនី' });
    }
    if (existing) {
      return res.status(400).json({ error: 'Username នេះមានគេប្រើរួចហើយ សូមជ្រើសរើសឈ្មោះផ្សេង!' });
    }

    const hashedPassword = db.hashPassword(password);
    const displayName = name && name.trim() ? name.trim() : cleanUsername;
    const userRole = role === 'admin' ? 'admin' : 'staff';

    db.run(
      `INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)`,
      [cleanUsername, hashedPassword, displayName, userRole],
      function (insErr) {
        if (insErr) {
          return res.status(500).json({ error: 'បរាជ័យក្នុងការបង្កើតគណនី' });
        }
        res.status(201).json({
          success: true,
          user: {
            id: this.lastID,
            username: cleanUsername,
            name: displayName,
            role: userRole,
            created_at: new Date().toISOString()
          },
          message: 'បានបង្កើតគណនីអ្នកប្រើប្រាស់ថ្មីជោគជ័យ!'
        });
      }
    );
  });
});

// Admin: Delete user account
app.delete('/api/auth/users/:id', authenticateUser, (req, res) => {
  const targetId = parseInt(req.params.id);
  if (isNaN(targetId)) {
    return res.status(400).json({ error: 'ID គណនីមិនត្រឹមត្រូវ' });
  }

  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'មិនអាចលុបគណនីដែលកំពុង Login នេះបានទេ!' });
  }

  if (targetId === 1) {
    return res.status(400).json({ error: 'មិនអាចលុបគណនីមេ Admin (ID: 1) បានឡើយ!' });
  }

  db.run(`DELETE FROM users WHERE id = ?`, [targetId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'បរាជ័យក្នុងការលុបគណនី' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'រកមិនឃើញគណនីនេះទេ' });
    }
    res.json({ success: true, message: 'បានលុបគណនីជោគជ័យ!' });
  });
});

// 2. Auth: Check Me (verify token)
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No token' });
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  db.get(`SELECT id, username, name, role FROM users WHERE token = ?`, [token], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ error: 'Session expired' });
    }
    res.json({ success: true, user });
  });
});

// 3. Auth: Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    db.run(`UPDATE users SET token = NULL WHERE token = ?`, [token], () => {});
  }
  res.json({ success: true });
});

// 4. Auth: Update Credentials (Username, Password, Name)
app.put('/api/auth/profile', authenticateUser, (req, res) => {
  const { currentPassword, newUsername, newPassword, newName } = req.body;
  const userId = req.user.id;

  db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'រកមិនឃើញអ្នកប្រើប្រាស់' });
    }

    if (!db.verifyPassword(currentPassword, user.password)) {
      return res.status(400).json({ error: 'លេខសម្ងាត់ចាស់មិនត្រឹមត្រូវទេ!' });
    }

    let updatedUsername = user.username;
    if (newUsername && newUsername.trim()) {
      updatedUsername = newUsername.trim();
    }

    let updatedPassword = user.password;
    if (newPassword && newPassword.trim()) {
      if (newPassword.length < 4) {
        return res.status(400).json({ error: 'លេខសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៤ តួអក្សរ!' });
      }
      updatedPassword = db.hashPassword(newPassword.trim());
    }

    const updatedName = newName && newName.trim() ? newName.trim() : user.name;

    db.get(`SELECT id FROM users WHERE username = ? COLLATE NOCASE AND id != ?`, [updatedUsername, userId], (confErr, confUser) => {
      if (confUser) {
        return res.status(400).json({ error: 'Username នេះមានគេប្រើរួចហើយ!' });
      }

      db.run(
        `UPDATE users SET username = ?, password = ?, name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [updatedUsername, updatedPassword, updatedName, userId],
        function(updateErr) {
          if (updateErr) {
            return res.status(500).json({ error: 'បរាជ័យក្នុងការកែប្រែព័ត៌មានគណនី' });
          }
          res.json({
            success: true,
            user: {
              id: userId,
              username: updatedUsername,
              name: updatedName,
              role: user.role
            },
            message: 'បានផ្លាស់ប្តូរព័ត៌មានគណនីជោគជ័យ!'
          });
        }
      );
    });
  });
});

// 2. Get All Orders / Products with Filters
app.get('/api/orders', (req, res) => {
  const {
    search,
    delivery_status,
    stock_status,
    from_date,
    to_date,
    sort_by = 'created_at',
    sort_order = 'DESC'
  } = req.query;

  let query = `SELECT * FROM orders WHERE 1=1`;
  const params = [];

  if (search && search.trim() !== '') {
    const s = `%${search.trim()}%`;
    query += ` AND (item_name LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ? OR tracking_number LIKE ? OR taobao_order_id LIKE ? OR china_tracking_number LIKE ? OR notes LIKE ?)`;
    params.push(s, s, s, s, s, s, s);
  }

  if (delivery_status && delivery_status !== 'all') {
    query += ` AND delivery_status = ?`;
    params.push(delivery_status);
  }

  if (stock_status && stock_status !== 'all') {
    query += ` AND stock_status = ?`;
    params.push(stock_status);
  }

  if (from_date) {
    query += ` AND (order_date >= ? OR arrival_date >= ?)`;
    params.push(from_date, from_date);
  }

  if (to_date) {
    query += ` AND (order_date <= ? OR arrival_date <= ?)`;
    params.push(to_date, to_date);
  }

  const validSortCols = ['created_at', 'order_date', 'arrival_date', 'total_revenue', 'total_profit', 'item_name', 'customer_name'];
  const safeSortBy = validSortCols.includes(sort_by) ? sort_by : 'created_at';
  const safeOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  query += ` ORDER BY ${safeSortBy} ${safeOrder}`;

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Database query error:', err.message);
      return res.status(500).json({ error: 'មានបញ្ហាក្នុងការទាញទិន្នន័យ' });
    }
    res.json(rows);
  });
});

// 3. Get Single Order
app.get('/api/orders/:id', (req, res) => {
  db.get(`SELECT * FROM orders WHERE id = ?`, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'មានបញ្ហាក្នុងការទាញទិន្នន័យ' });
    }
    if (!row) {
      return res.status(404).json({ error: 'រកមិនឃើញទិន្នន័យនេះទេ' });
    }
    res.json(row);
  });
});

// 4. Create Order / Product
app.post('/api/orders', (req, res) => {
  const body = req.body;
  if (!body.item_name || body.item_name.trim() === '') {
    return res.status(400).json({ error: 'សូមបញ្ចូលឈ្មោះឥវ៉ាន់!' });
  }

  const calc = calculateTotals(body);

  const query = `
    INSERT INTO orders (
      item_name, category, image_url, taobao_link, taobao_order_id, china_tracking_number, facebook_post_link,
      customer_name, customer_phone, customer_contact, customer_address,
      cost_cny, exchange_rate, cost_usd, china_shipping, cambodia_shipping,
      other_expenses, selling_price, deposit_amount, quantity,
      total_cost, total_revenue, total_profit,
      stock_status, delivery_status,
      order_date, arrival_date, delivered_date,
      tracking_number, shipping_company, notes
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      ?, ?, ?,
      ?, ?, ?
    )
  `;

  const values = [
    body.item_name.trim(),
    body.category || 'ទូទៅ',
    body.image_url || null,
    body.taobao_link || null,
    body.taobao_order_id || '',
    body.china_tracking_number || '',
    body.facebook_post_link || '',
    body.customer_name || 'អតិថិជនទូទៅ',
    body.customer_phone || '',
    body.customer_contact || '',
    body.customer_address || '',
    calc.cost_cny,
    calc.exchange_rate,
    calc.cost_usd,
    calc.china_shipping,
    calc.cambodia_shipping,
    calc.other_expenses,
    calc.selling_price,
    calc.deposit_amount,
    calc.quantity,
    calc.total_cost,
    calc.total_revenue,
    calc.total_profit,
    body.stock_status || 'pre_order',
    body.delivery_status || 'waiting',
    body.order_date || new Date().toISOString().split('T')[0],
    body.arrival_date || '',
    body.delivered_date || '',
    body.tracking_number || '',
    body.shipping_company || '',
    body.notes || ''
  ];

  db.run(query, values, function(err) {
    if (err) {
      console.error('Insert error:', err.message);
      return res.status(500).json({ error: 'បរាជ័យក្នុងការរក្សាទុកទិន្នន័យ' });
    }
    db.get(`SELECT * FROM orders WHERE id = ?`, [this.lastID], (err, newRow) => {
      res.status(201).json(newRow);
    });
  });
});

// 5. Update Order
app.put('/api/orders/:id', (req, res) => {
  const id = req.params.id;
  const body = req.body;

  if (!body.item_name || body.item_name.trim() === '') {
    return res.status(400).json({ error: 'សូមបញ្ចូលឈ្មោះឥវ៉ាន់!' });
  }

  const calc = calculateTotals(body);

  const query = `
    UPDATE orders SET
      item_name = ?, category = ?, image_url = ?, taobao_link = ?, taobao_order_id = ?, china_tracking_number = ?, facebook_post_link = ?,
      customer_name = ?, customer_phone = ?, customer_contact = ?, customer_address = ?,
      cost_cny = ?, exchange_rate = ?, cost_usd = ?, china_shipping = ?, cambodia_shipping = ?,
      other_expenses = ?, selling_price = ?, deposit_amount = ?, quantity = ?,
      total_cost = ?, total_revenue = ?, total_profit = ?,
      stock_status = ?, delivery_status = ?,
      order_date = ?, arrival_date = ?, delivered_date = ?,
      tracking_number = ?, shipping_company = ?, notes = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const values = [
    body.item_name.trim(),
    body.category || 'ទូទៅ',
    body.image_url || null,
    body.taobao_link || null,
    body.taobao_order_id || '',
    body.china_tracking_number || '',
    body.facebook_post_link || '',
    body.customer_name || 'អតិថិជនទូទៅ',
    body.customer_phone || '',
    body.customer_contact || '',
    body.customer_address || '',
    calc.cost_cny,
    calc.exchange_rate,
    calc.cost_usd,
    calc.china_shipping,
    calc.cambodia_shipping,
    calc.other_expenses,
    calc.selling_price,
    calc.deposit_amount,
    calc.quantity,
    calc.total_cost,
    calc.total_revenue,
    calc.total_profit,
    body.stock_status || 'pre_order',
    body.delivery_status || 'waiting',
    body.order_date || '',
    body.arrival_date || '',
    body.delivered_date || '',
    body.tracking_number || '',
    body.shipping_company || '',
    body.notes || '',
    id
  ];

  db.run(query, values, function(err) {
    if (err) {
      console.error('Update error:', err.message);
      return res.status(500).json({ error: 'បរាជ័យក្នុងការកែប្រែទិន្នន័យ' });
    }
    db.get(`SELECT * FROM orders WHERE id = ?`, [id], (err, updatedRow) => {
      res.json(updatedRow);
    });
  });
});

// 6. Fast Update Delivery / Stock Status
app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { delivery_status, stock_status } = req.body;

  let query = `UPDATE orders SET updated_at = CURRENT_TIMESTAMP`;
  const params = [];

  if (delivery_status) {
    query += `, delivery_status = ?`;
    params.push(delivery_status);
    if (delivery_status === 'shipped' || delivery_status === 'completed') {
      query += `, delivered_date = CASE WHEN delivered_date IS NULL OR delivered_date = '' THEN date('now') ELSE delivered_date END`;
    }
  }

  if (stock_status) {
    query += `, stock_status = ?`;
    params.push(stock_status);
  }

  query += ` WHERE id = ?`;
  params.push(id);

  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'មិនអាចផ្លាស់ប្តូរស្ថានភាពបានទេ' });
    }
    db.get(`SELECT * FROM orders WHERE id = ?`, [id], (err, row) => {
      res.json(row);
    });
  });
});

// 7. Delete Order
app.delete('/api/orders/:id', (req, res) => {
  const id = req.params.id;
  // Get image to optionally clean up
  db.get(`SELECT image_url FROM orders WHERE id = ?`, [id], (err, row) => {
    if (row && row.image_url && row.image_url.startsWith('/uploads/')) {
      const filename = path.basename(row.image_url);
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
      }
    }

    db.run(`DELETE FROM orders WHERE id = ?`, [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'មិនអាចលុបបានទេ' });
      }
      res.json({ success: true, message: 'បានលុបទិន្នន័យជោគជ័យ' });
    });
  });
});

// 8. Stats / Financial Summary
app.get('/api/stats', (req, res) => {
  const query = `
    SELECT
      COUNT(*) AS total_orders,
      COALESCE(SUM(quantity), 0) AS total_items_count,
      COALESCE(SUM(total_revenue), 0) AS total_revenue,
      COALESCE(SUM(total_cost), 0) AS total_cost,
      COALESCE(SUM(total_profit), 0) AS total_profit,
      COALESCE(SUM(deposit_amount), 0) AS total_deposit,
      
      -- Delivery Status breakdown
      COALESCE(SUM(CASE WHEN delivery_status = 'waiting' THEN 1 ELSE 0 END), 0) AS count_waiting,
      COALESCE(SUM(CASE WHEN delivery_status = 'arrived' THEN 1 ELSE 0 END), 0) AS count_arrived,
      COALESCE(SUM(CASE WHEN delivery_status = 'shipped' THEN 1 ELSE 0 END), 0) AS count_shipped,
      COALESCE(SUM(CASE WHEN delivery_status = 'completed' THEN 1 ELSE 0 END), 0) AS count_completed,
      COALESCE(SUM(CASE WHEN delivery_status = 'cancelled' THEN 1 ELSE 0 END), 0) AS count_cancelled,
      
      -- Stock Status breakdown
      COALESCE(SUM(CASE WHEN stock_status = 'pre_order' THEN 1 ELSE 0 END), 0) AS count_pre_order,
      COALESCE(SUM(CASE WHEN stock_status = 'in_stock' THEN 1 ELSE 0 END), 0) AS count_in_stock,
      COALESCE(SUM(CASE WHEN stock_status = 'out_of_stock' THEN 1 ELSE 0 END), 0) AS count_out_of_stock,

      -- Shipping costs breakdown
      COALESCE(SUM(china_shipping * quantity), 0) AS total_china_shipping,
      COALESCE(SUM(cambodia_shipping * quantity), 0) AS total_cambodia_shipping,
      COALESCE(SUM(cost_usd * quantity), 0) AS total_product_cost
    FROM orders
  `;

  db.get(query, [], (err, summary) => {
    if (err) {
      console.error('Stats query error:', err.message);
      return res.status(500).json({ error: 'បរាជ័យក្នុងការគណនាទិន្នន័យ' });
    }

    // Monthly breakdown for the current year
    const monthlyQuery = `
      SELECT 
        strftime('%Y-%m', order_date) as month,
        COUNT(*) as orders_count,
        SUM(total_revenue) as revenue,
        SUM(total_cost) as cost,
        SUM(total_profit) as profit
      FROM orders
      WHERE order_date IS NOT NULL AND order_date != ''
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `;

    db.all(monthlyQuery, [], (err, monthly) => {
      res.json({
        summary: {
          ...summary,
          total_revenue: parseFloat(summary.total_revenue.toFixed(2)),
          total_cost: parseFloat(summary.total_cost.toFixed(2)),
          total_profit: parseFloat(summary.total_profit.toFixed(2)),
          total_china_shipping: parseFloat(summary.total_china_shipping.toFixed(2)),
          total_cambodia_shipping: parseFloat(summary.total_cambodia_shipping.toFixed(2)),
          total_product_cost: parseFloat(summary.total_product_cost.toFixed(2))
        },
        monthly: monthly || []
      });
    });
  });
});

// 9. Settings Endpoints
app.get('/api/settings', (req, res) => {
  db.all(`SELECT key, value FROM settings`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching settings' });
    }
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);
    res.json(settings);
  });
});

app.put('/api/settings', (req, res) => {
  const entries = Object.entries(req.body);
  const stmt = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
  
  db.serialize(() => {
    entries.forEach(([key, val]) => {
      stmt.run(key, String(val));
    });
    stmt.finalize((err) => {
      if (err) {
        return res.status(500).json({ error: 'បរាជ័យក្នុងការរក្សាទុក Settings' });
      }
      res.json({ success: true });
    });
  });
});

// 10. Export to CSV (with UTF-8 BOM for Excel Khmer support)
app.get('/api/export-csv', (req, res) => {
  db.all(`SELECT * FROM orders ORDER BY id DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).send('Error');
    }

    const headers = [
      'ID', 'ឈ្មោះឥវ៉ាន់', 'ប្រភេទ', 'Link Taobao', 'ឈ្មោះភ្ញៀវ', 'លេខទូរស័ព្ទ', 'អាសយដ្ឋាន',
      'ថ្លៃដើម(CNY)', 'អត្រាប្តូរប្រាក់', 'ថ្លៃដើម(USD)', 'ថ្លៃដឹកចិន($)', 'ថ្លៃដឹកខ្មែរ($)',
      'តម្លៃលក់($)', 'ចំនួន', 'ចំណាយសរុប($)', 'ចំណូលសរុប($)', 'ប្រាក់ចំណេញ($)',
      'ស្ថានភាពស្តុក', 'ស្ថានភាពដឹកជញ្ជូន', 'ថ្ងៃកុម្មង់', 'ថ្ងៃមកដល់', 'Tracking #'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel
    csvContent += headers.join(',') + '\n';

    rows.forEach(r => {
      const stockText = r.stock_status === 'in_stock' ? 'មានស្តុក' : (r.stock_status === 'pre_order' ? 'កុម្មង់ទុកមុន(អត់ស្តុក)' : 'អស់ស្តុក');
      const deliveryText = {
        'waiting': 'រង់ចាំឥវ៉ាន់មកដល់',
        'arrived': 'មកដល់ហើយ/ត្រៀមផ្ញើ',
        'shipped': 'បានផ្ញើជូនភ្ញៀវ',
        'completed': 'បានបញ្ចប់',
        'cancelled': 'បានបោះបង់'
      }[r.delivery_status] || r.delivery_status;

      const row = [
        r.id,
        escapeCsv(r.item_name),
        escapeCsv(r.category),
        escapeCsv(r.taobao_link),
        escapeCsv(r.customer_name),
        escapeCsv(r.customer_phone),
        escapeCsv(r.customer_address),
        r.cost_cny,
        r.exchange_rate,
        r.cost_usd,
        r.china_shipping,
        r.cambodia_shipping,
        r.selling_price,
        r.quantity,
        r.total_cost,
        r.total_revenue,
        r.total_profit,
        escapeCsv(stockText),
        escapeCsv(deliveryText),
        escapeCsv(r.order_date),
        escapeCsv(r.arrival_date),
        escapeCsv(r.tracking_number)
      ];
      csvContent += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="OunShop_Orders_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvContent);
  });
});

// Serve frontend in production
const distDir = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`🚀 Oun Shop Online System is running!`);
  console.log(`🌐 Server URL: http://ounshop:${PORT} (or http://localhost:${PORT})`);
  console.log(`=========================================`);
});

// Also listen on standard HTTP port 80 locally if available
if (!process.env.RENDER && !process.env.RAILWAY_ENVIRONMENT && PORT != 80 && !process.env.PORT) {
  try {
    const server80 = app.listen(80, '0.0.0.0', () => {
      console.log(`✨ Direct URL (no port number needed): http://ounshop or http://localhost`);
    });
    server80.on('error', () => {});
  } catch (e) {}
}
