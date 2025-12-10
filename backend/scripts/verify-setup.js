#!/usr/bin/env node

/**
 * Script to verify local development setup
 * Checks that all required files and configurations are in place
 */

const fs = require('fs');
const path = require('path');

const checks = [];

function check(name, fn) {
  checks.push({ name, fn });
}

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, '..', filePath));
}

function directoryExists(dirPath) {
  return fs.existsSync(path.join(__dirname, '..', dirPath)) && 
         fs.statSync(path.join(__dirname, '..', dirPath)).isDirectory();
}

// Check 1: TypeScript compiled
check('TypeScript compiled (dist/ directory exists)', () => {
  return directoryExists('dist');
});

// Check 2: Handler files compiled
check('Lambda handlers compiled', () => {
  return fileExists('dist/handlers/getConfig.js') &&
         fileExists('dist/handlers/getRooms.js') &&
         fileExists('dist/handlers/addRoom.js');
});

// Check 3: SAM template exists
check('SAM template exists', () => {
  return fileExists('template.yaml');
});

// Check 4: SAM config exists
check('SAM config exists', () => {
  return fileExists('samconfig.toml');
});

// Check 5: Environment config exists
check('Environment config exists', () => {
  return fileExists('env.json');
});

// Check 6: Local env file exists
check('Local .env file exists', () => {
  return fileExists('.env.local');
});

// Check 7: Setup script exists
check('DynamoDB setup script exists', () => {
  return fileExists('scripts/setup-local-dynamodb.js');
});

// Check 8: Node modules installed
check('Node modules installed', () => {
  return directoryExists('node_modules');
});

// Check 9: AWS SDK installed
check('AWS SDK installed', () => {
  try {
    require.resolve('@aws-sdk/client-dynamodb');
    return true;
  } catch (e) {
    return false;
  }
});

// Run all checks
console.log('\n🔍 Verifying local development setup...\n');

let passed = 0;
let failed = 0;

checks.forEach(({ name, fn }) => {
  try {
    const result = fn();
    if (result) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${name} - Error: ${error.message}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✨ All checks passed! Your local development environment is ready.\n');
  console.log('Next steps:');
  console.log('  1. Start DynamoDB Local: npm run dynamodb:start');
  console.log('  2. Set up tables: npm run dynamodb:setup');
  console.log('  3. Start backend: npm run dev:backend');
  console.log('  4. Start frontend: npm run dev:frontend\n');
  console.log('Or run everything at once from the root: npm start\n');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Please fix the issues above.\n');
  console.log('Common fixes:');
  console.log('  - Run "npm install" to install dependencies');
  console.log('  - Run "npm run build" to compile TypeScript');
  console.log('  - Ensure all required files are present\n');
  process.exit(1);
}
