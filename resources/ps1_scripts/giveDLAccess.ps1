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
    $tempUsers = @() # Initialize the array to store user objects
    $tempNonExistingUsers = @() # Initialize the array to store non-existing users
    foreach ($userId in $users) {
        $userExists = Get-User -Identity $userId -ErrorAction SilentlyContinue
        if ($null -eq $userExists) {
            $tempNonExistingUsers += "User does not exist: $userId"
        } else {
            if ($userExists.RecipientTypeDetails -eq "UserMailbox") {
                Write-Output ("User is a mailbox: $userId")
                $tempUsers += [PSCustomObject]@{
                    Email = $userId
                    Guid = $userExists.Guid
                }
            } elseif ($userExists.RecipientTypeDetails -eq "GuestMailUser") {
                Write-Output ("User is a guest mail user: $userId")
                $tempUsers += [PSCustomObject]@{
                    Email = $userId
                    Guid = $userExists.Guid
                    Type = "GuestMailUser"
                }
            } elseif ($userExists.RecipientTypeDetails -eq "MailContact") {
                Write-Output ("User is a mail contact: $userId")
                $tempUsers += [PSCustomObject]@{
                    Email = $userId
                    Guid = $userExists.Guid
                    Type = "MailContact"
                }
            }
        }
    }
    
    # Remove MailContact if GuestMailUser exists for the same email
    $filteredUsers = $tempUsers | Group-Object Email | ForEach-Object {
        if ($_.Count -gt 1) {
            # If both GuestMailUser and MailContact exist, prefer GuestMailUser
            $_.Group | Where-Object { $_.Type -eq "GuestMailUser" }
        } else {
            $_.Group[0]  # Take the first (and only) user object
        }
    }

    # Create the $existingUsers array with filtered users
    $existingUsers = $filteredUsers

    # Collect non-existing users and distribution groups
    $nonExistingUsers = $tempNonExistingUsers | Where-Object { $_ -like "User does not exist:*" }
    $nonExistingMailboxes = $tempMailboxes | Where-Object { $_ -like "Distribution Group does not exist:*" }

    # Output a single message for non-existing users and distribution groups
    if ($nonExistingUsers) {
        Write-Output ("The following users do not exist: " + (($nonExistingUsers -replace 'User does not exist: ', '') -join ', '))
    }
    if ($nonExistingMailboxes) {
        Write-Output ("The following distribution groups do not exist: " + (($nonExistingMailboxes -replace 'Distribution Group does not exist: ', '') -join ', '))
    }

    # Create the $existingMailboxes array by excluding non-existing distribution groups
    $existingMailboxes = $tempMailboxes | Where-Object { $_ -notlike "Distribution Group does not exist:*" }

    foreach ($mailbox in $existingMailboxes) {
        foreach ($user in $existingUsers) {
            try {
                $addMemberResult = Add-DistributionGroupMember -Identity $mailbox -Member $user.Guid -ErrorAction Stop
                Write-Output ("SUCCESS|UserAdded|User:$($user.Email)|Mailbox:$mailbox|$addMemberResult")
            } catch {
                if ($_.Exception.Message -like "*already a member*") {
                    Write-Output ("INFO|AlreadyMember|User:$($user.Email)|Mailbox:$mailbox")
                } else {
                    Write-Output ("ERROR|FailedToAdd|User:$($user.Email)|Mailbox:$mailbox|Error: $($_.Exception.Message)")
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
