"""Matrix Hub ローカルサーバー

ブラウザの「フォルダ連携」を毎回やり直さなくて済むように、
tasks_data.json をこのサーバー経由で読み書きする。

  GET  /api/ping   起動確認
  GET  /api/data   tasks_data.json の中身
  GET  /api/stamp  最終更新時刻（外部の変更を見張る用）
  PUT  /api/data   保存（読み直し不要・原子的な置き換え＋1世代バックアップ）

起動: start-matrix-hub.bat （または pythonw server.py）
127.0.0.1 からの接続だけを受け付ける。
"""

import json
import os
import shutil
import socket
import sys
import tempfile
import threading
import time
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import urlopen

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'tasks_data.json')
LOG_PATH = os.path.join(BASE_DIR, 'server.log')
HOST = '127.0.0.1'
PORT = 8730
MAX_BODY = 20 * 1024 * 1024
APP_MARK = 'TimeMatrixTask'

write_lock = threading.Lock()


def log(message):
    line = f'{datetime.now().strftime("%Y-%m-%d %H:%M:%S")} {message}\n'
    try:
        with open(LOG_PATH, 'a', encoding='utf-8') as handle:
            handle.write(line)
    except OSError:
        pass


def file_stamp():
    try:
        return os.path.getmtime(DATA_PATH)
    except OSError:
        return 0


def write_data(payload):
    """一時ファイルに書いてから置き換える。直前の内容は1世代だけ残す。"""
    with write_lock:
        handle, tmp = tempfile.mkstemp(dir=BASE_DIR, suffix='.tmp')
        try:
            with os.fdopen(handle, 'w', encoding='utf-8') as out:
                json.dump(payload, out, ensure_ascii=False, indent=2)
            if os.path.exists(DATA_PATH):
                try:
                    shutil.copyfile(DATA_PATH, DATA_PATH + '.bak')
                except OSError:
                    pass
            os.replace(tmp, DATA_PATH)
        except BaseException:
            if os.path.exists(tmp):
                os.unlink(tmp)
            raise
    return file_stamp()


class Handler(SimpleHTTPRequestHandler):
    server_version = 'MatrixHub/1.0'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    # --- 共通 ---
    def log_message(self, fmt, *args):      # コンソールには出さない
        pass

    def local_only(self):
        if self.client_address[0] in ('127.0.0.1', '::1'):
            return True
        self.send_error(403, 'local only')
        return False

    def send_json(self, obj, status=200, stamp=None):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        if stamp is not None:
            self.send_header('X-Data-Stamp', str(stamp))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        # アプリ本体を更新したとき、古いものが残らないように
        if self.path.endswith(('.html', '.js', '.css', '/')):
            self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

    # --- GET ---
    def do_GET(self):
        if not self.local_only():
            return
        route = self.path.split('?')[0]
        if route == '/api/ping':
            self.send_json({'app': APP_MARK, 'pid': os.getpid(), 'data': DATA_PATH})
            return
        if route == '/api/stamp':
            self.send_json({'stamp': file_stamp()})
            return
        if route == '/api/data':
            stamp = file_stamp()
            if not stamp:
                self.send_json({'app': APP_MARK, 'version': 2, 'tasks': [], 'days': {}}, stamp=0)
                return
            try:
                with open(DATA_PATH, encoding='utf-8') as handle:
                    raw = handle.read()
            except OSError as exc:
                log(f'read error: {exc}')
                self.send_json({'error': str(exc)}, status=500)
                return
            body = raw.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Data-Stamp', str(stamp))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    # --- PUT（保存） ---
    def do_PUT(self):
        if not self.local_only():
            return
        if self.path.split('?')[0] != '/api/data':
            self.send_error(404)
            return
        length = int(self.headers.get('Content-Length') or 0)
        if length <= 0 or length > MAX_BODY:
            self.send_json({'error': 'bad length'}, status=400)
            return
        try:
            payload = json.loads(self.rfile.read(length).decode('utf-8'))
        except (ValueError, UnicodeDecodeError) as exc:
            self.send_json({'error': f'bad json: {exc}'}, status=400)
            return
        if not isinstance(payload, dict) or not isinstance(payload.get('tasks'), list):
            self.send_json({'error': 'tasks がありません'}, status=400)
            return
        try:
            stamp = write_data(payload)
        except OSError as exc:
            log(f'write error: {exc}')
            self.send_json({'error': str(exc)}, status=500)
            return
        self.send_json({'ok': True, 'stamp': stamp, 'tasks': len(payload['tasks'])})

    # ページを閉じる瞬間の保存（sendBeacon）は POST で来る
    do_POST = do_PUT


def already_running():
    """同じサーバーがもう動いていれば True。"""
    try:
        with urlopen(f'http://{HOST}:{PORT}/api/ping', timeout=1.5) as response:
            return json.load(response).get('app') == APP_MARK
    except Exception:
        return False


def main():
    if '--selftest' in sys.argv:
        return self_test()

    global PORT
    if '--port' in sys.argv:                      # 検証用に別ポートでも動かせる
        PORT = int(sys.argv[sys.argv.index('--port') + 1])

    try:
        server = ThreadingHTTPServer((HOST, PORT), Handler)
    except OSError:
        if already_running():
            log('already running - nothing to do')
            return 0
        log(f'port {PORT} is used by something else')
        print(f'ポート {PORT} は別のアプリが使っています。', file=sys.stderr)
        return 1

    server.daemon_threads = True
    log(f'started on http://{HOST}:{PORT}/ (pid {os.getpid()})')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        log('stopped')
    return 0


def self_test():
    """実データには触らず、一時フォルダで読み書きを通しで確認する。"""
    global BASE_DIR, DATA_PATH, LOG_PATH, PORT
    import urllib.error
    import urllib.request

    temp = tempfile.mkdtemp()
    BASE_DIR = temp
    DATA_PATH = os.path.join(temp, 'tasks_data.json')
    LOG_PATH = os.path.join(temp, 'server.log')
    PORT = 8799

    sample = {'app': APP_MARK, 'version': 2,
              'tasks': [{'id': 'a', 'title': 'テスト', 'today': '2026-11-03'}],
              'days': {'2026-11-03': {'focus': '集中'}},
              'theme': {'preset': 'sakura'}}
    with open(DATA_PATH, 'w', encoding='utf-8') as handle:
        json.dump(sample, handle, ensure_ascii=False)
    with open(os.path.join(temp, 'index.html'), 'w', encoding='utf-8') as handle:
        handle.write('<!DOCTYPE html><title>hub</title>')

    server = ThreadingHTTPServer((HOST, PORT), Handler)
    server.daemon_threads = True
    threading.Thread(target=server.serve_forever, daemon=True).start()
    time.sleep(0.3)
    base = f'http://{HOST}:{PORT}'
    results = []

    def get(path):
        with urllib.request.urlopen(base + path, timeout=3) as response:
            return response.status, response.headers, response.read().decode('utf-8')

    status, _, body = get('/api/ping')
    results.append(('起動確認', status == 200 and json.loads(body)['app'] == APP_MARK))

    status, headers, body = get('/api/data')
    data = json.loads(body)
    results.append(('データを返す', status == 200 and data['tasks'][0]['id'] == 'a'))
    results.append(('更新時刻を返す', float(headers['X-Data-Stamp']) > 0))
    results.append(('テーマも残る', data['theme']['preset'] == 'sakura'))

    status, _, body = get('/index.html')
    results.append(('画面も配信する', status == 200 and 'hub' in body))

    data['tasks'].append({'id': 'b', 'title': '追加した', 'today': '2026-11-03'})
    request = urllib.request.Request(base + '/api/data', method='PUT',
                                     data=json.dumps(data, ensure_ascii=False).encode('utf-8'),
                                     headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(request, timeout=3) as response:
        saved = json.load(response)
    results.append(('保存できる', saved['ok'] and saved['tasks'] == 2))

    on_disk = json.load(open(DATA_PATH, encoding='utf-8'))
    results.append(('ファイルに書かれる', len(on_disk['tasks']) == 2))
    results.append(('日々の記録が残る', on_disk['days']['2026-11-03']['focus'] == '集中'))
    results.append(('バックアップが残る', os.path.exists(DATA_PATH + '.bak')))

    bad = urllib.request.Request(base + '/api/data', method='PUT', data=b'{"nope":1}',
                                 headers={'Content-Type': 'application/json'})
    try:
        urllib.request.urlopen(bad, timeout=3)
        results.append(('おかしな保存は断る', False))
    except urllib.error.HTTPError as exc:
        results.append(('おかしな保存は断る', exc.code == 400))
    results.append(('断った後も無事', len(json.load(open(DATA_PATH, encoding='utf-8'))['tasks']) == 2))

    status, _, body = get('/api/stamp')
    results.append(('更新時刻だけ取れる', json.loads(body)['stamp'] > 0))

    server.shutdown()
    shutil.rmtree(temp, ignore_errors=True)

    width = max(len(name) for name, _ in results)
    for name, ok in results:
        print(('OK  ' if ok else 'NG  ') + name.ljust(width))
    print('\n' + ('すべて成功' if all(ok for _, ok in results) else '失敗あり'))
    return 0 if all(ok for _, ok in results) else 1


if __name__ == '__main__':
    sys.exit(main())
