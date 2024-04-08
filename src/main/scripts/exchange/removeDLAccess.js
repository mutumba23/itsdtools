const { spawn } = require("child_process");
import ps1Path from '../../../../resources/ps1_scripts/removeDLAccess.ps1?asset&asarUnpack'

const removeDLAccess = ({ mailboxes, users }) => {
  return new Promise((resolve, reject) => {
    // Remove whitespaces from each email
    const cleanedMailboxes = mailboxes.map((mailbox) =>
      mailbox.replace(/\s/g, "")
    );
    const cleanedUsers = users.map((email) => email.replace(/\s/g, ""));

    let stdout = "";

    const script = spawn("powershell.exe", [
      "-File",
      ps1Path,
      "-mailboxes",
      cleanedMailboxes.join(","),
      "-users",
      cleanedUsers.join(","),
    ]);

    script.stdout.on("data", (data) => {
      stdout += data;
      console.log("PowerShell script output:", data.toString());
    });

    script.on("close", (code) => {
      // Powershell errors
      if (code !== 0) {
        console.error("Error executing PowerShell script:", stdout);
        let errorMessages = [];
        if (stdout.includes("User canceled authentication")) {
          errorMessages.push("User canceled the authentication process.");
        }
        if (stdout.includes("Block Remote Powershell")) {
          errorMessages.push("Connection was blocked. Please make sure you use your adm account at @oneiig.onmicrosoft.com");
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

              if (action === "UserRemoved") {
                successMessages.push(`User ${user} removed from DL ${mailbox}.`);
              }
            } else {
              errorMessages.push(message);
            }
          } else if (message.startsWith("INFO")) {
            const parts = message.split("|");
            if (parts.length >= 4) {
              const action = parts[1];
              const mailbox = parts[3].split(":")[1];
              const user = parts[2].split(":")[1];

              if (action === "UserNotAMember") {
                successMessages.push(
                  `User ${user} was not a member of DL ${mailbox}. No action taken.`
                );
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

              if (action === "FailedToRemove") {
                errorMessages.push(
                  `Failed to remove ${user} from DL ${mailbox}.`
                );
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

export { removeDLAccess };