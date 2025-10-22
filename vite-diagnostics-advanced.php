<?php
/**
 * Advanced Vite Manifest Diagnostic
 * This script checks Laravel's Vite helper directly
 */

// Include Laravel's bootstrap
require_once __DIR__ . '/vendor/autoload.php';

// Try to bootstrap Laravel minimally
$app = require_once __DIR__ . '/bootstrap/app.php';

try {
    $app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
    
    echo "<h1>Advanced Vite Diagnostics</h1>";
    echo "<style>body{font-family:Arial,sans-serif;margin:20px;} .success{color:green;} .error{color:red;} .info{color:blue;} pre{background:#f5f5f5;padding:10px;border-radius:5px;}</style>";
    
    // Get Vite instance
    $vite = app('Illuminate\Foundation\Vite');
    
    echo "<h2>1. Laravel Vite Configuration</h2>";
    
    // Check build path
    $buildPath = public_path('build');
    echo "<p class='info'>Build path: $buildPath</p>";
    echo "<p>Exists: " . (is_dir($buildPath) ? "✓ Yes" : "✗ No") . "</p>";
    
    // Check manifest path
    $manifestPath = $buildPath . '/manifest.json';
    echo "<p class='info'>Manifest path: $manifestPath</p>";
    echo "<p>Exists: " . (file_exists($manifestPath) ? "✓ Yes" : "✗ No") . "</p>";
    
    if (file_exists($manifestPath)) {
        $manifest = json_decode(file_get_contents($manifestPath), true);
        echo "<p>Valid JSON: " . ($manifest ? "✓ Yes" : "✗ No") . "</p>";
        
        if ($manifest) {
            echo "<h3>Available entries in manifest:</h3>";
            echo "<ul>";
            foreach (array_keys($manifest) as $key) {
                echo "<li>$key</li>";
            }
            echo "</ul>";
            
            echo "<h3>Looking for app.tsx entry:</h3>";
            if (isset($manifest['resources/js/app.tsx'])) {
                echo "<p class='success'>✓ Found: resources/js/app.tsx</p>";
                echo "<pre>" . json_encode($manifest['resources/js/app.tsx'], JSON_PRETTY_PRINT) . "</pre>";
            } else {
                echo "<p class='error'>✗ Not found: resources/js/app.tsx</p>";
                
                // Look for similar entries
                foreach (array_keys($manifest) as $key) {
                    if (strpos($key, 'app.tsx') !== false) {
                        echo "<p class='info'>Found similar: $key</p>";
                    }
                }
            }
        }
    }
    
    echo "<h2>2. Try Vite Helper</h2>";
    
    try {
        // This is what Laravel does internally
        $viteHelper = \Illuminate\Support\Facades\Vite::class;
        echo "<p class='info'>Vite helper class: $viteHelper</p>";
        
        // Try to get the manifest
        $reflection = new ReflectionClass($viteHelper);
        if ($reflection->hasMethod('manifestHash')) {
            echo "<p class='info'>Manifest hash available</p>";
        }
        
    } catch (Exception $e) {
        echo "<p class='error'>Error with Vite helper: " . $e->getMessage() . "</p>";
    }
    
    echo "<h2>3. Environment Check</h2>";
    echo "<p>APP_ENV: " . config('app.env') . "</p>";
    echo "<p>APP_DEBUG: " . (config('app.debug') ? 'true' : 'false') . "</p>";
    echo "<p>APP_URL: " . config('app.url') . "</p>";
    
    echo "<h2>4. File System Check</h2>";
    $buildFiles = glob($buildPath . '/*');
    echo "<p>Files in build directory:</p><ul>";
    foreach ($buildFiles as $file) {
        $fileName = basename($file);
        $isReadable = is_readable($file);
        echo "<li>$fileName " . ($isReadable ? "(readable)" : "(NOT readable)") . "</li>";
    }
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<h1 style='color:red;'>Laravel Bootstrap Error</h1>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
    echo "<p>This might indicate a configuration issue.</p>";
}
?>