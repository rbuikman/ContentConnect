# IIS Deployment Checklist for ContentConnect

## Server Prerequisites
- [ ] IIS with PHP support installed
- [ ] PHP 8.1+ configured in IIS
- [ ] URL Rewrite Module installed
- [ ] Composer installed on server
- [ ] Microsoft Visual C++ Redistributable installed

## Application Setup
- [ ] Copy application files to IIS directory (usually C:\inetpub\wwwroot\contentconnnect)
- [ ] Set IIS document root to `/public` folder
- [ ] Copy `.env.example` to `.env` and configure
- [ ] Run `composer install --optimize-autoloader --no-dev`
- [ ] Run `php artisan key:generate`
- [ ] Run `php artisan config:cache`
- [ ] Run `php artisan route:cache`
- [ ] Run `php artisan view:cache`

## IIS Configuration
- [ ] Create new IIS site pointing to `/public` directory
- [ ] Set PHP as default document handler
- [ ] Configure PHP execution permissions
- [ ] Set proper folder permissions for storage and bootstrap/cache

## File Permissions (Windows)
Set permissions for IIS_IUSRS on these folders:
- [ ] `/storage` - Full Control
- [ ] `/bootstrap/cache` - Full Control
- [ ] `/public` - Read & Execute

## Environment Variables (.env)
Update these settings for production:
```
APP_ENV=production
APP_DEBUG=false
APP_URL=http://your-server-domain
DB_HOST=your-database-server
DB_DATABASE=your-database-name
DB_USERNAME=your-database-user
DB_PASSWORD=your-database-password
```

## Database Setup
- [ ] Create database on SQL Server/MySQL
- [ ] Update database connection in .env
- [ ] Run `php artisan migrate`
- [ ] Run `php artisan db:seed` (if needed)

## Final Steps
- [ ] Test the application in browser
- [ ] Check Laravel logs for any errors
- [ ] Configure scheduled tasks if needed
- [ ] Set up SSL certificate (recommended)