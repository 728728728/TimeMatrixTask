"""今日やること・デスクトップウィジェット

ブラウザとは関係なく常駐し、常に最前面に出る小窓。
Matrix Hub と同じ tasks_data.json を読み書きするので、どちらで操作しても同期する。

起動:  start-today-widget.bat （または pythonw today_widget.pyw）
終了:  小窓の ✕ ボタン（右クリックメニューからも）
"""

import json
import os
import subprocess
import sys
import tempfile
import winsound
import socket
import tkinter as tk
import tkinter.font as tkfont
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'tasks_data.json')
STATE_PATH = os.path.join(BASE_DIR, '.widget_state.json')

DAY_START_HOUR = 4      # 深夜4時までは前の日あつかい（アプリ本体と合わせる）
POLL_MS = 2000          # ファイルの変更を見にいく間隔
ALERT_MS = 30000        # 期限を見張る間隔
ALERT_LEAD_MIN = [60, 30, 10, 0]   # 何分前に知らせるか（0 は時間ちょうど）
WIDTH, HEIGHT = 340, 470

DEFAULT_THEME = {
    'bg': '#0d101a', 'surface': '#181e30', 'text': '#ffffff',
    'accent': '#64dfdf', 'accent2': '#00bbf9',
    'q1': '#ff85a1', 'q2': '#64dfdf', 'q3': '#fce181', 'q4': '#c8b6ff',
}
QUADRANT_SHORT = {'q1': 'I', 'q2': 'II', 'q3': 'III', 'q4': 'IV'}
QUADRANT_ORDER = {'q1': 0, 'q2': 1, 'q3': 2, 'q4': 3}
QUADRANT_PRESETS = {
    'q1': (75, 75), 'q2': (25, 75), 'q3': (75, 25), 'q4': (25, 25),
}


# ---------------------------------------------------------------- 色まわり
def hex_to_rgb(value, fallback=(255, 255, 255)):
    text = str(value or '').lstrip('#')
    if len(text) == 3:
        text = ''.join(c * 2 for c in text)
    if len(text) != 6:
        return fallback
    try:
        return tuple(int(text[i:i + 2], 16) for i in (0, 2, 4))
    except ValueError:
        return fallback


def rgb_to_hex(rgb):
    return '#%02x%02x%02x' % tuple(max(0, min(255, int(round(c)))) for c in rgb)


def mix(color_a, color_b, ratio):
    a, b = hex_to_rgb(color_a), hex_to_rgb(color_b)
    return rgb_to_hex([a[i] + (b[i] - a[i]) * ratio for i in range(3)])


def is_light(color):
    r, g, b = hex_to_rgb(color)
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150


# ---------------------------------------------------------------- 日付
def today_key(now=None):
    now = now or datetime.now()
    return (now - timedelta(hours=DAY_START_HOUR)).strftime('%Y-%m-%d')


def day_label(key):
    date = datetime.strptime(key, '%Y-%m-%d')
    week = '月火水木金土日'[date.weekday()]
    return f'{date.month}/{date.day}（{week}）'


def deadline_at(task):
    raw = task.get('deadline')
    if not raw:
        return None
    try:
        return datetime.fromisoformat(str(raw))
    except (ValueError, TypeError):
        return None


def minutes_left(task, now=None):
    due = deadline_at(task)
    if not due:
        return None
    return (due - (now or datetime.now())).total_seconds() / 60


def deadline_label(task):
    raw = task.get('deadline')
    if not raw:
        return None, False
    try:
        dt = datetime.fromisoformat(str(raw))
    except ValueError:
        return None, False
    if not task.get('completed') and dt < datetime.now():
        return f'期限切れ {dt.month}/{dt.day}', True
    key = dt.strftime('%Y-%m-%d')
    if key == today_key():
        return f'今日 {dt.hour}:{dt.minute:02d}まで', True
    return f'{dt.month}/{dt.day}まで', False


# ---------------------------------------------------------------- データ
class Store:
    """tasks_data.json の読み書き。書き込みは必ず読み直してから行う。"""

    def __init__(self, path):
        self.path = path
        self.payload = {'tasks': [], 'days': {}}
        self.mtime = 0
        self.error = None

    def _read(self):
        with open(self.path, encoding='utf-8') as handle:
            raw = json.load(handle)
        if isinstance(raw, list):              # 旧形式（配列だけ）
            raw = {'tasks': raw, 'days': {}}
        if not isinstance(raw, dict):
            raise ValueError('形式が違います')
        raw.setdefault('tasks', [])
        raw.setdefault('days', {})
        return raw

    def reload(self, force=False):
        """変更があれば読み直す。読み直したら True。"""
        try:
            mtime = os.path.getmtime(self.path)
        except OSError:
            self.error = 'tasks_data.json が見つかりません'
            return False
        if not force and mtime == self.mtime:
            return False
        try:
            self.payload = self._read()
            self.mtime = mtime
            self.error = None
            return True
        except (OSError, ValueError, json.JSONDecodeError) as exc:
            self.error = f'読み込めません: {exc}'
            return False

    def update(self, mutate):
        """最新の内容を読み直してから変更し、安全に書き戻す。"""
        try:
            payload = self._read()
        except (OSError, ValueError, json.JSONDecodeError):
            payload = self.payload
        mutate(payload)
        payload['savedAt'] = datetime.now().isoformat(timespec='seconds')

        directory = os.path.dirname(self.path)
        handle, tmp = tempfile.mkstemp(dir=directory, suffix='.tmp')
        try:
            with os.fdopen(handle, 'w', encoding='utf-8') as out:
                json.dump(payload, out, ensure_ascii=False, indent=2)
            if os.path.exists(self.path):       # 直前の状態を1世代だけ残す
                try:
                    import shutil
                    shutil.copyfile(self.path, self.path + '.bak')
                except OSError:
                    pass
            os.replace(tmp, self.path)
        except OSError as exc:
            self.error = f'保存できません: {exc}'
            if os.path.exists(tmp):
                os.unlink(tmp)
            return
        self.payload = payload
        try:
            self.mtime = os.path.getmtime(self.path)
        except OSError:
            pass
        self.error = None

    # --- 取り出し ---
    def theme(self):
        theme = dict(DEFAULT_THEME)
        saved = self.payload.get('theme')
        if isinstance(saved, dict):
            for key in DEFAULT_THEME:
                if saved.get(key):
                    theme[key] = saved[key]
        return theme

    def today_tasks(self):
        key = today_key()
        tasks = [t for t in self.payload.get('tasks', [])
                 if isinstance(t, dict) and t.get('today') == key]
        tasks.sort(key=lambda t: (bool(t.get('completed')),
                                  QUADRANT_ORDER[quadrant_of(t)]))
        return tasks

    def focus(self):
        day = self.payload.get('days', {}).get(today_key())
        return (day or {}).get('focus') or ''

    def due_tasks(self, within_hours=36):
        """期限が迫っている未完了のタスク。近い順。"""
        found = []
        for task in self.payload.get('tasks', []):
            if not isinstance(task, dict) or task.get('completed'):
                continue
            left = minutes_left(task)
            if left is None or left > within_hours * 60:
                continue
            found.append((left, task))
        found.sort(key=lambda pair: pair[0])
        return found


def quadrant_of(task):
    urgency = task.get('urgency', 50) or 0
    importance = task.get('importance', 50) or 0
    if urgency >= 50 and importance >= 50:
        return 'q1'
    if urgency < 50 and importance >= 50:
        return 'q2'
    if urgency >= 50 and importance < 50:
        return 'q3'
    return 'q4'


def new_task_id():
    return 'task-%d-%d' % (int(datetime.now().timestamp() * 1000), os.getpid() % 100000)


def make_task(title, parent=None):
    """ウィジェットから足すタスク。領域は親から引き継ぐ（なければ未仕分け）。"""
    task = {
        'id': new_task_id(),
        'title': title[:150],
        'category': (parent or {}).get('category', 'その他'),
        'urgency': 50, 'importance': 50,
        'deadline': (parent or {}).get('deadline'),
        'notes': '', 'completed': False, 'completedAt': None,
        'inbox': True, 'today': today_key(),
        'pdcaStrategy': None, 'pdcaReview': None,
        'parentId': (parent or {}).get('id'),
        'createdAt': int(datetime.now().timestamp() * 1000),
    }
    if parent and not parent.get('inbox'):
        task['inbox'] = False
        task['urgency'], task['importance'] = QUADRANT_PRESETS[quadrant_of(parent)]
    return task


# ---------------------------------------------------------------- 画面
class Widget:
    def __init__(self, root, store):
        self.root = root
        self.store = store
        self.state = self.load_state()
        self.collapsed = bool(self.state.get('collapsed'))
        self.follow_up_for = None
        self.row_widgets = []
        self.alerted = self.state.get('alerted') or {}   # {タスクid: [知らせた段階]}
        self.alert_banner = None

        root.title('今日やること')
        root.attributes('-topmost', True)
        root.minsize(260, 44)
        root.geometry(self.state.get('geometry') or self.default_geometry())
        root.protocol('WM_DELETE_WINDOW', self.quit)

        self.apply_theme()
        self.build()
        self.refresh(force=True)
        self.poll()
        self.root.after(3000, self.check_deadlines)

    # --- 位置・状態の記憶 ---
    def default_geometry(self):
        x = self.root.winfo_screenwidth() - WIDTH - 24
        return f'{WIDTH}x{HEIGHT}+{max(0, x)}+60'

    def load_state(self):
        try:
            with open(STATE_PATH, encoding='utf-8') as handle:
                return json.load(handle)
        except (OSError, ValueError):
            return {}

    def save_state(self):
        if not self.collapsed:
            self.state['geometry'] = self.root.geometry()
        self.state['collapsed'] = self.collapsed
        self.state['alerted'] = self.alerted
        try:
            with open(STATE_PATH, 'w', encoding='utf-8') as handle:
                json.dump(self.state, handle)
        except OSError:
            pass

    def quit(self):
        self.save_state()
        self.root.destroy()

    # --- 色とフォント ---
    def apply_theme(self):
        theme = self.store.theme()
        self.c = {
            'bg': theme['bg'],
            'surface': mix(theme['surface'], theme['bg'], 0.15),
            'row': mix(theme['surface'], theme['bg'], 0.3),
            'text': theme['text'],
            'muted': mix(theme['text'], theme['bg'], 0.45),
            'line': mix(theme['bg'], theme['text'], 0.18),
            'accent': theme['accent'],
            'on_accent': '#0c101a' if is_light(theme['accent']) else '#ffffff',
            'q1': theme['q1'], 'q2': theme['q2'], 'q3': theme['q3'], 'q4': theme['q4'],
        }
        family = 'Yu Gothic UI'
        if family not in tkfont.families(self.root):
            family = 'Meiryo' if 'Meiryo' in tkfont.families(self.root) else 'TkDefaultFont'
        self.f_title = tkfont.Font(family=family, size=10, weight='bold')
        self.f_body = tkfont.Font(family=family, size=10)
        self.f_small = tkfont.Font(family=family, size=8)
        self.f_done = tkfont.Font(family=family, size=10, overstrike=True)
        self.f_head = tkfont.Font(family=family, size=11, weight='bold')
        self.root.configure(bg=self.c['bg'])

    # --- 組み立て ---
    def build(self):
        c = self.c
        self.head = tk.Frame(self.root, bg=c['surface'], padx=10, pady=7)
        self.head.pack(fill='x', side='top')

        self.caret = tk.Label(self.head, text='▾', bg=c['surface'], fg=c['accent'],
                              font=self.f_small, cursor='hand2')
        self.caret.pack(side='left')
        self.title_label = tk.Label(self.head, text='今日やること', bg=c['surface'],
                                    fg=c['text'], font=self.f_head, cursor='hand2')
        self.title_label.pack(side='left', padx=(6, 0))
        for widget in (self.caret, self.title_label, self.head):
            widget.bind('<Button-1>', lambda _event: self.toggle_collapse())

        self.close_btn = self.icon_button(self.head, '✕', self.quit, '閉じる（終了）')
        self.close_btn.pack(side='right')
        self.min_btn = self.icon_button(self.head, '―', self.minimize, 'タスクバーにしまう')
        self.min_btn.pack(side='right')
        self.count_label = tk.Label(self.head, text='0 / 0', bg=c['surface'], fg=c['accent'],
                                    font=self.f_small)
        self.count_label.pack(side='right', padx=(0, 8))

        self.body = tk.Frame(self.root, bg=c['bg'])
        self.body.pack(fill='both', expand=True)

        meta = tk.Frame(self.body, bg=c['bg'], padx=10, pady=6)
        meta.pack(fill='x')
        self.date_label = tk.Label(meta, text='', bg=c['bg'], fg=c['muted'], font=self.f_small)
        self.date_label.pack(side='left')
        self.bar = tk.Canvas(self.body, height=4, bg=c['line'], highlightthickness=0)
        self.bar.pack(fill='x', padx=10)

        self.focus_label = tk.Label(self.body, text='', bg=mix(c['bg'], c['q3'], 0.14),
                                    fg=c['text'], font=self.f_body, anchor='w',
                                    justify='left', padx=8, pady=5, wraplength=WIDTH - 44)
        # 中身があるときだけ pack する

        # スクロールする一覧
        wrap = tk.Frame(self.body, bg=c['bg'])
        wrap.pack(fill='both', expand=True, padx=8, pady=(8, 4))
        self.canvas = tk.Canvas(wrap, bg=c['bg'], highlightthickness=0)
        self.scroll = tk.Scrollbar(wrap, orient='vertical', command=self.canvas.yview)
        self.list_frame = tk.Frame(self.canvas, bg=c['bg'])
        self.list_window = self.canvas.create_window((0, 0), window=self.list_frame, anchor='nw')
        self.canvas.configure(yscrollcommand=self.scroll.set)
        self.canvas.pack(side='left', fill='both', expand=True)
        self.list_frame.bind('<Configure>', self.on_list_resize)
        self.canvas.bind('<Configure>',
                         lambda e: self.canvas.itemconfigure(self.list_window, width=e.width))
        self.root.bind_all('<MouseWheel>', self.on_wheel)

        # 追加欄（常に下に残る）
        add = tk.Frame(self.body, bg=c['row'], padx=8, pady=2)
        add.pack(fill='x', padx=8, pady=(0, 8))
        tk.Label(add, text='＋', bg=c['row'], fg=c['muted'], font=self.f_body).pack(side='left')
        self.add_var = tk.StringVar()
        self.add_entry = tk.Entry(add, textvariable=self.add_var, bg=c['row'], fg=c['text'],
                                  insertbackground=c['text'], relief='flat', font=self.f_body)
        self.add_entry.pack(side='left', fill='x', expand=True, ipady=4, padx=(4, 0))
        self.add_entry.bind('<Return>', self.on_add)

        self.status = tk.Label(self.body, text='', bg=c['bg'], fg=c['muted'],
                               font=self.f_small, anchor='w', padx=10)

        menu = tk.Menu(self.root, tearoff=0)
        menu.add_command(label='最前面に固定を切り替え', command=self.toggle_topmost)
        menu.add_command(label='タスクバーにしまう', command=self.minimize)
        menu.add_separator()
        menu.add_command(label='終了', command=self.quit)
        self.root.bind('<Button-3>', lambda e: menu.tk_popup(e.x_root, e.y_root))

        if self.collapsed:
            self.collapsed = False
            self.toggle_collapse()

    def icon_button(self, parent, text, command, tooltip=''):
        button = tk.Label(parent, text=text, bg=self.c['surface'], fg=self.c['muted'],
                          font=self.f_small, padx=6, cursor='hand2')
        button.bind('<Button-1>', lambda _event: command())
        button.bind('<Enter>', lambda _e: button.configure(fg=self.c['text']))
        button.bind('<Leave>', lambda _e: button.configure(fg=self.c['muted']))
        if tooltip:
            button.tooltip = tooltip
        return button

    def on_list_resize(self, _event=None):
        self.canvas.configure(scrollregion=self.canvas.bbox('all'))
        needed = self.list_frame.winfo_reqheight() > self.canvas.winfo_height()
        if needed and not self.scroll.winfo_ismapped():
            self.scroll.pack(side='right', fill='y')
        elif not needed and self.scroll.winfo_ismapped():
            self.scroll.pack_forget()

    def on_wheel(self, event):
        if self.collapsed:
            return
        self.canvas.yview_scroll(-1 if event.delta > 0 else 1, 'units')

    # --- ウィンドウ操作 ---
    def toggle_collapse(self):
        self.collapsed = not self.collapsed
        if self.collapsed:
            self.state['geometry'] = self.root.geometry()
            self.body.pack_forget()
            self.caret.configure(text='▸')
            width = self.root.winfo_width()
            x, y = self.root.winfo_x(), self.root.winfo_y()
            self.root.geometry(f'{width}x40+{x}+{y}')
        else:
            self.body.pack(fill='both', expand=True)
            self.caret.configure(text='▾')
            self.root.geometry(self.state.get('geometry') or self.default_geometry())
        self.save_state()

    def minimize(self):
        self.root.attributes('-topmost', False)
        self.root.iconify()
        self.root.bind('<Map>', self.on_restore)

    def on_restore(self, _event=None):
        self.root.unbind('<Map>')
        self.root.attributes('-topmost', True)

    def toggle_topmost(self):
        now = not self.root.attributes('-topmost')
        self.root.attributes('-topmost', now)
        self.flash('最前面に固定中' if now else '最前面の固定を解除')

    def flash(self, message):
        self.status.configure(text=message)
        self.status.pack(fill='x', pady=(0, 4))
        self.root.after(2500, lambda: self.status.pack_forget())

    # --- 操作 ---
    def toggle_done(self, task_id):
        def mutate(payload):
            for task in payload.get('tasks', []):
                if task.get('id') == task_id:
                    done = not task.get('completed')
                    task['completed'] = done
                    task['completedAt'] = int(datetime.now().timestamp() * 1000) if done else None
                    if done:
                        task['inbox'] = False
                    break
        self.store.update(mutate)
        task = self.find(task_id)
        self.follow_up_for = task_id if (task and task.get('completed')) else None
        self.refresh(force=True)

    def find(self, task_id):
        for task in self.store.payload.get('tasks', []):
            if task.get('id') == task_id:
                return task
        return None

    def start_follow_up(self, task_id):
        self.follow_up_for = None if self.follow_up_for == task_id else task_id
        self.refresh(force=True)

    def add_task(self, title, parent_id=None):
        title = title.strip()
        if not title:
            return
        parent = self.find(parent_id) if parent_id else None
        task = make_task(title, parent)
        self.store.update(lambda payload: payload['tasks'].insert(0, task))
        self.follow_up_for = None
        self.refresh(force=True)
        self.flash(f'追加しました：{title[:18]}')

    def on_add(self, _event=None):
        self.add_task(self.add_var.get())
        self.add_var.set('')

    # --- 期限のお知らせ ---
    def check_deadlines(self):
        """期限まで 60/30/10/0 分をまたいだときと、過ぎたときに1回ずつ知らせる。"""
        try:
            self.store.reload()
            due_now = []
            live_ids = set()
            for left, task in self.store.due_tasks():
                task_id = str(task.get('id'))
                live_ids.add(task_id)
                done_stages = self.alerted.setdefault(task_id, [])
                stage = None
                if left < 0:
                    stage = 'over'
                else:
                    for lead in ALERT_LEAD_MIN:
                        if left <= lead:
                            stage = str(lead)
                            break
                if stage and stage not in done_stages:
                    done_stages.append(stage)
                    due_now.append((left, task))
            # 消えたタスクの記録は捨てる
            for task_id in [k for k in self.alerted if k not in live_ids]:
                del self.alerted[task_id]
            if due_now:
                self.save_state()
                self.announce(due_now)
            self.refresh()
        except Exception as exc:                       # お知らせで落ちないように
            print('deadline check failed:', exc, file=sys.stderr)
        self.root.after(ALERT_MS, self.check_deadlines)

    def announce(self, items):
        titles = [str(t.get('title', '')) for _, t in items]
        left = items[0][0]
        if left < 0:
            headline = '期限を過ぎています'
        elif left < 1:
            headline = 'いまが期限です'
        else:
            headline = f'あと{int(left) + 1}分で期限です'
        self.show_banner(headline, titles)
        self.notify(headline, '／'.join(titles)[:120])
        try:
            winsound.MessageBeep(winsound.MB_ICONEXCLAMATION)
        except Exception:
            pass
        # たたんでいても気づけるように開いて前に出す
        if self.collapsed:
            self.toggle_collapse()
        try:
            self.root.deiconify()
            self.root.lift()
            self.root.attributes('-topmost', True)
        except tk.TclError:
            pass

    def notify(self, title, body):
        """Windows の通知を出す。失敗しても無視する（音とバナーは出ている）。"""
        script = (
            '[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications,'
            ' ContentType=WindowsRuntime] > $null;'
            '$t=[Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent('
            '[Windows.UI.Notifications.ToastTemplateType]::ToastText02);'
            '$n=$t.GetElementsByTagName("text");'
            f'$n.Item(0).AppendChild($t.CreateTextNode("{title}")) > $null;'
            f'$n.Item(1).AppendChild($t.CreateTextNode("{body}")) > $null;'
            '[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('
            '"Matrix Hub").Show([Windows.UI.Notifications.ToastNotification]::new($t))'
        )
        try:
            subprocess.Popen(
                ['powershell', '-NoProfile', '-WindowStyle', 'Hidden', '-Command', script],
                creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0),
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass

    def show_banner(self, headline, titles):
        if self.alert_banner is not None:
            self.alert_banner.destroy()
        c = self.c
        banner = tk.Frame(self.body, bg=mix(c['bg'], c['q1'], 0.35))
        banner.pack(fill='x', padx=10, pady=(8, 0), before=self.focus_label
                    if self.focus_label.winfo_ismapped() else None)
        text = '⏰ ' + headline + '\n' + '\n'.join('・' + t for t in titles[:3])
        label = tk.Label(banner, text=text, bg=banner['bg'], fg=c['text'], font=self.f_body,
                         justify='left', anchor='w', padx=8, pady=6, wraplength=WIDTH - 70)
        label.pack(side='left', fill='x', expand=True)
        close = tk.Label(banner, text='✕', bg=banner['bg'], fg=c['text'], font=self.f_small,
                         padx=6, cursor='hand2')
        close.pack(side='right')
        close.bind('<Button-1>', lambda _e: self.hide_banner())
        self.alert_banner = banner

    def hide_banner(self):
        if self.alert_banner is not None:
            self.alert_banner.destroy()
            self.alert_banner = None

    # --- 描画 ---
    def poll(self):
        if self.store.reload():
            self.refresh()
        self.root.after(POLL_MS, self.poll)

    def refresh(self, force=False):
        if force:
            self.store.reload(force=True)
        for widget in self.row_widgets:
            widget.destroy()
        self.row_widgets = []

        c = self.c
        tasks = self.store.today_tasks()
        done = sum(1 for t in tasks if t.get('completed'))
        self.count_label.configure(text=f'{done} / {len(tasks)}')
        self.date_label.configure(text=day_label(today_key()))
        self.root.title(f'今日やること {done}/{len(tasks)}')

        self.bar.delete('all')
        self.bar.update_idletasks()
        if tasks:
            width = max(1, int(self.bar.winfo_width() * done / len(tasks)))
            self.bar.create_rectangle(0, 0, width, 4, fill=c['accent'], width=0)

        focus = self.store.focus()
        if focus:
            self.focus_label.configure(text='🎯 ' + focus)
            if not self.focus_label.winfo_ismapped():
                self.focus_label.pack(fill='x', padx=10, pady=(8, 0))
        elif self.focus_label.winfo_ismapped():
            self.focus_label.pack_forget()

        if self.store.error:
            self.add_message(self.store.error)
            return
        if not tasks:
            self.add_message('今日やることはまだありません。\n下の欄から追加できます。')

        for task in tasks:
            self.add_row(task)
            if self.follow_up_for == task.get('id'):
                self.add_follow_up_row(task)

        # 今日のリストにないけれど、期限が迫っているもの
        listed = {t.get('id') for t in tasks}
        upcoming = [(left, t) for left, t in self.store.due_tasks(within_hours=24)
                    if t.get('id') not in listed]
        if upcoming:
            head = tk.Label(self.list_frame, text='⏰ 期限が近いもの',
                            bg=c['bg'], fg=c['q1'], font=self.f_small, anchor='w', pady=6)
            head.pack(fill='x')
            self.row_widgets.append(head)
            for _left, task in upcoming[:5]:
                self.add_row(task, due_only=True)
        self.on_list_resize()

    def add_message(self, text):
        label = tk.Label(self.list_frame, text=text, bg=self.c['bg'], fg=self.c['muted'],
                         font=self.f_small, justify='center', pady=14,
                         wraplength=WIDTH - 60)
        label.pack(fill='x')
        self.row_widgets.append(label)

    def pull_into_today(self, task_id):
        def mutate(payload):
            for task in payload.get('tasks', []):
                if task.get('id') == task_id:
                    task['today'] = today_key()
                    break
        self.store.update(mutate)
        self.refresh(force=True)

    def add_row(self, task, due_only=False):
        c = self.c
        done = bool(task.get('completed'))
        color = c[quadrant_of(task)] if not task.get('inbox') else c['muted']
        task_id = task.get('id')

        row = tk.Frame(self.list_frame, bg=c['row'], highlightthickness=0)
        row.pack(fill='x', pady=3)
        self.row_widgets.append(row)

        tk.Frame(row, bg=color if not done else c['line'], width=3).pack(side='left', fill='y')

        check = tk.Label(row, text='✓' if done else '○', bg=c['row'],
                         fg=color if done else c['muted'],
                         font=self.f_title, padx=7, cursor='hand2')
        check.pack(side='left')
        check.bind('<Button-1>', lambda _e, i=task_id: self.toggle_done(i))

        if due_only:
            pull = tk.Label(row, text='今日', bg=c['row'], fg=c['accent'],
                            font=self.f_small, padx=6, cursor='hand2')
            pull.pack(side='right')
            pull.bind('<Button-1>', lambda _e, i=task_id: self.pull_into_today(i))
        elif not done:
            next_btn = tk.Label(row, text='＋次', bg=c['row'], fg=c['muted'],
                                font=self.f_small, padx=6, cursor='hand2')
            next_btn.pack(side='right')
            next_btn.bind('<Button-1>', lambda _e, i=task_id: self.start_follow_up(i))
            next_btn.bind('<Enter>', lambda _e, b=next_btn: b.configure(fg=c['accent']))
            next_btn.bind('<Leave>', lambda _e, b=next_btn: b.configure(fg=c['muted']))

        text = tk.Frame(row, bg=c['row'])
        text.pack(side='left', fill='x', expand=True, pady=5)
        prefix = '↳ ' if task.get('parentId') else ''
        title = tk.Label(text, text=prefix + str(task.get('title', '')), bg=c['row'],
                         fg=c['muted'] if done else c['text'], font=self.f_body,
                         anchor='w', justify='left', wraplength=WIDTH - 110)
        title.pack(fill='x')
        if done:
            title.configure(font=self.f_done)

        bits = []
        if not task.get('inbox'):
            bits.append('第' + QUADRANT_SHORT[quadrant_of(task)])
        label, warn = deadline_label(task)
        if label and not done:
            bits.append(label)
            if due_only:
                warn = True
        if bits:
            sub = tk.Label(text, text='  '.join(bits), bg=c['row'],
                           fg=c['q1'] if warn and not done else c['muted'],
                           font=self.f_small, anchor='w')
            sub.pack(fill='x')

    def add_follow_up_row(self, task):
        c = self.c
        row = tk.Frame(self.list_frame, bg=c['bg'])
        row.pack(fill='x', padx=(16, 0), pady=(0, 3))
        self.row_widgets.append(row)
        tk.Label(row, text='↳', bg=c['bg'], fg=c['accent'], font=self.f_body).pack(side='left')

        var = tk.StringVar()
        entry = tk.Entry(row, textvariable=var, bg=c['row'], fg=c['text'],
                         insertbackground=c['text'], relief='flat', font=self.f_body)
        entry.pack(side='left', fill='x', expand=True, ipady=4, padx=4)
        entry.focus_set()
        parent_id = task.get('id')
        entry.bind('<Return>', lambda _e: self.add_task(var.get(), parent_id))
        entry.bind('<Escape>', lambda _e: self.start_follow_up(parent_id))


def self_test():
    """画面を出さずに、読み書きと組み立てを通しで確認する。"""
    import shutil
    temp_dir = tempfile.mkdtemp()
    data = os.path.join(temp_dir, 'tasks_data.json')
    key = today_key()
    sample = {
        'app': 'TimeMatrixTask', 'version': 2,
        'tasks': [
            {'id': 'a', 'title': '書類を出す', 'urgency': 90, 'importance': 90,
             'today': key, 'completed': False, 'category': '仕事'},
            {'id': 'b', 'title': '勉強する', 'urgency': 20, 'importance': 90,
             'today': key, 'completed': False, 'category': '学習'},
            {'id': 'c', 'title': '今日ではない', 'urgency': 20, 'importance': 20,
             'today': None, 'completed': False},
        ],
        'days': {key: {'focus': '企画書を仕上げる'}},
        'theme': {'preset': 'sakura', 'bg': '#1a0f16', 'surface': '#2e1a27',
                  'text': '#fff4f8', 'accent': '#ff9ec7', 'accent2': '#c7a0ff',
                  'q1': '#ff7a9c', 'q2': '#9ee6e0', 'q3': '#ffd59e', 'q4': '#d4b8ff'},
    }
    with open(data, 'w', encoding='utf-8') as handle:
        json.dump(sample, handle, ensure_ascii=False)

    global DATA_PATH, STATE_PATH
    DATA_PATH = data
    STATE_PATH = os.path.join(temp_dir, 'state.json')

    results = []
    root = tk.Tk()
    root.withdraw()
    store = Store(data)
    widget = Widget(root, store)
    root.update()

    results.append(('今日のタスクだけ出る', len(store.today_tasks()) == 2))
    results.append(('テーマを読む', store.theme()['accent'] == '#ff9ec7'))
    results.append(('いちばん大事なこと', store.focus() == '企画書を仕上げる'))

    widget.toggle_done('a')
    root.update()
    saved = json.load(open(data, encoding='utf-8'))
    task_a = [t for t in saved['tasks'] if t['id'] == 'a'][0]
    results.append(('完了が保存される', task_a['completed'] and task_a['completedAt']))
    results.append(('完了したら次の入力が出る', widget.follow_up_for == 'a'))
    results.append(('他のキーが消えない', saved.get('theme', {}).get('preset') == 'sakura'
                    and saved['days'][key]['focus'] == '企画書を仕上げる'))

    widget.add_task('先方へ送付する', 'a')
    root.update()
    saved = json.load(open(data, encoding='utf-8'))
    added = saved['tasks'][0]
    results.append(('次にやることが今日に入る', added['today'] == key))
    results.append(('親とつながる', added['parentId'] == 'a'))
    results.append(('領域を引き継ぐ', added['urgency'] == 75 and added['importance'] == 75))

    widget.add_task('買い物')
    root.update()
    results.append(('単独の追加は未仕分け', json.load(open(data, encoding='utf-8'))['tasks'][0]['inbox']))
    results.append(('一覧に反映される', len(store.today_tasks()) == 4))

    # 外から書き換えたら拾うか
    saved = json.load(open(data, encoding='utf-8'))
    saved['tasks'].append({'id': 'z', 'title': '外から追加', 'urgency': 60,
                           'importance': 60, 'today': key, 'completed': False})
    with open(data, 'w', encoding='utf-8') as handle:
        json.dump(saved, handle, ensure_ascii=False)
    os.utime(data, (store.mtime + 5, store.mtime + 5))
    results.append(('外部の変更を拾う', store.reload()))

    widget.toggle_collapse()
    root.update()
    widget.toggle_collapse()
    root.update()
    results.append(('たたむ・戻すが動く', not widget.collapsed))

    # --- 期限のお知らせ ---
    widget.notify = lambda *a, **kw: None          # 通知は出さない
    sent = []
    widget.announce = lambda items: sent.append([t.get('title') for _, t in items])

    soon = datetime.now() + timedelta(minutes=8)
    overdue = datetime.now() - timedelta(hours=2)
    far = datetime.now() + timedelta(days=3)
    store.update(lambda payload: payload['tasks'].extend([
        {'id': 'soon', 'title': '提出が近い', 'urgency': 80, 'importance': 80,
         'today': None, 'completed': False, 'deadline': soon.isoformat(timespec='minutes')},
        {'id': 'over', 'title': '過ぎている', 'urgency': 80, 'importance': 80,
         'today': None, 'completed': False, 'deadline': overdue.isoformat(timespec='minutes')},
        {'id': 'far', 'title': 'まだ先', 'urgency': 80, 'importance': 80,
         'today': None, 'completed': False, 'deadline': far.isoformat(timespec='minutes')},
    ]))
    due = {t.get('id') for _, t in store.due_tasks(within_hours=24)}
    results.append(('近い期限を拾う', 'soon' in due and 'over' in due))
    results.append(('遠い期限は拾わない', 'far' not in due))

    widget.check_deadlines()
    root.update()
    results.append(('期限を知らせる', bool(sent) and '提出が近い' in sent[0]))

    before = len(sent)
    widget.check_deadlines()
    root.update()
    results.append(('同じ知らせを繰り返さない', len(sent) == before))

    results.append(('未完了だけ見る',
                    all(not t.get('completed') for _, t in store.due_tasks())))

    widget.pull_into_today('soon')
    root.update()
    pulled = [t for t in json.load(open(data, encoding='utf-8'))['tasks'] if t['id'] == 'soon'][0]
    results.append(('期限のものを今日へ入れられる', pulled['today'] == key))

    widget.show_banner('あと1分', ['提出が近い'])
    root.update()
    results.append(('お知らせ帯が出る', widget.alert_banner is not None))
    widget.hide_banner()
    root.update()
    results.append(('お知らせ帯を消せる', widget.alert_banner is None))

    root.destroy()
    shutil.rmtree(temp_dir, ignore_errors=True)

    width = max(len(name) for name, _ in results)
    for name, ok in results:
        print(f'{"OK  " if ok else "NG  "}{name.ljust(width)}')
    print('\n' + ('すべて成功' if all(ok for _, ok in results) else '失敗あり'))
    return 0 if all(ok for _, ok in results) else 1


SINGLE_INSTANCE_PORT = 8731
_instance_lock = None


def claim_single_instance():
    """二重起動を防ぐ。すでに動いていれば False。"""
    global _instance_lock
    _instance_lock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        _instance_lock.bind(('127.0.0.1', SINGLE_INSTANCE_PORT))
        _instance_lock.listen(1)
        return True
    except OSError:
        _instance_lock.close()
        _instance_lock = None
        return False


def main():
    if '--selftest' in sys.argv:
        return self_test()
    if not claim_single_instance():
        return 0            # もう出ている
    root = tk.Tk()
    store = Store(DATA_PATH)
    Widget(root, store)
    root.mainloop()
    return 0


if __name__ == '__main__':
    sys.exit(main())
