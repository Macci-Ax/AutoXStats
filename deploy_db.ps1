
$ServerUser = "root"
$ServerIP = "72.62.146.87"
$RemotePath = "/var/www/autoxstats"
$DBFile = "autox.db"

Write-Host "WARNING: This will OVERWRITE the database on the server with your local copy."
Write-Host "Any data created only on the server (like new users/requests) will be LOST."
$confirmation = Read-Host "Are you sure you want to proceed? (Type 'yes' to confirm)"

if ($confirmation -ne 'yes') {
    Write-Host "Operation cancelled."
    exit 0
}

# 1. Upload Database
Write-Host "Uploading $DBFile to $ServerIP..."
scp $DBFile "$ServerUser@${ServerIP}:$RemotePath/$DBFile"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Upload failed!"
    exit 1
}

# 2. Restart Service (to clear any in-memory DB locks/caches)
Write-Host "Restarting service on server..."
ssh "$ServerUser@$ServerIP" "pm2 restart autoxstats || systemctl restart autoxstats"

Write-Host "Database deployment complete!"
