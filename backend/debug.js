const fs = require('fs');
const path = require('path');

// Print current directory
console.log('Current directory:', process.cwd());

// List files in current directory
console.log('\nFiles in current directory:');
fs.readdirSync('.').forEach(file => {
  console.log(file);
});

// Check if models directory exists
const modelsPath = path.join('.', 'models');
console.log(`\nChecking if models directory exists at ${modelsPath}:`, fs.existsSync(modelsPath));

// List files in models directory if it exists
if (fs.existsSync(modelsPath)) {
  console.log('\nFiles in models directory:');
  fs.readdirSync(modelsPath).forEach(file => {
    console.log(file);
  });
}

// Check if Submission.js exists
const submissionPath = path.join(modelsPath, 'Submission.js');
console.log(`\nChecking if Submission.js exists at ${submissionPath}:`, fs.existsSync(submissionPath));

// Print environment variables (without sensitive values)
console.log('\nEnvironment variables:');
Object.keys(process.env)
  .filter(key => !key.includes('KEY') && !key.includes('SECRET') && !key.includes('TOKEN') && !key.includes('PASSWORD'))
  .forEach(key => {
    console.log(`${key}=${process.env[key]}`);
  });
