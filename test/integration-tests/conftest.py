import os
import pytest
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.webdriver.chrome.options import Options as chrome_options_mod
from selenium.webdriver.firefox.options import Options as firefox_options_mod
from selenium import webdriver

from selenium.webdriver import Remote
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities


@pytest.fixture
def base_url():
    # Get the base URL from the environment variable, default to localhost if not set
    return os.getenv("BASE_URL", None)


@pytest.fixture
def browser():
    # Get the Selenium Grid URL from the environment variable
    grid_url = os.getenv("GRID_URL", None)
    print(f"using Grid URL:{grid_url}")
    if grid_url:
        options = chrome_options_mod()
        driver = Remote(
            command_executor=grid_url,
            options=options,
        )
    else:
        # If no GRID_URL, run the browser locally
        driver = webdriver.Chrome()  # You can change this to Firefox, Safari, etc.
    # driver = webdriver.Chrome()  # You
    driver.implicitly_wait(10)
    driver.set_window_size(1920, 1080)  # Full HD resolution

    yield driver
    driver.quit()
