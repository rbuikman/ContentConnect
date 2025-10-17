@echo off
echo Installing Composer dependencies for production...
composer install --optimize-autoloader --no-dev

echo Generating application key...
php artisan key:generate

echo Caching configuration...
php artisan config:cache

echo Caching routes...
php artisan route:cache

echo Caching views...
php artisan view:cache

echo Running database migrations...
php artisan migrate --force

echo Clearing old caches...
php artisan cache:clear

echo Deployment completed!
echo.
echo Next steps:
echo 1. Configure IIS site to point to /public directory
echo 2. Set proper folder permissions for storage and bootstrap/cache
echo 3. Update .env file with production settings
echo 4. Test the application

pause