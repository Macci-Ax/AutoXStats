
# Configuration
$ServerUser = "root"
$ServerIP = "72.62.146.87"
$RemotePath = "/var/www/autoxstats"

# 1. Build the project
Write-Host "Building project..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}

# 2. Package files
Write-Host "Packaging files..."
tar -czf deploy_package.tar.gz dist src scripts server.js package.json package-lock.json

# 3. Upload package (Single SCP connection)
Write-Host "Uploading package to $ServerIP..."
scp deploy_package.tar.gz "$ServerUser@${ServerIP}:$RemotePath/deploy_package.tar.gz"

# 4. Extract and Restart
Write-Host "Extracting and restarting service on server..."
# Check if pm2 is installed, install if not, then start/restart app
$RemoteScript = "
cd $RemotePath
tar -xzf deploy_package.tar.gz
rm deploy_package.tar.gz
npm install --production
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
pm2 describe autoxstats > /dev/null 2>&1
if [ `$? -eq 0 ]; then
    pm2 reload autoxstats --update-env
else
    pm2 start server.js --name autoxstats
fi
pm2 save
"
# CRITICAL: Remove Windows carriage returns for Linux compatibility
$RemoteScript = $RemoteScript -replace "`r", ""

ssh "$ServerUser@$ServerIP" $RemoteScript

# Cleanup local package
Remove-Item deploy_package.tar.gz


Write-Host "Deployment complete!"
