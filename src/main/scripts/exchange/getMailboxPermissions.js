const { spawn } = require('child_process');
const fs = require("fs");
const path = require("path");
import ps1Path from '../../../../resources/ps1_scripts/getMailboxPermission.ps1?asset&asarUnpack'

const getMailboxPermissions = ({ mailbox: mailboxValue }) => {
  return new Promise((resolve, reject) => {

    let stdout = '';
    let stderr = '';

    const logFile = path.resolve("C:\\temp\\getMailboxPermissionLog.txt");
    const errorFile = path.resolve("C:\\temp\\getMailboxPermissioErrorLog.txt");  

    const powershellPath = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
    const scriptArgs = [
      "-WindowStyle", "Hidden",
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      ps1Path,
      "-mailbox",
      mailboxValue,
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


    script.stdout.on('data', (data) => {
      stdout += data;
    });

    script.on('close', (code) => {
      const logOutput = fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8") : "";
      const errorOutput = fs.existsSync(errorFile) ? fs.readFileSync(errorFile, "utf8") : "";
      let errorMessages = [];
      let successMessages = [];

      const logMessages = logOutput.split("\n");
      logMessages.forEach((message) => {
        // Always log all messages to the console for debugging
        console.log("Log message:", message);

        if (message.includes("User canceled authentication")) {
          errorMessages.push("User canceled the authentication process.");
        }
        if (message.includes("Block Remote Powershell")) {
          errorMessages.push("Connection was blocked. Please make sure you use your adm account at @oneiig.onmicrosoft.com");
        }
        if (message.includes("does not exist")) {
          errorMessages.push("The mailbox does not exist.");
        }
        if (message.includes("Script completed successfully")) {
          successMessages.push("Script completed successfully.");
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
        const message = `Mailbox_Permissions_Summary.csv created on C:/Temp/`;
        resolve({ successMessages: [message] });
      }
    });
  });
};

export { getMailboxPermissions };
