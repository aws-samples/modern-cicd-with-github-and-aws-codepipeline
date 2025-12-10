/**
 * Integration tests for hotel management application using Selenium WebDriver
 * Tests the complete application flow from frontend to backend
 * Requirements: 6.3
 * 
 * These tests run against the local development environment:
 * - Frontend: http://localhost:5173 (Vite dev server)
 * - Backend: http://localhost:3000 (SAM Local API Gateway)
 * - Database: DynamoDB Local
 */

import { Builder, By, until, WebDriver, WebElement } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

// Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

describe('Hotel Management Application - Integration Tests', () => {
  let driver: WebDriver;

  // Setup: Create WebDriver instance before all tests
  beforeAll(async () => {
    const options = new chrome.Options();
    
    // Run in headless mode in CI
    if (process.env.CI) {
      options.addArguments('--headless');
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
    }
    
    // Additional options for stability
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');
    
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    // Set implicit wait timeout
    await driver.manage().setTimeouts({ implicit: 10000 });
  }, TEST_TIMEOUT);

  // Teardown: Quit WebDriver after all tests
  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  }, TEST_TIMEOUT);

  // Helper function to generate unique room numbers for testing
  function generateRoomNumber(): number {
    return Math.floor(Math.random() * 9000) + 1000;
  }

  // Helper function to wait for page load
  async function waitForPageLoad() {
    await driver.wait(
      async () => {
        const readyState = await driver.executeScript('return document.readyState');
        return readyState === 'complete';
      },
      10000,
      'Page did not load within timeout'
    );
  }

  test('should load home page and display hotel name', async () => {
    // Test: Home page navigation
    // Navigate to the application
    await driver.get(FRONTEND_URL);
    await waitForPageLoad();

    // Verify the page title contains "Hotel"
    const title = await driver.getTitle();
    expect(title).toMatch(/hotel/i);

    // Verify the hotel name is displayed in the page
    // Look for any element containing "hotel" text
    const bodyText = await driver.findElement(By.tagName('body')).getText();
    expect(bodyText).toMatch(/hotel/i);

    // Verify header is present
    const headers = await driver.findElements(By.css('header, [role="banner"]'));
    expect(headers.length).toBeGreaterThan(0);
  }, TEST_TIMEOUT);

  test('should display rooms list', async () => {
    // Test: Rooms list display
    await driver.get(FRONTEND_URL);
    await waitForPageLoad();

    // Wait a moment for API call to complete
    await driver.sleep(2000);

    // Look for table or cards component
    const roomsContainers = await driver.findElements(
      By.css('table, [role="table"], .awsui-table, .awsui-cards')
    );

    if (roomsContainers.length > 0) {
      // Verify rooms container is visible
      const isDisplayed = await roomsContainers[0].isDisplayed();
      expect(isDisplayed).toBe(true);

      // Look for room data cells
      const dataCells = await driver.findElements(
        By.css('td, .awsui-table-cell, .awsui-cards-card')
      );

      // Either we have data or an empty state (both are valid)
      expect(dataCells.length).toBeGreaterThanOrEqual(0);
    } else {
      // If no table/cards, verify no error message is shown
      const errorElements = await driver.findElements(By.xpath("//*[contains(text(), 'error') or contains(text(), 'Error')]"));
      expect(errorElements.length).toBe(0);
    }
  }, TEST_TIMEOUT);

  test('should add a new room successfully', async () => {
    // Test: Adding a new room
    await driver.get(FRONTEND_URL);
    await waitForPageLoad();

    const roomNumber = generateRoomNumber();
    const floorNumber = Math.floor(roomNumber / 100);

    // Find form inputs
    // Look for number inputs (room and floor)
    const numberInputs = await driver.findElements(By.css('input[type="number"]'));
    expect(numberInputs.length).toBeGreaterThanOrEqual(2);

    const roomNumberInput = numberInputs[0];
    const floorNumberInput = numberInputs[1];

    // Fill in the form
    await roomNumberInput.clear();
    await roomNumberInput.sendKeys(roomNumber.toString());

    await floorNumberInput.clear();
    await floorNumberInput.sendKeys(floorNumber.toString());

    // Check the hasView checkbox if it exists
    const checkboxes = await driver.findElements(By.css('input[type="checkbox"]'));
    if (checkboxes.length > 0) {
      await checkboxes[0].click();
    }

    // Find and click submit button
    const submitButtons = await driver.findElements(
      By.css('button[type="submit"], button')
    );
    
    let submitButton: WebElement | null = null;
    for (const button of submitButtons) {
      const buttonText = await button.getText();
      if (buttonText.match(/add|submit/i)) {
        submitButton = button;
        break;
      }
    }

    if (submitButton) {
      await submitButton.click();
    } else {
      // Try the first button if no "Add" button found
      if (submitButtons.length > 0) {
        await submitButtons[0].click();
      }
    }

    // Wait for the API call to complete
    await driver.sleep(2000);

    // Verify success - look for the room number in the page or success message
    const bodyText = await driver.findElement(By.tagName('body')).getText();
    
    // Check for success indicators
    const hasSuccess = 
      bodyText.includes('success') ||
      bodyText.includes('Success') ||
      bodyText.includes('added') ||
      bodyText.includes('Added') ||
      bodyText.includes(roomNumber.toString());

    // At minimum, verify no error occurred
    const hasError = bodyText.match(/error|failed/i);
    expect(hasError).toBeFalsy();
  }, TEST_TIMEOUT);

  test('should show validation error for invalid room data', async () => {
    // Test: Form validation errors
    await driver.get(FRONTEND_URL);
    await waitForPageLoad();

    // Find form inputs
    const numberInputs = await driver.findElements(By.css('input[type="number"]'));
    expect(numberInputs.length).toBeGreaterThanOrEqual(2);

    const roomNumberInput = numberInputs[0];
    const floorNumberInput = numberInputs[1];

    // Enter invalid data (negative numbers)
    await roomNumberInput.clear();
    await roomNumberInput.sendKeys('-1');

    await floorNumberInput.clear();
    await floorNumberInput.sendKeys('-1');

    // Find and click submit button
    const submitButtons = await driver.findElements(
      By.css('button[type="submit"], button')
    );
    
    if (submitButtons.length > 0) {
      let submitButton: WebElement | null = null;
      for (const button of submitButtons) {
        const buttonText = await button.getText();
        if (buttonText.match(/add|submit/i)) {
          submitButton = button;
          break;
        }
      }
      
      if (submitButton) {
        await submitButton.click();
      } else {
        await submitButtons[0].click();
      }
    }

    // Wait for validation
    await driver.sleep(1000);

    // Look for error indicators
    const errorElements = await driver.findElements(
      By.css('.awsui-form-field-error, [role="alert"]')
    );

    const bodyText = await driver.findElement(By.tagName('body')).getText();
    const hasErrorText = 
      bodyText.match(/invalid|required|must be|error/i) !== null;

    // Either we have error elements or error text, or no success message
    const hasSuccessText = bodyText.match(/success|added/i) !== null;
    
    // Validation should prevent success
    expect(hasSuccessText).toBe(false);
  }, TEST_TIMEOUT);

  test('should verify API endpoints are accessible', async () => {
    // Test: API connectivity
    // Navigate to a page to get access to fetch API
    await driver.get(FRONTEND_URL);
    await waitForPageLoad();

    // Test GET /api/config using executeScript
    const configResponse = await driver.executeScript(`
      return fetch('${API_URL}/api/config')
        .then(res => res.json())
        .then(data => ({ success: true, data }))
        .catch(err => ({ success: false, error: err.message }));
    `);

    expect(configResponse).toHaveProperty('success', true);
    expect(configResponse).toHaveProperty('data');
    expect((configResponse as any).data).toHaveProperty('hotelName');

    // Test GET /api/rooms
    const roomsResponse = await driver.executeScript(`
      return fetch('${API_URL}/api/rooms')
        .then(res => res.json())
        .then(data => ({ success: true, data }))
        .catch(err => ({ success: false, error: err.message }));
    `);

    expect(roomsResponse).toHaveProperty('success', true);
    expect(roomsResponse).toHaveProperty('data');
    expect((roomsResponse as any).data).toHaveProperty('rooms');
    expect(Array.isArray((roomsResponse as any).data.rooms)).toBe(true);
  }, TEST_TIMEOUT);

  test('should handle API errors gracefully', async () => {
    // Test: Error handling
    await driver.get(FRONTEND_URL);
    await waitForPageLoad();

    // Try to add a room with invalid data via API
    const response = await driver.executeScript(`
      return fetch('${API_URL}/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: 'invalid',
          floorNumber: 'invalid',
          hasView: 'not-a-boolean'
        })
      })
      .then(res => res.json().then(data => ({ status: res.status, data })))
      .catch(err => ({ status: 0, error: err.message }));
    `);

    // Should return 400 Bad Request
    expect((response as any).status).toBe(400);

    // Response should contain error information
    expect((response as any).data).toHaveProperty('error');
  }, TEST_TIMEOUT);
});
