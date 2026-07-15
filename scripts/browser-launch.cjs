const fs = require('fs');

function chromiumLaunchOptions() {
  const configured = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (configured) {
    if (!fs.existsSync(configured)) throw new Error(`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH 不存在: ${configured}`);
    return { executablePath: configured, args: ['--no-sandbox'] };
  }

  if (process.env.CI) return { args: ['--no-sandbox'] };

  const systemBrowsers = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  const executablePath = systemBrowsers.find(candidate => fs.existsSync(candidate));
  return executablePath ? { executablePath, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] };
}

module.exports = { chromiumLaunchOptions };
