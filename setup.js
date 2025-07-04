const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const executeCommand = (command, options = {}) => {
  console.log(`Executing: ${command}`);
  try {
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    console.error(`Failed to execute: ${command}`);
    console.error(error.message);
    return false;
  }
};

console.log('Setting up AI Writing Platform...\n');

// Clean up existing directories
console.log('Cleaning up...');
if (fs.existsSync('frontend')) {
  fs.rmSync('frontend', { recursive: true, force: true });
}
if (fs.existsSync('backend/node_modules')) {
  fs.rmSync('backend/node_modules', { recursive: true, force: true });
}
if (fs.existsSync('backend/dist')) {
  fs.rmSync('backend/dist', { recursive: true, force: true });
}

// Create new React app
console.log('\nCreating new React app...');
if (!executeCommand('npx create-react-app frontend --template typescript')) {
  process.exit(1);
}

// Install additional frontend dependencies
console.log('\nInstalling additional frontend dependencies...');
if (!executeCommand('npm install @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/react-fontawesome axios classnames', { cwd: 'frontend' })) {
  process.exit(1);
}

// Install backend dependencies
console.log('\nInstalling backend dependencies...');
if (!executeCommand('npm install', { cwd: 'backend' })) {
  process.exit(1);
}

// Create necessary directories
console.log('\nCreating required directories...');
const dirs = [
  path.join('backend', 'logs'),
  path.join('backend', 'uploads'),
  path.join('backend', 'models', 't5')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

console.log('\nSetup completed successfully!');
console.log('\nTo start development:');
console.log('1. In VS Code, press Ctrl+Shift+P');
console.log('2. Type "Tasks: Run Task"');
console.log('3. Select "Start Development"\n');
console.log('Or run these commands in separate terminals:');
console.log('Terminal 1: cd frontend && npm start');
console.log('Terminal 2: cd backend && npm run dev\n');
    const fullPath = path.join(__dirname, envPath);
    if (!fs.existsSync(fullPath)) {
      log.warn(`${envPath} not found. Please create it based on the example file.`);
    }
  });

  log.info('\nChecking TypeScript configuration...');
  
  // Verify TypeScript configs
  const tsConfigs = ['backend/tsconfig.json', 'frontend/tsconfig.json'];
  tsConfigs.forEach(config => {
    const configPath = path.join(__dirname, config);
    if (fs.existsSync(configPath)) {
      log.success(`Found ${config}`);
    } else {
      log.error(`Missing ${config}`);
    }
  });

  log.info('\nSetup completed!');
  log.info('\nTo start development:');
  log.info('1. Terminal 1: cd backend && npm run dev');
  log.info('2. Terminal 2: cd frontend && npm start');
  log.info('\nMake sure MongoDB is running locally or update the connection string in backend/.env');
}

setup().catch(error => {
  log.error('Setup failed:');
  log.error(error.message);
  process.exit(1);
});