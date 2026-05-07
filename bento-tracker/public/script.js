document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-bento-form');
    const bentoList = document.getElementById('bento-list');
    const searchInput = document.getElementById('search-input');
    const loading = document.getElementById('loading');
    const noData = document.getElementById('no-data');
    const table = document.getElementById('bento-table');

    // 預設將今天的日期填入表單
    document.getElementById('date').valueAsDate = new Date();

    // 載入資料
    const loadBentos = async (searchQuery = '') => {
        try {
            loading.style.display = 'block';
            table.style.display = 'none';
            noData.style.display = 'none';

            const url = searchQuery ? `/api/bento?search=${encodeURIComponent(searchQuery)}` : '/api/bento';
            const response = await fetch(url);
            const data = await response.json();

            loading.style.display = 'none';

            if (data.length === 0) {
                noData.style.display = 'block';
                return;
            }

            table.style.display = 'table';
            bentoList.innerHTML = '';

            data.forEach((bento, index) => {
                appendBentoRow(bento, false);
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            loading.innerText = '載入失敗，請稍後再試。';
        }
    };

    // 增加一列到表格
    const appendBentoRow = (bento, isNew = false) => {
        const tr = document.createElement('tr');
        if (isNew) {
            tr.classList.add('new-row');
        }
        tr.dataset.id = bento.id;
        
        tr.innerHTML = `
            <td>${bento.date}</td>
            <td>${bento.name}</td>
            <td class="price-cell">$${bento.price}</td>
            <td>
                <button class="btn-delete" onclick="deleteBento(${bento.id}, this)">刪除</button>
            </td>
        `;
        
        if (isNew) {
            bentoList.insertBefore(tr, bentoList.firstChild);
        } else {
            bentoList.appendChild(tr);
        }
    };

    // 刪除便當
    window.deleteBento = async (id, btnElement) => {
        if (!confirm('確定要刪除這筆紀錄嗎？')) return;

        const originalText = btnElement.innerText;
        btnElement.innerText = '刪除中...';
        btnElement.disabled = true;

        try {
            const response = await fetch(`/api/bento/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // 移除對應的 tr
                const tr = btnElement.closest('tr');
                tr.style.opacity = '0';
                setTimeout(() => {
                    tr.remove();
                    // 如果表格空了，顯示 no data
                    if (bentoList.children.length === 0) {
                        table.style.display = 'none';
                        noData.style.display = 'block';
                    }
                }, 300);
            } else {
                alert('刪除失敗，請稍後再試');
                btnElement.innerText = originalText;
                btnElement.disabled = false;
            }
        } catch (error) {
            console.error('Error deleting data:', error);
            alert('系統錯誤，請稍後再試');
            btnElement.innerText = originalText;
            btnElement.disabled = false;
        }
    };

    // 處理表單提交 (新增便當)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const date = document.getElementById('date').value;
        const name = document.getElementById('name').value;
        const price = document.getElementById('price').value;

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = '新增中...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/bento', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ date, name, price: parseInt(price) })
            });

            if (response.ok) {
                const newBento = await response.json();
                
                // 如果目前在搜尋狀態，則清除搜尋並重新載入
                if (searchInput.value) {
                    searchInput.value = '';
                    await loadBentos();
                } else {
                    // 直接將新資料插入表格頂端並加上動畫
                    if (noData.style.display === 'block') {
                        noData.style.display = 'none';
                        table.style.display = 'table';
                    }
                    appendBentoRow(newBento, true);
                }

                // 清空輸入框，但保留日期
                document.getElementById('name').value = '';
                document.getElementById('price').value = '';
                document.getElementById('name').focus();
            } else {
                alert('新增失敗，請檢查資料格式');
            }
        } catch (error) {
            console.error('Error adding data:', error);
            alert('系統錯誤，請稍後再試');
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });

    // 處理搜尋 (加上 Debounce 避免頻繁發送請求)
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadBentos(e.target.value);
        }, 300);
    });

    // 初始載入
    loadBentos();
});
