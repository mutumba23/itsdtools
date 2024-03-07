const { spawn } = require('child_process');

export const runGpUpdate = ({ computerName }) => {
  return new Promise((resolve, reject) => {
    const command = `powershell.exe`;
    const args = [`Invoke-Command -ComputerName ${computerName} -ScriptBlock {echo n | gpupdate /force}`];
    const cmd = spawn(command, args);

    cmd.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    cmd.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    cmd.on('error', (error) => {
      console.error(`exec error: ${error}`);
      reject({ errorMessages: ['There was an error running the gpupdate command.'] });
    });

    cmd.on('close', (code) => {
      if (code !== 0) {
        reject({ errorMessages: [`gpupdate command exited with code ${code}`] });
      } else {
        resolve({ successMessages: ['The gpupdate /force command completed successfully.'] });
      }
    });
  });
};