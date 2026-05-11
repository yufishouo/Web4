const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 資料庫設定 (相容 Azure/Render 部署)
const isAzure = !!process.env.WEBSITE_SITE_NAME;
const dataDir = isAzure ? '/home/data' : '.';

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'data.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log(`Connected to the SQLite database at ${dbPath}`);
        // 建立表格
        db.run(`CREATE TABLE IF NOT EXISTS bento_prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            name TEXT NOT NULL,
            price INTEGER NOT NULL
        )`);
        
        // 如果是空的，塞入近十年的假資料 (以展示通膨趨勢)
        db.get('SELECT COUNT(*) as count FROM bento_prices', (err, row) => {
            if (!err && row.count === 0) {
                const stmt = db.prepare('INSERT INTO bento_prices (date, name, price) VALUES (?, ?, ?)');
                // 2014 - 2017：物價較平穩時期
                stmt.run('2014-03-15', '巷口排骨便當', 65);
                stmt.run('2015-06-20', '大學學餐雞腿飯', 70);
                stmt.run('2016-09-10', '知名連鎖控肉便當', 75);
                stmt.run('2017-12-05', '超商國民便當', 55);
                
                // 2018 - 2020：緩步上漲
                stmt.run('2018-04-18', '巷口排骨便當', 75);
                stmt.run('2019-08-22', '台鐵八角排骨便當', 80);
                stmt.run('2020-05-11', '大學學餐雞腿飯', 80);
                
                // 2021 - 2023：通膨開始有感
                stmt.run('2021-10-30', '知名連鎖控肉便當', 90);
                stmt.run('2022-02-14', '巷口排骨便當', 90);
                stmt.run('2023-07-25', '超商豪華便當', 99);
                
                // 2024 - 2025：百元便當時代、健康餐盒興起
                stmt.run('2024-03-20', '大學學餐雞排飯', 95);
                stmt.run('2024-11-10', '巷口排骨便當', 105);
                stmt.run('2025-01-05', '台鐵特製排骨便當', 100);
                stmt.run('2025-05-01', '健身水煮餐盒', 130);
                
                stmt.finalize();
                console.log('Inserted 10-year historical bento data.');
            }
        });
    }
});

// API Routes

// 取得所有價格資料，支援關鍵字搜尋
app.get('/api/bento', (req, res) => {
    const { search } = req.query;
    let sql = 'SELECT * FROM bento_prices ORDER BY date DESC';
    let params = [];

    if (search) {
        sql = 'SELECT * FROM bento_prices WHERE name LIKE ? ORDER BY date DESC';
        params = [`%${search}%`];
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 新增一筆資料
app.post('/api/bento', (req, res) => {
    const { date, name, price } = req.body;
    if (!date || !name || price == null) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    const sql = 'INSERT INTO bento_prices (date, name, price) VALUES (?, ?, ?)';
    db.run(sql, [date, name, price], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            id: this.lastID,
            date,
            name,
            price
        });
    });
});

// 刪除一筆資料
app.delete('/api/bento/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = 'DELETE FROM bento_prices WHERE id = ?';
    db.run(sql, id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Deleted successfully', changes: this.changes });
    });
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
