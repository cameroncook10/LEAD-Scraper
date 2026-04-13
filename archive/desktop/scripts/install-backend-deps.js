const { execSync } = require('child_process');
const path = require('path');

exports.default = async function (context) {
  const backendDir = path.join(context.appOutDir, 'resources', 'backend');
  console.log('Installing backend dependencies in:', backendDir);
  execSync('npm install --omit=dev', {
    cwd: backendDir,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  });
};
