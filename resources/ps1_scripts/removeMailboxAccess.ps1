param($mailboxes, $users)

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
        foreach ($user in $existingUsers) {
            try {
                # Check if user has FullAccess permission
                $fullAccessPermission = Get-EXOMailboxPermission -Identity $mailbox -User $user -ErrorAction SilentlyContinue
                if ($null -ne $fullAccessPermission) {
                    # If user has FullAccess permission, remove it
                    Remove-MailboxPermission -Identity $mailbox -User $user -AccessRights FullAccess -Confirm:$false -ErrorAction Stop
                    Write-Output ("SUCCESS|FullAccessPermissionRemoved|User:$user|Mailbox:$mailbox")
                } else {
                    # If user does not have FullAccess permission, log a message
                    Write-Output ("INFO|UserDoesNotHaveFullAccess|User:$user|Mailbox:$mailbox")
                }

                # Check if user has SendAs permission
                $sendAsPermission = Get-EXORecipientPermission -Identity $mailbox -Trustee $user -ErrorAction SilentlyContinue
                if ($null -ne $sendAsPermission) {
                    # If user has SendAs permission, remove it
                    Remove-RecipientPermission -Identity $mailbox -Trustee $user -AccessRights SendAs -Confirm:$false -ErrorAction Stop
                    Write-Output ("SUCCESS|SendAsPermissionRemoved|User:$user|Mailbox:$mailbox")
                } else {
                    # If user does not have SendAs permission, log a message
                    Write-Output ("INFO|UserDoesNotHaveSendAsPermission|User:$user|Mailbox:$mailbox")
                }
            } catch {
                Write-Output ("ERROR|FailedToRemovePermission|User:$user|Mailbox:$mailbox|Error:$($_.Exception.Message)")
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
