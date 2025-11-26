const sidebar = document.getElementById('sidebar');
const overlay = document.querySelector('.overlay');
const app = document.getElementById('app');
const themeBtn = document.getElementById('theme-btn');
let allToolsData = [];

// --- テーマ管理機能 ---
function initTheme() {
    let savedTheme = localStorage.getItem('marutility_theme');
    if (!savedTheme) {
        savedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('marutility_theme', next);
    applyTheme(next);
}

function applyTheme(mode) {
    if (mode === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/></svg>';
    }
}

// --- 初期化 & ナビゲーション ---
function init() {
    initTheme(); 
    if (window.innerWidth >= 768) sidebar.classList.add('active');
    
    loadMenu().then(() => {
        const hash = window.location.hash.replace('#', '');
        loadTool(hash || 'home');
    });
}

function toggleMenu() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

async function loadMenu() {
    try {
        const res = await fetch('/api/tools');
        allToolsData = await res.json();
        renderSidebar();
    } catch (e) {
        console.error(e);
    }
}

function renderSidebar() {
    const list = document.getElementById('menu-list');
    list.innerHTML = '';
    
    allToolsData.forEach(tool => {
        const div = document.createElement('div');
        div.className = 'nav-item';
        div.textContent = tool.name;
        div.id = `nav-${tool.id}`;
        div.onclick = () => handleNav(tool.id);
        list.appendChild(div);
    });
}

function handleNav(id) {
    loadTool(id);
    if (window.innerWidth < 768 && sidebar.classList.contains('active')) {
        toggleMenu();
    }
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('current'));
    const active = document.getElementById(`nav-${id}`);
    if(active) active.classList.add('current');
}

async function loadTool(toolId) {
    window.location.hash = toolId;
    if (toolId === 'home') { renderHome(); return; }

    try {
        // 変更点: ツールごとのフォルダ内の index.html を読み込む
        const path = `/tools/${toolId}/index.html`;
        
        const res = await fetch(path);
        if (!res.ok) throw new Error('Tool not found');
        const html = await res.text();
        app.innerHTML = html;
        executeScripts(app);

        // ヘッダーにお気に入りボタンを追加
        const header = app.querySelector('h2');
        if (header) {
            const favBtn = document.createElement('button');
            favBtn.className = 'fav-header-btn';
            favBtn.title = 'お気に入りに追加/削除';
            updateFavBtnState(favBtn, toolId);
            favBtn.onclick = () => {
                toggleFavorite(toolId);
                updateFavBtnState(favBtn, toolId);
            };
            header.appendChild(favBtn);
        }
    } catch (e) {
        console.error(e);
        app.innerHTML = `<p>ページが見つかりません。</p><button class="action-btn" onclick="handleNav('home')">ホームへ戻る</button>`;
    }
}

function updateFavBtnState(btn, id) {
    const isFav = getFavorites().includes(id);
    btn.innerHTML = isFav ? '★' : '☆';
    if (isFav) btn.classList.add('active');
    else btn.classList.remove('active');
}

function renderHome() {
    const favIds = getFavorites();
    const favTools = allToolsData.filter(t => favIds.includes(t.id));
    const allTools = allToolsData;
    let html = `<h2>ホーム</h2>`;
    if (favTools.length > 0) {
        html += `<div style="margin-bottom: 30px;"><small style="color:var(--text-sub); font-weight:bold;">お気に入り</small>`;
        favTools.forEach(tool => {
            html += `<div class="flat-list-item" onclick="handleNav('${tool.id}')">
                        <span class="flat-item-name">★ ${tool.name}</span>
                        <span style="color:var(--text-sub);">></span>
                     </div>`;
        });
        html += `</div>`;
    }
    html += `<div><small style="color:var(--text-sub); font-weight:bold;">すべてのツール</small>`;
    allTools.forEach(tool => {
        html += `<div class="flat-list-item" onclick="handleNav('${tool.id}')">
                    <span class="flat-item-name">${tool.name}</span>
                    <span style="color:var(--text-sub);">></span>
                 </div>`;
    });
    html += `</div>`;
    app.innerHTML = html;
}

function getFavorites() { return JSON.parse(localStorage.getItem('marutility_favs') || '[]'); }
function toggleFavorite(id) {
    let favs = getFavorites();
    if (favs.includes(id)) favs = favs.filter(f => f !== id);
    else favs.push(id);
    localStorage.setItem('marutility_favs', JSON.stringify(favs));
}

function executeScripts(container) {
    container.querySelectorAll('script').forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode.replaceChild(newScript, oldScript);
    });
}

init();

window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && !sidebar.classList.contains('active')) {
        sidebar.classList.add('active');
    }
    if (window.innerWidth < 768 && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
});