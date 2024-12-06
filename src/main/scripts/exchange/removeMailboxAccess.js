const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
import ps1Path from '../../../../resources/ps1_scripts/removeMailboxAccess.ps1?asset&asarUnpack'

const removeMailboxAccess = ({ mailboxes, users }) => {
  return new Promise((resolve, reject) => {
    // Remove whitespaces from each email
    const cleanedMailboxes = mailboxes.map((mailbox) =>
      mailbox.replace(/\s/g, "")
    );
    const cleanedUsers = users.map((email) => email.replace(/\s/g, ""));

    const logFile = path.resolve("C:\\temp\\removeMailboxAccessLog.txt");
    const errorFile = path.resolve("C:\\temp\\removeMailboxAccessErrorLog.txt"); 

    const powershellPath = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
    const scriptArgs = [
      "-WindowStyle", "Hidden",
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      ps1Path,
      "-mailboxes",
      cleanedMailboxes.join(","),
      "-users",
      cleanedUsers.join(","),
    ];

    const script = spawn(powershellPath, scriptArgs, { shell: true, env: { ...process.env }, stdio: "pipe", detached: true, windowsHide: true, });

    if (!script) {
      console.error("Failed to spawn child process");
      return;
    }

    let stdout = "";
    script.stdout.on("data", (data) => {
      stdout += data;
      console.log("PowerShell script output:", data.toString());
    });

    let stderr = "";
    script.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Allow parent process to exit without waiting for the child process
    script.unref();

    script.on("close", (code) => {
      const logOutput = fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8") : "";
      const errorOutput = fs.existsSync(errorFile) ? fs.readFileSync(errorFile, "utf8") : "";
      let errorMessages = [];
      let successMessages = [];






      // Powershell errors
      if (code !== 0) {
        console.error("Error executing PowerShell script:", stdout);
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
        // Powershell success
        console.log("PowerShell script execution succeeded.");
        const logMessages = logOutput.split("\n");
        let successMessages = [];
        let errorMessages = [];

        logMessages.forEach((message) => {
          // Always log all messages to the console for debugging
          console.log("Log message:", message);

          if (message.trim() !== "") {
            if (message.startsWith("SUCCESS")) {
              const parts = message.split("|");
              if (parts.length >= 4) {
                const action = parts[1];
                const mailbox = parts[3].split(":")[1];
                const user = parts[2].split(":")[1];

                if (action === "FullAccessPermissionRemoved") {
                  successMessages.push(`FullAccess permission for mailbox ${mailbox} removed from user ${user}`);
                }
                if (action === "SendAsPermissionRemoved") {
                  successMessages.push(`SendAs permission for mailbox ${mailbox} removed from user ${user}`);
                }
              } 
            } else if (message.startsWith("ERROR")) {
              const parts = message.split("|");
              if (parts.length >= 4) {
                const mailbox = parts[3].split(":")[1];
                const user = parts[2].split(":")[1];
                errorMessages.push(
                  `Failed to remove user ${user} from mailbox ${mailbox}`
                );
              } else {
                errorMessages.push(message);
              }
            } else if (message.startsWith("INFO")) {
              const parts = message.split("|");
              if (parts.length >= 4) {
                const action = parts[1];
                const mailbox = parts[3].split(":")[1];
                const user = parts[2].split(":")[1];

                if (action === "UserDoesNotHaveFullAccess") {
                  successMessages.push(`User ${user} did not have FullAccess permission on mailbox ${mailbox}`);
                }
                if (action === "UserDoesNotHaveSendAsPermission") {
                  successMessages.push(`User ${user} did not have SendAs permission on mailbox ${mailbox}`);
                }
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

export { removeMailboxAccess };
