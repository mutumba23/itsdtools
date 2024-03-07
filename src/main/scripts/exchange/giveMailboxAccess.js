const { spawn } = require("child_process");
const path = require("path");

const giveMailboxAccess = ({ mailboxes, users, automapping }) => {
  return new Promise((resolve, reject) => {
    // Remove whitespaces from each email
    const cleanedMailboxes = mailboxes.map((mailbox) =>
      mailbox.replace(/\s/g, "")
    );
    const cleanedUsers = users.map((email) => email.replace(/\s/g, ""));

    const isDevelopment = process.env.NODE_ENV !== "production";
    let scriptPath;
    if (isDevelopment) {
      // Go up two directories to get to the root directory
      scriptPath = path.join(__dirname, '..', '..', 'resources', 'ps1_scripts', 'giveMailboxAccess.ps1');
    } else {
        scriptPath = path.join(process.resourcesPath, 'ps1_scripts', 'giveMailboxAccess.ps1');
    }

    const script = spawn("powershell.exe", [
      "-File",
      scriptPath,
      "-mailboxes",
      cleanedMailboxes.join(","),
      "-users",
      cleanedUsers.join(","),
      "-autoMapping",
      automapping,
    ]);

    let stdout = "";
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
        if (errorMessages.length === 0) {
          errorMessages.push("An unknown error occurred.");
        }
        console.error(
          "PowerShell script execution failed. Error messages:",
          errorMessages
        );
        reject({ errorMessages });
      } else {
        // Powershell success
        console.log("PowerShell script execution succeeded.");
        const stdoutMessages = stdout.split("\n");
        let successMessages = [];
        let errorMessages = [];

        let accessReapplied = false; // Flag to track if access was reapplied

        stdoutMessages.forEach((message) => {
          if (message.trim() !== "") {
            if (message.startsWith("INFO")) {
              const parts = message.split("|");
              if (parts.length >= 2) {
                const action = parts[1];
                if (action === "AlreadyHasFullAccess") {
                  // Mark that access was reapplied
                  accessReapplied = true;
                } else {
                  errorMessages.push(message);
                }
              } else {
                errorMessages.push(message);
              }
            } else if (message.startsWith("SUCCESS")) {
              const parts = message.split("|");
              if (parts.length >= 4) {
                const action = parts[1];
                const mailbox = parts[3].split(":")[1];
                const user = parts[2].split(":")[1];

                if (action === "FullAccess" && accessReapplied) {
                  // If FullAccess was granted and access was reapplied, merge the messages
                  successMessages.push(
                    `User ${user} already had FullAccess to ${mailbox}. Access reapplied with new automapping value.`
                  );
                  accessReapplied = false; // Reset the flag
                } else {
                  // Otherwise, add the success message normally
                  successMessages.push(
                    `${action} permission for mailbox ${mailbox} granted to user ${user}`
                  );
                }
              } else {
                errorMessages.push(message);
              }
            } else if (message.startsWith("The following users do not exist")) {
              errorMessages.push(message);
            } else if (message.startsWith("The following mailboxes do not exist")) {
              errorMessages.push(message);
            } 
          }
        });

        // Check if the PowerShell script execution succeeded or failed
        if (successMessages.length === 0 && errorMessages.length === 0) {
          errorMessages.push(
            "No messages returned from the script. Please check the logs for more information."
          );
        }

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

export { giveMailboxAccess };
