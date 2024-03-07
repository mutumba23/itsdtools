const { spawn } = require('child_process');
const path = require('path');

const getMailboxPermissions = ({ mailbox: mailboxValue }) => {
  return new Promise((resolve, reject) => {
    const isDevelopment = process.env.NODE_ENV !== "production";
    let scriptPath;
    if (isDevelopment) {
      scriptPath = path.join(__dirname, '..', '..', 'resources', 'ps1_scripts', 'getMailboxPermission.ps1');
    } else {
      scriptPath = path.join(process.resourcesPath, 'ps1_scripts', 'getMailboxPermission.ps1');
    }
    const script = spawn('powershell.exe', ['-File', scriptPath, '-mailbox', mailboxValue]);

    let stdout = '';

    script.stdout.on('data', (data) => {
      stdout += data;
    });

    script.on('close', (code) => {
      if (code !== 0) {
        console.error('Error executing PowerShell script:', stdout);
        let errorMessages = [];
        if (stdout.includes('User canceled authentication')) {
          errorMessages.push('User canceled the authentication process.');
        }
        if (stdout.includes('does not exist')) {
          errorMessages.push('The mailbox does not exist.');
        }
        if (errorMessages.length === 0) {
          errorMessages.push('An unknown error occurred.');
        }
        console.error('PowerShell script execution failed. Error messages:', errorMessages);
        reject({ errorMessages });
      } else {
        const message = `Mailbox_Permissions_Summary.csv created on C:/Temp/`;
        console.log('PowerShell script output:', stdout);
        resolve({ successMessages: [message] });
      }
    });
  });
};

export { getMailboxPermissions };
