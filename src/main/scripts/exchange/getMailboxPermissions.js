const { spawn } = require('child_process');
import ps1Path from '../../../../resources/ps1_scripts/getMailboxPermission.ps1?asset&asarUnpack'

const getMailboxPermissions = ({ mailbox: mailboxValue }) => {
  return new Promise((resolve, reject) => {

    const script = spawn('powershell.exe', ['-File', ps1Path, '-mailbox', mailboxValue]);

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
        if (stdout.includes("Block Remote Powershell")) {
          errorMessages.push("Connection was blocked. Please make sure you use your adm account at @oneiig.onmicrosoft.com");
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
