const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
import ps1Path from '../../../../resources/ps1_scripts/giveMailboxAccess.ps1?asset&asarUnpack'


const giveMailboxAccess = ({ mailboxes, users, automapping,  }) => {
  return new Promise((resolve, reject) => {
    // Remove whitespaces from each email
    const cleanedMailboxes = mailboxes.map((mailbox) =>
      mailbox.replace(/\s/g, "")
    );
    const cleanedUsers = users.map((email) => email.replace(/\s/g, ""));

    const logFile = path.resolve("C:\\temp\\giveMailboxAccessLog.txt");
    const errorFile = path.resolve("C:\\temp\\giveMailboxAccessErrorLog.txt"); 

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
      "-autoMapping",
      automapping,
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
    script.stderr.on("data", (data) => {
      stderr += data;
      console.error("PowerShell script error:", data.toString());
    });

    script.on("close", (code) => {
      const logOutput = fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8") : "";
      const errorOutput = fs.existsSync(errorFile) ? fs.readFileSync(errorFile, "utf8") : "";
      let errorMessages = [];
      let successMessages = [];
      let accessReapplied = false; 

      const logMessages = logOutput.split("\n");
      logMessages.forEach((message) => {
        // Always log all messages to the console for debugging
        console.log("Log message:", message);

        if (message.trim() !== "") {
          if (message.startsWith("INFO")) {
            const parts = message.split("|");
            if (parts.length >= 2) {
              const action = parts[1];
              if (action === "AlreadyHasFullAccess") {
                // Mark that access was reapplied
                accessReapplied = true;
              } 
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
          } else if (message.startsWith("ERROR")) {
            const parts = message.split("|");
            if (parts.length >= 3) {
              const action = parts[1];
              const mailbox = parts[2].split(":")[1];

              if (action === "NotASharedMailbox") {
                errorMessages.push(`Skipping mailbox ${mailbox} because it's not a shared mailbox. No action taken for this mailbox.`);
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


      // After processing the log messages
      if (successMessages.length === 0 && errorMessages.length === 0) {
        errorMessages.push(
          "No relevant messages returned from the script. Please check the logs for more information."
        );
      }

      console.log("Processed log output:");
      if (successMessages.length > 0) {
        console.log("Success messages:", successMessages);
      }
      if (errorMessages.length > 0) {
        console.error("Error messages:", errorMessages);
      }

      // Reject or resolve based on the results
      resolve({ successMessages, errorMessages });

    });
  });
};

export { giveMailboxAccess };
