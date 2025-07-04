const { spawn } = require('child_process');
const path = require('path');

// Helper to spawn processes
function spawnProcess(command, args, cwd, name) {
  const proc = spawn(command, args, {
    cwd: path.join(__dirname, cwd),
    shell: true,
    stdio: 'pipe'
  });

  proc.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });

  proc.stderr.on('data', (data) => {
    console.error(`[${name}] ${data.toString().trim()}`);
  });

  proc.on('error', (error) => {
    console.error(`[${name}] Failed to start:`, error);
  });

  return proc;
}

// Start backend
console.log('Starting backend server...');
const backend = spawnProcess(
  'npm',
  ['run', 'dev'],
  'backend',
  'Backend'
);

// Wait for backend to start before starting frontend
setTimeout(() => {
  console.log('Starting frontend server...');
  const frontend = spawnProcess(
    'npm',
    ['start'],
    'frontend',
    'Frontend'
  );

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\nShutting down servers...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });
}, 5000); // Wait 5 seconds for backend to initialize

console.log('\nStarting development servers...');
console.log('Press Ctrl+C to stop all servers\n');