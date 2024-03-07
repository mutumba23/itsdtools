const sudo = require('sudo-prompt');
const path = require("path");

const installExchangeModule = () => {
    return new Promise((resolve, reject) => {
        const isDevelopment = process.env.NODE_ENV !== "production";
        let scriptPath;
        if (isDevelopment) {
            scriptPath = path.join(__dirname, '..', '..', 'resources', 'ps1_scripts', 'installExchangeModule.ps1');
        } else {
            scriptPath = path.join(process.resourcesPath, 'ps1_scripts', 'installExchangeModule.ps1');
        }

        const options = {
            name: 'ITSD Tools',
        };

        sudo.exec(`powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`, options,
            (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing PowerShell script: ${error}`);
                    console.error(`stderr: ${stderr}`);
                    reject({ errorMessages: [`There was an error executing the installation script: ${error}`] });
                } else {
                    console.log('stdout: ' + stdout);
                    console.log('stderr: ' + stderr);
                    
                    if (stdout.includes('ExchangeOnlineManagement module is already installed')) {
                        resolve({ successMessages: ['The Exchange Online Module is already installed.'] });
                    } else if (stdout.includes('ExchangeOnlineManagement module installed successfully')) {
                        resolve({ successMessages: ['The Exchange Online Module is now installed.'] });
                    } else {
                        console.error('Unknown output from installation script:', stdout);
                        reject({ errorMessages: ['An unknown error occurred during installation.'] });
                    }
                }
            }
        );
    });
};

export { installExchangeModule };
