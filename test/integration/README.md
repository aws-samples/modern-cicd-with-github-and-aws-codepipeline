# Integration Tests

This directory contains end-to-end integration tests for the hotel management application using Selenium WebDriver.

## Overview

These tests verify the complete application flow from frontend to backend, including:
- Home page navigation and display
- Rooms list display
- Adding new rooms
- Form validation
- API connectivity
- Error handling

## Requirements

- Node.js 18+
- Docker Desktop (for DynamoDB Local)
- Local development environment running

## Running Tests

### Prerequisites

Before running integration tests, ensure the local development environment is running:

```bash
# Start DynamoDB Local
npm run dynamodb:start

# Set up DynamoDB tables
npm run dynamodb:setup

# Start backend (SAM Local)
npm run dev:backend

# Start frontend (Vite dev server) - in a separate terminal
npm run dev:frontend
```

### Run All Integration Tests

```bash
# Run all tests (headless Chrome)
npm run test:integration

# Run tests in watch mode
npm run test:integration:watch
```

### Run Specific Tests

```bash
# Run a specific test file
jest --config jest.integration.config.js test/integration/hotel-app.test.ts

# Run tests matching a pattern
jest --config jest.integration.config.js -t "should add a new room"

# Run with verbose output
jest --config jest.integration.config.js --verbose
```

## Test Structure

### hotel-app.test.ts

Main integration test suite using Selenium WebDriver covering:

1. **Home Page Navigation**
   - Verifies page loads successfully
   - Checks hotel name is displayed
   - Validates header elements

2. **Rooms List Display**
   - Verifies rooms list loads
   - Checks room data is displayed
   - Handles empty state

3. **Add New Room**
   - Fills in room form
   - Submits valid data
   - Verifies room is added

4. **Form Validation**
   - Tests invalid input handling
   - Verifies error messages
   - Ensures form doesn't submit with invalid data

5. **API Connectivity**
   - Tests GET /api/config endpoint
   - Tests GET /api/rooms endpoint
   - Verifies response structure

6. **Error Handling**
   - Tests API error responses
   - Verifies 400 status for invalid data
   - Checks error message structure

## Configuration

Tests are configured in `jest.integration.config.js` at the root level:

- **Test Directory**: `./test/integration`
- **Test Pattern**: `**/*.test.ts`
- **Timeout**: 30 seconds per test
- **Test Environment**: Node.js
- **Browser**: Chrome (headless in CI)
- **Reporters**: Default, JUnit XML

### Environment Variables

- `FRONTEND_URL`: Frontend URL (default: http://localhost:5173)
- `API_URL`: Backend API URL (default: http://localhost:3000)
- `CI`: Set to enable headless mode and CI-specific behavior

## Test Reports

After running tests, reports are generated in:

- **JUnit XML**: `test-results/junit-integration.xml`
- **Console Output**: Detailed test results in terminal

View test results:

```bash
# Run tests with verbose output
npm run test:integration -- --verbose
```

## CI/CD Integration

Integration tests can be run in CodeBuild using the following buildspec:

```yaml
phases:
  install:
    runtime-versions:
      nodejs: 18
    commands:
      - npm ci
      # Chrome is pre-installed in CodeBuild standard images
  pre_build:
    commands:
      - npm run dynamodb:start
      - npm run dynamodb:setup
      - npm run dev:backend &
      - npm run dev:frontend &
      - sleep 10  # Wait for services to start
  build:
    commands:
      - export CI=true  # Enable headless mode
      - npm run test:integration
reports:
  integration-tests:
    files:
      - 'test-results/junit-integration.xml'
    file-format: 'JUNITXML'
```

## Troubleshooting

### Tests Fail to Connect

If tests fail with connection errors:

1. Verify DynamoDB Local is running:
   ```bash
   docker ps | grep dynamodb
   ```

2. Verify backend is running:
   ```bash
   curl http://localhost:3000/api/config
   ```

3. Verify frontend is running:
   ```bash
   curl http://localhost:5173
   ```

### Tests Timeout

If tests timeout:

1. Increase timeout in `playwright.config.ts`
2. Check if services are responding slowly
3. Verify network connectivity

### ChromeDriver Issues

If you encounter ChromeDriver version mismatch:

```bash
# Update chromedriver to match your Chrome version
npm install --save-dev chromedriver@latest
```

## Best Practices

1. **Keep Tests Independent**: Each test should be able to run independently
2. **Use Unique Data**: Generate unique room numbers to avoid conflicts
3. **Wait for Elements**: Use Selenium's `until` conditions and implicit waits
4. **Clean Up**: Always quit the WebDriver in afterAll hook
5. **Descriptive Names**: Use clear, descriptive test names
6. **Error Messages**: Include helpful error messages in assertions
7. **Headless Mode**: Run in headless mode in CI for faster execution

## Requirements Validation

These integration tests validate:
- **Requirement 6.3**: Integration tests using Selenium for API endpoints
- **Requirement 4.1-4.6**: Local development parity
- **Requirement 1.1-1.7**: Frontend functionality
- **Requirement 2.1-2.6**: Backend API functionality

## Additional Resources

- [Selenium WebDriver Documentation](https://www.selenium.dev/documentation/webdriver/)
- [Selenium Best Practices](https://www.selenium.dev/documentation/test_practices/)
- [Selenium JavaScript API](https://www.selenium.dev/selenium/docs/api/javascript/)
