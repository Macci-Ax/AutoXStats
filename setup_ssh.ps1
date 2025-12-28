
$ServerUser = "root"
$ServerIP = "72.62.146.87"

# 1. Check/Generate SSH Key
$KeyPath = "$env:USERPROFILE\.ssh\id_rsa"
if (-not (Test-Path $KeyPath)) {
    Write-Host "Generating new SSH key..."
    mkdir "$env:USERPROFILE\.ssh" -ErrorAction SilentlyContinue
    ssh-keygen -t rsa -b 4096 -f $KeyPath -N ""
}
else {
    Write-Host "SSH key already exists."
}

# 2. Upload Key to Server
Write-Host "Uploading SSH key to server..."
Write-Host "You will be asked for your password ONE LAST TIME."
Write-Host "------------------------------------------------"

$PublicKey = Get-Content "$KeyPath.pub"
# Robust command to create dir and append key
$RemoteCommand = "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$PublicKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

ssh "$ServerUser@$ServerIP" $RemoteCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "------------------------------------------------"
    Write-Host "Success! Passwordless login is set up."
    Write-Host "Now try running '.\deploy.ps1' again."
}
else {
    Write-Host "Failed to upload key. Please try again or check your password."
}
