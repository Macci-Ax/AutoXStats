
$ServerUser = "root"
$ServerIP = "72.62.146.87"
$RemotePath = "/var/www/autoxstats"
$UploadsDir = "uploads"

# 1. Package uploads
Write-Host "Packaging uploads directory..."
# Create a tar of the uploads directory content
tar -czf uploads_package.tar.gz uploads

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create package. Make sure you have 'tar' installed (Git Bash provides it)."
    exit 1
}

# 2. Upload Package
Write-Host "Uploading uploads package to $ServerIP..."
scp uploads_package.tar.gz "$ServerUser@${ServerIP}:$RemotePath/uploads_package.tar.gz"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Upload failed!"
    exit 1
}

# 3. Extract on Server
Write-Host "Extracting files on server..."
# We use 'mkdir -p uploads' to ensure it exists
# Then tar -xzf inside the root will overwrite existing files in uploads/ with the new ones
# because the tar archive contains "uploads/filename" paths.
$RemoteCommand = "
cd $RemotePath
mkdir -p uploads
tar -xzf uploads_package.tar.gz
rm uploads_package.tar.gz
"

# Strip Windows line endings just in case
$RemoteCommand = $RemoteCommand -replace "`r", ""

ssh "$ServerUser@$ServerIP" $RemoteCommand

# Cleanup local package
Remove-Item uploads_package.tar.gz

Write-Host "Uploads deployment complete!"
