try {
    $module = Get-Module -ListAvailable -Name ExchangeOnlineManagement
    if ($null -eq $module) {
      Write-Output "Installing ExchangeOnlineManagement module..."
      Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser -Force -Confirm:$false
      Write-Output "ExchangeOnlineManagement module installed successfully"
    } else {
      Write-Output "ExchangeOnlineManagement module is already installed"
    }
} catch {
    Write-Error "An error occurred while installing the ExchangeOnlineManagement module: $_"
    exit 1
}