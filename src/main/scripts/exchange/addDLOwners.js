const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
import ps1Path from '../../../../resources/ps1_scripts/addDLOwners.ps1?asset&asarUnpack'

const addDLOwners = ({ mailboxes, users, keepOwners, ownersToRemove }) => {
  return new Promise((resolve, reject) => {
    // Remove whitespaces from each email
    const cleanedMailboxes = (mailboxes || []).map(mailbox => mailbox.trim());
    console.log("ownersToRemove:", ownersToRemove);
    const cleanedOwners = (users || []).map(email => email.trim());
    const cleanedOwnersToRemove = (ownersToRemove || []).map(email => email.trim());
    //const cleanedOwners = (users || []).map((email) => email.replace(/\s/g, ""));
    //const cleanedOwnersToRemove = (ownersToRemove || []).map((email) => email.replace(/\s/g, ""));
    

    console.log("Cleaned Mailboxes:", cleanedMailboxes);
    console.log("Cleaned Owners:", cleanedOwners);
    console.log("Cleaned Owners to Remove:", cleanedOwnersToRemove);

    let stdout = "";
    let stderr = "";

    const logFile = path.resolve("C:\\temp\\addDLOwnersLog.txt");
    const errorFile = path.resolve("C:\\temp\\addDLOwnersErrorLog.txt");
    const powershellPath = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";

    const jsonMailboxes = JSON.stringify(cleanedMailboxes); 
    const jsonOwners = JSON.stringify(cleanedOwners); 
    const jsonOwnersToRemove = JSON.stringify(cleanedOwnersToRemove); 
    console.log("JSON Owners:", jsonOwners);
    

    const scriptArgs = [
      "-WindowStyle", "Hidden",
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      ps1Path,
      "-keepOwners",
      keepOwners ? "true" : "false",
    ];

    //scriptArgs.push("-mailboxes", `'${jsonMailboxes}'`);
    scriptArgs.push("-mailboxes", cleanedMailboxes);

     // Add the -ownersToRemove argument only if it is not empty
     if (cleanedOwners.length > 0) {
      //scriptArgs.push("-owners", `'${jsonOwners}'`);
      scriptArgs.push("-owners", cleanedOwners);
    }

    // Add the -ownersToRemove argument only if it is not empty
    if (cleanedOwnersToRemove.length > 0) {
      //scriptArgs.push("-ownersToRemove", `'${jsonOwnersToRemove}'`); 
      scriptArgs.push("-ownersToRemove", cleanedOwnersToRemove);   
    }   

    console.log("Script Arguments:", scriptArgs);

    const script = spawn(powershellPath, scriptArgs, { shell: true, env: { ...process.env }, stdio: "pipe", detached: true, windowsHide: true, });


    script.stdout.on("data", (data) => {
      stdout += data.toString();
      console.log("stdout:", stdout);
    });

    script.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log("stderr:", stderr);
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

            if (action === "OwnerRemoved" && !cleanedOwners.includes(user)) {
              successMessages.push(`User ${user} removed as owner from DL ${mailbox}.`);
            }
            if (action === "OwnerAdded") {
                successMessages.push(`User ${user} added as owner of DL ${mailbox}.`);
            }
          }
        }
        // Only push the specific info messages to successMessages
        else if (message.startsWith("INFO")) {
          const parts = message.split("|");
          if (parts.length >= 3) {
                const action = parts[1];
                const user = parts[2].split(":")[1];
                const mailbox = message.includes("Mailbox:")
                  ? message.split("Mailbox:")[1]
                  : "Unknown mailbox";

            if (action === "OwnerNotFound") {
              successMessages.push(
                `INFO: User ${user} does not exist as an owner in DL ${mailbox}.`
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
                errorMessages.push(`Failed to add user ${user} as owner of DL ${mailbox}.`);
              }
              if (action === "FailedToRemove") {
                  errorMessages.push(`Failed to remove user ${user} as owner of DL ${mailbox}.`);
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

export { addDLOwners };