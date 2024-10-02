from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def open_homepage(browser, base_url):
    # Navigate to the base URL
    browser.get(base_url)


def verify_homepage_elements(browser, element, value=None):
    # Explicit wait for title verification
    if element == "title":
        xpath = "/html/head/title"
        WebDriverWait(browser, 10).until(
            EC.presence_of_element_located((By.XPATH, xpath))
        )
        assert (
            browser.title == value
        ), f"Expected title to be {value}, but got {browser.title}"

    # Explicit wait for navbar visibility
    elif element == "navbar":
        navbar = WebDriverWait(browser, 10).until(
            EC.presence_of_element_located((By.ID, "navbarNav"))
        )

        # Check if the navbar is collapsed (collapsed class exists)
        toggle_button = browser.find_element(By.CLASS_NAME, "navbar-toggler")
        if toggle_button.is_displayed():
            toggle_button.click()  # Expand the navbar

        # Wait until the text in the navbar is loaded
        WebDriverWait(browser, 10).until(lambda x: navbar.text.strip() != "")

        assert "Home" in navbar.text, '"Home" link is missing in navbar'
        assert "Rooms" in navbar.text, '"Rooms" link is missing in navbar'
        assert "Add" in navbar.text, '"Add" link is missing in navbar'

    # Explicit wait for heading
    elif element == "heading":
        heading = WebDriverWait(browser, 10).until(
            EC.visibility_of_element_located((By.TAG_NAME, "h1"))
        )
        assert (
            heading.text == "Welcome to AWS App Runner Hotel"
        ), f"Expected heading 'Welcome to AWS App Runner Hotel', but got '{heading.text}'"
