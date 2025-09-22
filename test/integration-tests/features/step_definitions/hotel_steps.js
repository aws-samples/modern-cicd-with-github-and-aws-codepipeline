const { setDefaultTimeout, Given, When, Then, After } = require('@cucumber/cucumber');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const { openHomepage, verifyHomepageElements } = require('./helpers/homepageHelper');
const {
  openAddRoomPage,
  fillAddRoomForm,
  verifyAddRoomSuccess,
  verifyAddRoomFormFields,
  verifySubmitButton
} = require('./helpers/addRoomHelper');
const {
  openRoomsPage,
  verifyRoomList,
  verifyRoomDetails,
  verifyTableColumns,
  verifyRoomsStoredAlert
} = require('./helpers/roomsHelper');

let driver;

setDefaultTimeout(120 * 1000); // needed for the time it takes to spin up the remote web driver if used

// Function to build and return a WebDriver instance
const buildDriver = async () => {
  const gridUrl = process.env.GRID_URL || null;

  if (gridUrl) {
    console.log(`Using Selenium Grid at: ${gridUrl}`);
    driver = await new Builder()
      .usingServer(gridUrl) // Use the Selenium Grid URL here
      .forBrowser('chrome')
      .build();
  } else {
    // If no GRID_URL is set, run the browser locally
    let options = new chrome.Options();
    options.addArguments(
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--allow-running-insecure-content',
      '--disable-web-security'
    );

    if (process.env.CI) {
      console.log('Running in CI, enabling headless mode for Chrome');
      options.addArguments('--headless');
    }

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  }

  // Common settings for the driver
  await driver.manage().setTimeouts({ implicit: 10000 });
  await driver.manage().window().setRect({ width: 1920, height: 1080 }); // Full HD resolution
};

// Step Definitions
Given('I am on the homepage', async function () {
  await buildDriver(); // Create WebDriver instance
  const baseUrl = process.env.BASE_URL || 'http://localhost:8081';
  await openHomepage(driver, baseUrl); // Use helper function to open the homepage
});

Then('I should see the page title {string}', async function (title) {
  await verifyHomepageElements(driver, 'title', title); // Use helper function
});

Then('I should see a navbar with {string}, {string}, and {string} options', async function (home, rooms, add) {
  await verifyHomepageElements(driver, 'navbar');
});

Then('I should see the heading {string}', async function (headingText) {
  await verifyHomepageElements(driver, 'heading', headingText);
});

When('I click on {string} in the navbar', async function (linkText) {
  // Ensure navbar is expanded
  const toggleButton = await driver.findElement(By.className("navbar-toggler"));
  if (await toggleButton.isDisplayed()) {
    await toggleButton.click();
    await driver.sleep(500);
  }
  
  // Find and click the navbar link
  const navbarLinkLocator = By.linkText(linkText);
  await driver.wait(
    until.elementLocated(navbarLinkLocator),
    10000,
    `Navbar link "${linkText}" not found`
  );
  
  const navbarLink = await driver.findElement(navbarLinkLocator);
  await navbarLink.click();
  await driver.sleep(1000);
});


Then('I should be on the {string} page', async function (pageTitle) {
  await verifyRoomList(driver, 'title', pageTitle);
});

Then('I should see a table with the list of rooms', async function () {
  await verifyRoomList(driver, 'room_table');
});

Then('the table should contain columns for {string}, {string}, and {string}', async function (c1, c2, c3) {
  await verifyTableColumns(driver);
});

When('I enter {string} in the {string} field', async function (value, fieldName) {
  if (fieldName === 'Room number') {
    await fillAddRoomForm(driver, 'room_number', value);
  } else if (fieldName === 'Floor number') {
    await fillAddRoomForm(driver, 'floor_number', value);
  } else {
    throw new Error(`Unsupported field name: ${fieldName}`);
  }
});

When('I select {string} from the "Good View" dropdown', async function (value) {
  await fillAddRoomForm(driver, 'good_view', value);
});

When('I click the "Add room" button', async function () {
  await fillAddRoomForm(driver, 'submit');
});

Then('the new room should be added successfully', async function () {
  await verifyAddRoomSuccess(driver);
});

Then('I should see a room with the room number {string}, on floor {string}, with {string} under Good View', async function (rNumber, fNumber, viewStatus) {
  await verifyRoomDetails(driver, rNumber, fNumber, viewStatus);
});

Then('I should see an alert displaying the number of rooms stored in the database', async function () {
  await verifyRoomsStoredAlert(driver);
});

Then('I should see a form with fields for {string}, {string}, and {string}', { timeout: 20000 }, async function (f1, f2, f3) {
  await verifyAddRoomFormFields(driver);
});

Then('I should see a submit button labeled {string}', { timeout: 20000 }, async function (buttonLabel) {
  await verifySubmitButton(driver, buttonLabel);
});

// Tear Down
After(async function () {
  if (driver) {
    await driver.quit();
  }
});
