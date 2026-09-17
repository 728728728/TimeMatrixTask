/* ==========================================================================
   テーマ（色）エンジン
   - 色だけを切り替える。ガラスの透明度・ぼかしは style.css 側で固定
   - <head> で読み込み、保存済みテーマを描画前に適用する
   ========================================================================== */
const THEME_KEY = 'tmt_theme_v1';

const THEME_FIELDS = [
    { key: 'bg', label: '背景' },
    { key: 'surface', label: 'ガラスの色味' },
    { key: 'text', label: '文字' },
    { key: 'accent', label: 'アクセント' },
    { key: 'accent2', label: 'アクセント（グラデ先）' },
    { key: 'q1', label: '第I領域' },
    { key: 'q2', label: '第II領域' },
    { key: 'q3', label: '第III領域' },
    { key: 'q4', label: '第IV領域' }
];

const THEME_PRESETS = {
    navy: {
        name: 'ディープネイビー（標準）',
        bg: '#0d101a', surface: '#181e30', text: '#ffffff', accent: '#64dfdf', accent2: '#00bbf9',
        q1: '#ff85a1', q2: '#64dfdf', q3: '#fce181', q4: '#c8b6ff'
    },
    ocean: {
        name: 'オーシャン',
        bg: '#031022', surface: '#0c2240', text: '#eaf6ff', accent: '#5cc8ff', accent2: '#7b8cff',
        q1: '#ff8fa3', q2: '#5cc8ff', q3: '#ffe08a', q4: '#b3a7ff'
    },
    forest: {
        name: 'フォレスト',
        bg: '#07130f', surface: '#14281f', text: '#eefaf3', accent: '#7ee2a8', accent2: '#3fb6a8',
        q1: '#ff9b85', q2: '#7ee2a8', q3: '#f3e39b', q4: '#a8c7b8'
    },
    sakura: {
        name: 'サクラ',
        bg: '#1a0f16', surface: '#2e1a27', text: '#fff4f8', accent: '#ff9ec7', accent2: '#c7a0ff',
        q1: '#ff7a9c', q2: '#9ee6e0', q3: '#ffd59e', q4: '#d4b8ff'
    },
    sunset: {
        name: 'サンセット',
        bg: '#170d0a', surface: '#2d1b16', text: '#fff5ee', accent: '#ffb36b', accent2: '#ff7a7a',
        q1: '#ff7a7a', q2: '#7fd6c9', q3: '#ffd36b', q4: '#c3a6ff'
    },
    mono: {
        name: 'モノクローム',
        bg: '#0b0b0e', surface: '#1c1c22', text: '#f2f2f5', accent: '#e5e5ea', accent2: '#9ca3af',
        q1: '#ff8a8a', q2: '#9ad0ff', q3: '#ffd479', q4: '#b9b9c6'
    },
    frost: {
        name: 'フロスト（ライト）',
        bg: '#dfe7f2', surface: '#ffffff', text: '#1b2436', accent: '#2f7df6', accent2: '#7a5cff',
        q1: '#e5486e', q2: '#0f9d9a', q3: '#c98a00', q4: '#7a5cff'
    },
    lavender: {
        name: 'ラベンダー（ライト）',
        bg: '#e9e2f5', surface: '#ffffff', text: '#2a2140', accent: '#8a5cf6', accent2: '#e05c9e',
        q1: '#e0527a', q2: '#1f9e94', q3: '#c58a12', q4: '#8a5cf6'
    }
};

const DEFAULT_PRESET = 'navy';

function hexToRgb(hex) {
    let h = String(hex || '').replace('#', '').trim();
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}

function rgbToHex(rgb) {
    return '#' + rgb.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}

function mixRgb(a, b, t) {
    return a.map((v, i) => v + (b[i] - v) * t);
}

function luminance(rgb) {
    const [r, g, b] = rgb.map(v => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function normalizeTheme(theme) {
    const base = THEME_PRESETS[theme && THEME_PRESETS[theme.preset] ? theme.preset : DEFAULT_PRESET];
    const out = { preset: (theme && theme.preset) || DEFAULT_PRESET };
    THEME_FIELDS.forEach(({ key }) => {
        const v = theme && theme[key];
        out[key] = hexToRgb(v) ? rgbToHex(hexToRgb(v)) : base[key];
    });
    return out;
}

function applyTheme(theme) {
    const t = normalizeTheme(theme);
    const rgb = {};
    THEME_FIELDS.forEach(({ key }) => { rgb[key] = hexToRgb(t[key]); });

    // 文字はガラス越しに背景の上へ乗るので、両者を混ぜた色で明暗を判定する
    const light = luminance(mixRgb(rgb.surface, rgb.bg, 0.4)) > 0.4;
    const white = [255, 255, 255];
    const black = [0, 0, 0];
    const css = v => v.map(Math.round).join(', ');

    const vars = {
        '--bg-rgb': css(rgb.bg),
        '--surface-rgb': css(rgb.surface),
        '--surface-hi-rgb': css(light ? mixRgb(rgb.surface, rgb.accent, 0.08) : mixRgb(rgb.surface, white, 0.14)),
        '--surface-lo-rgb': css(light ? mixRgb(rgb.surface, rgb.bg, 0.35) : mixRgb(rgb.surface, black, 0.35)),
        '--ink-rgb': css(light ? mixRgb(rgb.text, black, 0.2) : white),
        '--shade-rgb': css(light ? white : black),
        '--shadow-rgb': css(light ? mixRgb(rgb.text, rgb.bg, 0.3) : black),
        '--shadow-strength': light ? '0.3' : '1',
        '--text-rgb': css(rgb.text),
        '--text-secondary': rgbToHex(mixRgb(rgb.text, rgb.bg, 0.18)),
        '--text-muted': rgbToHex(mixRgb(rgb.text, rgb.bg, 0.45)),
        '--accent-rgb': css(rgb.accent),
        '--accent-2-rgb': css(rgb.accent2),
        '--on-accent': luminance(rgb.accent) > 0.35 ? '#0c101a' : '#ffffff',
        '--q1-rgb': css(rgb.q1),
        '--q2-rgb': css(rgb.q2),
        '--q3-rgb': css(rgb.q3),
        '--q4-rgb': css(rgb.q4)
    };

    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.dataset.themeMode = light ? 'light' : 'dark';
    root.style.colorScheme = light ? 'light' : 'dark';
    return t;
}

function loadSavedTheme() {
    try {
        const raw = localStorage.getItem(THEME_KEY);
        return raw ? normalizeTheme(JSON.parse(raw)) : null;
    } catch (e) {
        return null;
    }
}

function saveTheme(theme) {
    try { localStorage.setItem(THEME_KEY, JSON.stringify(theme)); } catch (e) {}
}

// 描画前に適用
(function () {
    const saved = loadSavedTheme();
    if (saved) applyTheme(saved);
})();
