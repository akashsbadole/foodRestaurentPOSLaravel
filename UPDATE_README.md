# InfoShop Update System Guide

This comprehensive guide covers the update functionality of InfoShop, including both the legacy V1 system and the current V2 system. It provides detailed instructions for updating your InfoShop installation safely and efficiently.

## Table of Contents

1. [Introduction to InfoShop's Update System](#introduction)
2. [Overview of V1 (Legacy) and V2 (Current) Update Systems](#v1-vs-v2)
3. [Prerequisites and System Requirements](#prerequisites)
4. [Step-by-Step Update Process](#update-process)
5. [Update Package Structure and Requirements](#package-structure)
6. [Configuration Requirements](#configuration)
7. [Troubleshooting Common Update Issues](#troubleshooting)
8. [Security Considerations](#security)
9. [Advanced Features](#advanced-features)
10. [API Endpoints for Automated Updates](#api-endpoints)

---

## Introduction to InfoShop's Update System <a name="introduction"></a>

InfoShop features a robust update system designed to safely upgrade your installation with minimal downtime. The system includes:

- **Automated package extraction and deployment**
- **Database migration support**
- **Built-in backup functionality**
- **Maintenance mode support**
- **Rollback capabilities**
- **Web-based and API-based update methods**

The current version of InfoShop uses an improved V2 update system that provides enhanced security, better error handling, and more reliable rollback capabilities compared to the legacy V1 system.

---

## Overview of V1 (Legacy) and V2 (Current) Update Systems <a name="v1-vs-v2"></a>

### V1 (Legacy) Update System

The V1 system was the original update implementation with the following characteristics:

- **Simple ZIP extraction**: Directly extracts and overwrites files
- **SQL file execution**: Executes a `database.sql` file if present in the update package
- **Basic error handling**: Limited error reporting and recovery options
- **No automatic rollback**: Failed updates required manual restoration

### V2 (Current) Update System

The V2 system is the current recommended update approach with significant improvements:

- **Migration-based updates**: Uses Laravel migrations instead of raw SQL files
- **Pre-flight checks**: Validates system requirements before starting the update
- **Automatic backup**: Creates a complete backup before applying updates
- **Enhanced error handling**: Detailed error reporting with automatic rollback on failure
- **Maintenance mode**: Automatically enables maintenance mode during updates
- **Structured logging**: Comprehensive logging of the update process

**Recommendation**: Always use the V2 update system when possible, as it provides a much safer and more reliable update experience.

---

## Prerequisites and System Requirements <a name="prerequisites"></a>

### Minimum System Requirements

- **PHP Version**: 8.2 or higher
- **MySQL/MariaDB**: 5.7+ or 10.2+ respectively
- **Required PHP Extensions**:
  - `zip` (for package extraction)
  - `pdo_mysql` (for database connectivity)
  - `fileinfo` (for file handling)
  - `openssl` (for security features)

### Disk Space Requirements

- **Minimum Free Space**: 100MB for update process
- **Additional Space**: 2x the size of your current installation for backups

### File Permissions

The following directories must be writable by the web server:

```
app/
bootstrap/
config/
database/
public/
resources/
routes/
storage/
vendor/ (if present)
```

### Database Requirements

- **Database Connection**: Active with proper credentials
- **Permissions**: ALTER, CREATE, DELETE, DROP, INDEX, INSERT, SELECT, UPDATE
- **Storage Engine**: InnoDB must be available

---

## Step-by-Step Update Process <a name="update-process"></a>

### Web-Based Update (Recommended)

#### V2 Update Process (Current)

1. **Access the Update Interface**
   ```
   https://your-domain.com/maintenance
   ```

2. **Upload Update Package**
   - Click "Browse" and select the update ZIP file
   - Ensure the file is less than 50MB
   - Click "Upload and Update"

3. **Automatic Process**
   - System performs pre-flight checks
   - Maintenance mode is enabled
   - Backup is created automatically
   - Update package is validated
   - Files are extracted and deployed
   - Database migrations are executed
   - Caches are cleared
   - Maintenance mode is disabled

4. **Review Results**
   - Check for any error messages
   - Verify the application functions correctly
   - Confirm the version has been updated

#### V1 Update Process (Legacy)

1. **Access the Update Interface**
   ```
   https://your-domain.com/update
   ```

2. **Upload Update Package**
   - Select the ZIP file containing the update
   - Click "Upload"

3. **Manual Process**
   - Files are extracted and overwritten
   - SQL file is executed if present (no validation)
   - Manual cache clearing may be required

### API-Based Update (Automated)

#### V2 API Update

```bash
curl -X POST "https://your-domain.com/api/application-update-v2" \
  -H "Content-Type: multipart/form-data" \
  -F "update_token=YOUR_UPDATE_TOKEN" \
  -F "zip_file=@/path/to/update.zip"
```

#### V1 API Update

```bash
curl -X POST "https://your-domain.com/api/application-update" \
  -H "Content-Type: multipart/form-data" \
  -F "update_token=YOUR_UPDATE_TOKEN" \
  -F "zip_file=@/path/to/update.zip"
```

### Manual Update (Advanced Users)

For environments where web-based updates aren't possible:

1. **Download the Update Package**
   - Obtain the ZIP file from the official source
   - Verify the integrity if checksum is provided

2. **Create Manual Backup**
   ```bash
   # Backup database
   mysqldump -u username -p database_name > backup.sql
   
   # Backup files
   cp -r /path/to/infoshop /path/to/backup/infoshop_backup_$(date +%Y%m%d)
   ```

3. **Extract Update Package**
   ```bash
   unzip update.zip -d /path/to/temp_extract/
   ```

4. **Copy Files**
   ```bash
   # Copy required directories
   cp -r /path/to/temp_extract/app /path/to/infoshop/
   cp -r /path/to/temp_extract/bootstrap /path/to/infoshop/
   cp -r /path/to/temp_extract/config /path/to/infoshop/
   cp -r /path/to/temp_extract/database /path/to/infoshop/
   cp -r /path/to/temp_extract/resources /path/to/infoshop/
   cp -r /path/to/temp_extract/routes /path/to/infoshop/
   
   # Handle public directory carefully
   cp -r /path/to/temp_extract/public/* /path/to/infoshop/public/
   ```

5. **Run Migrations (V2)**
   ```bash
   php artisan migrate --force
   ```

6. **Clear Caches**
   ```bash
   php artisan cache:clear
   php artisan config:clear
   php artisan route:clear
   php artisan view:clear
   php artisan optimize:clear
   ```

---

## Update Package Structure and Requirements <a name="package-structure"></a>

### V2 Update Package Structure (Recommended)

```
update_package.zip
├── app/              (Required)
├── bootstrap/        (Required)
├── config/           (Required)
├── database/
│   └── migrations/   (Required - contains migration files)
├── resources/        (Required)
├── routes/           (Required)
├── public/           (Optional)
│   ├── build/        (Optional - frontend assets)
│   └── ...           (Other public files)
└── vendor/           (Optional - if changed)
```

### V1 Update Package Structure (Legacy)

```
update_package.zip
├── app/
├── bootstrap/
├── config/
├── database/
├── resources/
├── routes/
├── public/
├── vendor/
└── database.sql      (SQL file for database changes)
```

### Package Requirements

- **Format**: ZIP archive
- **Maximum Size**: 50MB for web uploads
- **Required Folders**: app, bootstrap, config, database, resources, routes
- **Database Changes**: Use Laravel migrations in V2, SQL file in V1
- **Frontend Assets**: Include updated build folder if UI changes are present

---

## Configuration Requirements <a name="configuration"></a>

### UPDATE_TOKEN Configuration

For security, all API-based updates require an UPDATE_TOKEN:

1. **Add to .env file**:
   ```
   UPDATE_TOKEN=your_secure_random_token_here
   ```

2. **Generate a secure token**:
   ```bash
   openssl rand -base64 32
   ```

3. **Use in API calls**:
   Include `update_token` parameter in your API requests

### Database Configuration

Ensure your `.env` file has correct database settings:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### Maintenance Mode Configuration

The update system will automatically enable maintenance mode, but you can customize the behavior:

```env
APP_MAINTENANCE_DRIVER=file
# or
APP_MAINTENANCE_STORE=database
```

---

## Troubleshooting Common Update Issues <a name="troubleshooting"></a>

### Permission Issues

**Problem**: "Permission denied" errors during update

**Solution**:
```bash
# Set proper permissions
chmod -R 755 /path/to/infoshop
chown -R www-data:www-data /path/to/infoshop

# Or for specific directories
chmod -R 755 app/ bootstrap/ config/ database/ public/ resources/ routes/ storage/
```

### Insufficient Disk Space

**Problem**: "Insufficient disk space" error

**Solution**:
- Free up at least 100MB of space
- Clear unnecessary backups and logs
- Consider expanding disk capacity

### Database Connection Issues

**Problem**: "Database connection failed" error

**Solution**:
1. Verify database credentials in `.env`
2. Check database server is running
3. Ensure database user has required permissions
4. Test connection manually:
   ```bash
   php artisan tinker
   DB::connection()->getPdo();
   ```

### Migration Failures

**Problem**: Database migrations fail during V2 update

**Solution**:
1. Check migration status:
   ```bash
   php artisan migrate:status
   ```

2. Run migrations manually to see detailed errors:
   ```bash
   php artisan migrate --force
   ```

3. For rollback (V2 only):
   ```bash
   php artisan migrate:rollback --step=1
   ```

### Timeout Issues

**Problem**: Update process times out

**Solution**:
1. Increase PHP execution time:
   ```ini
   max_execution_time = 300
   ```

2. For web-based updates, try:
   - Using API update method
   - Splitting large updates into smaller packages

### Corrupted Update Package

**Problem**: "Failed to extract ZIP file" error

**Solution**:
1. Re-download the update package
2. Verify file integrity (check file size and checksum if available)
3. Try extracting the ZIP locally first to confirm it's not corrupted

### Frontend Not Updating

**Problem**: Backend updates successfully but frontend shows old version

**Solution**:
1. Clear browser cache
2. Check if build folder was updated in the package
3. Manually clear caches:
   ```bash
   php artisan cache:clear
   php artisan view:clear
   npm run build  # If build tools are used
   ```

---

## Security Considerations <a name="security"></a>

### UPDATE_TOKEN Security

- **Never expose your UPDATE_TOKEN in client-side code**
- **Use a strong, randomly generated token**
- **Rotate the UPDATE_TOKEN periodically**
- **Restrict update endpoints to trusted IP addresses** (if possible)

### Update Package Verification

- **Only download updates from official sources**
- **Verify package integrity if checksums are provided**
- **Scan update packages for malware before deployment**
- **Review update notes for breaking changes**

### Network Security

- **Use HTTPS for all update operations**
- **Consider IP whitelisting for update endpoints**
- **Monitor update API calls in access logs**
- **Implement rate limiting on update endpoints**

### Backup Security

- **Store backups securely**
- **Encrypt sensitive backups if possible**
- **Regularly test backup restoration process**
- **Maintain multiple backup versions**

---

## Advanced Features <a name="advanced-features"></a>

### Automated Backup Creation

The V2 update system automatically creates backups before applying updates:

**Backup Location**:
```
storage/app/backups/YYYY-MM-DD_HHMMSS/
├── app/
├── bootstrap/
├── config/
├── database/
├── public/
├── resources/
├── routes/
└── build/ (if present)
```

### Manual Database Backup

You can create a manual database backup:

**Web Interface**:
```
https://your-domain.com/api/maintenance/database/backup
```

**Command Line**:
```bash
php artisan db:backup --path=storage/app/backups/custom_backup.sql
```

### Migration Management

**Check Migration Status**:
```bash
# Web Interface
https://your-domain.com/api/maintenance/database/migrations

# Command Line
php artisan migrate:status
```

**Run Migrations Manually**:
```bash
# Web Interface
POST /api/maintenance/database/migrate

# Command Line
php artisan migrate --force
```

### Maintenance Mode Control

**Enable Maintenance Mode**:
```bash
php artisan down --render="errors::503" --retry=60
```

**Disable Maintenance Mode**:
```bash
php artisan up
```

### Custom Update Hooks

For advanced users, you can modify the update process by extending the `UpgradeController`:

```php
// In your custom controller
protected function beforeUpdate()
{
    // Custom pre-update logic
}

protected function afterUpdate()
{
    // Custom post-update logic
}
```

### Update Logging

All update processes are logged to:
```
storage/logs/laravel.log
```

Look for entries tagged with "V2 upgrade" or "V1 upgrade" to track update history.

---

## API Endpoints for Automated Updates <a name="api-endpoints"></a>

### Update Endpoints

#### V2 Update (Recommended)
```
POST /api/application-update-v2
```

#### V1 Update (Legacy)
```
POST /api/application-update
```

**Required Parameters**:
- `update_token`: Security token configured in .env
- `zip_file`: The update package (multipart form data)

### Database Management Endpoints

```
GET  /api/maintenance/database/tables      - List database tables
GET  /api/maintenance/database/migrations - Check migration status
POST /api/maintenance/database/migrate     - Run pending migrations
POST /api/maintenance/database/seed       - Run database seeders
GET  /api/maintenance/database/backup     - Download database backup
```

### Version Check Endpoint

```
GET /version
```

Returns current version:
```json
{
    "version": "1.5.9"
}
```

### Example Script for Automated Updates

```bash
#!/bin/bash

# Configuration
INFOSHOP_URL="https://your-domain.com"
UPDATE_TOKEN="your_update_token_here"
UPDATE_PACKAGE="/path/to/update.zip"

# Perform update
RESPONSE=$(curl -s -X POST "$INFOSHOP_URL/api/application-update-v2" \
  -F "update_token=$UPDATE_TOKEN" \
  -F "zip_file=@$UPDATE_PACKAGE")

# Check response
if echo "$RESPONSE" | grep -q "success"; then
    echo "Update completed successfully"
else
    echo "Update failed:"
    echo "$RESPONSE"
    exit 1
fi
```

### Monitoring Update Progress

For long-running updates, you can monitor the application logs:

```bash
tail -f storage/logs/laravel.log | grep -i "upgrade\|update\|migration"
```

---

## Best Practices and Recommendations

### Before Updating

1. **Always create a full backup** (database and files)
2. **Test updates on a staging environment first**
3. **Review update notes and changelog**
4. **Ensure sufficient disk space**
5. **Schedule updates during low-traffic periods**
6. **Notify users of planned maintenance**

### During Update

1. **Avoid interrupting the update process**
2. **Monitor logs for any errors**
3. **Don't refresh the browser during web-based updates**
4. **Wait for completion confirmation before proceeding**

### After Update

1. **Verify the application functions correctly**
2. **Check the version number has updated**
3. **Test critical functionality**
4. **Clear browser cache if UI issues persist**
5. **Update documentation if needed**
6. **Schedule the next update check**

### Regular Maintenance

1. **Periodically review and clean old backups**
2. **Rotate the UPDATE_TOKEN regularly**
3. **Keep PHP and database versions updated**
4. **Monitor security advisories**
5. **Test restore procedures periodically**

---

## Support and Additional Resources

For additional assistance with InfoShop updates:

- **Check the logs**: `storage/logs/laravel.log`
- **Verify requirements**: Ensure all prerequisites are met
- **Community forums**: Check for known issues with specific versions
- **Official documentation**: Review latest update guides
- **Contact support**: For critical issues affecting production systems

---

## Version History

- **Current Version**: 1.5.9
- **Update System**: V2 (migration-based)
- **Previous V1 Support**: Maintained for backward compatibility

---

*This document is updated regularly to reflect the latest update procedures and best practices. Last updated: December 2024*