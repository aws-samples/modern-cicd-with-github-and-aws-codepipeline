const { By, until } = require('selenium-webdriver');

async function openRoomsPage(driver) {
    const roomsLink = await driver.wait(until.elementIsVisible(driver.findElement(By.linkText("Rooms"))), 20000);
    await driver.wait(until.elementIsEnabled(roomsLink), 10000);
    await roomsLink.click();
}

async function verifyRoomList(driver, element, value = null) {
    if (element === "title") {
        await driver.wait(until.titleIs(value), 10000);
    } else if (element === "room_table") {
        await driver.wait(until.elementLocated(By.css("table")), 10000);
    }
}

async function verifyRoomDetails(driver, roomNumber, floorNumber, viewStatus) {
    const rows = await driver.wait(until.elementsLocated(By.css("tbody tr")), 10000);
    for (let row of rows) {
        const rowText = await row.getText();
        if (rowText.includes(roomNumber)) {
            if (!rowText.includes(floorNumber)) {
                throw new Error(`Expected floor number ${floorNumber} not found`);
            }

            const rowHTML = await row.getAttribute("innerHTML");
            if (viewStatus === "Yes" && !rowHTML.includes("bg-success")) {
                throw new Error(`Expected view status 'Yes', but found 'No'`);
            } else if (viewStatus === "No" && !rowHTML.includes("bg-danger")) {
                throw new Error(`Expected view status 'No', but found 'Yes'`);
            }
            break;
        }
    }
}

async function verifyTableColumns(driver) {
    const headers = await driver.wait(until.elementsLocated(By.css("table thead th")), 10000);
    const headerTexts = await Promise.all(headers.map(header => header.getText()));

    if (!headerTexts.includes("Room Number")) {
        throw new Error("Expected 'Room Number' column in table headers");
    }
    if (!headerTexts.includes("Floor Number")) {
        throw new Error("Expected 'Floor Number' column in table headers");
    }
    if (!headerTexts.includes("Good View")) {
        throw new Error("Expected 'Good View' column in table headers");
    }
}

async function verifyRoomsStoredAlert(driver) {
    const alert = await driver.wait(until.elementLocated(By.css(".alert-info")), 10000);
    const alertText = await alert.getText();
    const pattern = /Rooms stored in database: \d+/;
    if (!pattern.test(alertText)) {
        throw new Error(`Expected an alert matching '${pattern}', but got: ${alertText}`);
    }
}

module.exports = {
    openRoomsPage,
    verifyRoomList,
    verifyRoomDetails,
    verifyTableColumns,
    verifyRoomsStoredAlert,
};
