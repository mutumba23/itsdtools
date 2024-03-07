param($mailbox)

try {
    Connect-ExchangeOnline -ErrorAction Stop
    $mailboxExists = Get-EXOMailbox -Identity $mailbox -ErrorAction SilentlyContinue
    if ($null -eq $mailboxExists) {
        Write-Output "Mailbox $mailbox does not exist"
        exit 1
    }

    # Get mailbox permissions
    $mailboxPermissions = Get-EXOMailboxPermission -Identity $mailbox | Select-Object Identity, User, AccessRights

    # Get recipient permissions
    $recipientPermissions = Get-EXORecipientPermission -Identity $mailbox | Select-Object Identity, Trustee, AccessRights

    # Combine permissions for each user
    $combinedPermissions = @{}
    foreach ($permission in $mailboxPermissions) {
        $combinedPermissions[$permission.User] += $permission.AccessRights
    }
    foreach ($permission in $recipientPermissions) {
        $combinedPermissions[$permission.Trustee] += $permission.AccessRights
    }

    # Format combined permissions
    $allPermissions = foreach ($user in $combinedPermissions.Keys) {
        [PSCustomObject]@{
            Identity = $mailbox
            User = $user
            AccessRights = $combinedPermissions[$user] -join ', '
        }
    }

    # Export to CSV
    $mailboxName = $mailbox -replace '[\\/:*?"<>|]', '_' # Replace any characters that are not allowed in filenames
    $csvFilePath = "C:\Temp\Mailbox_Permissions_${mailboxName}_Summary.csv"
    $allPermissions | Export-Csv -Path $csvFilePath -NoTypeInformation

    # Open the Excel file
    Invoke-Item $csvFilePath

    Write-Output "Script completed successfully"
} catch {
    Write-Output "An error occurred: $($_.Exception.Message)"
    exit 1
} finally {
    Disconnect-ExchangeOnline -Confirm:$false
    Write-Output "Connection disconnected"
}