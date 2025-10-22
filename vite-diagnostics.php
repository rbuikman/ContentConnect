<?php
/**
 * Production Deployment Diagnostic Script
 * Run this on your production server to verify Vite manifest and assets
 * 
 * Usage: Copy this to C:\inetpub\wwwroot\ and access via browser
 * URL: http://your-domain.com/vite-diagnostics.php
 */

header('Content-Type: text/html; charset=utf-8');
echo "<!DOCTYPE html><html><head><title>Vite Asset Diagnostics</title></head><body>";
echo "<h1>Vite Asset Diagnostics</h1>";
echo "<style>body{font-family:Arial,sans-serif;margin:20px;} .success{color:green;} .error{color:red;} .warning{color:orange;} pre{background:#f5f5f5;padding:10px;border-radius:5px;}</style>";

$buildPath = __DIR__ . '/public/build';
$manifestPath = $buildPath . '/manifest.json';

echo "<h2>1. Build Directory Check</h2>";
if (is_dir($buildPath)) {
    echo "<p class='success'>✓ Build directory exists: $buildPath</p>";
    
    // List contents
    $contents = scandir($buildPath);
    echo "<p>Contents: " . implode(', ', array_filter($contents, function($item) { return $item !== '.' && $item !== '..'; })) . "</p>";
} else {
    echo "<p class='error'>✗ Build directory NOT found: $buildPath</p>";
}

echo "<h2>2. Manifest File Check</h2>";
if (file_exists($manifestPath)) {
    echo "<p class='success'>✓ Manifest file exists: $manifestPath</p>";
    
    // Check if readable
    if (is_readable($manifestPath)) {
        echo "<p class='success'>✓ Manifest file is readable</p>";
        
        // Try to parse JSON
        $manifestContent = file_get_contents($manifestPath);
        $manifest = json_decode($manifestContent, true);
        
        if ($manifest !== null) {
            echo "<p class='success'>✓ Manifest JSON is valid</p>";
            
            // Check for app.tsx entry
            if (isset($manifest['resources/js/app.tsx'])) {
                echo "<p class='success'>✓ app.tsx entry found in manifest</p>";
                $appEntry = $manifest['resources/js/app.tsx'];
                echo "<p>App entry details:</p><pre>" . json_encode($appEntry, JSON_PRETTY_PRINT) . "</pre>";
                
                // Check if the actual JS file exists
                $jsFile = $buildPath . '/' . $appEntry['file'];
                if (file_exists($jsFile)) {
                    echo "<p class='success'>✓ App JS file exists: " . $appEntry['file'] . "</p>";
                } else {
                    echo "<p class='error'>✗ App JS file NOT found: " . $appEntry['file'] . "</p>";
                }
            } else {
                echo "<p class='error'>✗ app.tsx entry NOT found in manifest</p>";
                echo "<p>Available entries:</p><pre>";
                foreach (array_keys($manifest) as $key) {
                    echo "- $key\n";
                    if (strpos($key, 'app') !== false) {
                        echo "  ^ This looks like an app entry!\n";
                    }
                }
                echo "</pre>";
            }
        } else {
            echo "<p class='error'>✗ Manifest JSON is invalid</p>";
            echo "<p>JSON Error: " . json_last_error_msg() . "</p>";
        }
    } else {
        echo "<p class='error'>✗ Manifest file is not readable (permission issue?)</p>";
    }
} else {
    echo "<p class='error'>✗ Manifest file NOT found: $manifestPath</p>";
}

echo "<h2>3. Laravel Environment Check</h2>";
// Check if this is Laravel environment
if (file_exists(__DIR__ . '/artisan')) {
    echo "<p class='success'>✓ Laravel detected (artisan file found)</p>";
    
    // Check APP_ENV
    if (file_exists(__DIR__ . '/.env')) {
        $envContent = file_get_contents(__DIR__ . '/.env');
        if (preg_match('/APP_ENV\s*=\s*(.+)/', $envContent, $matches)) {
            $appEnv = trim($matches[1]);
            echo "<p>APP_ENV: <strong>$appEnv</strong></p>";
            if ($appEnv === 'production') {
                echo "<p class='success'>✓ Running in production mode</p>";
            } else {
                echo "<p class='warning'>⚠ Not running in production mode</p>";
            }
        }
        
        // Check APP_DEBUG
        if (preg_match('/APP_DEBUG\s*=\s*(.+)/', $envContent, $matches)) {
            $appDebug = trim($matches[1]);
            echo "<p>APP_DEBUG: <strong>$appDebug</strong></p>";
            if (strtolower($appDebug) === 'false') {
                echo "<p class='success'>✓ Debug mode disabled</p>";
            } else {
                echo "<p class='warning'>⚠ Debug mode is enabled</p>";
            }
        }
    }
} else {
    echo "<p class='error'>✗ Laravel NOT detected (no artisan file)</p>";
}

echo "<h2>4. File Permissions Check</h2>";
$testFile = $buildPath . '/test-write.txt';
if (is_writable($buildPath)) {
    echo "<p class='success'>✓ Build directory is writable</p>";
} else {
    echo "<p class='warning'>⚠ Build directory is not writable</p>";
}

echo "<h2>5. Suggested Actions</h2>";
if (!file_exists($manifestPath)) {
    echo "<p class='error'>🔧 CRITICAL: Copy the manifest.json file to production</p>";
}
if (!is_readable($manifestPath)) {
    echo "<p class='error'>🔧 CRITICAL: Fix file permissions for IIS_IUSRS</p>";
}
echo "<p>🔧 Clear Laravel caches with these commands:</p>";
echo "<pre>php artisan cache:clear
php artisan config:clear
php artisan view:clear
php artisan route:clear</pre>";

echo "<hr><p><small>Diagnostic completed at " . date('Y-m-d H:i:s') . "</small></p>";
echo "</body></html>";
?>