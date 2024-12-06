param($mailboxes, $users)

$mailboxes = $mailboxes -split ','
$users = $users -split ','

#Start-Transcript -Path "C:\temp\ExchangeOnlineLog.txt" -Append
$LogFile = "C:\temp\removeDLAccessLog.txt"
$ErrorFile = "C:\temp\removeDLAccessErrorLog.txt"

# Clear existing logs
Clear-Content -Path $LogFile -ErrorAction SilentlyContinue
Clear-Content -Path $ErrorFile -ErrorAction SilentlyContinue

# Redirect output and errors
Start-Transcript -Path $LogFile -Append

try {
    Connect-ExchangeOnline -ErrorAction Stop

    # Check if distribution groups exist
    $tempMailboxes = $mailboxes | ForEach-Object {
        $mailboxExists = Get-DistributionGroup -Identity $_ -ErrorAction SilentlyContinue
        if ($null -eq $mailboxExists) {
            "Distribution Group does not exist: $_"
        } else {
            $_
        }
    }

    # Check if users exist
    $tempUsers = $users | ForEach-Object {
        $userExists = Get-User -Identity $_ -ErrorAction SilentlyContinue
        if ($null -eq $userExists) {
            "User does not exist: $_"
        } else {
            $_
        }
    }

    # Collect non-existing users and distribution groups
    $nonExistingUsers = $tempUsers | Where-Object { $_ -like "User does not exist:*" }
    $nonExistingMailboxes = $tempMailboxes | Where-Object { $_ -like "Distribution Group does not exist:*" }

    # Output a single message for non-existing users and distribution groups
    if ($nonExistingUsers) {
        Write-Output ("The following users do not exist: " + (($nonExistingUsers -replace 'User does not exist: ', '') -join ', '))
    }
    if ($nonExistingMailboxes) {
        Write-Output ("The following distribution groups do not exist: " + (($nonExistingMailboxes -replace 'Distribution Group does not exist: ', '') -join ', '))
    }

    # Create the $existingUsers and existingMailboxes array by excluding non-existing users and distribution groups
    $existingUsers = $tempUsers | Where-Object { $_ -notlike "User does not exist:*" }
    $existingMailboxes = $tempMailboxes | Where-Object { $_ -notlike "Distribution Group does not exist:*" }

    foreach ($mailbox in $existingMailboxes) {
        foreach ($user in $existingUsers) {
            try {  
                # Remove the user from the distribution group
                Remove-DistributionGroupMember -Identity $mailbox -Member $user -BypassSecurityGroupManagerCheck -Confirm:$false -ErrorAction Stop
                Write-Output ("SUCCESS|UserRemoved|User:$user|DistributionGroup:$mailbox")
            } catch {
                # Check if the exception is due to the user not being found in the distribution group
                if ($_.Exception.Message -like "*isn't a member of the group*") {
                    # Log a specific message indicating that the user is not a member
                    Write-Output ("INFO|UserNotAMember|User:$user|DistributionGroup:$mailbox|Error:$($_.Exception.Message)")
                } else {
                    # Log a generic error message for other types of exceptions
                    Write-Output ("ERROR|FailedToRemove|User:$user|DistributionGroup:$mailbox|Error:$($_.Exception.Message)")
                }
            }
        }
    }
    
    
} catch {
    Write-Output "An error occurred: $($_.Exception.Message)"
    exit 1
} finally {
    Disconnect-ExchangeOnline -Confirm:$false
    Write-Output "Connection disconnected"
    Stop-Transcript
}
