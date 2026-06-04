// Generate timestamp and run electron-builder with BUILD_TIME env var.
// Uses spawnSync to avoid shell injection and argument splitting issues.
const { spawnSync } = require('child_process');
const path = require('path');

const now = new Date();
const pad = (n) => String(Math.floor(n)).padStart(2, '0');
const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
console.log(`Build timestamp: ${ts}`);

// Run electron-builder CLI directly via node (avoids shell and .cmd issues on Windows)
const electronBuilderCli = path.join(__dirname, '..', 'node_modules', 'electron-builder', 'cli.js');
const args = [electronBuilderCli, ...process.argv.slice(2)];

const result = spawnSync(process.execPath, args, {
  stdio: 'inherit',
  env: { ...process.env, BUILD_TIME: ts },
  timeout: 10 * 60 * 1000 // 10 minutes — prevents indefinite hang on network stall
});

if (result.error) {
  // spawnSync itself failed (command not found, out of memory, etc.)
  console.error('Failed to launch electron-builder:', result.error.message);
  process.exit(1);
}

if (result.signal) {
  // Process was killed by a signal (SIGKILL, OOM, etc.)
  console.error(`electron-builder killed by signal: ${result.signal}`);
  process.exit(128 + (result.signal === 'SIGKILL' ? 9 : 1));
}

// Propagate electron-builder's actual exit code
process.exit(result.status);
