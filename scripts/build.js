/**
 * 通用打包脚本
 * 自动注入 BUILD_TIME 环境变量，确保每次打包的文件名包含时间戳
 * 用法: node scripts/build.js [electron-builder 参数]
 */
const { spawnSync } = require('child_process');

// 生成时间戳: YYYYMMDD-HHmm
const now = new Date();
const buildTime = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
  '-',
  String(now.getHours()).padStart(2, '0'),
  String(now.getMinutes()).padStart(2, '0'),
].join('');

// 设置环境变量，注入构建时间戳
const env = { ...process.env, BUILD_TIME: buildTime };

// 获取命令行参数（去掉 node 和脚本路径）
const args = process.argv.slice(2);

console.log(`[build] BUILD_TIME=${buildTime}`);
console.log(`[build] electron-builder ${args.join(' ')}`);

// 执行 electron-builder
const result = spawnSync('npx', ['electron-builder', ...args], {
  env,
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
