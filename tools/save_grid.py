"""Simple HTTP endpoint to save grid calibration data."""
import http.server
import json
import os
import sys

GRID_FILE = os.path.join(os.path.dirname(__file__), 'calibrated_grids.json')

class GridSaver(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/grids':
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            if os.path.exists(GRID_FILE):
                with open(GRID_FILE, 'r') as f:
                    self.wfile.write(f.read().encode())
            else:
                self.wfile.write(b'{}')

    def do_POST(self):
        if self.path == '/save_grid':
            length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(length))

            # Load existing data
            existing = {}
            if os.path.exists(GRID_FILE):
                with open(GRID_FILE, 'r') as f:
                    existing = json.load(f)

            # Merge new grid
            scene_id = data.get('sceneId')
            existing[scene_id] = data.get('gridData')

            with open(GRID_FILE, 'w') as f:
                json.dump(existing, f, indent=2, ensure_ascii=False)

            print(f'Saved grid for: {scene_id}')

            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': True, 'scene': scene_id}).encode())

if __name__ == '__main__':
    port = 8900
    print(f'Grid saver listening on http://localhost:{port}/save_grid')
    http.server.HTTPServer(('localhost', port), GridSaver).serve_forever()
