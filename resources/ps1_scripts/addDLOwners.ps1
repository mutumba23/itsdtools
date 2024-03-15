param($mailboxes, $owners, $ownersToRemove, $keepOwners)
Write-Output "keepOwners: $keepOwners"
$keepOwners = [System.Convert]::ToBoolean($keepOwners)

$mailboxes = $mailboxes -split ','
$owners = $owners -split ','
$ownersToRemove = if ($ownersToRemove -eq '') { @() } else { $ownersToRemove -split ',' }

try {
    Connect-ExchangeOnline -ErrorAction Stop

    foreach ($mailbox in $mailboxes) {
        # Check if distribution group exists
        $mailboxExists = Get-DistributionGroup -Identity $mailbox -ErrorAction SilentlyContinue
        if ($null -eq $mailboxExists) {
            Write-Output "Distribution Group does not exist: $mailbox"
            continue
        }

        # If keepOwners is false, remove all existing owners and set new owners
        if (!$keepOwners) {
            $existingOwners = Get-DistributionGroup -Identity $mailbox | Select-Object -ExpandProperty ManagedBy
            foreach ($existingOwner in $existingOwners) {
                $ownerUser = Get-User -Identity $existingOwner
                Write-Output "SUCCESS|OwnerRemoved|Owner:$($ownerUser.UserPrincipalName)|Mailbox:$mailbox"
            }
            try {
                Set-DistributionGroup -Identity $mailbox -ManagedBy $owners -BypassSecurityGroupManagerCheck
                foreach ($owner in $owners) {
                    Write-Output "SUCCESS|OwnerAdded|Owner:$owner|Mailbox:$mailbox"
                }
            } catch {
                $errorDetails = @{
                    Message = $_.Exception.Message
                    Type = $_.Exception.GetType().FullName
                    StackTrace = $_.Exception.StackTrace
                }
                Write-Output "ERROR|FailedToAdd|Owners:$owners|Mailbox:$mailbox|Error:$_|FullError:$(ConvertTo-Json $errorDetails)"
            }
        }
        # If keepOwners is true, add new owners and remove selected owners without removing all existing ones
        else {
            try {
                Set-DistributionGroup -Identity $mailbox -ManagedBy @{Add=$owners; Remove=$ownersToRemove} -BypassSecurityGroupManagerCheck
                foreach ($ownerToRemove in $ownersToRemove) {
                    Write-Output "SUCCESS|OwnerRemoved|Owner:$ownerToRemove|Mailbox:$mailbox"
                }
                foreach ($owner in $owners) {
                    Write-Output "SUCCESS|OwnerAdded|Owner:$owner|Mailbox:$mailbox"
                }
            } catch {
                $errorDetails = @{
                    Message = $_.Exception.Message
                    Type = $_.Exception.GetType().FullName
                    StackTrace = $_.Exception.StackTrace
                }
                Write-Output "ERROR|FailedToAddOrRemove|Mailbox:$mailbox|Error:$_|FullError:$(ConvertTo-Json $errorDetails)"
            }
        }
    }
} catch {
    Write-Output "An error occurred: $($_.Exception.Message)"
    exit 1
} finally {
    Disconnect-ExchangeOnline -Confirm:$false
    Write-Output "Connection disconnected"
}