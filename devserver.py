#!/usr/bin/env python3
"""本機預覽用的靜態伺服器。

跟 `python3 -m http.server` 的差別只有一個：一律送 no-store。
瀏覽器對 ES module 的快取很黏，改了程式卻載到舊的會很難查。
正式站在 GitHub Pages 上，快取由 Pages 自己處理，不會用到這支。

    python3 devserver.py [port]
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

MIME_EXTRA = {
    '.webp': 'image/webp',
    '.mjs': 'text/javascript',
    '.js': 'text/javascript',
}


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def guess_type(self, path):
        for ext, mime in MIME_EXTRA.items():
            if str(path).endswith(ext):
                return mime
        return super().guess_type(path)

    def log_message(self, fmt, *args):
        # 只留錯誤，正常請求不洗版
        if args and str(args[1]).startswith(('4', '5')):
            super().log_message(fmt, *args)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    handler = partial(NoCacheHandler, directory=str(__file__).rsplit('/', 1)[0])
    print(f'http://localhost:{port}')
    ThreadingHTTPServer(('127.0.0.1', port), handler).serve_forever()
