const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
import ps1Path from '../../../../resources/ps1_scripts/giveDLAccess.ps1?asset&asarUnpack'

const giveDLAccess = ({ mailboxes, users }) => {
  return new Promise((resolve, reject) => {
    // Remove whitespaces from each email
    const cleanedMailboxes = mailboxes.map((mailbox) =>
      mailbox.replace(/\s/g, "")
    );
    const cleanedUsers = users.map((email) => email.replace(/\s/g, ""));

    let stdout = "";
    let stderr = "";

    const logFile = path.resolve("C:\\temp\\giveDLAccessLog.txt");
    const errorFile = path.resolve("C:\\temp\\giveDLAccessErrorLog.txt");  

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

    script.stdout.on("data", (data) => {
      stdout += data;
    });

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

      const logMessages = logOutput.split("\n");
      logMessages.forEach((message) => {
        // Always log all messages to the console for debugging
        console.log("Log message:", message);

        // Only push the specific success messages to successMessages
        if (message.startsWith("SUCCESS")) {
          const parts = message.split("|");
          if (parts.length >= 4) {
            const action = parts[1];
            const mailbox = parts[3].split(":")[1];
            const user = parts[2].split(":")[1];

            if (action === "UserAdded") {
              successMessages.push(`User ${user} added to DL ${mailbox}.`);
            }
          }
        }
        // Only push the specific info messages to successMessages
        else if (message.startsWith("INFO")) {
          const parts = message.split("|");
          if (parts.length >= 4) {
            const action = parts[1];
            const mailbox = parts[3].split(":")[1];
            const user = parts[2].split(":")[1];

            if (action === "AlreadyMember") {
              successMessages.push(
                `User ${user} is already a member of DL ${mailbox}.`
              );
            }
          }
        }
        // Only push the specific error messages to errorMessages
        else if (message.startsWith("ERROR")) {
          const parts = message.split("|");
          if (parts.length >= 3) {
            const action = parts[1];
            const user = parts[2].split(":")[1];
            if (parts.length >= 4) {
              const mailbox = parts[3].split(":")[1];

              if (action === "FailedToAdd") {
                errorMessages.push(
                  `Failed to add user ${user} to DL ${mailbox}.`
                );
              }
            }
            
            if (action === "MFAWindowCancelled") {
              errorMessages.push(
                `User canceled authentication`
              );
            }
          }
        }
        // Push these specific error messages
        else if (message.startsWith("The following users do not exist")) {
          errorMessages.push(message);
        }
        else if (message.startsWith("The following distribution groups do not exist")) {
          errorMessages.push(message);
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
      if (errorMessages.length > 0) {
        reject({ errorMessages }); // Reject the promise with error messages
      } else {
        resolve({ successMessages, errorMessages }); // Resolve the promise with both success and error messages
      }
    });
  });
};

export { giveDLAccess };
