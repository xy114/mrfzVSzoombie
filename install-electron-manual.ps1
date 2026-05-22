# 手动下载并安装 Electron
$ErrorActionPreference = "Stop"

$electronVersion = "42.2.0"
$downloadUrl = "https://npmmirror.com/mirrors/electron/v$electronVersion/electron-v$electronVersion-win32-x64.zip"
$tempDir = "E:\clone\mrfzVSzoombie\.electron-cache"
$zipFile = "$tempDir\electron-v$electronVersion-win32-x64.zip"
$extractDir = "E:\clone\mrfzVSzoombie\node_modules\electron\dist"
$pathFile = "E:\clone\mrfzVSzoombie\node_modules\electron\path.txt"

Write-Host "正在创建目录..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
New-Item -ItemType Directory -Force -Path $extractDir | Out-Null

Write-Host "正在下载 Electron $electronVersion..." -ForegroundColor Green
Write-Host "下载地址: $downloadUrl" -ForegroundColor Cyan

try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile -UseBasicParsing
    Write-Host "下载完成!" -ForegroundColor Green
} catch {
    Write-Host "下载失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host "正在解压..." -ForegroundColor Green
Expand-Archive -Path $zipFile -DestinationPath $extractDir -Force

Write-Host "创建 path.txt..." -ForegroundColor Green
"electron.exe" | Out-File -FilePath $pathFile -Encoding utf8 -NoNewline

Write-Host "清理临时文件..." -ForegroundColor Green
Remove-Item -Path $zipFile -Force

Write-Host "Electron 安装完成!" -ForegroundColor Green
Write-Host ""
Write-Host "现在可以运行: npm start" -ForegroundColor Yellow
