const { spawn } = require("child_process");
import ps1Path from '../../../../resources/ps1_scripts/addDLOwners.ps1?asset&asarUnpack'

const addDLOwners = ({ mailboxes, users, keepOwners, ownersToRemove }) => {
  return new Promise((resolve, reject) => {
    // Remove whitespaces from each email
    const cleanedMailboxes = mailboxes.map((mailbox) =>
      mailbox.replace(/\s/g, "")
    );
    const cleanedOwners = users.map((email) => email.replace(/\s/g, ""));
    const cleanedOwnersToRemove = ownersToRemove.map((email) => email.replace(/\s/g, ""));

    let stdout = "";

    const script = spawn("powershell.exe", [
      "-File",
      ps1Path,
      "-mailboxes",
      cleanedMailboxes.join(","),
      "-owners",
      cleanedOwners.join(","),
      "-ownersToRemove",
      cleanedOwnersToRemove.join(","),
      "-keepOwners",
      keepOwners
    ]);

    script.stdout.on("data", (data) => {
      stdout += data;
    });

    script.on("close", (code) => {
      // Powershell errors
      if (code !== 0) {
        console.error("Error executing PowerShell script:", stdout);
        let errorMessages = [];
        if (stdout.includes("User canceled authentication")) {
          errorMessages.push("User canceled the authentication process.");
        }
        if (errorMessages.length === 0) {
          errorMessages.push("An unknown error occurred.");
        }
        console.error(
          "PowerShell script execution failed. Error messages:",
          errorMessages
        );
        reject({ errorMessages });
      } else {
        console.log("PowerShell script execution succeeded.");
        const stdoutMessages = stdout.split("\n");
        let successMessages = [];
        let errorMessages = [];

        stdoutMessages.forEach((message) => {
            if (message.startsWith("SUCCESS")) {
              const parts = message.split("|");
              if (parts.length >= 4) {
                const action = parts[1];
                const mailbox = parts[3].split(":")[1];
                const user = parts[2].split(":")[1];
  
                if (action === "OwnerRemoved" && !cleanedOwners.includes(user)) {
                  successMessages.push(`User ${user} removed as owner from DL ${mailbox}.`);
                }
                if (action === "OwnerAdded") {
                    successMessages.push(`User ${user} added as owner of DL ${mailbox}.`);
                  }
              } else {
                errorMessages.push(message);
              }
            } else if (message.startsWith("ERROR")) {
              const parts = message.split("|");
              if (parts.length >= 4) {
                const action = parts[1];
                const mailbox = parts[3].split(":")[1];
                const user = parts[2].split(":")[1];
  
                if (action === "FailedToAdd") {
                  errorMessages.push(`Failed to add user ${user} as owner of DL ${mailbox}.`);
                }
                if (action === "FailedToRemove") {
                    errorMessages.push(`Failed to remove user ${user} as owner of DL ${mailbox}.`);
                  }
              } else {
                errorMessages.push(message);
              }
            } else if (message.startsWith("The following users do not exist")) {
              errorMessages.push(message);
            } else if (message.startsWith("The following distribution groups do not exist")) {
              errorMessages.push(message);
            }
          });

        // Check if the PowerShell script execution succeeded or failed
        if (successMessages.length === 0 && errorMessages.length === 0) {
          errorMessages.push(
            "No messages returned from the script. Please check the logs for more information."
          );
        }

        console.log("PowerShell script stdout:", stdout);

        if (successMessages && successMessages.length > 0) {
          console.log("PowerShell script success messages:", successMessages);
        }
        if (errorMessages && errorMessages.length > 0) {
          console.error("PowerShell script error messages:", errorMessages);
        }

        resolve({ successMessages, errorMessages });
      }
    });
  });
};

export { addDLOwners };