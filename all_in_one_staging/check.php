<?php
// check.php - File chẩn đoán và tự động định vị cấu trúc thư mục
header('Content-Type: text/html; charset=UTF-8');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo '<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Chẩn đoán thư mục ThayKinhKPI</title>';
echo '<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 960px; margin: 30px auto; padding: 20px; background: #0f172a; color: #e2e8f0; line-height: 1.6; }
.card { background: #1e293b; border-radius: 12px; padding: 22px; margin-bottom: 22px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border-left: 6px solid #3b82f6; }
.card.ok { border-left-color: #22c55e; }
.card.err { border-left-color: #ef4444; }
.card.warn { border-left-color: #f59e0b; }
h2 { margin-top: 0; font-size: 1.25rem; }
pre { background: #090d16; padding: 14px; border-radius: 8px; overflow-x: auto; color: #38bdf8; font-size: 13px; font-family: Consolas, monospace; }
code { background: #334155; padding: 2px 6px; border-radius: 4px; font-size: 13px; color: #f1f5f9; }
.btn { display: inline-block; padding: 8px 16px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; border: 0; cursor: pointer; }
.btn:hover { background: #1d4ed8; }
</style></head><body>';
echo '<h1 style="color:#60a5fa;border-bottom:2px solid #334155;padding-bottom:14px;">🔍 BẢN ĐỒ VỊ TRÍ THƯ MỤC TRÊN CPANEL</h1>';

// Đường dẫn hiện tại của check.php
$currentDir = __DIR__;
echo '<div class="card ok">';
echo '<h2>1. Vị trí file check.php</h2>';
echo 'Thư mục hiện tại (public_html): <code>' . htmlspecialchars($currentDir) . '</code><br>';
echo '</div>';

// Quét toàn bộ thư mục trong public_html
echo '<div class="card">';
echo '<h2>2. Cây thư mục bên trong public_html</h2>';
function scanDirectoryTree($dir, $depth = 0, $maxDepth = 3) {
    if ($depth > $maxDepth || !is_dir($dir)) return [];
    $result = [];
    $items = scandir($dir);
    foreach ($items as $item) {
        if ($item === '.' || $item === '..' || $item === '.git') continue;
        $path = $dir . '/' . $item;
        if (is_dir($path)) {
            $result[$item . ' (thư mục)'] = scanDirectoryTree($path, $depth + 1, $maxDepth);
        } else {
            $result[] = $item;
        }
    }
    return $result;
}
$tree = scanDirectoryTree($currentDir, 0, 3);
echo '<pre>' . htmlspecialchars(print_r($tree, true)) . '</pre>';
echo '</div>';

// Tìm kiếm Router.php ở bất cứ đâu trong server
echo '<div class="card">';
echo '<h2>3. Tìm kiếm file Router.php ở đâu?</h2>';
$foundPaths = [];
$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($currentDir, RecursiveDirectoryIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST
);
foreach ($iterator as $file) {
    if ($file->getFilename() === 'Router.php') {
        $foundPaths[] = $file->getPathname();
    }
}

// Thử tìm ngoài public_html một cấp (thư mục gốc /home/d0g97w3mqxbj/)
$parentDir = dirname($currentDir);
if (is_dir($parentDir . '/backend')) {
    $parentIterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($parentDir . '/backend', RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    foreach ($parentIterator as $file) {
        if ($file->getFilename() === 'Router.php') {
            $foundPaths[] = $file->getPathname() . ' (NẰM NGOÀI PUBLIC_HTML!)';
        }
    }
}

if (!empty($foundPaths)) {
    echo '<p style="color:#86efac;"><b>ĐÃ TÌM THẤY FILE Router.php TẠI:</b></p>';
    foreach ($foundPaths as $p) {
        echo '👉 <code>' . htmlspecialchars($p) . '</code><br>';
    }
} else {
    echo '<p style="color:#ef4444;"><b>KHÔNG TÌM THẤY file Router.php ở bất cứ đâu!</b></p>';
    echo 'Có thể quá trình giải nén bị lỗi hoặc file zip chưa có file PHP bên trong thư mục Core!';
}
echo '</div>';

echo '</body></html>';
