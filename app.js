/* ==========================================================================
   Eisenhower Matrix Task Hub | Absolute Data Safety & Forced PDCA Engine
   ========================================================================== */

// Multi-Tier Storage Keys for Absolute Data Protection
const STORAGE_KEY = 'eisenhower_matrix_tasks_v1';
const BACKUP_KEY = 'eisenhower_matrix_tasks_backup_latest';
const HISTORY_KEY = 'eisenhower_matrix_backups_list';

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
            action: '【次回改善Action】今回判明したDBタイムアウトの検知アラートしきい値を調整し、自動でSlack通知と自動復旧スクリプトが動く仕組みを作った！'
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
        pdcaStrategy: {
            strategy: '夜にやろうとすると疲れてサボるので、毎朝出社前の『カフェでの30分×2セット』にスケジュールを先入れ固定する！',
            obstacle: 'スマホを触って動画を見てしまう誘惑 ➡ カフェに入ったらスマホを鞄の底にしまい、ノートPCだけでドキュメントを開く。',
            goal: 'データ分析の公式チュートリアル第3章のハンズオンコードをすべて動かしてGithubにコミットする。'
        },
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
        notes: 'これをやっておくと来月以降の「第I領域（火消し作業）」が半減する！ぜひ優先して時間を確保。',
        completed: false,
        pdcaStrategy: {
            strategy: '完璧なGUIアプリを作ろうとせず、まずは自分が毎日使う「ExcelからCSVに自動変換する5行のPythonコード」から作る。',
            obstacle: '他の緊急作業に押し流されて時間が消える ➡ 毎週金曜の午前10時～11時を「第II領域・改善専用タイム」としてカレンダーブロックする。',
            goal: '毎月の月次レポート集計時間を2時間から15分に短縮するツールが稼働すること。'
        },
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
        notes: '急かされているが、実は自分の成果には直結しない。事前にアジェンダを確認し、場合によっては権限移譲か欠席を相談する。',
        completed: false,
        pdcaStrategy: {
            strategy: '会議にただ出席するのではなく、主催者に事前に『今回の決定事項のゴールと、私の出席が必要な議題はどこか？』をチャットで確認する。',
            obstacle: 'なんとなく1時間拘束される ➡ 必要であれば最初の15分だけ参加して『別件の緊急対応がある』と断って退席する。',
            goal: '自分の業務時間を無駄にせず、かつ相手にも必要なフィードバックをテキストで事前に提出した状態。'
        },
        pdcaReview: null,
        createdAt: Date.now() - 3600000 * 8
    }
];

function getRelativeDate(daysOffset, hours) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hours, 0, 0, 0);
    return d.toISOString().slice(0, 16);
}

// App State
let tasks = [];
let backupHistory = [];
let activeFileHandle = null; // ローカルファイルとの直接接続ハンドル (File System Access API)
let currentView = 'matrix';
let activeTaskId = null;
let reviewTargetTaskId = null;
let isDragging = false;
let draggedTask = null;

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

const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const btnCloseReview = document.getElementById('btn-close-review');
const btnCancelReview = document.getElementById('btn-cancel-review');
const btnCloseDetail = document.getElementById('btn-close-detail');

const searchInput = document.getElementById('search-input');
const filterCategory = document.getElementById('filter-category');
const toggleCompleted = document.getElementById('toggle-completed');

// Sliders and Live Preview
const taskUrgencySlider = document.getElementById('task-urgency');
const taskImportanceSlider = document.getElementById('task-importance');
const urgencyValDisplay = document.getElementById('urgency-val-display');
const importanceValDisplay = document.getElementById('importance-val-display');
const liveQuadrantBadge = document.getElementById('live-quadrant-badge');

// Wizard Elements
const wizardStep1 = document.getElementById('wizard-step-1');
const wizardStep2 = document.getElementById('wizard-step-2');
const tabStep1 = document.getElementById('tab-step-1');
const tabStep2 = document.getElementById('tab-step-2');
const btnGoStep2 = document.getElementById('btn-go-step-2');
const btnBackStep1 = document.getElementById('btn-back-step-1');

// ==========================================================================
// Initialization & Absolute Data Safety Loading (IndexedDB + LocalStorage)
// ==========================================================================
window.addEventListener('DOMContentLoaded', async () => {
    await loadTasksWithSafetyFallback();
    setupDirectFileSyncListeners();
    updateFileSyncUI();
    setupEventListeners();
    renderAll();
    
    // ブラウザを閉じて再起動した後も前回の接続ファイルへ自動再接続する最強エンジン起動！
    await initAndRestoreDirectFileSync();
});

// タスクデータの完全正規化・サニタイズ関数（どんな誤ったデータ・破損データでもバグゼロへ最適化）
function sanitizeTask(t, idx = 0) {
    if (!t || typeof t !== 'object') return null;
    return {
        id: t.id || `task-recovered-${Date.now()}-${idx}`,
        title: String(t.title || '無題のタスク').slice(0, 150),
        category: t.category || '未指定',
        urgency: Math.max(0, Math.min(100, Number.isFinite(Number(t.urgency)) ? Number(t.urgency) : 50)),
        importance: Math.max(0, Math.min(100, Number.isFinite(Number(t.importance)) ? Number(t.importance) : 50)),
        deadline: t.deadline || null,
        notes: String(t.notes || ''),
        completed: Boolean(t.completed),
        pdcaStrategy: (t.pdcaStrategy && typeof t.pdcaStrategy === 'object') ? {
            strategy: String(t.pdcaStrategy.strategy || '設定なし'),
            obstacle: String(t.pdcaStrategy.obstacle || '設定なし'),
            goal: String(t.pdcaStrategy.goal || '設定なし')
        } : { strategy: '設定なし', obstacle: '設定なし', goal: '設定なし' },
        pdcaReview: (t.pdcaReview && typeof t.pdcaReview === 'object') ? {
            result: String(t.pdcaReview.result || ''),
            action: String(t.pdcaReview.action || '')
        } : null,
        createdAt: Number.isFinite(Number(t.createdAt)) ? Number(t.createdAt) : Date.now()
    };
}

async function loadTasksWithSafetyFallback() {
    let loaded = null;

    // 1. Try IndexedDB Backup Store first (Most reliable & unlimited size)
    try {
        const idbData = await getIDBData('TasksStore', 'latest_tasks_snapshot');
        if (idbData && Array.isArray(idbData) && idbData.length > 0) {
            loaded = idbData;
            console.info('Restored tasks from IndexedDB.');
        }
    } catch (e) { console.warn('IndexedDB load check error:', e); }

    // 2. Try Main LocalStorage
    if (!loaded || !Array.isArray(loaded) || loaded.length === 0) {
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
            let candBackup = savedBackup ? JSON.parse(savedBackup) : null;
            let candSession = savedSession ? JSON.parse(savedSession) : null;

            if (candBackup && Array.isArray(candBackup) && candBackup.length > 0) {
                loaded = candBackup;
                console.info('Restored from LocalBackup!');
            } else if (candSession && Array.isArray(candSession) && candSession.length > 0) {
                loaded = candSession;
                console.info('Restored from SessionStorage!');
            }
        } catch (e) { console.warn('Backup load error:', e); }
    }

    // 4. Load Backup History List
    try {
        const hist = localStorage.getItem(HISTORY_KEY);
        if (hist) backupHistory = JSON.parse(hist);
        if (!Array.isArray(backupHistory)) backupHistory = [];
    } catch (e) { backupHistory = []; }

    // 5. Sanitize & Final Fallback to Sample if totally empty
    if (loaded && Array.isArray(loaded)) {
        tasks = loaded.map((t, idx) => sanitizeTask(t, idx)).filter(Boolean);
    } else {
        tasks = SAMPLE_TASKS.map((t, idx) => sanitizeTask(t, idx)).filter(Boolean);
        saveTasks(true, true); // Save initial sample
    }

    updateSaveIndicator();
}

function saveTasks(silent = false, skipDirectFile = false) {
    const dataStr = JSON.stringify(tasks);

    // 1. Main LocalStorage
    try { localStorage.setItem(STORAGE_KEY, dataStr); } catch (e) { console.error('LocalStorage error:', e); }

    // 2. Latest Backup LocalStorage
    try { localStorage.setItem(BACKUP_KEY, dataStr); } catch (e) {}

    // 3. SessionStorage
    try { sessionStorage.setItem(STORAGE_KEY, dataStr); } catch (e) {}

    // 4. Record to Snapshot History (Keep max 10 recent snapshots if changed)
    try {
        const nowStr = new Date().toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (backupHistory.length === 0 || JSON.stringify(backupHistory[0].data) !== dataStr) {
            backupHistory.unshift({ timestamp: nowStr, count: tasks.length, data: JSON.parse(dataStr) });
            if (backupHistory.length > 10) backupHistory.pop();
            localStorage.setItem(HISTORY_KEY, JSON.stringify(backupHistory));
        }
    } catch (e) {}

    // 5. IndexedDB Persistent Store (無限容量＆絶対安全・ページを閉じても消滅しないストレージ)
    try {
        setIDBData('TasksStore', 'latest_tasks_snapshot', tasks);
    } catch (e) {}

    // 6. Direct Local File Sync (if linked)
    if (!skipDirectFile && activeFileHandle) {
        saveToDirectLocalFile(true);
    }

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
// Quadrant Helper
// ==========================================================================
function getQuadrant(urgency, importance) {
    if (urgency >= 50 && importance >= 50) return 'q1';
    if (urgency < 50 && importance >= 50) return 'q2';
    if (urgency >= 50 && importance < 50) return 'q3';
    return 'q4';
}

function getQuadrantName(q) {
    switch (q) {
        case 'q1': return '第I領域 (必須・危機)';
        case 'q2': return '第II領域 (価値・投資)';
        case 'q3': return '第III領域 (見せかけ・錯覚)';
        case 'q4': return '第IV領域 (無駄・過剰)';
        default: return '';
    }
}

// ==========================================================================
// Event Listeners
// ==========================================================================
function setupEventListeners() {
    // Navigation Tabs
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            navTabs.forEach(t => t.classList.remove('active'));
            viewPanels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const targetView = tab.dataset.view;
            document.getElementById(`view-${targetView}`).classList.add('active');
            currentView = targetView;

            renderAll();
        });
    });

    // Add Task Button
    btnAddTask.addEventListener('click', () => openTaskModal());

    // Modals Close
    btnCloseModal.addEventListener('click', closeTaskModal);
    btnCancelModal.addEventListener('click', closeTaskModal);
    btnCloseReview.addEventListener('click', closeReviewModal);
    btnCancelReview.addEventListener('click', closeReviewModal);
    btnCloseDetail.addEventListener('click', closeDetailModal);

    modalTask.addEventListener('click', (e) => { if (e.target === modalTask) closeTaskModal(); });
    modalReview.addEventListener('click', (e) => { if (e.target === modalReview) closeReviewModal(); });
    modalDetail.addEventListener('click', (e) => { if (e.target === modalDetail) closeDetailModal(); });

    // Backup Modal
    const btnOpenBackup = document.getElementById('btn-open-backup');
    const btnCloseBackup = document.getElementById('btn-close-backup');
    const btnCloseBackupBottom = document.getElementById('btn-close-backup-bottom');
    if (btnOpenBackup) btnOpenBackup.addEventListener('click', openBackupModal);
    if (btnCloseBackup) btnCloseBackup.addEventListener('click', closeBackupModal);
    if (btnCloseBackupBottom) btnCloseBackupBottom.addEventListener('click', closeBackupModal);
    if (modalBackup) modalBackup.addEventListener('click', (e) => { if (e.target === modalBackup) closeBackupModal(); });

    document.getElementById('btn-backup-now').addEventListener('click', () => {
        saveTasks();
        renderBackupHistory();
        showToast('🛡️ 今時点の安全バックアップスナップショットを作成しました！');
    });
    document.getElementById('btn-export-backup-json').addEventListener('click', exportJSON);

    // Sliders live preview inside Modal
    taskUrgencySlider.addEventListener('input', updateLivePreview);
    taskImportanceSlider.addEventListener('input', updateLivePreview);

    // Wizard Navigation
    btnGoStep2.addEventListener('click', () => {
        const titleInput = document.getElementById('task-title');
        if (!titleInput.value.trim()) {
            titleInput.focus();
            showToast('まずはタスク名を入力してください！');
            return;
        }
        showWizardStep(2);
    });
    btnBackStep1.addEventListener('click', () => showWizardStep(1));
    tabStep1.addEventListener('click', () => showWizardStep(1));
    tabStep2.addEventListener('click', () => {
        if (document.getElementById('task-title').value.trim()) showWizardStep(2);
        else showToast('まずはタスク名を入力してください！');
    });

    // Form Submit (Forced PDCA Strategy Save)
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveFormTask();
    });

    // Review Form Submit (Forced Check & Action Save)
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
        if (confirm('現在のタスクにサンプルデータを追加・更新しますか？')) {
            tasks = [...SAMPLE_TASKS];
            saveTasks();
            renderAll();
            showToast('サンプルデータを投入しました！');
        }
    });

    document.getElementById('btn-clear-all').addEventListener('click', () => {
        if (confirm('本当にすべてのタスクをクリアしますか？（バックアップセンターから復元可能です）')) {
            saveTasks(); // 削除前にスナップショット自動記録！
            tasks = [];
            saveTasks();
            renderAll();
            showToast('タスクをクリアしました（バックアップからいつでも復元可能）');
        }
    });

    document.getElementById('input-import-json').addEventListener('change', importJSON);

    // Detail modal actions
    document.getElementById('btn-toggle-complete').addEventListener('click', () => {
        if (activeTaskId) {
            const task = tasks.find(t => t.id === activeTaskId);
            if (task) {
                closeDetailModal();
                if (task.completed) {
                    task.completed = false;
                    saveTasks();
                    renderAll();
                    showToast('タスクを未完了に戻しました');
                } else {
                    openReviewModal(task);
                }
            }
        }
    });

    document.getElementById('btn-edit-from-detail').addEventListener('click', () => {
        const id = activeTaskId;
        closeDetailModal();
        const task = tasks.find(t => t.id === id);
        if (task) openTaskModal(task);
    });

    document.getElementById('btn-delete-task').addEventListener('click', () => {
        if (activeTaskId && confirm('このタスクを削除してもよろしいですか？')) {
            tasks = tasks.filter(t => t.id !== activeTaskId);
            saveTasks();
            renderAll();
            closeDetailModal();
            showToast('タスクを削除しました');
        }
    });

    window.addEventListener('resize', () => {
        if (currentView === 'matrix') renderMatrixGraph();
    });

    // Before unload safety check
    window.addEventListener('beforeunload', () => {
        saveTasks(true);
    });
}

function showWizardStep(stepNum) {
    if (stepNum === 1) {
        wizardStep1.classList.add('active');
        wizardStep2.classList.remove('active');
        tabStep1.classList.add('active');
        tabStep2.classList.remove('active');
    } else {
        wizardStep1.classList.remove('active');
        wizardStep2.classList.add('active');
        tabStep1.classList.remove('active');
        tabStep2.classList.add('active');
        const stratEl = document.getElementById('pdca-strategy');
        if (stratEl) stratEl.focus();
    }
}

function updateLivePreview() {
    const u = parseInt(taskUrgencySlider.value, 10);
    const i = parseInt(taskImportanceSlider.value, 10);
    urgencyValDisplay.textContent = `${u}%`;
    importanceValDisplay.textContent = `${i}%`;

    const q = getQuadrant(u, i);
    liveQuadrantBadge.className = `quadrant-live-badge ${q}`;
    liveQuadrantBadge.textContent = getQuadrantName(q);
}

// ==========================================================================
// Filtering Tasks
// ==========================================================================
function getFilteredTasks() {
    const query = searchInput.value.trim().toLowerCase();
    const cat = filterCategory.value;
    const showCompleted = toggleCompleted.checked;

    return tasks.filter(task => {
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
    if (currentView === 'matrix') renderMatrixGraph();
    if (currentView === 'board') renderBoard();
    if (currentView === 'analytics') renderAnalytics();
}

function updateHeaderStats() {
    let q1 = 0, q2 = 0, q3 = 0, q4 = 0;
    tasks.forEach(task => {
        if (!task.completed) {
            const q = getQuadrant(task.urgency, task.importance);
            if (q === 'q1') q1++;
            if (q === 'q2') q2++;
            if (q === 'q3') q3++;
            if (q === 'q4') q4++;
        }
    });
    document.getElementById('stat-q1').textContent = q1;
    document.getElementById('stat-q2').textContent = q2;
    document.getElementById('stat-q3').textContent = q3;
    document.getElementById('stat-q4').textContent = q4;
}

// ==========================================================================
// VIEW 1: Matrix Graph Rendering & Drag/Drop with Safe Area Padding
// ==========================================================================
function renderMatrixGraph() {
    matrixTasksLayer.innerHTML = '';
    const filtered = getFilteredTasks();

    const rect = matrixCanvasArea.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // 0%や100%でもカード全貌が枠線やタイトルで隠れないためのワイド・セーフマージン（ハーフスクリーンや狭い画面でも被りゼロ）
    const safePaddingX = Math.max(95, Math.min(135, Math.round(width * 0.18)));
    const safePaddingY = Math.max(36, Math.min(48, Math.round(height * 0.08)));
    const usableWidth = Math.max(100, width - safePaddingX * 2);
    const usableHeight = Math.max(100, height - safePaddingY * 2);

    // タスクカードの幅と高さ（衝突判定用矩形ボックス）
    const cardWidth = Math.min(185, Math.max(140, Math.round(width * 0.16)));
    const cardHeight = 40;
    const placedBoxes = [];

    filtered.forEach((task, index) => {
        const q = getQuadrant(task.urgency, task.importance);
        const point = document.createElement('div');
        point.className = `task-point ${q} ${task.completed ? 'completed' : ''}`;
        point.dataset.id = task.id;

        // 0%〜100%を安全領域内に正確にマッピング
        let xPos = safePaddingX + (task.urgency / 100) * usableWidth;
        let yPos = safePaddingY + ((100 - task.importance) / 100) * usableHeight;

        // 【かぶりゼロ処理1】象限タイトルバッジ（各領域の上部ラベル）との重なりを自動回避！
        const isUpperHalf = task.importance >= 50;
        if (isUpperHalf && yPos < safePaddingY + 54) {
            yPos = safePaddingY + 54; // 上半分の象限タイトルすぐ下の安全領域へスライド
        }
        if (!isUpperHalf && yPos < safePaddingY + usableHeight * 0.5 + 54 && yPos > safePaddingY + usableHeight * 0.5 - 15) {
            yPos = safePaddingY + usableHeight * 0.5 + 54; // 下半分の象限タイトルすぐ下の安全領域へスライド
        }

        // 【かぶりゼロ処理2】既に配置された全てのタスクカードとの重なりを検知し、スパイラル状にスマート分散！
        let collision = true;
        let attempts = 0;
        const maxAttempts = 80;
        let angle = 0;
        let radius = 0;
        let testX = xPos;
        let testY = yPos;

        while (collision && attempts < maxAttempts) {
            collision = false;
            for (let i = 0; i < placedBoxes.length; i++) {
                const box = placedBoxes[i];
                // カード同士の中心座標距離が重なっているかどうかを正確に判定
                if (Math.abs(testX - box.x) < cardWidth * 0.92 && Math.abs(testY - box.y) < cardHeight * 0.95) {
                    collision = true;
                    break;
                }
            }

            if (collision) {
                attempts++;
                // 渦巻き（スパイラル）状に上下左右斜めへ最適な隙間を探し出し、綺麗に分散配置！
                radius += 6;
                angle += Math.PI / 3.5;
                testX = xPos + Math.cos(angle) * radius;
                testY = yPos + Math.sin(angle) * radius;

                // 領域外や枠線にはみ出さないよう確実な境界内にクランプ
                testX = Math.max(safePaddingX, Math.min(safePaddingX + usableWidth, testX));
                testY = Math.max(safePaddingY + 12, Math.min(safePaddingY + usableHeight - 12, testY));
            }
        }

        xPos = testX;
        yPos = testY;
        placedBoxes.push({ x: xPos, y: yPos });

        point.style.left = `${xPos}px`;
        point.style.top = `${yPos}px`;

        const iconIcon = task.completed && task.pdcaReview 
            ? `<i class="fa-solid fa-award pdca-gold-icon" title="PDCA完結検証済み"></i>` 
            : `<i class="fa-solid fa-brain pdca-mini-icon" title="PDCA戦略仮説設定済み"></i>`;

        point.innerHTML = `
            <div class="task-point-card">
                <div class="point-dot"></div>
                <span class="point-title" title="${escapeHTML(task.title)}">${escapeHTML(task.title)}</span>
                ${iconIcon}
            </div>
        `;

        // 【かぶりゼロ処理3】ホバー＆クリック時に絶対に他のどんなカードやタイトルよりも最前面(z-index:999999)へ昇格させる！
        point.addEventListener('mouseenter', () => { point.style.zIndex = '999999'; });
        point.addEventListener('mouseleave', () => { if (!point.classList.contains('dragging')) point.style.zIndex = '15'; });

        let startX = 0, startY = 0;
        let isDraggingThis = false;
        let hasMoved = false;

        const onMouseDown = (e) => {
            if (e.button !== 0) return;
            isDraggingThis = true;
            hasMoved = false;
            draggedTask = task;
            startX = e.clientX;
            startY = e.clientY;
            point.style.transition = 'none';
            point.style.zIndex = '999999';
            point.classList.add('dragging');

            const onMouseMove = (moveEvent) => {
                if (!isDraggingThis) return;
                const dx = Math.abs(moveEvent.clientX - startX);
                const dy = Math.abs(moveEvent.clientY - startY);
                if (dx > 4 || dy > 4) hasMoved = true;

                if (hasMoved) {
                    const canvasRect = matrixCanvasArea.getBoundingClientRect();
                    const dragSafePaddingX = Math.max(95, Math.min(135, Math.round(canvasRect.width * 0.18)));
                    const dragSafePaddingY = Math.max(36, Math.min(48, Math.round(canvasRect.height * 0.08)));
                    const dragUsableWidth = Math.max(100, canvasRect.width - dragSafePaddingX * 2);
                    const dragUsableHeight = Math.max(100, canvasRect.height - dragSafePaddingY * 2);

                    let newLeft = moveEvent.clientX - canvasRect.left;
                    let newTop = moveEvent.clientY - canvasRect.top;

                    newLeft = Math.max(dragSafePaddingX, Math.min(canvasRect.width - dragSafePaddingX, newLeft));
                    newTop = Math.max(dragSafePaddingY, Math.min(canvasRect.height - dragSafePaddingY, newTop));

                    point.style.left = `${newLeft}px`;
                    point.style.top = `${newTop}px`;

                    const newUrgency = Math.round(((newLeft - dragSafePaddingX) / dragUsableWidth) * 100);
                    const newImportance = Math.round(((dragUsableHeight - (newTop - dragSafePaddingY)) / dragUsableHeight) * 100);
                    
                    task.urgency = Math.max(0, Math.min(100, newUrgency));
                    task.importance = Math.max(0, Math.min(100, newImportance));

                    const newQ = getQuadrant(task.urgency, task.importance);
                    point.className = `task-point ${newQ} dragging ${task.completed ? 'completed' : ''}`;
                }
            };

            const onMouseUp = () => {
                isDraggingThis = false;
                point.classList.remove('dragging');
                point.style.zIndex = '15';
                point.style.transition = '';
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);

                if (hasMoved) {
                    saveTasks();
                    updateHeaderStats();
                    renderMatrixGraph(); // 座標移動後も全カード同士が絶対に重ならないように即座に自動スマート分散整列！
                    showToast(`「${task.title.slice(0, 12)}...」の座標を保存しました (緊急度:${task.urgency}%, 重要度:${task.importance}%)`);
                    if (activeFileHandle) verifyOrRequestPermission(activeFileHandle, false);
                } else {
                    openDetailModal(task);
                }
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        };

        point.addEventListener('mousedown', onMouseDown);
        matrixTasksLayer.appendChild(point);
    });
}

// ==========================================================================
// VIEW 2: Kanban Board Rendering
// ==========================================================================
function renderBoard() {
    const filtered = getFilteredTasks();
    const lists = {
        q1: document.getElementById('board-q1-list'),
        q2: document.getElementById('board-q2-list'),
        q3: document.getElementById('board-q3-list'),
        q4: document.getElementById('board-q4-list')
    };
    const counts = { q1: 0, q2: 0, q3: 0, q4: 0 };

    Object.values(lists).forEach(list => list.innerHTML = '');

    filtered.forEach(task => {
        const q = getQuadrant(task.urgency, task.importance);
        counts[q]++;

        const card = document.createElement('div');
        card.className = `task-card ${q} ${task.completed ? 'completed' : ''}`;
        
        let deadlineMarkup = '';
        if (task.deadline) {
            const dt = new Date(task.deadline);
            const isOver = !task.completed && dt < new Date();
            const dtStr = `${dt.getMonth()+1}/${dt.getDate()} ${dt.getHours()}:${String(dt.getMinutes()).padStart(2,'0')}`;
            deadlineMarkup = `
                <span class="deadline-badge ${isOver ? 'overdue' : ''}">
                    <i class="fa-regular fa-clock"></i> ${dtStr} ${isOver ? '(超過)' : ''}
                </span>
            `;
        }

        const pdcaBadge = task.completed && task.pdcaReview
            ? `<div class="task-card-pdca-status verified"><i class="fa-solid fa-award"></i> PDCA完結検証済み</div>`
            : `<div class="task-card-pdca-status"><i class="fa-solid fa-brain"></i> 戦略設定済み (Plan)</div>`;

        card.innerHTML = `
            <div class="task-card-header">
                <span class="task-card-title">${escapeHTML(task.title)}</span>
                <div class="task-card-actions">
                    <button class="btn-card-icon check" title="完了確認・振り返り" onclick="toggleTaskComplete(event, '${task.id}')">
                        <i class="fa-${task.completed ? 'solid' : 'regular'} fa-circle-check"></i>
                    </button>
                    <button class="btn-card-icon" title="詳細・編集" onclick="openDetailById(event, '${task.id}')">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            </div>
            ${pdcaBadge}
            <div class="task-card-meta">
                <span class="cat-badge">${escapeHTML(task.category)}</span>
                ${deadlineMarkup}
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-card-icon')) {
                openDetailModal(task);
            }
        });

        lists[q].appendChild(card);
    });

    document.getElementById('count-board-q1').textContent = counts.q1;
    document.getElementById('count-board-q2').textContent = counts.q2;
    document.getElementById('count-board-q3').textContent = counts.q3;
    document.getElementById('count-board-q4').textContent = counts.q4;
}

window.toggleTaskComplete = function(event, id) {
    event.stopPropagation();
    const task = tasks.find(t => t.id === id);
    if (task) {
        if (task.completed) {
            task.completed = false;
            saveTasks();
            renderAll();
            showToast('タスクを未完了に戻しました');
        } else {
            openReviewModal(task);
        }
    }
};

window.openDetailById = function(event, id) {
    event.stopPropagation();
    const task = tasks.find(t => t.id === id);
    if (task) openDetailModal(task);
};

// ==========================================================================
// VIEW 3: Analytics & Smart Coaching Advice
// ==========================================================================
function renderAnalytics() {
    const activeTasks = tasks.filter(t => !t.completed);
    const total = activeTasks.length;

    let counts = { q1: 0, q2: 0, q3: 0, q4: 0 };
    activeTasks.forEach(task => {
        const q = getQuadrant(task.urgency, task.importance);
        counts[q]++;
    });

    const getPerc = (c) => total === 0 ? 0 : Math.round((c / total) * 100);
    const p1 = getPerc(counts.q1);
    const p2 = getPerc(counts.q2);
    const p3 = getPerc(counts.q3);
    const p4 = getPerc(counts.q4);

    document.getElementById('bar-percentage-q1').textContent = `${p1}% (${counts.q1}件)`;
    document.getElementById('bar-fill-q1').style.width = `${p1}%`;

    document.getElementById('bar-percentage-q2').textContent = `${p2}% (${counts.q2}件)`;
    document.getElementById('bar-fill-q2').style.width = `${p2}%`;

    document.getElementById('bar-percentage-q3').textContent = `${p3}% (${counts.q3}件)`;
    document.getElementById('bar-fill-q3').style.width = `${p3}%`;

    document.getElementById('bar-percentage-q4').textContent = `${p4}% (${counts.q4}件)`;
    document.getElementById('bar-fill-q4').style.width = `${p4}%`;

    const container = document.getElementById('coaching-message-container');
    container.innerHTML = '';

    if (total === 0) {
        container.innerHTML = `
            <div class="coach-bubble">
                現在アクティブなタスクがありません！右上の「新規タスク追加」から、成功戦略仮説（Plan）を立てて新しいタスクを登録しましょう。
            </div>
        `;
        return;
    }

    if (p1 >= 40) {
        container.innerHTML += `
            <div class="coach-bubble warning">
                <strong>🔥 警告：【第I領域：必須・火消し】が過多（${p1}%）になっています！</strong><br>
                締め切りやトラブルに追われやすい状態です。各タスクの『PDCA障害予測と対策』を見直し、手戻りを極限まで減らして一気に攻略しましょう！
            </div>
        `;
    }

    if (p2 >= 40) {
        container.innerHTML += `
            <div class="coach-bubble">
                <strong>✨ 素晴らしい状態：【第II領域：価値・投資】に時間を配分できています（${p2}%）！</strong><br>
                事前の『成功戦略仮説』に基づき、集中時間を確保して着実に実行していきましょう。これらが完了した時の『Check＆Action（振り返り）』が一番の財産になります。
            </div>
        `;
    } else if (counts.q2 === 0) {
        container.innerHTML += `
            <div class="coach-bubble warning">
                <strong>💎 提案：【第II領域：価値・投資】のタスクを少なくとも1つ登録しましょう！</strong><br>
                自分のスキルアップや業務自動化など、「すぐやらなくても怒られないが、後から10倍の価値を生むタスク」の戦略を立てて登録してみてください。
            </div>
        `;
    }

    if (p3 + p4 >= 40) {
        container.innerHTML += `
            <div class="coach-bubble info">
                <strong>⚠️ 注意：見せかけや無駄な時間（第III・第IV領域）が全体の${p3 + p4}%を占めています</strong><br>
                登録時の成功戦略ステップ（Plan）で「どうやったらこのタスクを人に任せられるか？または断れるか？」を仮説として設定してみることをお勧めします。
            </div>
        `;
    }

    if (container.innerHTML === '') {
        container.innerHTML = `
            <div class="coach-bubble">
                タスクのバランスは良好です！「事前の仮説づくり（Plan） ➡ 実行（Do） ➡ 振り返り検証（Check/Action）」のサイクルを回して最高の成果を出し続けましょう！
            </div>
        `;
    }
}

// ==========================================================================
// Modals Control (Wizard & Forced PDCA Strategy)
// ==========================================================================
function openTaskModal(taskToEdit = null) {
    showWizardStep(1);

    if (taskToEdit) {
        document.getElementById('task-id').value = taskToEdit.id;
        document.getElementById('task-title').value = taskToEdit.title;
        document.getElementById('task-category').value = taskToEdit.category || '仕事';
        document.getElementById('task-deadline').value = taskToEdit.deadline || '';
        document.getElementById('task-urgency').value = taskToEdit.urgency;
        document.getElementById('task-importance').value = taskToEdit.importance;
        document.getElementById('task-notes').value = taskToEdit.notes || '';

        // Strategy fields
        document.getElementById('pdca-strategy').value = taskToEdit.pdcaStrategy?.strategy || '';
        document.getElementById('pdca-obstacle').value = taskToEdit.pdcaStrategy?.obstacle || '';
        document.getElementById('pdca-goal').value = taskToEdit.pdcaStrategy?.goal || '';
    } else {
        taskForm.reset();
        document.getElementById('task-id').value = '';
        document.getElementById('task-urgency').value = 75;
        document.getElementById('task-importance').value = 80;

        document.getElementById('pdca-strategy').value = '';
        document.getElementById('pdca-obstacle').value = '';
        document.getElementById('pdca-goal').value = '';
    }

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
    const category = document.getElementById('task-category').value;
    const deadline = document.getElementById('task-deadline').value;
    const urgency = parseInt(document.getElementById('task-urgency').value, 10);
    const importance = parseInt(document.getElementById('task-importance').value, 10);
    const notes = document.getElementById('task-notes').value.trim();

    // Forced Strategy inputs
    const strategy = document.getElementById('pdca-strategy').value.trim();
    const obstacle = document.getElementById('pdca-obstacle').value.trim();
    const goal = document.getElementById('pdca-goal').value.trim();

    if (!title) {
        showWizardStep(1);
        showToast('タスク名を入力してください');
        return;
    }
    if (!strategy || !obstacle || !goal) {
        showWizardStep(2);
        showToast('⚠️ PDCAの成功仮説・戦略・ゴールをすべて入力してください！');
        return;
    }

    const pdcaStrategy = { strategy, obstacle, goal };

    if (id) {
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index] = sanitizeTask({ ...tasks[index], title, category, deadline, urgency, importance, notes, pdcaStrategy });
        }
        showToast('タスクと戦略仮説を確実に保存しました！🛡️');
    } else {
        const newTask = sanitizeTask({
            id: 'task-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            title,
            category,
            deadline,
            urgency,
            importance,
            notes,
            pdcaStrategy,
            pdcaReview: null,
            completed: false,
            createdAt: Date.now()
        });
        tasks.unshift(newTask);
        showToast('PDCA戦略仮説付きで新規タスクを確実に保存しました！🛡️');
    }

    saveTasks();
    closeTaskModal();
    renderAll();
    
    // バックグラウンドでファイル権限を自動再検証＆即座同期！
    if (activeFileHandle) verifyOrRequestPermission(activeFileHandle, false);
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
    if (confirm(`【確認】タイムスタンプ [${backupHistory[idx].timestamp}] のスナップショット (${backupHistory[idx].count}件のタスク) を復元して適用しますか？`)) {
        tasks = JSON.parse(JSON.stringify(backupHistory[idx].data));
        saveTasks();
        renderAll();
        closeBackupModal();
        showToast('バックアップからタスクデータを完全に復元しました！🎉');
    }
};

// ==========================================================================
// FORCED PDCA REVIEW MODAL (Check & Action)
// ==========================================================================
function openReviewModal(task) {
    reviewTargetTaskId = task.id;
    document.getElementById('review-task-title').textContent = task.title;

    const origBox = document.getElementById('review-original-strategy');
    origBox.innerHTML = `
        <strong>🎯 立てていた成功戦略:</strong> ${escapeHTML(task.pdcaStrategy?.strategy || '設定なし')}<br>
        <strong>🏁 目指した完了ゴール:</strong> ${escapeHTML(task.pdcaStrategy?.goal || '設定なし')}
    `;

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
    if (!reviewTargetTaskId) return;
    const task = tasks.find(t => t.id === reviewTargetTaskId);
    if (!task) return;

    const result = document.getElementById('review-result').value.trim();
    const action = document.getElementById('review-action').value.trim();

    if (!result || !action) {
        showToast('⚠️ 振り返り結果と次回アクションを入力してください！');
        return;
    }

    task.pdcaReview = { result, action };
    task.completed = true;

    saveTasks();
    closeReviewModal();
    renderAll();
    showToast('🏆 PDCA振り返り完了！完了メダルを獲得し確実に保存しました！🎉');
    
    // バックグラウンドでファイル権限を自動再検証＆即座同期！
    if (activeFileHandle) verifyOrRequestPermission(activeFileHandle, false);
}

// ==========================================================================
// Detail Modal
// ==========================================================================
function openDetailModal(task) {
    activeTaskId = task.id;
    const q = getQuadrant(task.urgency, task.importance);

    const qBadge = document.getElementById('detail-quadrant-badge');
    qBadge.className = `q-badge ${q}`;
    qBadge.textContent = getQuadrantName(q);

    document.getElementById('detail-category-badge').textContent = task.category || '未指定';
    document.getElementById('detail-title').textContent = task.title;

    const statusBadge = document.getElementById('detail-pdca-status-badge');
    if (task.completed && task.pdcaReview) {
        statusBadge.className = 'pdca-status-badge verified';
        statusBadge.innerHTML = '<i class="fa-solid fa-award"></i> PDCA完結検証済み';
    } else {
        statusBadge.className = 'pdca-status-badge';
        statusBadge.innerHTML = '<i class="fa-solid fa-brain"></i> 戦略実行中 (Plan & Do)';
    }

    document.getElementById('detail-urgency-bar').style.width = `${task.urgency}%`;
    document.getElementById('detail-urgency-text').textContent = `${task.urgency}%`;
    document.getElementById('detail-importance-bar').style.width = `${task.importance}%`;
    document.getElementById('detail-importance-text').textContent = `${task.importance}%`;

    const deadlineRow = document.getElementById('detail-deadline-row');
    if (task.deadline) {
        deadlineRow.style.display = 'flex';
        const dt = new Date(task.deadline);
        const dtStr = `${dt.getFullYear()}/${dt.getMonth()+1}/${dt.getDate()} ${dt.getHours()}:${String(dt.getMinutes()).padStart(2,'0')}`;
        document.getElementById('detail-deadline-text').textContent = dtStr;
    } else {
        deadlineRow.style.display = 'none';
    }

    document.getElementById('detail-pdca-strategy').textContent = task.pdcaStrategy?.strategy || '設定なし';
    document.getElementById('detail-pdca-obstacle').textContent = task.pdcaStrategy?.obstacle || '設定なし';
    document.getElementById('detail-pdca-goal').textContent = task.pdcaStrategy?.goal || '設定なし';

    const reviewArea = document.getElementById('pdca-review-display-area');
    if (task.completed && task.pdcaReview) {
        reviewArea.classList.remove('hidden');
        document.getElementById('detail-review-result').textContent = task.pdcaReview.result;
        document.getElementById('detail-review-action').textContent = task.pdcaReview.action;
    } else {
        reviewArea.classList.add('hidden');
    }

    document.getElementById('detail-notes-text').textContent = task.notes || 'メモはありません。';

    const btnToggle = document.getElementById('btn-toggle-complete');
    if (task.completed) {
        btnToggle.className = 'btn btn-secondary';
        btnToggle.innerHTML = '<i class="fa-solid fa-rotate-left"></i> 未完了に戻す';
    } else {
        btnToggle.className = 'btn btn-success';
        btnToggle.innerHTML = '<i class="fa-solid fa-check"></i> 完了にする (PDCA振り返りへ)';
    }

    modalDetail.classList.add('show');
}

function closeDetailModal() {
    modalDetail.classList.remove('show');
    activeTaskId = null;
}

// ==========================================================================
// JSON Import & Export (File System Absolute Safety)
// ==========================================================================
function exportJSON() {
    saveTasks();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `eisenhower_pdca_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('💾 PCにJSONファイルとしてタスクデータを保存しました！');
}

function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported)) {
                tasks = imported;
                saveTasks();
                renderAll();
                showToast(`🎉 PCから${imported.length}件のタスクデータを完全に復元・保存しました！`);
            } else {
                alert('無効なファイル形式です。');
            }
        } catch (err) {
            alert('JSONの読み込みエラー: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// ==========================================================================
// File System Access API: Persistent Direct Local File Sync & Auto-Reconnect
// ==========================================================================
let isSyncingFile = false;

function setupDirectFileSyncListeners() {
    const btnLink = document.getElementById('btn-link-local-file');
    const btnSaveDirect = document.getElementById('btn-direct-save-file');
    const btnMenuLink = document.getElementById('btn-menu-link-local');
    const btnMenuSave = document.getElementById('btn-menu-direct-save');
    const btnBackupLink = document.getElementById('btn-backup-link-local');
    const syncBadge = document.getElementById('file-sync-status');

    if (btnLink) btnLink.addEventListener('click', linkLocalFileDirectly);
    if (btnSaveDirect) btnSaveDirect.addEventListener('click', () => saveToDirectLocalFile(false));
    if (btnMenuLink) btnMenuLink.addEventListener('click', linkLocalFileDirectly);
    if (btnMenuSave) btnMenuSave.addEventListener('click', () => saveToDirectLocalFile(false));
    if (btnBackupLink) btnBackupLink.addEventListener('click', linkLocalFileDirectly);
    
    // ステータスバッジをクリックするだけで、ブラウザ再読込後のファイル権限を即座に自動再取得・復元！
    if (syncBadge) {
        syncBadge.style.cursor = 'pointer';
        syncBadge.title = 'クリックしてファイルの接続をただちに再開・更新する';
        syncBadge.addEventListener('click', async () => {
            if (activeFileHandle) {
                await verifyOrRequestPermission(activeFileHandle, true);
            } else {
                await linkLocalFileDirectly();
            }
        });
    }
}

// IndexedDBへのファイルハンドル永続化ユーティリティ
async function saveFileHandleToIDB(handle) {
    if (!handle) return;
    try {
        await setIDBData('HandlesStore', 'main_task_file', handle);
        console.info('FileHandle persisted to IndexedDB successfully.');
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

// 起動時に呼び出される「自動再接続＆復元」心臓部エンジン
async function initAndRestoreDirectFileSync() {
    if (!('showOpenFilePicker' in window)) return;
    try {
        const savedHandle = await getFileHandleFromIDB();
        if (!savedHandle) return;

        activeFileHandle = savedHandle;
        const permission = await activeFileHandle.queryPermission({ mode: 'readwrite' });
        if (permission === 'granted') {
            // 完全に許可済みなら、即座にファイルから最新のJSONを読み出し・完全同期！
            const file = await activeFileHandle.getFile();
            const text = await file.text();
            if (text && text.trim()) {
                const parsed = JSON.parse(text);
                if (Array.isArray(parsed)) {
                    tasks = parsed.map((t, idx) => sanitizeTask(t, idx)).filter(Boolean);
                    saveTasks(true, true); // ローカルの5重バックアップにも反映
                    renderAll();
                    showToast(`⚡ PCファイル「${file.name}」と自動再接続しデータを完全同期しました！`);
                }
            }
        } else {
            // 再起動などでブラウザ仕様による再認可(1クリック)が必要な状態
            console.info('FileHandle restored from IndexedDB. Waiting for user click to re-verify permission.');
            showToast(`⚡ 前回の保存先「${activeFileHandle.name}」を検出しました。バッジやボタンクリックで自動再接続されます！`);
        }
        updateFileSyncUI();
    } catch (e) {
        console.warn('Auto-reconnect failed or permission expired:', e);
    }
}

// 権限確認・自動再要求ユーティリティ
async function verifyOrRequestPermission(handle, forcePrompt = false) {
    if (!handle) return false;
    try {
        const opts = { mode: 'readwrite' };
        if (!forcePrompt && (await handle.queryPermission(opts)) === 'granted') {
            return true;
        }
        if ((await handle.requestPermission(opts)) === 'granted') {
            updateFileSyncUI();
            // 権限が得られたらただちにファイル読み込み＆最新化または書き出し！
            try {
                const file = await handle.getFile();
                const text = await file.text();
                if (text && text.trim()) {
                    const parsed = JSON.parse(text);
                    if (Array.isArray(parsed) && parsed.length >= tasks.length) {
                        tasks = parsed.map((t, idx) => sanitizeTask(t, idx)).filter(Boolean);
                        renderAll();
                    }
                }
                saveToDirectLocalFile(true);
            } catch (err) {}
            showToast(`⚡ 「${handle.name}」とのファイル連携を完全に再開しました！`);
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

    if (!badge || !badgeText) return;

    if (activeFileHandle) {
        badge.classList.add('active');
        activeFileHandle.queryPermission({ mode: 'readwrite' }).then(perm => {
            if (perm === 'granted') {
                badgeText.innerHTML = `<i class="fa-solid fa-bolt"></i> 接続中: <strong>${escapeHTML(activeFileHandle.name)}</strong> (自動保存中)`;
            } else {
                badgeText.innerHTML = `<i class="fa-solid fa-plug-circle-exclamation"></i> 前回のファイル: <strong>${escapeHTML(activeFileHandle.name)}</strong> (クリックして即接続)`;
            }
        }).catch(() => {
            badgeText.innerHTML = `<i class="fa-solid fa-folder-open"></i> 同期候補: <strong>${escapeHTML(activeFileHandle.name)}</strong>`;
        });
        if (saveBtn) saveBtn.classList.remove('hidden');
    } else {
        badge.classList.remove('active');
        badgeText.textContent = 'PCファイル未連携 (ブラウザ内保護中)';
        if (saveBtn) saveBtn.classList.add('hidden');
    }
}

async function linkLocalFileDirectly() {
    if (!('showOpenFilePicker' in window)) {
        showToast('お使いのブラウザはダイレクトファイル同期に対応していません。通常のJSON保存をご利用ください。');
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
        await saveFileHandleToIDB(handle); // IndexedDBへ永続保存！ウェブを閉じても消えない！

        const file = await handle.getFile();
        const text = await file.text();
        try {
            if (text.trim()) {
                const parsed = JSON.parse(text);
                if (Array.isArray(parsed)) {
                    tasks = parsed.map((t, idx) => sanitizeTask(t, idx)).filter(Boolean);
                    saveTasks(false, true); // LocalStorage/Snapshot等バックアップにも即反映
                    renderAll();
                    showToast(`⚡ 「${file.name}」と直接接続＆永続同期しました！以降ウェブを閉じても再接続されます。`);
                } else {
                    showToast(`⚡ 「${file.name}」と接続しました！自動または保存ボタンで書き込まれます。`);
                }
            } else {
                showToast(`⚡ 「${file.name}」(新規ファイル)と接続しました！自動で書き込まれます。`);
            }
        } catch (err) {
            showToast(`⚡ 「${file.name}」と接続しました！(現在のタスクをファイルへ上書き保存可能です)`);
        }
        updateFileSyncUI();
        if (modalBackup && modalBackup.classList.contains('show')) {
            modalBackup.classList.remove('show');
        }
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
            if (silent) { isSyncingFile = false; return; }
            activeFileHandle = await window.showSaveFilePicker({
                suggestedName: 'tasks_data.json',
                types: [{
                    description: 'Matrix Task Hub JSON File',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            await saveFileHandleToIDB(activeFileHandle); // IndexedDBへ永続保存！
        } else {
            // 権限確認・再認可（必要な場合のみ）
            const ok = await verifyOrRequestPermission(activeFileHandle, !silent);
            if (!ok) { isSyncingFile = false; return; }
        }
        const writable = await activeFileHandle.createWritable();
        await writable.write(JSON.stringify(tasks, null, 2));
        await writable.close();
        updateFileSyncUI();
        if (!silent) showToast(`💾 フォルダ内の「${activeFileHandle.name}」へ直接・完全に上書き保存しました！`);
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.error('File write error:', e);
            if (!silent) showToast('直接保存に失敗しました。ファイルが開いたままになっていないかご確認ください。');
        }
    } finally {
        isSyncingFile = false;
    }
}

// ==========================================================================
// Utility Helpers
// ==========================================================================
function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3400);
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

// 画面サイズを変更した際や半分画面(ハーフスクリーン)にした際も自動で重なりを再計算して被りゼロを維持！
let resizeTimeout = null;
window.addEventListener('resize', () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (currentView === 'matrix') {
            renderMatrixGraph();
        }
    }, 100);
});
