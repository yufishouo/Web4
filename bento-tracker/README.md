# 姓名：[你的姓名]  
# 班級：[你的班級]  
# 網站標題：便當價格觀測站 | 通膨追蹤

---

## 🍱 商品特色與選擇理由

**【我為什麼選這類型的商品？】**
我選擇「便當」作為通膨追蹤的主題。
對於大學生或一般上班族來說，便當是幾乎每天都會接觸到的民生必需品。比起政府 CPI 籃子裡遙不可及的汽車或房價，學餐便當從 70 元漲到 90 元、連鎖排骨便當突破百元大關，這種「體感通膨」才是最真實且最有感的。透過追蹤常吃便當的價格變化，能更精準地反映出個人生活成本的上升。

**【商品資料來源網站】**
- 資料來源：[請填寫你想參考價格的網站，例如：台鐵便當官網、7-11 線上購物中心、或是你平常買便當的店家粉專]
- 網址：[請貼上網址]

---

## 🛠 Spec 規格表與實作過程

| 項目 | 實作說明 |
| :--- | :--- |
| **前端設計** | 使用 Vanilla HTML、CSS、JavaScript。設計上採用了高質感的「玻璃擬物化 (Glassmorphism)」風格，加上深色模式與動態光暈背景，提升使用者體驗。 |
| **後端 API** | 使用 Node.js 與 Express.js 建立 RESTful API。提供 `GET /api/bento` 取得與搜尋資料、`POST /api/bento` 新增資料，以及 `DELETE /api/bento/:id` 刪除紀錄的功能。 |
| **資料庫** | 使用 SQLite 儲存。資料庫檔案 `data.db` 配合 Azure/Render 部署特性採用相對路徑/持久化路徑判斷 (`isAzure` 判斷)，確保在雲端重啟時資料不會遺失。 |
| **即時互動** | 前端使用 Fetch API 與後端溝通，新增資料後會立刻在表格頂端顯示，並帶有醒目的動畫提示，無須重新整理頁面。同時支援 Debounce 的即時搜尋功能。 |
| **部署相容** | `package.json` 已設定 `start` 指令與 Node 版本要求；`server.js` 使用 `process.env.PORT` 動態綁定 Port。 |

---

## 💻 關鍵程式碼說明

### 1. 前端 (Fetch API 新增與搜尋)
前端透過 JavaScript 監聽表單提交，並使用 Fetch 將資料送到後端，成功後即時更新畫面。搜尋功能則加入了 Debounce 機制減少 Server 負擔。
```javascript
// 新增資料
const response = await fetch('/api/bento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, name, price: parseInt(price) })
});

// 即時搜尋 (Debounce)
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadBentos(e.target.value);
    }, 300);
});
```

### 2. 後端 (Express API)
使用 Express 接收 POST 請求並處理 GET 請求。
```javascript
app.post('/api/bento', (req, res) => {
    const { date, name, price } = req.body;
    const sql = 'INSERT INTO bento_prices (date, name, price) VALUES (?, ?, ?)';
    db.run(sql, [date, name, price], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, date, name, price });
    });
});
```

### 3. 資料庫 (SQLite 雲端持久化處理)
為了符合未來 Azure 的部署需求，動態判斷路徑，確保資料存在 `/home/data` 達到持久化效果。
```javascript
const isAzure = !!process.env.WEBSITE_SITE_NAME;
const dataDir = isAzure ? '/home/data' : '.';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'data.db');
const db = new sqlite3.Database(dbPath);
```

---

## 🚀 Localhost 執行流程與畫面

### 步驟 1：啟動伺服器
在專案根目錄開啟終端機，執行以下指令：
```bash
npm install
npm start
```
伺服器啟動後，瀏覽器前往 `http://localhost:3000`。
> **[請在此處貼上啟動 Terminal 成功畫面的截圖]**

### 步驟 2：首頁與資料展示
進入網站後，會看到預設的幾筆便當資料。採用玻璃擬物化風格，介面精美。
> **[請在此處貼上網站首頁截圖]**

### 步驟 3：新增一筆紀錄
在左側表單輸入日期、便當名稱（如：公司附近滷雞腿便當）、價格（如：110），點擊「新增紀錄」。
資料會立刻以高亮動畫出現在右側歷史紀錄的最上方。
重新整理網頁後，資料依然存在（證明 SQLite 寫入成功）。
> **[請在此處貼上新增資料成功後的截圖]**

### 步驟 4：搜尋功能測試
在右上角的搜尋框輸入「台鐵」，系統會即時過濾出只包含「台鐵」名稱的便當紀錄。
> **[請在此處貼上搜尋過濾結果的截圖]**

---

## 🔗 GitHub 連結
[請貼上你的 GitHub Repo 連結]

*(本專案已完全相容 Render / Azure 部署要求，如需部署可直接參考講義上的步驟即可完成。)*
