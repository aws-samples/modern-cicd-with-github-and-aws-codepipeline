const { setDefaultTimeout, Given, When, Then, After } = require('@cucumber/cucumber');
const { Builder, By, until } = require('selenium-webdriver');
const { openHomepage, verifyHomepageElements } = require('./helpers/homepageHelper');
const { openAddRoomPage, fillAddRoomForm, verifyAddRoomSuccess, verifyAddRoomFormFields, verifySubmitButton } = require('./helpers/addRoomHelper');
const { openRoomsPage, verifyRoomList, verifyRoomDetails, verifyTableColumns, verifyRoomsStoredAlert } = require('./helpers/roomsHelper');

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
        driver = await new Builder().forBrowser('chrome').build();
    }

    // Common settings for the driver
    await driver.manage().setTimeouts({ implicit: 10000 });
    await driver.manage().window().setRect({ width: 1920, height: 1080 }); // Full HD resolution
};

// Step Definitions
Given('I am on the homepage', async function () {
    await buildDriver();  // Create WebDriver instance
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    await openHomepage(driver, baseUrl);  // Use helper function to open the homepage
});

Then('I should see the page title {string}', async function (title) {
    await verifyHomepageElements(driver, 'title', title);  // Use helper function to verify the title
});

Then('I should see a navbar with {string}, {string}, and {string} options', async function (home, rooms, add) {
    await verifyHomepageElements(driver, 'navbar');  // Use helper function to verify the navbar with the given options
});

Then('I should see the heading {string}', async function (headingText) {
    await verifyHomepageElements(driver, 'heading', headingText);  // Use helper function to verify the heading
});

When('I click on {string} in the navbar', async function (linkText) {
    if (linkText === "Rooms") {
        await openRoomsPage(driver);  // Use helper to open the Rooms page
    } else if (linkText === "Add") {
        await openAddRoomPage(driver);  // Use helper to open the Add Room page
    } else {
        throw new Error(`Link text ${linkText} is not supported.`);
    }
});

Then('I should be on the {string} page', async function (pageTitle) {
    await verifyRoomList(driver, 'title', pageTitle);  // Use helper function to verify the page title
});

Then('I should see a table with the list of rooms', async function () {
    await verifyRoomList(driver, 'room_table');  // Use helper function to verify room table is present
});

Then('the table should contain columns for {string}, {string}, and {string}', async function (column1, column2, column3) {
    await verifyTableColumns(driver);  // Use helper function to verify table columns
});

When('I enter {string} in the {string} field', async function (value, fieldName) {
    if (fieldName === "Room number") {
        await fillAddRoomForm(driver, "room_number", value);
    } else if (fieldName === "Floor number") {
        await fillAddRoomForm(driver, "floor_number", value);
    } else {
        throw new Error(`Unsupported field name: ${fieldName}`);
    }
});

When('I select {string} from the "Good View" dropdown', async function (value) {
    await fillAddRoomForm(driver, "good_view", value);
});

When('I click the "Add room" button', async function () {
    await fillAddRoomForm(driver, "submit");
});

Then('the new room should be added successfully', async function () {
    await verifyAddRoomSuccess(driver);
});

Then('I should see a room with the room number {string}, on floor {string}, with {string} under Good View', async function (roomNumber, floorNumber, viewStatus) {
    await verifyRoomDetails(driver, roomNumber, floorNumber, viewStatus);
});

Then('I should see an alert displaying the number of rooms stored in the database', async function () {
    await verifyRoomsStoredAlert(driver);
});

Then('I should see a form with fields for {string}, {string}, and {string}', { timeout: 20000 }, async function (field1, field2, field3) {
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
