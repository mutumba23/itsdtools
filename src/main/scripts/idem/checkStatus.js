import { exec } from 'child_process';

export const checkStatus = ({ computerName }) => {
  return new Promise((resolve, reject) => {
    const command = `powershell.exe Invoke-Command -ComputerName ${computerName} -ScriptBlock {reg query "HKLM\\SOFTWARE\\IKEA\\IDEM" /v CurrentStatus}`;
    exec(command, (error, stdout) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject({ errorMessages: ['There was an error reading the status.'] });
      } else {
        console.log(`stdout: ${stdout}`);
        const match = stdout.match(/CurrentStatus\s+REG_SZ\s+(.+)/);
        if (match) {
          resolve({ successMessages: [match[1]] });
        } else {
          reject({ errorMessages: ['Could not find the information.'] });
        }
      }
    });
  });
};
