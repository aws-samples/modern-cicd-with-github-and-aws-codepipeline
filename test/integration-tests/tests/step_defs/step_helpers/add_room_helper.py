from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Helper function to wait until an element is present before interacting with it
def wait_for_element(browser, by, value, timeout=10):
    return WebDriverWait(browser, timeout).until(
        EC.presence_of_element_located((by, value))
    )


def open_add_room_page(browser):
    # Use By.LINK_TEXT to click on the "Add" link, wait until it's clickable
    add_link = wait_for_element(browser, By.LINK_TEXT, "Add")
    add_link.click()


def fill_add_room_form(browser, field, value=None):
    if field == "room_number":
        # Use By.NAME to find the room number field, wait until present
        room_number_field = wait_for_element(browser, By.NAME, "roomNumber")
        room_number_field.clear()  # Clear the field if there's existing data
        room_number_field.send_keys(value)
    elif field == "floor_number":
        # Use By.NAME to find the floor number field, wait until present
        floor_number_field = wait_for_element(browser, By.NAME, "floorNumber")
        floor_number_field.clear()
        floor_number_field.send_keys(value)
    elif field == "good_view":
        # Use By.NAME to find the good view dropdown, wait until present
        good_view_dropdown = wait_for_element(browser, By.NAME, "hasView")
        good_view_dropdown.send_keys(value)  # Simulate selecting the dropdown value
    elif field == "submit":
        # Use By.CSS_SELECTOR to click the submit button, wait until clickable
        submit_button = wait_for_element(
            browser, By.CSS_SELECTOR, 'button[type="submit"]'
        )
        submit_button.click()


def verify_add_room_success(browser, redirect=None):
    if redirect:
        # Verify that the page title is "Room List" after redirection
        WebDriverWait(browser, 10).until(EC.title_is("Room List"))
    else:
        # Find the results div and check if it contains the success message
        success_message = wait_for_element(browser, By.CSS_SELECTOR, ".results p")
        success_text = success_message.text
        # Verify that the success message contains the expected text
        assert (
            "Room number" in success_text and "added" in success_text
        ), f"Expected success message not found. Got: {success_text}"


def verify_add_room_page(browser):
    # Verify the page title is "Add new room"
    WebDriverWait(browser, 10).until(EC.title_is("Add new room"))

    # Use By.NAME to check that the form fields exist
    room_number_field = wait_for_element(browser, By.NAME, "roomNumber")
    floor_number_field = wait_for_element(browser, By.NAME, "floorNumber")
    good_view_dropdown = wait_for_element(browser, By.NAME, "hasView")
    submit_button = wait_for_element(browser, By.CSS_SELECTOR, 'button[type="submit"]')

    # Assert that the required elements are present
    assert room_number_field is not None
    assert floor_number_field is not None
    assert good_view_dropdown is not None
    assert submit_button.text == "Add room"


def verify_add_room_form_fields(browser):
    # Check if the "Room number" field is present
    room_number_field = wait_for_element(browser, By.NAME, "roomNumber")
    assert room_number_field is not None, "Room number field is missing"

    # Check if the "Floor number" field is present
    floor_number_field = wait_for_element(browser, By.NAME, "floorNumber")
    assert floor_number_field is not None, "Floor number field is missing"

    # Check if the "Good View" dropdown is present
    good_view_dropdown = wait_for_element(browser, By.NAME, "hasView")
    assert good_view_dropdown is not None, "Good View dropdown is missing"


def verify_submit_button(browser):
    # Find the submit button by its type and label
    submit_button = wait_for_element(browser, By.CSS_SELECTOR, 'button[type="submit"]')

    # Verify that the button text is "Add room"
    assert (
        submit_button.text == "Add room"
    ), f"Expected button text to be 'Add room', but got '{submit_button.text}'"


def leave_room_number_blank(browser):
    # Simulate leaving the "Room number" field blank
    fill_add_room_form(browser, "room_number", "")
