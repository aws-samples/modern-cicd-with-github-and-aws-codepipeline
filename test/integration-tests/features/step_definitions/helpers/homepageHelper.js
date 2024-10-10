const { By, until } = require('selenium-webdriver');

async function openHomepage(driver, baseUrl) {
    await driver.get(baseUrl);
}

async function verifyHomepageElements(driver, element, value = null) {
    if (element === "title") {
        await driver.wait(until.titleIs(value), 10000);
    } else if (element === "navbar") {
        const navbar = await driver.wait(until.elementLocated(By.id("navbarNav")), 10000);
        const toggleButton = await driver.findElement(By.className("navbar-toggler"));
        if (await toggleButton.isDisplayed()) {
            await toggleButton.click();
        }

        const navbarText = await navbar.getText();
        if (!navbarText.includes("Home") || !navbarText.includes("Rooms") || !navbarText.includes("Book")) {
            throw new Error(`Navbar links missing. Got: ${navbarText}`);
        }
    } else if (element === "heading") {
        const heading = await driver.wait(until.elementLocated(By.tagName("h1")), 10000);
        const headingText = await heading.getText();
        if (headingText !== value) {
            throw new Error(`Expected heading '${value}', but got '${headingText}'`);
        }
    }
}

module.exports = {
    openHomepage,
    verifyHomepageElements,
};
