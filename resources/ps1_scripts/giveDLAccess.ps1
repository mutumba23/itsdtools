param($mailboxes, $users)

$mailboxes = $mailboxes -split ','
$users = $users -split ','

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
                $addMemberResult = Add-DistributionGroupMember -Identity $mailbox -Member $user -ErrorAction Stop
                Write-Output ("SUCCESS|UserAdded|User:$user|Mailbox:$mailbox|$addMemberResult")
            } catch {
                if ($_.Exception.Message -like "*already a member*") {
                    Write-Output ("INFO|AlreadyMember|User:$user|Mailbox:$mailbox")
                } else {
                    Write-Output ("ERROR|FailedToAdd|User:$user|Mailbox:$mailbox")
                }
                continue
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