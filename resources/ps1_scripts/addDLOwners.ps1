param(
    [string[]]$mailboxes,
    [string[]]$owners,
    [string[]]$ownersToRemove,
    [string]$keepOwners
)

$keepOwners = [System.Convert]::ToBoolean($keepOwners)

$mailboxes = if ($null -eq $mailboxes) { @() } else { $mailboxes }
$owners = if ($null -eq $owners) { @() } else { $owners }
$ownersToRemove = if ($null -eq $ownersToRemove) { @() } else { $ownersToRemove }


$LogFile = "C:\temp\addDLOwnersLog.txt"
$ErrorFile = "C:\temp\addDLOwnersErrorLog.txt"

# Clear existing logs
if (Test-Path $LogFile) { Clear-Content -Path $LogFile -ErrorAction SilentlyContinue }
if (Test-Path $ErrorFile) { Clear-Content -Path $ErrorFile -ErrorAction SilentlyContinue }


# Redirect output and errors
Start-Transcript -Path $LogFile -Append


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
                # Get current owners
                $currentOwners = (Get-DistributionGroup -Identity $mailbox | Select-Object -ExpandProperty ManagedBy) | ForEach-Object {
                    (Get-User -Identity $_).UserPrincipalName
                }

                Write-Output "Current Owners: $($currentOwners -join ', ')"
                Write-Output "Current Owners Count: $($currentOwners.Count)"
                $currentOwners | ForEach-Object { Write-Output "Current Owner: $_" }

                # Ensure currentOwners is an array of strings
                $currentOwners = [string[]]$currentOwners

                # Ensure owners array is split into individual elements
                $ownersArray = @($owners) -split ','

                $ownersToRemoveArray = @($ownersToRemove) -split ','

                Write-Output "New Owners to be added: $($ownersArray -join ', ')"
                Write-Output "New Owners to be added: $($ownersArray.Count)"
                $ownersArray | ForEach-Object { Write-Output "Owner: $_" }

                # Calculate final owners list
                $newOwners = @($currentOwners) + @($ownersArray) | Where-Object { $_ -notin $ownersToRemoveArray } | Select-Object -Unique

                Write-Output "New list of owners: $($newOwners -join ', ')"  # This is fine for output, but $newOwners remains an array
                Write-Output "New Owners Count: $($newOwners.Count)"
                $newOwners | ForEach-Object { Write-Output "Owner: $_" }

                # Ensure $newOwners is an array (this should already be an array, but just in case)
                $newOwnersArray = [string[]]$newOwners

                # Update the ManagedBy property
                Set-DistributionGroup -Identity $mailbox -ManagedBy $newOwnersArray -BypassSecurityGroupManagerCheck


                # Log successful changes
                foreach ($ownerToRemove in $ownersToRemoveArray) {
                    if ($ownerToRemove -ne "" -and $ownerToRemove -in $currentOwners) {
                        Write-Output "SUCCESS|OwnerRemoved|Owner:$ownerToRemove|Mailbox:$mailbox"
                    } elseif ($ownerToRemove -ne "") {
                        Write-Output "INFO|OwnerNotFound|Owner:$ownerToRemove|Mailbox:$mailbox"
                    }
                }
                foreach ($owner in $ownersArray) {
                    if ($owner -notin $currentOwners) {
                        Write-Output "SUCCESS|OwnerAdded|Owner:$owner|Mailbox:$mailbox"
                    }
                }
            } catch {
                $errorDetails = @{
                    Message = $_.Exception.Message
                    Type = $_.Exception.GetType().FullName
                    StackTrace = $_.Exception.StackTrace
                }
                Write-Output "ERROR|FailedToUpdateOwners|Mailbox:$mailbox|Error:$_|FullError:$(ConvertTo-Json $errorDetails)"
            }
        }
    }
} catch {
    if ($_.Exception.Message -like "*User canceled authentication*") {
        Write-Output "ERROR|MFAWindowCancelled|User canceled authentication"
    } else {
        Write-Output "An error occurred: $($_.Exception.Message)"
    }
    exit 1
} finally {
    Disconnect-ExchangeOnline -Confirm:$false
    Write-Output "Connection disconnected"
    Stop-Transcript
}
