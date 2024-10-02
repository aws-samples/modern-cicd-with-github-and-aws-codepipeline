from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import re


def open_rooms_page(browser):
    # Wait until the "Rooms" link is clickable and then click it
    rooms_link = WebDriverWait(browser, 10).until(
        EC.element_to_be_clickable((By.LINK_TEXT, "Rooms"))
    )
    rooms_link.click()


def verify_room_list(browser, element, value=None):
    # Wait until the page title is correct
    if element == "title":
        WebDriverWait(browser, 10).until(EC.title_is(value))
        assert (
            browser.title == value
        ), f"Expected title to be {value}, but got {browser.title}"

    # Wait for the room table to be visible
    elif element == "room_table":
        table = WebDriverWait(browser, 10).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "table"))
        )
        assert table is not None, "Room table is not present on the page"


def verify_room_details(browser, room_number, floor_number, view_status):
    # Wait for the table rows to be present
    rows = WebDriverWait(browser, 10).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "tbody tr"))
    )
    for row in rows:
        if room_number in row.text:
            assert (
                floor_number in row.text
            ), f"Expected floor number {floor_number} not found"
            if view_status == "Yes":
                assert "bg-success" in row.get_attribute(
                    "innerHTML"
                ), "Expected view status 'Yes', but found 'No'"
            else:
                assert "bg-danger" in row.get_attribute(
                    "innerHTML"
                ), "Expected view status 'No', but found 'Yes'"


def verify_table_columns(browser):
    # Wait for the table headers to be visible
    headers = WebDriverWait(browser, 10).until(
        EC.visibility_of_all_elements_located((By.CSS_SELECTOR, "table thead th"))
    )

    # Extract the text from each header element and check for the required columns
    header_texts = [header.text for header in headers]
    assert (
        "Room Number" in header_texts
    ), "Expected 'Room Number' column in table headers"
    assert (
        "Floor Number" in header_texts
    ), "Expected 'Floor Number' column in table headers"
    assert "Good View" in header_texts, "Expected 'Good View' column in table headers"


def verify_rooms_stored_alert(browser):
    # Wait for the alert to be visible
    alert = WebDriverWait(browser, 10).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, ".alert-info"))
    )

    # Verify the alert text matches the regex
    alert_text = alert.text
    pattern = r"Rooms stored in database: \d+"
    assert re.match(
        pattern, alert_text
    ), f"Expected an alert matching '{pattern}', but got: {alert_text}"
