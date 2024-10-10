const { By, until } = require('selenium-webdriver');

// Helper function to wait until an element is present before interacting with it
async function waitForElement(driver, locator, timeout = 10000) {
    return driver.wait(until.elementLocated(locator), timeout);
}

async function openAddRoomPage(driver) {
    const addLink = await driver.wait(until.elementIsVisible(driver.findElement(By.linkText("Book"))), 20000);
    await driver.wait(until.elementIsEnabled(addLink), 10000);
    await addLink.click();
}

async function fillAddRoomForm(driver, field, value = null) {
    if (field === "room_number") {
        const roomNumberField = await waitForElement(driver, By.name("roomNumber"));
        await roomNumberField.clear();
        await roomNumberField.sendKeys(value);
    } else if (field === "floor_number") {
        const floorNumberField = await waitForElement(driver, By.name("floorNumber"));
        await floorNumberField.clear();
        await floorNumberField.sendKeys(value);
    } else if (field === "good_view") {
        const goodViewDropdown = await waitForElement(driver, By.name("hasView"));
        await goodViewDropdown.sendKeys(value); // Simulate selecting the dropdown value
    } else if (field === "submit") {
        const submitButton = await waitForElement(driver, By.css('button[type="submit"]'));
        await submitButton.click();
    }
}

async function verifyAddRoomFormFields(driver) {
    // Check if the "Room number" field is present
    const roomNumberField = await driver.wait(until.elementLocated(By.name("roomNumber")), 20000);
    if (!roomNumberField) {
        throw new Error("Room number field is missing");
    }

    // Check if the "Floor number" field is present
    const floorNumberField = await driver.wait(until.elementLocated(By.name("floorNumber")), 20000);
    if (!floorNumberField) {
        throw new Error("Floor number field is missing");
    }

    // Check if the "Good View" dropdown is present
    const goodViewDropdown = await driver.wait(until.elementLocated(By.name("hasView")), 20000);
    if (!goodViewDropdown) {
        throw new Error("Good View dropdown is missing");
    }

}

async function verifyAddRoomSuccess(driver, redirect = null) {
    if (redirect) {
        await driver.wait(until.titleIs("Room List"), 10000);
    } else {
        const successMessage = await waitForElement(driver, By.css(".results p"));
        const successText = await successMessage.getText();
        if (!successText.includes("Room number") || !successText.includes("added")) {
            throw new Error(`Expected success message not found. Got: ${successText}`);
        }
    }
}

async function verifySubmitButton(driver, expectedLabel) {
    // Locate the submit button using its type attribute
    const submitButton = await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 20000);
    const buttonText = await submitButton.getText();

    // Check if the button text matches the expected label
    if (buttonText !== expectedLabel) {
        throw new Error(`Expected button text to be '${expectedLabel}', but got '${buttonText}'`);
    }

    console.log(`Submit button with label '${buttonText}' is present.`);
}

module.exports = {
    openAddRoomPage,
    fillAddRoomForm,
    verifyAddRoomSuccess,
    verifyAddRoomFormFields,
    verifySubmitButton,
};
