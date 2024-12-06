$outputFile = "$env:TEMP\installExchangeModuleOutput.txt"
try {
    Write-Output "Checking if NuGet provider is available..." | Out-File -FilePath $outputFile -Append
    $nugetProvider = Get-PackageProvider -Name NuGet -Force -ErrorAction SilentlyContinue
    if ($null -eq $nugetProvider) {
        Write-Output "NuGet provider not found. Installing NuGet provider..." | Out-File -FilePath $outputFile -Append
        Install-PackageProvider -Name NuGet -Force -Confirm:$false -AllowClobber | Out-File -FilePath $outputFile -Append
        Write-Output "NuGet provider installed successfully" | Out-File -FilePath $outputFile -Append
    } else {
        Write-Output "NuGet provider is already installed" | Out-File -FilePath $outputFile -Append
    }

    Write-Output "Checking if ExchangeOnlineManagement module is available..." | Out-File -FilePath $outputFile -Append
    $module = Get-Module -ListAvailable -Name ExchangeOnlineManagement
    if ($null -eq $module) {
        Write-Output "Installing ExchangeOnlineManagement module..." | Out-File -FilePath $outputFile -Append
        Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser -Force -Confirm:$false -AllowClobber | Out-File -FilePath $outputFile -Append
        Write-Output "ExchangeOnlineManagement module installed successfully" | Out-File -FilePath $outputFile -Append
    } else {
        Write-Output "ExchangeOnlineManagement module is already installed" | Out-File -FilePath $outputFile -Append
    }
} catch {
    Write-Output "An error occurred while installing the ExchangeOnlineManagement module: $_" | Out-File -FilePath $outputFile -Append
    exit 1
}