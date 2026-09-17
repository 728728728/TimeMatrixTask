/* ==========================================================================
   Eisenhower Matrix Task Hub | 朝の確認・夜の振り返り ＋ 多重データ保護
   ========================================================================== */

// Multi-Tier Storage Keys for Absolute Data Protection
const STORAGE_KEY = 'eisenhower_matrix_tasks_v1';
const BACKUP_KEY = 'eisenhower_matrix_tasks_backup_latest';
const HISTORY_KEY = 'eisenhower_matrix_backups_list';
const DAYS_KEY = 'eisenhower_matrix_days_v1';

// 日付の切り替わり時刻（深夜0〜4時の振り返りは「前の日」として扱う）
const DAY_START_HOUR = 4;

// 領域をワンタップで選んだときの座標
const QUADRANT_PRESETS = {
    q1: { urgency: 75, importance: 75 },
    q2: { urgency: 25, importance: 75 },
    q3: { urgency: 75, importance: 25 },
    q4: { urgency: 25, importance: 25 }
};
const QUADRANT_ORDER = { q1: 0, q2: 1, q3: 2, q4: 3 };
const QUADRANT_SHORT = { q1: 'I', q2: 'II', q3: 'III', q4: 'IV' };

// Sample Tasks with PDCA Strategy (Plan) and Review (Check & Action)
const SAMPLE_TASKS = [
    {
        id: 'task-1',
        title: 'Q3戦略企画書の締め切り前最終確認',
        category: '仕事',
        urgency: 90,
        importance: 92,
        deadline: getRelativeDate(0, 16),
        notes: '経営陣へのプレゼン資料。数字の不備がないか最終チェックを行う。絶対遅延不可！',
        completed: false,
        pdcaStrategy: {
            strategy: 'ゼロから確認せず、過去の合格資料の『チェックリスト10項目』と照らし合わせながら30分一本勝負で確認する！',
            obstacle: '途中で急な電話やメールで気が散ること ➡ 15:00～15:30はカレンダーを『取り込み中』にして通知を全オフにする。',
            goal: '全12ページの数値・誤字が100%チェック完了し、経営陣宛てに送信予約がセットされた状態。'
        },
        pdcaReview: null,
        createdAt: Date.now() - 3600000 * 5
    },
    {
        id: 'task-2',
        title: '重大な顧客サーバー障害・クレームへの対応',
        category: '仕事',
        urgency: 95,
        importance: 85,
        deadline: getRelativeDate(0, 14),
        notes: '午前中に発生したアラートの根本原因調査と顧客への第一報を送る。',
        completed: true,
        pdcaStrategy: {
            strategy: '一人で悩まず、インフラリーダーと5分間クイックミーティングをしてログ調査を2名で手分けする。',
            obstacle: '原因特定に時間がかかって第一報が遅れるリスク ➡ 原因不明でも『調査完了予定時刻』をまず13時に顧客に連絡して安心させる。',
            goal: '顧客への一次回答メールが完了し、再発防止のチケットを発行した状態。'
        },
        pdcaReview: {
            result: 'リーダーと即座に連携したおかげで15分でDBの接続タイムアウトが原因と判明し、顧客からも迅速な連絡に感謝された！',
            action: '今回判明したDBタイムアウトの検知アラートしきい値を調整し、自動でSlack通知と自動復旧スクリプトが動く仕組みを作った！'
        },
        createdAt: Date.now() - 3600000 * 12
    },
    {
        id: 'task-3',
        title: '最新AIツール＆データ分析スキルの学習 1時間',
        category: '自己投資・学習',
        urgency: 25,
        importance: 90,
        deadline: getRelativeDate(3, 20),
        notes: '将来のキャリアアップに不可欠な知識の習得。緊急ではないが毎日少しずつコツコツ続けるのが一番重要！',
        completed: false,
        pdcaStrategy: null,
        pdcaReview: null,
        createdAt: Date.now() - 3600000 * 24
    },
    {
        id: 'task-4',
        title: '業務自動化スクリプト・テンプレートの作成',
        category: '仕事',
        urgency: 35,
        importance: 82,
        deadline: getRelativeDate(5, 18),
        notes: 'これをやっておくと来月以降の「第I領域（火消し作業）」が半減する！',
        completed: false,
        pdcaStrategy: null,
        pdcaReview: null,
        createdAt: Date.now() - 3600000 * 36
    },
    {
        id: 'task-5',
        title: '突然依頼された目的不明確な定例会議・アンケート',
        category: '仕事',
        urgency: 80,
        importance: 25,
        deadline: getRelativeDate(0, 17),
        notes: '急かされているが、実は自分の成果には直結しない。',
        completed: false,
        pdcaStrategy: null,
        pdcaReview: null,
        createdAt: Date.now() - 3600000 * 8
    },
    {
        id: 'task-6',
        title: '部屋の片付け',
        category: 'その他',
        inbox: true,
        completed: false,
        createdAt: Date.now() - 3600000
    }
];

function getRelativeDate(daysOffset, hours) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return `${toDateKey(d)}T${String(hours).padStart(2, '0')}:00`;
}

// App State
let tasks = [];
let days = {}; // { 'YYYY-MM-DD': { morningAt, eveningAt, focus, reflection, planned, done } }
let backupHistory = [];
let activeFileHandle = null; // ローカルファイルとの直接接続ハンドル (File System Access API)
let currentView = 'today';
let activeTaskId = null;
let reviewTargetTaskId = null;
let modalQuadrant = 'q1';
let quickAddQuadrant = '';
let morningExpanded = false;
let eveningExpanded = false;
let showAllCandidates = false;
let renderedDayKey = null;

// DOM Elements
const navTabs = document.querySelectorAll('.nav-tab');
const viewPanels = document.querySelectorAll('.view-panel');
const matrixCanvasArea = document.getElementById('matrix-canvas-area');
const matrixTasksLayer = document.getElementById('matrix-tasks-layer');
const btnAddTask = document.getElementById('btn-add-task');
const modalTask = document.getElementById('modal-task');
const modalReview = document.getElementById('modal-review');
const modalDetail = document.getElementById('modal-detail');
const modalBackup = document.getElementById('modal-backup');
const taskForm = document.getElementById('task-form');
const reviewForm = document.getElementById('review-form');

const searchInput = document.getElementById('search-input');
const filterCategory = document.getElementById('filter-category');
const toggleCompleted = document.getElementById('toggle-completed');

// Sliders and Live Preview
const taskUrgencySlider = document.getElementById('task-urgency');
const taskImportanceSlider = document.getElementById('task-importance');
const urgencyValDisplay = document.getElementById('urgency-val-display');
const importanceValDisplay = document.getElementById('importance-val-display');
const liveQuadrantBadge = document.getElementById('live-quadrant-badge');

const quickAddInput = document.getElementById('quick-add-input');

// ==========================================================================
// Initialization
// ==========================================================================
window.addEventListener('DOMContentLoaded', async () => {
    await loadTasksWithSafetyFallback();
    setupDirectFileSyncListeners();
    updateFileSyncUI();
    setupEventListeners();
    setupTodayListeners();
    setupBoardEnhancements();
    renderAll();

    // ブラウザを閉じて再起動した後も前回の接続ファイルへ自動再接続
    await initAndRestoreDirectFileSync();
});

// ==========================================================================
// IndexedDB helpers（容量無制限の保存先＆ファイルハンドルの永続化）
// ==========================================================================
const IDB_NAME = 'TimeMatrixTaskDB';
const IDB_STORES = ['TasksStore', 'HandlesStore'];
let idbPromise = null;

function getDB() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB unavailable'));
    if (!idbPromise) {
        idbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(IDB_NAME, 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                IDB_STORES.forEach(name => {
                    if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
                });
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        }).catch(e => { idbPromise = null; throw e; });
    }
    return idbPromise;
}

async function getIDBData(store, key) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const req = db.transaction(store, 'readonly').objectStore(store).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function setIDBData(store, key, value) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ==========================================================================
// Date helpers
// ==========================================================================
function toDateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTodayKey() {
    const d = new Date();
    d.setHours(d.getHours() - DAY_START_HOUR);
    return toDateKey(d);
}

function addDaysToKey(key, n) {
    const [y, m, d] = key.split('-').map(Number);
    return toDateKey(new Date(y, m - 1, d + n));
}

function formatDayLabel(key) {
    const [y, m, d] = key.split('-').map(Number);
    const wd = ['日', '月', '火', '水', '木', '金', '土'][new Date(y, m - 1, d).getDay()];
    return `${m}/${d}（${wd}）`;
}

function getDayRecord(key) {
    if (!days[key]) days[key] = {};
    return days[key];
}

// ==========================================================================
// Data normalize / load / save
// ==========================================================================
function sanitizeStrategy(s) {
    if (!s || typeof s !== 'object') return null;
    const clean = v => {
        const str = String(v || '').trim();
        return str === '設定なし' ? '' : str;
    };
    const out = { strategy: clean(s.strategy), obstacle: clean(s.obstacle), goal: clean(s.goal) };
    return (out.strategy || out.obstacle || out.goal) ? out : null;
}

// タスクデータの正規化（古い形式・壊れたデータも安全に読み込む）
function sanitizeTask(t, idx = 0) {
    if (!t || typeof t !== 'object') return null;
    const review = (t.pdcaReview && typeof t.pdcaReview === 'object') ? {
        result: String(t.pdcaReview.result || ''),
        action: String(t.pdcaReview.action || '')
    } : null;
    return {
        id: t.id || `task-recovered-${Date.now()}-${idx}`,
        title: String(t.title || '無題のタスク').slice(0, 150),
        category: t.category || 'その他',
        urgency: Math.max(0, Math.min(100, Number.isFinite(Number(t.urgency)) ? Number(t.urgency) : 50)),
        importance: Math.max(0, Math.min(100, Number.isFinite(Number(t.importance)) ? Number(t.importance) : 50)),
        deadline: t.deadline || null,
        notes: String(t.notes || ''),
        completed: Boolean(t.completed),
        completedAt: Number.isFinite(Number(t.completedAt)) && t.completedAt ? Number(t.completedAt) : null,
        inbox: Boolean(t.inbox),
        today: typeof t.today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.today) ? t.today : null,
        pdcaStrategy: sanitizeStrategy(t.pdcaStrategy),
        pdcaReview: (review && (review.result || review.action)) ? review : null,
        createdAt: Number.isFinite(Number(t.createdAt)) ? Number(t.createdAt) : Date.now()
    };
}

function sanitizeDays(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
    const out = {};
    Object.keys(obj).forEach(k => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(k) && obj[k] && typeof obj[k] === 'object') out[k] = obj[k];
    });
    return out;
}

// ファイル（tasks_data.json）の中身：旧形式（配列）と新形式（オブジェクト）の両方を読める
function parseDataPayload(parsed) {
    if (Array.isArray(parsed)) return { tasks: parsed, days: null };
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.tasks)) {
        return { tasks: parsed.tasks, days: parsed.days || null };
    }
    return null;
}

function applyDataPayload(payload) {
    tasks = payload.tasks.map((t, idx) => sanitizeTask(t, idx)).filter(Boolean);
    if (payload.days) days = { ...days, ...sanitizeDays(payload.days) };
}

function buildFilePayload() {
    return { app: 'TimeMatrixTask', version: 2, savedAt: new Date().toISOString(), tasks, days };
}

async function loadTasksWithSafetyFallback() {
    let loaded = null;

    // 1. IndexedDB
    try {
        const idbData = await getIDBData('TasksStore', 'latest_tasks_snapshot');
        if (idbData && Array.isArray(idbData) && idbData.length > 0) loaded = idbData;
    } catch (e) { console.warn('IndexedDB load check error:', e); }

    // 2. Main LocalStorage
    if (!loaded || loaded.length === 0) {
        try {
            const dataStr = localStorage.getItem(STORAGE_KEY);
            if (dataStr) loaded = JSON.parse(dataStr);
        } catch (e) { console.warn('Main storage load error:', e); }
    }

    // 3. Fallback to Latest Backup or SessionStorage
    if (!loaded || !Array.isArray(loaded) || loaded.length === 0) {
        try {
            const savedBackup = localStorage.getItem(BACKUP_KEY);
            const savedSession = sessionStorage.getItem(STORAGE_KEY);
            const candBackup = savedBackup ? JSON.parse(savedBackup) : null;
            const candSession = savedSession ? JSON.parse(savedSession) : null;
            if (Array.isArray(candBackup) && candBackup.length > 0) loaded = candBackup;
            else if (Array.isArray(candSession) && candSession.length > 0) loaded = candSession;
        } catch (e) { console.warn('Backup load error:', e); }
    }

    // 4. 日々の記録
    try {
        const idbDays = await getIDBData('TasksStore', 'latest_days');
        if (idbDays) days = sanitizeDays(idbDays);
    } catch (e) {}
    try {
        const d = localStorage.getItem(DAYS_KEY);
        if (d) days = { ...sanitizeDays(JSON.parse(d)), ...days };
    } catch (e) {}

    // 5. Backup History List
    try {
        const hist = localStorage.getItem(HISTORY_KEY);
        if (hist) backupHistory = JSON.parse(hist);
        if (!Array.isArray(backupHistory)) backupHistory = [];
    } catch (e) { backupHistory = []; }

    // 6. Sanitize & Final Fallback to Sample if totally empty
    if (loaded && Array.isArray(loaded)) {
        tasks = loaded.map((t, idx) => sanitizeTask(t, idx)).filter(Boolean);
    } else {
        tasks = SAMPLE_TASKS.map((t, idx) => sanitizeTask(t, idx)).filter(Boolean);
        saveTasks(true, true);
    }

    updateSaveIndicator();
}

function saveTasks(silent = false, skipDirectFile = false) {
    const dataStr = JSON.stringify(tasks);
    const daysStr = JSON.stringify(days);

    try { localStorage.setItem(STORAGE_KEY, dataStr); } catch (e) { console.error('LocalStorage error:', e); }
    try { localStorage.setItem(BACKUP_KEY, dataStr); } catch (e) {}
    try { localStorage.setItem(DAYS_KEY, daysStr); } catch (e) {}
    try { sessionStorage.setItem(STORAGE_KEY, dataStr); } catch (e) {}

    // Snapshot History (max 10, only when changed)
    try {
        const nowStr = new Date().toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (backupHistory.length === 0 || JSON.stringify(backupHistory[0].data) !== dataStr) {
            backupHistory.unshift({ timestamp: nowStr, count: tasks.length, data: JSON.parse(dataStr) });
            if (backupHistory.length > 10) backupHistory.pop();
            localStorage.setItem(HISTORY_KEY, JSON.stringify(backupHistory));
        }
    } catch (e) {}

    // IndexedDB
    setIDBData('TasksStore', 'latest_tasks_snapshot', JSON.parse(dataStr)).catch(() => {});
    setIDBData('TasksStore', 'latest_days', JSON.parse(daysStr)).catch(() => {});

    // Direct Local File Sync (if linked)
    if (!skipDirectFile && activeFileHandle) saveToDirectLocalFile(true);

    updateHeaderStats();
    updateSaveIndicator();
    if (!silent) console.info('Tasks saved across storage tiers.');
}

function updateSaveIndicator() {
    const el = document.getElementById('last-saved-time');
    if (!el) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    el.textContent = `保護完了 (${timeStr})`;

    const badge = document.getElementById('save-status-indicator');
    if (badge) {
        badge.style.borderColor = '#00f5d4';
        setTimeout(() => { badge.style.borderColor = 'rgba(0, 245, 212, 0.3)'; }, 1000);
    }
}

// ==========================================================================
// Quadrant / task helpers
// ==========================================================================
function getQuadrant(urgency, importance) {
    if (urgency >= 50 && importance >= 50) return 'q1';
    if (urgency < 50 && importance >= 50) return 'q2';
    if (urgency >= 50 && importance < 50) return 'q3';
    return 'q4';
}

function taskQuadrant(task) {
    return getQuadrant(task.urgency, task.importance);
}

function getQuadrantName(q) {
    switch (q) {
        case 'q1': return '第I領域 (緊急・重要)';
        case 'q2': return '第II領域 (重要・急がない)';
        case 'q3': return '第III領域 (緊急・重要でない)';
        case 'q4': return '第IV領域 (どちらでもない)';
        default: return '';
    }
}

// 領域を割り当てる（'' は「あとで仕分け」）。すでに同じ領域なら座標はそのまま
function setTaskQuadrant(task, q) {
    if (!q) {
        task.inbox = true;
        return;
    }
    task.inbox = false;
    if (taskQuadrant(task) !== q) {
        task.urgency = QUADRANT_PRESETS[q].urgency;
        task.importance = QUADRANT_PRESETS[q].importance;
    }
}

function setTaskCompleted(task, done) {
    task.completed = done;
    task.completedAt = done ? Date.now() : null;
    if (done) task.inbox = false;
}

function findTask(id) {
    return tasks.find(t => t.id === id);
}

function newTaskId() {
    return 'task-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
}

function createTask(title, q, forToday) {
    const task = sanitizeTask({
        id: newTaskId(),
        title,
        category: 'その他',
        completed: false,
        createdAt: Date.now()
    });
    setTaskQuadrant(task, q);
    if (forToday) task.today = getTodayKey();
    return task;
}

function deadlineInfo(task) {
    if (!task.deadline) return null;
    const dt = new Date(task.deadline);
    if (isNaN(dt)) return null;
    const key = toDateKey(dt);
    const today = getTodayKey();
    const time = `${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}`;
    if (!task.completed && dt < new Date()) return { label: `期限切れ ${dt.getMonth() + 1}/${dt.getDate()}`, warn: true, rank: 0 };
    if (key === today) return { label: `今日 ${time}まで`, warn: true, rank: 1 };
    if (key === addDaysToKey(today, 1)) return { label: `明日 ${time}まで`, warn: false, rank: 2 };
    return { label: `${dt.getMonth() + 1}/${dt.getDate()}まで`, warn: false, rank: 3 };
}

// ==========================================================================
// Event Listeners
// ==========================================================================
function switchView(targetView) {
    navTabs.forEach(t => t.classList.toggle('active', t.dataset.view === targetView));
    viewPanels.forEach(p => p.classList.toggle('active', p.id === `view-${targetView}`));
    currentView = targetView;
    document.getElementById('nav-filters').classList.toggle('hidden', targetView === 'today' || targetView === 'analytics');
    renderAll();
}

function setupEventListeners() {
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => switchView(tab.dataset.view));
    });

    // 追加ボタン：今日タブのクイック入力へ
    btnAddTask.addEventListener('click', () => {
        if (currentView !== 'today') switchView('today');
        quickAddInput.focus();
        quickAddInput.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });

    // Modals Close
    document.getElementById('btn-close-modal').addEventListener('click', closeTaskModal);
    document.getElementById('btn-cancel-modal').addEventListener('click', closeTaskModal);
    document.getElementById('btn-close-review').addEventListener('click', closeReviewModal);
    document.getElementById('btn-cancel-review').addEventListener('click', closeReviewModal);
    document.getElementById('btn-close-detail').addEventListener('click', closeDetailModal);

    modalTask.addEventListener('click', (e) => { if (e.target === modalTask) closeTaskModal(); });
    modalReview.addEventListener('click', (e) => { if (e.target === modalReview) closeReviewModal(); });
    modalDetail.addEventListener('click', (e) => { if (e.target === modalDetail) closeDetailModal(); });

    // Backup Modal
    document.getElementById('btn-open-backup').addEventListener('click', openBackupModal);
    document.getElementById('btn-close-backup').addEventListener('click', closeBackupModal);
    document.getElementById('btn-close-backup-bottom').addEventListener('click', closeBackupModal);
    modalBackup.addEventListener('click', (e) => { if (e.target === modalBackup) closeBackupModal(); });

    document.getElementById('btn-backup-now').addEventListener('click', () => {
        saveTasks();
        renderBackupHistory();
        showToast('🛡️ 今時点のバックアップを作成しました');
    });
    document.getElementById('btn-export-backup-json').addEventListener('click', exportJSON);

    // Task modal: quadrant picker & sliders
    document.querySelectorAll('#task-quadrant-picker button').forEach(btn => {
        btn.addEventListener('click', () => {
            const q = btn.dataset.q;
            modalQuadrant = q;
            if (q && getQuadrant(+taskUrgencySlider.value, +taskImportanceSlider.value) !== q) {
                taskUrgencySlider.value = QUADRANT_PRESETS[q].urgency;
                taskImportanceSlider.value = QUADRANT_PRESETS[q].importance;
            }
            updateLivePreview();
        });
    });
    taskUrgencySlider.addEventListener('input', () => { modalQuadrant = null; updateLivePreview(); });
    taskImportanceSlider.addEventListener('input', () => { modalQuadrant = null; updateLivePreview(); });

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveFormTask();
    });

    reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveReviewAndCompleteTask();
    });

    // Search and Filters
    searchInput.addEventListener('input', () => renderAll());
    filterCategory.addEventListener('change', () => renderAll());
    toggleCompleted.addEventListener('change', () => renderAll());

    // Dropdown menu toggle
    const btnMenu = document.getElementById('btn-menu');
    const dropdownMenu = document.getElementById('dropdown-menu');
    btnMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    document.addEventListener('click', () => dropdownMenu.classList.remove('show'));

    // Dropdown Actions
    document.getElementById('btn-instant-save-json').addEventListener('click', exportJSON);
    document.getElementById('btn-load-sample').addEventListener('click', () => {
        if (confirm('現在のタスクをサンプルデータに置き換えますか？（バックアップから戻せます）')) {
            saveTasks(true);
            tasks = SAMPLE_TASKS.map((t, idx) => sanitizeTask(t, idx)).filter(Boolean);
            saveTasks();
            renderAll();
            showToast('サンプルデータを投入しました');
        }
    });

    document.getElementById('btn-clear-all').addEventListener('click', () => {
        if (confirm('本当にすべてのタスクをクリアしますか？（バックアップセンターから復元可能です）')) {
            saveTasks(); // 削除前にスナップショット記録
            tasks = [];
            saveTasks();
            renderAll();
            showToast('タスクをクリアしました（バックアップから復元可能）');
        }
    });

    document.getElementById('input-import-json').addEventListener('change', importJSON);

    // Detail modal actions
    document.getElementById('btn-toggle-complete').addEventListener('click', () => {
        const task = findTask(activeTaskId);
        if (!task) return;
        closeDetailModal();
        toggleComplete(task);
    });

    document.getElementById('btn-toggle-today').addEventListener('click', () => {
        const task = findTask(activeTaskId);
        if (!task) return;
        const key = getTodayKey();
        task.today = task.today === key ? null : key;
        saveTasks();
        renderAll();
        openDetailModal(task);
        showToast(task.today ? '☀ 今日やることに入れました' : '今日やることから外しました');
    });

    document.getElementById('btn-write-review').addEventListener('click', () => {
        const task = findTask(activeTaskId);
        if (!task) return;
        closeDetailModal();
        openReviewModal(task);
    });

    document.getElementById('btn-edit-from-detail').addEventListener('click', () => {
        const task = findTask(activeTaskId);
        closeDetailModal();
        if (task) openTaskModal(task);
    });

    document.getElementById('btn-delete-task').addEventListener('click', () => {
        if (activeTaskId && confirm('このタスクを削除してもよろしいですか？')) {
            deleteTask(activeTaskId);
            closeDetailModal();
        }
    });

    // Escで閉じる / n でクイック入力へ
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTaskModal(); closeReviewModal(); closeDetailModal(); closeBackupModal();
            return;
        }
        const tag = (e.target.tagName || '').toLowerCase();
        const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
        if (!typing && !e.ctrlKey && !e.metaKey && !e.altKey && e.key === 'n' && !document.querySelector('.modal-overlay.show')) {
            e.preventDefault();
            btnAddTask.click();
        }
    });

    // 日付が変わったら「今日」を描き直す（開きっぱなし対策）
    const checkRollover = () => {
        if (renderedDayKey && renderedDayKey !== getTodayKey()) {
            morningExpanded = false;
            eveningExpanded = false;
            renderAll();
        }
    };
    setInterval(checkRollover, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) checkRollover(); });

    let resizeTimeout = null;
    window.addEventListener('resize', () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (currentView === 'matrix') renderMatrixGraph();
        }, 100);
    });

    window.addEventListener('beforeunload', () => saveTasks(true));
}

function toggleComplete(task) {
    const done = !task.completed;
    setTaskCompleted(task, done);
    saveTasks();
    renderAll();
    showToast(done ? `✅ 「${task.title.slice(0, 20)}」完了！` : '未完了に戻しました');
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderAll();
    showToast('タスクを削除しました（データ復元から戻せます）');
}

function updateLivePreview() {
    const u = parseInt(taskUrgencySlider.value, 10);
    const i = parseInt(taskImportanceSlider.value, 10);
    urgencyValDisplay.textContent = `${u}%`;
    importanceValDisplay.textContent = `${i}%`;

    const q = getQuadrant(u, i);
    liveQuadrantBadge.className = `quadrant-live-badge ${q}`;
    liveQuadrantBadge.textContent = getQuadrantName(q);

    const selected = modalQuadrant === '' ? '' : q;
    document.querySelectorAll('#task-quadrant-picker button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.q === selected);
    });
}

// ==========================================================================
// VIEW 0: 今日（クイック追加・朝の確認・夜の振り返り）
// ==========================================================================
function cleanLine(line) {
    return line
        .replace(/^\s*(?:[-*・•●○□■☐☑✓✔]|\[[ xX]?\]|\d+[.)．、])\s*/, '')
        .trim();
}

function setupTodayListeners() {
    const form = document.getElementById('quick-add-form');
    const todayCheck = document.getElementById('quick-add-today');

    const autoGrow = () => {
        quickAddInput.style.height = 'auto';
        quickAddInput.style.height = Math.min(quickAddInput.scrollHeight + 2, 200) + 'px';
    };
    quickAddInput.addEventListener('input', autoGrow);

    quickAddInput.addEventListener('keydown', (e) => {
        // 日本語変換中のEnterでは送信しない
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) {
            e.preventDefault();
            form.requestSubmit();
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const lines = quickAddInput.value.split(/\r?\n/).map(cleanLine).filter(Boolean);
        if (lines.length === 0) {
            quickAddInput.focus();
            return;
        }
        const forToday = todayCheck.checked;
        const created = lines.map(line => createTask(line.slice(0, 150), quickAddQuadrant, forToday));
        tasks.unshift(...created);
        saveTasks();
        quickAddInput.value = '';
        autoGrow();
        renderAll();
        const where = quickAddQuadrant ? `第${QUADRANT_SHORT[quickAddQuadrant]}領域` : '「仕分け」';
        showToast(`${created.length}件を${where}に追加しました${forToday ? '（今日やる）' : ''}`);
        quickAddInput.focus();
    });

    document.querySelectorAll('#quick-add-quadrant button').forEach(btn => {
        btn.addEventListener('click', () => {
            quickAddQuadrant = btn.dataset.q;
            document.querySelectorAll('#quick-add-quadrant button').forEach(b => b.classList.toggle('active', b === btn));
            quickAddInput.focus();
        });
    });

    // 朝の確認
    const focusInput = document.getElementById('focus-input');
    focusInput.addEventListener('change', () => {
        getDayRecord(getTodayKey()).focus = focusInput.value.trim();
        saveTasks(true);
        renderToday();
    });
    focusInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) focusInput.blur();
    });

    document.getElementById('btn-morning-done').addEventListener('click', () => {
        const key = getTodayKey();
        const rec = getDayRecord(key);
        rec.focus = focusInput.value.trim();
        rec.morningAt = Date.now();
        morningExpanded = false;
        saveTasks();
        renderAll();
        const n = tasks.filter(t => t.today === key && !t.completed).length;
        showToast(n > 0 ? `☀ 今日は${n}件。いってらっしゃい！` : '☀ 朝の確認OK（今日やることは後からでも追加できます）');
    });
    document.getElementById('btn-morning-reopen').addEventListener('click', () => {
        morningExpanded = !morningExpanded;
        renderToday();
    });
    document.getElementById('btn-candidate-more').addEventListener('click', () => {
        showAllCandidates = !showAllCandidates;
        renderToday();
    });

    // 夜の振り返り
    const reflectionInput = document.getElementById('reflection-input');
    reflectionInput.addEventListener('change', () => {
        getDayRecord(getTodayKey()).reflection = reflectionInput.value.trim();
        saveTasks(true);
    });

    document.getElementById('btn-carry-all').addEventListener('click', () => {
        const key = getTodayKey();
        const left = tasks.filter(t => t.today === key && !t.completed);
        left.forEach(t => { t.today = addDaysToKey(key, 1); });
        saveTasks();
        renderAll();
        showToast(`${left.length}件を明日に回しました`);
    });

    document.getElementById('btn-evening-done').addEventListener('click', () => {
        const key = getTodayKey();
        const rec = getDayRecord(key);
        const planned = tasks.filter(t => t.today === key);
        rec.reflection = reflectionInput.value.trim();
        rec.eveningAt = Date.now();
        rec.planned = planned.length;
        rec.done = countDoneOn(key);
        eveningExpanded = false;
        saveTasks();
        renderAll();
        showToast('🌙 おつかれさまでした。また明日！');
    });
    document.getElementById('btn-evening-reopen').addEventListener('click', () => {
        eveningExpanded = !eveningExpanded;
        renderToday();
    });

    // 各リストのボタン（イベント委譲）
    ['inbox-list', 'candidate-list', 'today-list', 'evening-left-list'].forEach(id => {
        document.getElementById(id).addEventListener('click', onItemListClick);
    });
}

function onItemListClick(e) {
    const row = e.target.closest('.item-row');
    if (!row) return;
    const task = findTask(row.dataset.id);
    if (!task) return;
    const btn = e.target.closest('button');
    const key = getTodayKey();

    if (!btn) {
        if (e.target.closest('.item-main')) openDetailModal(task);
        return;
    }

    const act = btn.dataset.act;
    if (act === 'sort') {
        setTaskQuadrant(task, btn.dataset.q);
        showToast(`「${task.title.slice(0, 16)}」→ 第${QUADRANT_SHORT[btn.dataset.q]}領域`);
    } else if (act === 'today') {
        task.today = key;
        task.inbox = false;
    } else if (act === 'untoday') {
        task.today = null;
    } else if (act === 'tomorrow') {
        task.today = addDaysToKey(key, 1);
        showToast('明日に回しました');
    } else if (act === 'check') {
        setTaskCompleted(task, !task.completed);
        if (task.completed) showToast(`✅ 「${task.title.slice(0, 20)}」完了！`);
    } else if (act === 'delete') {
        if (!confirm(`「${task.title}」を削除しますか？`)) return;
        tasks = tasks.filter(t => t.id !== task.id);
    } else {
        return;
    }
    saveTasks();
    renderAll();
}

function countDoneOn(key) {
    return tasks.filter(t => t.completed && t.completedAt && (() => {
        const d = new Date(t.completedAt);
        d.setHours(d.getHours() - DAY_START_HOUR);
        return toDateKey(d) === key;
    })()).length;
}

function getPhase(rec) {
    const h = new Date().getHours();
    const isEvening = h >= 17 || h < DAY_START_HOUR;
    if (isEvening) return rec.eveningAt ? 'done' : 'evening';
    return rec.morningAt ? 'day' : 'morning';
}

function computeStreak() {
    const hasCheck = k => days[k] && (days[k].morningAt || days[k].eveningAt);
    let key = getTodayKey();
    if (!hasCheck(key)) key = addDaysToKey(key, -1);
    let n = 0;
    while (hasCheck(key)) {
        n++;
        key = addDaysToKey(key, -1);
    }
    return n;
}

function itemRowHTML(task, opts) {
    const q = task.inbox ? '' : taskQuadrant(task);
    const dl = deadlineInfo(task);
    const subs = [];
    if (opts.showQuadrant && q) subs.push(`<span>第${QUADRANT_SHORT[q]}</span>`);
    if (opts.carry) subs.push(`<span class="carry">持ち越し</span>`);
    if (dl && !task.completed) subs.push(`<span class="${dl.warn ? 'warn' : ''}"><i class="fa-regular fa-clock"></i> ${dl.label}</span>`);
    return `
        <li class="item-row ${q} ${opts.inbox ? 'inbox' : ''} ${task.completed ? 'done' : ''}" data-id="${escapeHTML(task.id)}">
            ${opts.check ? `<button type="button" class="check-btn" data-act="check" title="${task.completed ? '未完了に戻す' : '完了にする'}"><i class="fa-solid fa-check"></i></button>` : ''}
            <div class="item-main">
                <span class="item-title">${escapeHTML(task.title)}</span>
                <span class="item-sub">${subs.join('')}</span>
            </div>
            <div class="item-actions">${opts.actions}</div>
        </li>`;
}

function renderToday() {
    const key = getTodayKey();
    renderedDayKey = key;
    const rec = days[key] || {};
    const phase = getPhase(rec);

    // Hero
    const [y, m, d] = key.split('-').map(Number);
    document.getElementById('today-date-label').textContent = `${y}年 ${formatDayLabel(key)}`;
    const todayTasks = tasks.filter(t => t.today === key);
    const leftTasks = todayTasks.filter(t => !t.completed);
    const greeting = {
        morning: 'おはようございます。まずは朝の確認から',
        day: leftTasks.length > 0 ? `今日やることは残り ${leftTasks.length} 件` : '今日の予定はすべて完了！',
        evening: 'おつかれさまです。夜の振り返りをしましょう',
        done: '今日もおつかれさまでした'
    }[phase];
    document.getElementById('today-greeting').textContent = greeting;
    document.getElementById('pill-morning').classList.toggle('done', Boolean(rec.morningAt));
    document.getElementById('pill-evening').classList.toggle('done', Boolean(rec.eveningAt));
    document.getElementById('streak-count').textContent = computeStreak();

    const grid = document.getElementById('today-grid');
    grid.classList.toggle('phase-day', phase === 'day');
    grid.classList.toggle('phase-evening', phase === 'evening' || phase === 'done');

    // ---- 朝の確認 ----
    const inbox = tasks.filter(t => t.inbox && !t.completed);
    const inboxList = document.getElementById('inbox-list');
    document.getElementById('inbox-count').textContent = inbox.length ? `${inbox.length}件` : '';
    inboxList.innerHTML = inbox.length === 0
        ? '<li class="item-empty">仕分け待ちはありません 👍</li>'
        : inbox.map(t => itemRowHTML(t, {
            inbox: true,
            actions: ['q1', 'q2', 'q3', 'q4'].map(q =>
                `<button type="button" class="mini-q ${q}" data-act="sort" data-q="${q}" title="${getQuadrantName(q)}">${QUADRANT_SHORT[q]}</button>`
            ).join('') + `<button type="button" class="mini-btn icon" data-act="delete" title="削除"><i class="fa-solid fa-xmark"></i></button>`
        })).join('');

    const candidates = tasks
        .filter(t => !t.completed && !t.inbox && t.today !== key && !(t.today && t.today > key))
        .map(t => {
            const dl = deadlineInfo(t);
            const carry = Boolean(t.today && t.today < key);
            const rank = carry ? 0 : (dl && dl.rank <= 1 ? 1 : 2);
            return { t, carry, rank };
        })
        .sort((a, b) =>
            a.rank - b.rank ||
            QUADRANT_ORDER[taskQuadrant(a.t)] - QUADRANT_ORDER[taskQuadrant(b.t)] ||
            b.t.importance - a.t.importance
        );
    const LIMIT = 6;
    const shown = showAllCandidates ? candidates : candidates.slice(0, LIMIT);
    document.getElementById('candidate-list').innerHTML = candidates.length === 0
        ? '<li class="item-empty">候補はありません。上の入力欄から追加できます。</li>'
        : shown.map(c => itemRowHTML(c.t, {
            showQuadrant: true,
            carry: c.carry,
            actions: `<button type="button" class="mini-btn primary" data-act="today"><i class="fa-solid fa-plus"></i> 今日</button>`
        })).join('');
    const moreBtn = document.getElementById('btn-candidate-more');
    moreBtn.classList.toggle('hidden', candidates.length <= LIMIT);
    moreBtn.textContent = showAllCandidates ? '少なく表示' : `ほかの候補も見る（あと${candidates.length - LIMIT}件）`;

    const focusInput = document.getElementById('focus-input');
    if (document.activeElement !== focusInput) focusInput.value = rec.focus || '';

    const morningDone = Boolean(rec.morningAt);
    const showMorningBody = !morningDone || morningExpanded;
    document.getElementById('morning-body').classList.toggle('hidden', !showMorningBody);
    const mNote = document.getElementById('morning-done-note');
    mNote.classList.toggle('hidden', showMorningBody);
    if (morningDone) {
        const t = new Date(rec.morningAt);
        mNote.textContent = `✓ ${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')} に完了` +
            (inbox.length ? `\n仕分け待ちが ${inbox.length} 件あります` : '');
    }
    const mReopen = document.getElementById('btn-morning-reopen');
    mReopen.classList.toggle('hidden', !morningDone);
    mReopen.textContent = morningExpanded ? '閉じる' : 'もう一度見る';
    document.getElementById('btn-morning-done').innerHTML = morningDone
        ? '<i class="fa-solid fa-check"></i> 更新して閉じる'
        : '<i class="fa-solid fa-check"></i> 朝の確認を完了';
    document.getElementById('card-morning').classList.toggle('current', phase === 'morning');

    // ---- 今日やること ----
    const sortedToday = [...todayTasks].sort((a, b) =>
        (a.completed - b.completed) ||
        QUADRANT_ORDER[taskQuadrant(a)] - QUADRANT_ORDER[taskQuadrant(b)]
    );
    document.getElementById('today-list').innerHTML = sortedToday.length === 0
        ? '<li class="item-empty">まだありません。朝の確認で選ぶか、「今日やる」にチェックして追加してください。</li>'
        : sortedToday.map(t => itemRowHTML(t, {
            check: true,
            showQuadrant: true,
            actions: t.completed ? '' : `<button type="button" class="mini-btn icon" data-act="untoday" title="今日やることから外す"><i class="fa-solid fa-xmark"></i></button>`
        })).join('');
    const doneCount = todayTasks.length - leftTasks.length;
    document.getElementById('today-progress-text').textContent = `${doneCount} / ${todayTasks.length}`;
    document.getElementById('today-progress-fill').style.width =
        todayTasks.length ? `${Math.round(doneCount / todayTasks.length * 100)}%` : '0%';
    const focusDisplay = document.getElementById('focus-display');
    focusDisplay.classList.toggle('hidden', !rec.focus);
    focusDisplay.innerHTML = rec.focus ? `<small>今日いちばん大事なこと</small>${escapeHTML(rec.focus)}` : '';

    // ---- 夜の振り返り ----
    const doneToday = countDoneOn(key);
    document.getElementById('evening-summary').innerHTML =
        `今日の完了 <strong>${doneToday}</strong> 件` +
        (todayTasks.length ? `（予定 ${todayTasks.length} 件中 ${doneCount} 件）` : '');
    document.getElementById('evening-left-step').classList.toggle('hidden', leftTasks.length === 0);
    document.getElementById('evening-reflect-num').textContent = leftTasks.length ? '2' : '1';
    document.getElementById('evening-left-list').innerHTML = leftTasks.map(t => itemRowHTML(t, {
        check: true,
        actions: `<button type="button" class="mini-btn" data-act="tomorrow">明日へ</button>` +
                 `<button type="button" class="mini-btn" data-act="untoday">外す</button>`
    })).join('');

    const reflectionInput = document.getElementById('reflection-input');
    if (document.activeElement !== reflectionInput) reflectionInput.value = rec.reflection || '';

    const eveningDone = Boolean(rec.eveningAt);
    const showEveningBody = !eveningDone || eveningExpanded;
    document.getElementById('evening-body').classList.toggle('hidden', !showEveningBody);
    const eNote = document.getElementById('evening-done-note');
    eNote.classList.toggle('hidden', showEveningBody);
    if (eveningDone) {
        eNote.textContent = `✓ 完了（${rec.done ?? doneToday} 件達成）` + (rec.reflection ? `\n「${rec.reflection}」` : '');
    }
    const eReopen = document.getElementById('btn-evening-reopen');
    eReopen.classList.toggle('hidden', !eveningDone);
    eReopen.textContent = eveningExpanded ? '閉じる' : 'もう一度見る';
    document.getElementById('btn-evening-done').innerHTML = eveningDone
        ? '<i class="fa-solid fa-moon"></i> 更新して閉じる'
        : '<i class="fa-solid fa-moon"></i> 夜の振り返りを完了';
    document.getElementById('card-evening').classList.toggle('current', phase === 'evening');

    // ---- 記録 ----
    const keys = Object.keys(days).filter(k => days[k].morningAt || days[k].eveningAt || days[k].reflection).sort().reverse().slice(0, 14);
    document.getElementById('day-log-list').innerHTML = keys.length === 0
        ? '<li>まだ記録はありません。朝と夜の確認を完了すると、ここに残ります。</li>'
        : keys.map(k => {
            const r = days[k];
            const marks = `${r.morningAt ? '☀' : '・'} ${r.eveningAt ? '🌙' : '・'}`;
            const count = r.eveningAt ? `${r.done ?? 0}件完了${r.planned ? ` / 予定${r.planned}件` : ''}` : '';
            return `<li>
                <div class="log-head">${formatDayLabel(k)} <span>${marks}</span> <span class="log-mark">${count}</span></div>
                ${r.focus ? `<div class="log-text">🎯 ${escapeHTML(r.focus)}</div>` : ''}
                ${r.reflection ? `<div class="log-text">📝 ${escapeHTML(r.reflection)}</div>` : ''}
            </li>`;
        }).join('');
}

// ==========================================================================
// Filtering Tasks (マトリックス・ボード用。未仕分けは除く)
// ==========================================================================
function getFilteredTasks() {
    const query = searchInput.value.trim().toLowerCase();
    const cat = filterCategory.value;
    const showCompleted = toggleCompleted.checked;

    return tasks.filter(task => {
        if (task.inbox) return false;
        if (!showCompleted && task.completed) return false;
        if (cat !== 'all' && task.category !== cat) return false;
        if (query) {
            const matchTitle = task.title.toLowerCase().includes(query);
            const matchNotes = task.notes?.toLowerCase().includes(query);
            const matchStrat = task.pdcaStrategy?.strategy?.toLowerCase().includes(query);
            if (!matchTitle && !matchNotes && !matchStrat) return false;
        }
        return true;
    });
}

// ==========================================================================
// Rendering Main Controllers
// ==========================================================================
function renderAll() {
    updateHeaderStats();
    if (currentView === 'today') renderToday();
    if (currentView === 'matrix') renderMatrixGraph();
    if (currentView === 'board') renderBoard();
    if (currentView === 'analytics') renderAnalytics();
}

function updateHeaderStats() {
    const counts = { q1: 0, q2: 0, q3: 0, q4: 0 };
    let inbox = 0;
    tasks.forEach(task => {
        if (task.completed) return;
        if (task.inbox) inbox++;
        else counts[taskQuadrant(task)]++;
    });
    ['q1', 'q2', 'q3', 'q4'].forEach(q => {
        document.getElementById(`stat-${q}`).textContent = counts[q];
    });
    const badge = document.getElementById('nav-inbox-count');
    badge.textContent = inbox;
    badge.classList.toggle('hidden', inbox === 0);
}

// ==========================================================================
// VIEW 1: Matrix Graph Rendering & Drag/Drop (マウス・タッチ両対応)
// ==========================================================================
function getMatrixGeometry(rect) {
    const padX = Math.max(95, Math.min(135, Math.round(rect.width * 0.18)));
    const padY = Math.max(36, Math.min(48, Math.round(rect.height * 0.08)));
    return {
        padX,
        padY,
        usableW: Math.max(100, rect.width - padX * 2),
        usableH: Math.max(100, rect.height - padY * 2)
    };
}

function renderMatrixGraph() {
    matrixTasksLayer.innerHTML = '';
    const filtered = getFilteredTasks();

    const rect = matrixCanvasArea.getBoundingClientRect();
    const width = rect.width;
    const { padX: safePaddingX, padY: safePaddingY, usableW: usableWidth, usableH: usableHeight } = getMatrixGeometry(rect);

    const cardWidth = Math.min(185, Math.max(140, Math.round(width * 0.16)));
    const cardHeight = 40;
    const placedBoxes = [];

    filtered.forEach((task) => {
        const q = taskQuadrant(task);
        const point = document.createElement('div');
        point.className = `task-point ${q} ${task.completed ? 'completed' : ''}`;
        point.dataset.id = task.id;

        let xPos = safePaddingX + (task.urgency / 100) * usableWidth;
        let yPos = safePaddingY + ((100 - task.importance) / 100) * usableHeight;

        // 象限タイトルとの重なりを回避
        const isUpperHalf = task.importance >= 50;
        if (isUpperHalf && yPos < safePaddingY + 54) {
            yPos = safePaddingY + 54;
        }
        if (!isUpperHalf && yPos < safePaddingY + usableHeight * 0.5 + 54 && yPos > safePaddingY + usableHeight * 0.5 - 15) {
            yPos = safePaddingY + usableHeight * 0.5 + 54;
        }

        // 他のカードとの重なりをスパイラル状に回避
        let collision = true;
        let attempts = 0;
        let angle = 0;
        let radius = 0;
        let testX = xPos;
        let testY = yPos;

        while (collision && attempts < 80) {
            collision = placedBoxes.some(box =>
                Math.abs(testX - box.x) < cardWidth * 0.92 && Math.abs(testY - box.y) < cardHeight * 0.95
            );
            if (collision) {
                attempts++;
                radius += 6;
                angle += Math.PI / 3.5;
                testX = Math.max(safePaddingX, Math.min(safePaddingX + usableWidth, xPos + Math.cos(angle) * radius));
                testY = Math.max(safePaddingY + 12, Math.min(safePaddingY + usableHeight - 12, yPos + Math.sin(angle) * radius));
            }
        }

        placedBoxes.push({ x: testX, y: testY });
        point.style.left = `${testX}px`;
        point.style.top = `${testY}px`;

        const icon = task.completed
            ? `<i class="fa-solid fa-award pdca-gold-icon" title="完了"></i>`
            : (task.today === getTodayKey() ? `<i class="fa-solid fa-sun pdca-mini-icon" title="今日やる"></i>` : '');

        point.innerHTML = `
            <div class="task-point-card">
                <div class="point-dot"></div>
                <span class="point-title" title="${escapeHTML(task.title)}">${escapeHTML(task.title)}</span>
                ${icon}
            </div>
        `;

        point.addEventListener('mouseenter', () => { point.style.zIndex = '999999'; });
        point.addEventListener('mouseleave', () => { if (!point.classList.contains('dragging')) point.style.zIndex = '15'; });

        point.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            const startX = e.clientX;
            const startY = e.clientY;
            let hasMoved = false;
            point.setPointerCapture(e.pointerId);
            point.style.transition = 'none';
            point.style.zIndex = '999999';
            point.classList.add('dragging');

            const onMove = (ev) => {
                if (Math.abs(ev.clientX - startX) > 4 || Math.abs(ev.clientY - startY) > 4) hasMoved = true;
                if (!hasMoved) return;
                const canvasRect = matrixCanvasArea.getBoundingClientRect();
                const g = getMatrixGeometry(canvasRect);
                const newLeft = Math.max(g.padX, Math.min(canvasRect.width - g.padX, ev.clientX - canvasRect.left));
                const newTop = Math.max(g.padY, Math.min(canvasRect.height - g.padY, ev.clientY - canvasRect.top));
                point.style.left = `${newLeft}px`;
                point.style.top = `${newTop}px`;

                task.urgency = Math.max(0, Math.min(100, Math.round(((newLeft - g.padX) / g.usableW) * 100)));
                task.importance = Math.max(0, Math.min(100, Math.round(((g.usableH - (newTop - g.padY)) / g.usableH) * 100)));
                point.className = `task-point ${taskQuadrant(task)} dragging ${task.completed ? 'completed' : ''}`;
            };

            const onUp = () => {
                point.removeEventListener('pointermove', onMove);
                point.removeEventListener('pointerup', onUp);
                point.removeEventListener('pointercancel', onUp);
                point.classList.remove('dragging');
                point.style.zIndex = '15';
                point.style.transition = '';

                if (hasMoved) {
                    saveTasks();
                    renderMatrixGraph();
                    showToast(`「${task.title.slice(0, 12)}」を移動しました (緊急度${task.urgency}% / 重要度${task.importance}%)`);
                } else {
                    openDetailModal(task);
                }
            };

            point.addEventListener('pointermove', onMove);
            point.addEventListener('pointerup', onUp);
            point.addEventListener('pointercancel', onUp);
        });

        matrixTasksLayer.appendChild(point);
    });
}

// ==========================================================================
// VIEW 2: Kanban Board（列ごとのクイック追加・ドラッグで領域移動）
// ==========================================================================
function setupBoardEnhancements() {
    ['q1', 'q2', 'q3', 'q4'].forEach(q => {
        const list = document.getElementById(`board-${q}-list`);

        const form = document.createElement('form');
        form.className = 'column-quick-add';
        form.autocomplete = 'off';
        form.innerHTML = `<input type="text" placeholder="＋ この領域に追加（Enter）">`;
        const input = form.querySelector('input');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = input.value.trim();
            if (!title) return;
            tasks.unshift(createTask(title.slice(0, 150), q, false));
            input.value = '';
            saveTasks();
            renderAll();
            input.focus();
        });
        list.after(form);

        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            list.classList.add('drop-over');
        });
        list.addEventListener('dragleave', (e) => {
            if (!list.contains(e.relatedTarget)) list.classList.remove('drop-over');
        });
        list.addEventListener('drop', (e) => {
            e.preventDefault();
            list.classList.remove('drop-over');
            const task = findTask(e.dataTransfer.getData('text/plain'));
            if (!task || taskQuadrant(task) === q) return;
            setTaskQuadrant(task, q);
            saveTasks();
            renderAll();
            showToast(`「${task.title.slice(0, 16)}」→ 第${QUADRANT_SHORT[q]}領域`);
        });
    });
}

function renderBoard() {
    const filtered = getFilteredTasks();
    const lists = {
        q1: document.getElementById('board-q1-list'),
        q2: document.getElementById('board-q2-list'),
        q3: document.getElementById('board-q3-list'),
        q4: document.getElementById('board-q4-list')
    };
    const counts = { q1: 0, q2: 0, q3: 0, q4: 0 };
    const todayKey = getTodayKey();

    Object.values(lists).forEach(list => list.innerHTML = '');

    filtered.forEach(task => {
        const q = taskQuadrant(task);
        counts[q]++;

        const card = document.createElement('div');
        card.className = `task-card ${q} ${task.completed ? 'completed' : ''} ${task.today === todayKey ? 'today-mark' : ''}`;
        card.draggable = true;

        const dl = deadlineInfo(task);
        const deadlineMarkup = dl
            ? `<span class="deadline-badge ${dl.warn && !task.completed ? 'overdue' : ''}"><i class="fa-regular fa-clock"></i> ${dl.label}</span>`
            : '';

        const reviewBadge = task.pdcaReview
            ? `<div class="task-card-pdca-status verified"><i class="fa-solid fa-award"></i> ふりかえり済み</div>`
            : (task.pdcaStrategy ? `<div class="task-card-pdca-status"><i class="fa-solid fa-brain"></i> 作戦メモあり</div>` : '');

        card.innerHTML = `
            <div class="task-card-header">
                <span class="task-card-title">${escapeHTML(task.title)}</span>
                <div class="task-card-actions">
                    <button class="btn-card-icon check" data-act="check" title="${task.completed ? '未完了に戻す' : '完了にする'}">
                        <i class="fa-${task.completed ? 'solid' : 'regular'} fa-circle-check"></i>
                    </button>
                    <button class="btn-card-icon" data-act="today" title="${task.today === todayKey ? '今日やることから外す' : '今日やる'}">
                        <i class="fa-${task.today === todayKey ? 'solid' : 'regular'} fa-sun"></i>
                    </button>
                </div>
            </div>
            ${reviewBadge}
            <div class="task-card-meta">
                <span class="cat-badge">${escapeHTML(task.category)}</span>
                ${deadlineMarkup}
            </div>
        `;

        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-card-icon');
            if (!btn) {
                openDetailModal(task);
                return;
            }
            if (btn.dataset.act === 'check') {
                toggleComplete(task);
            } else if (btn.dataset.act === 'today') {
                task.today = task.today === todayKey ? null : todayKey;
                saveTasks();
                renderAll();
                showToast(task.today ? '☀ 今日やることに入れました' : '今日やることから外しました');
            }
        });

        lists[q].appendChild(card);
    });

    ['q1', 'q2', 'q3', 'q4'].forEach(q => {
        document.getElementById(`count-board-${q}`).textContent = counts[q];
    });
}

// ==========================================================================
// VIEW 3: Analytics & Smart Coaching Advice
// ==========================================================================
function renderAnalytics() {
    const activeTasks = tasks.filter(t => !t.completed && !t.inbox);
    const total = activeTasks.length;

    const counts = { q1: 0, q2: 0, q3: 0, q4: 0 };
    activeTasks.forEach(task => counts[taskQuadrant(task)]++);

    const getPerc = (c) => total === 0 ? 0 : Math.round((c / total) * 100);
    const perc = {};
    ['q1', 'q2', 'q3', 'q4'].forEach(q => {
        perc[q] = getPerc(counts[q]);
        document.getElementById(`bar-percentage-${q}`).textContent = `${perc[q]}% (${counts[q]}件)`;
        document.getElementById(`bar-fill-${q}`).style.width = `${perc[q]}%`;
    });
    const { q1: p1, q2: p2, q3: p3, q4: p4 } = perc;

    const container = document.getElementById('coaching-message-container');
    const bubbles = [];

    if (total === 0) {
        container.innerHTML = `<div class="coach-bubble">未完了のタスクがありません。「今日」タブの入力欄から、やることを追加しましょう。</div>`;
        return;
    }

    if (p1 >= 40) {
        bubbles.push(`<div class="coach-bubble warning">
            <strong>🔥 第I領域（緊急・重要）が ${p1}% と多めです</strong><br>
            締め切りに追われやすい状態です。朝の確認で第IIを1つ先に入れて、火消しの元を減らしていきましょう。
        </div>`);
    }

    if (p2 >= 40) {
        bubbles.push(`<div class="coach-bubble">
            <strong>✨ 第II領域（重要・急がない）に ${p2}% 配分できています</strong><br>
            この調子で、毎朝1つは「今日やる」に入れて少しずつ進めましょう。
        </div>`);
    } else if (counts.q2 === 0) {
        bubbles.push(`<div class="coach-bubble warning">
            <strong>💎 第II領域のタスクを1つ登録しましょう</strong><br>
            スキルアップや仕組みづくりなど「今やらなくても怒られないが、後で効いてくること」を入れてみてください。
        </div>`);
    }

    if (p3 + p4 >= 40) {
        bubbles.push(`<div class="coach-bubble info">
            <strong>⚠️ 第III・第IV領域が ${p3 + p4}% を占めています</strong><br>
            人に任せる・断る・やめる、ができないか夜の振り返りで考えてみましょう。
        </div>`);
    }

    const streak = computeStreak();
    if (streak >= 2) {
        bubbles.push(`<div class="coach-bubble"><strong>🔥 朝・夜の確認が ${streak} 日連続です</strong><br>続けることがいちばんの力になります。</div>`);
    }

    container.innerHTML = bubbles.length ? bubbles.join('') : `
        <div class="coach-bubble">
            バランスは良好です。朝に決めて、夜に振り返るサイクルを続けていきましょう。
        </div>`;
}

// ==========================================================================
// Task Modal（1画面・必須はタイトルだけ）
// ==========================================================================
function openTaskModal(taskToEdit = null) {
    taskForm.reset();
    const todayCheck = document.getElementById('task-today');

    if (taskToEdit) {
        document.getElementById('task-modal-title').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> やることを編集';
        document.getElementById('task-id').value = taskToEdit.id;
        document.getElementById('task-title').value = taskToEdit.title;
        document.getElementById('task-category').value = taskToEdit.category || 'その他';
        document.getElementById('task-deadline').value = taskToEdit.deadline || '';
        taskUrgencySlider.value = taskToEdit.urgency;
        taskImportanceSlider.value = taskToEdit.importance;
        document.getElementById('task-notes').value = taskToEdit.notes || '';
        todayCheck.checked = taskToEdit.today === getTodayKey();
        modalQuadrant = taskToEdit.inbox ? '' : taskQuadrant(taskToEdit);

        document.getElementById('pdca-strategy').value = taskToEdit.pdcaStrategy?.strategy || '';
        document.getElementById('pdca-obstacle').value = taskToEdit.pdcaStrategy?.obstacle || '';
        document.getElementById('pdca-goal').value = taskToEdit.pdcaStrategy?.goal || '';
        document.getElementById('details-pdca').open = Boolean(taskToEdit.pdcaStrategy);
    } else {
        document.getElementById('task-modal-title').innerHTML = '<i class="fa-solid fa-plus"></i> やることを追加';
        document.getElementById('task-id').value = '';
        document.getElementById('task-category').value = 'その他';
        taskUrgencySlider.value = QUADRANT_PRESETS.q1.urgency;
        taskImportanceSlider.value = QUADRANT_PRESETS.q1.importance;
        modalQuadrant = 'q1';
        document.getElementById('details-pdca').open = false;
    }
    document.getElementById('details-sliders').open = false;

    updateLivePreview();
    modalTask.classList.add('show');
    document.getElementById('task-title').focus();
}

function closeTaskModal() {
    modalTask.classList.remove('show');
}

function saveFormTask() {
    const id = document.getElementById('task-id').value;
    const title = document.getElementById('task-title').value.trim();
    if (!title) {
        showToast('やることの名前を入力してください');
        return;
    }

    const existing = id ? findTask(id) : null;
    const todayKey = getTodayKey();
    const wantToday = document.getElementById('task-today').checked;
    let today = existing ? existing.today : null;
    if (wantToday) today = todayKey;
    else if (today === todayKey) today = null;

    const fields = {
        title,
        category: document.getElementById('task-category').value,
        deadline: document.getElementById('task-deadline').value || null,
        urgency: parseInt(taskUrgencySlider.value, 10),
        importance: parseInt(taskImportanceSlider.value, 10),
        notes: document.getElementById('task-notes').value.trim(),
        inbox: modalQuadrant === '',
        today,
        pdcaStrategy: sanitizeStrategy({
            strategy: document.getElementById('pdca-strategy').value,
            obstacle: document.getElementById('pdca-obstacle').value,
            goal: document.getElementById('pdca-goal').value
        })
    };

    if (existing) {
        const index = tasks.indexOf(existing);
        tasks[index] = sanitizeTask({ ...existing, ...fields });
        showToast('保存しました');
    } else {
        tasks.unshift(sanitizeTask({ ...fields, id: newTaskId(), completed: false, createdAt: Date.now() }));
        showToast('追加しました');
    }

    saveTasks();
    closeTaskModal();
    renderAll();
}

// ==========================================================================
// Backup & Restore Modal Logic
// ==========================================================================
function openBackupModal() {
    renderBackupHistory();
    modalBackup.classList.add('show');
}

function closeBackupModal() {
    modalBackup.classList.remove('show');
}

function renderBackupHistory() {
    const listContainer = document.getElementById('backup-list');
    listContainer.innerHTML = '';

    if (!backupHistory || backupHistory.length === 0) {
        listContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px;">保存されたバックアップ履歴はまだありません。</p>`;
        return;
    }

    backupHistory.forEach((snap, idx) => {
        const item = document.createElement('div');
        item.className = 'backup-item';
        item.innerHTML = `
            <div class="backup-meta">
                <span class="backup-time"><i class="fa-regular fa-clock text-q2"></i> ${escapeHTML(snap.timestamp)}</span>
                <span class="backup-count">タスク件数: <strong>${snap.count}件</strong></span>
            </div>
            <button class="btn btn-secondary" onclick="restoreSnapshot(${idx})">
                <i class="fa-solid fa-rotate-left text-q2"></i> この時点に復元
            </button>
        `;
        listContainer.appendChild(item);
    });
}

window.restoreSnapshot = function(idx) {
    if (!backupHistory[idx] || !backupHistory[idx].data) return;
    if (confirm(`【確認】[${backupHistory[idx].timestamp}] の状態 (${backupHistory[idx].count}件) に戻しますか？`)) {
        tasks = backupHistory[idx].data.map((t, i) => sanitizeTask(t, i)).filter(Boolean);
        saveTasks();
        renderAll();
        closeBackupModal();
        showToast('バックアップから復元しました');
    }
};

// ==========================================================================
// Review Modal（任意）
// ==========================================================================
function openReviewModal(task) {
    reviewTargetTaskId = task.id;
    document.getElementById('review-task-title').textContent = task.title;

    const planBox = document.getElementById('review-plan-box');
    planBox.classList.toggle('hidden', !task.pdcaStrategy);
    if (task.pdcaStrategy) {
        document.getElementById('review-original-strategy').innerHTML = `
            <strong>🎯 作戦:</strong> ${escapeHTML(task.pdcaStrategy.strategy || '—')}<br>
            <strong>🏁 完了の目安:</strong> ${escapeHTML(task.pdcaStrategy.goal || '—')}
        `;
    }

    document.getElementById('review-result').value = task.pdcaReview?.result || '';
    document.getElementById('review-action').value = task.pdcaReview?.action || '';

    modalReview.classList.add('show');
    document.getElementById('review-result').focus();
}

function closeReviewModal() {
    modalReview.classList.remove('show');
    reviewTargetTaskId = null;
}

function saveReviewAndCompleteTask() {
    const task = findTask(reviewTargetTaskId);
    if (!task) return;

    const result = document.getElementById('review-result').value.trim();
    const action = document.getElementById('review-action').value.trim();
    task.pdcaReview = (result || action) ? { result, action } : null;
    if (!task.completed) setTaskCompleted(task, true);

    saveTasks();
    closeReviewModal();
    renderAll();
    showToast('🏆 保存しました');
}

// ==========================================================================
// Detail Modal
// ==========================================================================
function openDetailModal(task) {
    activeTaskId = task.id;
    const q = taskQuadrant(task);
    const todayKey = getTodayKey();

    const qBadge = document.getElementById('detail-quadrant-badge');
    qBadge.className = task.inbox ? 'q-badge' : `q-badge ${q}`;
    qBadge.textContent = task.inbox ? '未仕分け' : getQuadrantName(q);

    document.getElementById('detail-category-badge').textContent = task.category || 'その他';
    document.getElementById('detail-title').textContent = task.title;

    const statusBadge = document.getElementById('detail-pdca-status-badge');
    if (task.completed) {
        statusBadge.className = 'pdca-status-badge verified';
        statusBadge.innerHTML = '<i class="fa-solid fa-award"></i> 完了';
    } else if (task.today === todayKey) {
        statusBadge.className = 'pdca-status-badge';
        statusBadge.innerHTML = '<i class="fa-solid fa-sun"></i> 今日やる';
    } else {
        statusBadge.className = 'pdca-status-badge hidden';
        statusBadge.innerHTML = '';
    }

    document.getElementById('detail-urgency-bar').style.width = `${task.urgency}%`;
    document.getElementById('detail-urgency-text').textContent = `${task.urgency}%`;
    document.getElementById('detail-importance-bar').style.width = `${task.importance}%`;
    document.getElementById('detail-importance-text').textContent = `${task.importance}%`;

    const deadlineRow = document.getElementById('detail-deadline-row');
    if (task.deadline) {
        deadlineRow.style.display = 'flex';
        const dt = new Date(task.deadline);
        document.getElementById('detail-deadline-text').textContent =
            `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()} ${dt.getHours()}:${String(dt.getMinutes()).padStart(2, '0')}`;
    } else {
        deadlineRow.style.display = 'none';
    }

    const planArea = document.getElementById('pdca-plan-display-area');
    planArea.classList.toggle('hidden', !task.pdcaStrategy);
    if (task.pdcaStrategy) {
        document.getElementById('detail-pdca-strategy').textContent = task.pdcaStrategy.strategy || '—';
        document.getElementById('detail-pdca-obstacle').textContent = task.pdcaStrategy.obstacle || '—';
        document.getElementById('detail-pdca-goal').textContent = task.pdcaStrategy.goal || '—';
    }

    const reviewArea = document.getElementById('pdca-review-display-area');
    reviewArea.classList.toggle('hidden', !task.pdcaReview);
    if (task.pdcaReview) {
        document.getElementById('detail-review-result').textContent = task.pdcaReview.result || '—';
        document.getElementById('detail-review-action').textContent = task.pdcaReview.action || '—';
    }

    document.getElementById('detail-notes-text').textContent = task.notes || 'メモはありません。';

    const btnToggle = document.getElementById('btn-toggle-complete');
    if (task.completed) {
        btnToggle.className = 'btn btn-secondary';
        btnToggle.innerHTML = '<i class="fa-solid fa-rotate-left"></i> 未完了に戻す';
    } else {
        btnToggle.className = 'btn btn-success';
        btnToggle.innerHTML = '<i class="fa-solid fa-check"></i> 完了にする';
    }

    const btnToday = document.getElementById('btn-toggle-today');
    btnToday.classList.toggle('hidden', task.completed);
    btnToday.innerHTML = task.today === todayKey
        ? '<i class="fa-solid fa-sun"></i> 今日から外す'
        : '<i class="fa-regular fa-sun"></i> 今日やる';

    document.getElementById('btn-write-review').innerHTML = task.pdcaReview
        ? '<i class="fa-solid fa-pen-nib"></i> ふりかえり編集'
        : '<i class="fa-solid fa-pen-nib"></i> ふりかえり';

    modalDetail.classList.add('show');
}

function closeDetailModal() {
    modalDetail.classList.remove('show');
    activeTaskId = null;
}

// ==========================================================================
// JSON Import & Export
// ==========================================================================
function exportJSON() {
    saveTasks();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(buildFilePayload(), null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `eisenhower_pdca_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('💾 JSONファイルとして保存しました');
}

function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const payload = parseDataPayload(JSON.parse(event.target.result));
            if (payload) {
                saveTasks(true); // 読込前の状態をスナップショット
                applyDataPayload(payload);
                saveTasks();
                renderAll();
                showToast(`🎉 ${tasks.length}件のタスクを読み込みました`);
            } else {
                alert('無効なファイル形式です。');
            }
        } catch (err) {
            alert('JSONの読み込みエラー: ' + err.message);
        }
        e.target.value = '';
    };
    reader.readAsText(file);
}

// ==========================================================================
// File System Access API: Persistent Direct Local File Sync & Auto-Reconnect
// ==========================================================================
let isSyncingFile = false;

function setupDirectFileSyncListeners() {
    const syncBadge = document.getElementById('file-sync-status');

    document.getElementById('btn-link-local-file').addEventListener('click', linkLocalFileDirectly);
    document.getElementById('btn-direct-save-file').addEventListener('click', () => saveToDirectLocalFile(false));
    document.getElementById('btn-menu-link-local').addEventListener('click', linkLocalFileDirectly);
    document.getElementById('btn-menu-direct-save').addEventListener('click', () => saveToDirectLocalFile(false));
    document.getElementById('btn-backup-link-local').addEventListener('click', linkLocalFileDirectly);

    // バッジのクリックで、再起動後のファイル権限を再取得
    syncBadge.style.cursor = 'pointer';
    syncBadge.title = 'クリックしてファイルの接続を再開・更新する';
    syncBadge.addEventListener('click', async () => {
        if (activeFileHandle) await verifyOrRequestPermission(activeFileHandle, true);
        else await linkLocalFileDirectly();
    });
}

async function saveFileHandleToIDB(handle) {
    if (!handle) return;
    try {
        await setIDBData('HandlesStore', 'main_task_file', handle);
    } catch (e) {
        console.warn('Could not persist FileHandle to IndexedDB:', e);
    }
}

async function getFileHandleFromIDB() {
    try {
        return await getIDBData('HandlesStore', 'main_task_file');
    } catch (e) {
        return null;
    }
}

async function readPayloadFromHandle(handle) {
    const file = await handle.getFile();
    const text = await file.text();
    if (!text || !text.trim()) return { file, payload: null };
    return { file, payload: parseDataPayload(JSON.parse(text)) };
}

// 起動時の自動再接続
async function initAndRestoreDirectFileSync() {
    if (!('showOpenFilePicker' in window)) return;
    try {
        const savedHandle = await getFileHandleFromIDB();
        if (!savedHandle) return;

        activeFileHandle = savedHandle;
        const permission = await activeFileHandle.queryPermission({ mode: 'readwrite' });
        if (permission === 'granted') {
            const { file, payload } = await readPayloadFromHandle(activeFileHandle);
            if (payload) {
                applyDataPayload(payload);
                saveTasks(true, true);
                renderAll();
                showToast(`⚡ 「${file.name}」と同期しました`);
            }
        } else {
            showToast(`⚡ 前回のファイル「${activeFileHandle.name}」があります。上部のバッジをクリックで再接続`);
        }
        updateFileSyncUI();
    } catch (e) {
        console.warn('Auto-reconnect failed or permission expired:', e);
    }
}

async function verifyOrRequestPermission(handle, forcePrompt = false) {
    if (!handle) return false;
    try {
        const opts = { mode: 'readwrite' };
        if (!forcePrompt && (await handle.queryPermission(opts)) === 'granted') {
            return true;
        }
        if ((await handle.requestPermission(opts)) === 'granted') {
            updateFileSyncUI();
            try {
                const { payload } = await readPayloadFromHandle(handle);
                if (payload && payload.tasks.length >= tasks.length) {
                    applyDataPayload(payload);
                    renderAll();
                }
                saveToDirectLocalFile(true);
            } catch (err) {}
            showToast(`⚡ 「${handle.name}」との連携を再開しました`);
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

function updateFileSyncUI() {
    const badge = document.getElementById('file-sync-status');
    const badgeText = document.getElementById('file-sync-text');
    const saveBtn = document.getElementById('btn-direct-save-file');

    if (activeFileHandle) {
        badge.classList.add('active');
        activeFileHandle.queryPermission({ mode: 'readwrite' }).then(perm => {
            if (perm === 'granted') {
                badgeText.innerHTML = `<i class="fa-solid fa-bolt"></i> 接続中: <strong>${escapeHTML(activeFileHandle.name)}</strong> (自動保存中)`;
            } else {
                badgeText.innerHTML = `<i class="fa-solid fa-plug-circle-exclamation"></i> 前回のファイル: <strong>${escapeHTML(activeFileHandle.name)}</strong> (クリックして接続)`;
            }
        }).catch(() => {
            badgeText.innerHTML = `<i class="fa-solid fa-folder-open"></i> 同期候補: <strong>${escapeHTML(activeFileHandle.name)}</strong>`;
        });
        saveBtn.classList.remove('hidden');
    } else {
        badge.classList.remove('active');
        badgeText.textContent = 'PCファイル未連携 (ブラウザ内保護中)';
        saveBtn.classList.add('hidden');
    }
}

async function linkLocalFileDirectly() {
    if (!('showOpenFilePicker' in window)) {
        showToast('このブラウザはファイル直接同期に対応していません。JSON保存をご利用ください。');
        return;
    }
    try {
        const [handle] = await window.showOpenFilePicker({
            types: [{
                description: 'Matrix Task Hub JSON File (tasks_data.json)',
                accept: { 'application/json': ['.json'] }
            }],
            multiple: false
        });
        activeFileHandle = handle;
        await saveFileHandleToIDB(handle);

        try {
            const { file, payload } = await readPayloadFromHandle(handle);
            if (payload) {
                applyDataPayload(payload);
                saveTasks(false, true);
                renderAll();
                showToast(`⚡ 「${file.name}」と接続しました。次回からも自動で再接続します`);
            } else {
                showToast(`⚡ 「${file.name}」と接続しました。変更は自動で書き込まれます`);
                saveToDirectLocalFile(true);
            }
        } catch (err) {
            showToast(`⚡ 「${handle.name}」と接続しました（現在のタスクで上書き保存できます）`);
        }
        updateFileSyncUI();
        modalBackup.classList.remove('show');
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.error('File link error:', e);
            showToast('ファイルの連携に失敗しました。');
        }
    }
}

async function saveToDirectLocalFile(silent = false) {
    if (!('showSaveFilePicker' in window)) {
        if (!silent) exportJSON();
        return;
    }
    if (isSyncingFile) return;
    try {
        isSyncingFile = true;
        if (!activeFileHandle) {
            if (silent) return;
            activeFileHandle = await window.showSaveFilePicker({
                suggestedName: 'tasks_data.json',
                types: [{
                    description: 'Matrix Task Hub JSON File',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            await saveFileHandleToIDB(activeFileHandle);
        } else {
            const ok = await verifyOrRequestPermission(activeFileHandle, !silent);
            if (!ok) return;
        }
        const writable = await activeFileHandle.createWritable();
        await writable.write(JSON.stringify(buildFilePayload(), null, 2));
        await writable.close();
        updateFileSyncUI();
        if (!silent) showToast(`💾 「${activeFileHandle.name}」へ保存しました`);
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.error('File write error:', e);
            if (!silent) showToast('直接保存に失敗しました。ファイルが他で開かれていないか確認してください。');
        }
    } finally {
        isSyncingFile = false;
    }
}

// ==========================================================================
// Utility Helpers
// ==========================================================================
let toastTimer = null;
function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = msg;
    toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('hidden'), 3400);
}

function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}
