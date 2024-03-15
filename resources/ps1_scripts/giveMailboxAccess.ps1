param($mailboxes, $users, $autoMapping)

$mailboxes = $mailboxes -split ','
$users = $users -split ','

try {
    Connect-ExchangeOnline -ErrorAction Stop

    # Check if mailboxes exist
    $tempMailboxes = $mailboxes | ForEach-Object {
        $mailboxExists = Get-EXOMailbox -Identity $_ -ErrorAction SilentlyContinue
        if ($null -eq $mailboxExists) {
            "Mailbox does not exist: $_"
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

    # Collect non-existing users and mailboxes
    $nonExistingUsers = $tempUsers | Where-Object { $_ -like "User does not exist:*" }
    $nonExistingMailboxes = $tempMailboxes | Where-Object { $_ -like "Mailbox does not exist:*" }
    

    # Output a single message for non-existing users and mailboxes
    if ($nonExistingUsers) {
        Write-Output ("The following users do not exist: " + (($nonExistingUsers -replace 'User does not exist: ', '') -join ', '))
    }
    if ($nonExistingMailboxes) {
        Write-Output ("The following mailboxes do not exist: " + (($nonExistingMailboxes -replace 'Mailbox does not exist: ', '') -join ', '))
    }

    # Create the $existingUsers and existingMailboxes array by excluding non-existing users and mailboxes
    $existingUsers = $tempUsers | Where-Object { $_ -notlike "User does not exist:*" }
    $existingMailboxes = $tempMailboxes | Where-Object { $_ -notlike "Mailbox does not exist:*" }

    foreach ($mailbox in $existingMailboxes) {
        $mailboxDetails = Get-Mailbox -Identity $mailbox -ErrorAction SilentlyContinue
        if ($mailboxDetails.RecipientTypeDetails -eq 'SharedMailbox') {
             
            foreach ($user in $existingUsers) {
                try {
                    $fullAccessPermission = Get-EXOMailboxPermission -Identity $mailbox -User $user -ErrorAction SilentlyContinue
                    if ($null -ne $fullAccessPermission) {
                        Write-Output ("INFO|AlreadyHasFullAccess|User:$user|Mailbox:$mailbox|$fullAccessPermission")
                        Remove-MailboxPermission -Identity $mailbox -User $user -AccessRights FullAccess -Confirm:$false
                    }
                    $fullAccessResult = Add-MailboxPermission -Identity $mailbox -User $user -AccessRights FullAccess -AutoMapping $autoMapping -ErrorAction Stop
                    Write-Output ("SUCCESS|FullAccess|User:$user|Mailbox:$mailbox|$fullAccessResult")
                } catch {
                    Write-Output ("ERROR|FailedToAdd|User:$user|Mailbox:$mailbox|Error:$($_.Exception.Message)")
                }
        
                try {
                    $sendAsResult = Add-RecipientPermission -Identity $mailbox -Trustee $user -AccessRights SendAs -Confirm:$false -ErrorAction Stop
                    Write-Output ("SUCCESS|SendAs|User:$user|Mailbox:$mailbox|$sendAsResult")
                } catch {
                    if ($_.Exception.Message -like "*already has*" -or $_.Exception.Message -like "*already is*") {
                        Write-Output ("SUCCESS|AlreadyHasSendAs|User:$user|Mailbox:$mailbox")
                    } elseif ($_.Exception.Message -like "*The appropriate access control entry is already present*") {
                        Write-Output ("SUCCESS|AlreadyPresent|User:$user|Mailbox:$mailbox")
                    } else {
                        Write-Output ("ERROR|Failed|User:$user|Mailbox:$mailbox|Error:$($_.Exception.Message)")
                    }
                }
            } 

        } else {
            Write-Output ("ERROR|NotASharedMailbox|Mailbox:$mailbox")
        }
    }
    
} catch {
    Write-Output "An error occurred: $($_.Exception.Message)"
    exit 1
} finally {
    Disconnect-ExchangeOnline -Confirm:$false
    Write-Output "Connection disconnected"
}