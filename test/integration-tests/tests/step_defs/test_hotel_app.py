import pytest
from pytest_bdd import scenarios, given, when, then, parsers
from step_helpers.homepage_helper import *
from step_helpers.rooms_helper import *
from step_helpers.add_room_helper import *

# Load the homepage feature file
scenarios("../features/hotel_management.feature")


@given("I am on the homepage")
def open_page(browser, base_url):
    open_homepage(browser, base_url)


@when('I click on "Rooms" in the navbar')
def navigate_to_rooms(browser):
    open_rooms_page(browser)


@then('I should see the page title "AWS App Runner Hotel"')
def check_homepage_title(browser):
    verify_homepage_elements(browser, "title", "AWS App Runner Hotel")


@then('I should see the page title "Room List"')
def check_homepage_title(browser):
    verify_homepage_elements(browser, "title", "Room List")


@then(
    'the table should contain columns for "Room Number", "Floor Number", and "Good View"'
)
def check_table_columns(browser):
    verify_table_columns(browser)


@then('I should see a navbar with "Home", "Rooms", and "Add" options')
def check_navbar(browser):
    verify_homepage_elements(browser, "navbar")


@then('I should see the heading "Welcome to AWS App Runner Hotel"')
def check_heading(browser):
    verify_homepage_elements(browser, "heading")


@when('I click on "Rooms" in the navbar')
def navigate_to_rooms(browser):
    open_rooms_page(browser)


@then('I should be on the "Room List" page')
def check_rooms_page_title(browser):
    verify_room_list(browser, "title", "Room List")


@then("I should see a table with the list of rooms")
def check_room_list(browser):
    verify_room_list(browser, "room_table")


@then(
    parsers.cfparse(
        'I should see a room with the room number "{room_number}", on floor "{floor_number}", with "{view_status}" under Good View'
    )
)
def check_specific_room(browser, room_number, floor_number, view_status):
    verify_room_details(browser, room_number, floor_number, view_status)


@then("I should see an alert displaying the number of rooms stored in the database")
def check_database_room_count(browser):
    verify_rooms_stored_alert(browser)


@when('I click on "Add" in the navbar')
def navigate_to_add_room(browser):
    open_add_room_page(browser)


@when(parsers.cfparse('I enter "{room_number}" in the "Room number" field'))
def enter_room_number(browser, room_number):
    fill_add_room_form(browser, "room_number", room_number)


@when(parsers.cfparse('I enter "{floor_number}" in the "Floor number" field'))
def enter_floor_number(browser, floor_number):
    fill_add_room_form(browser, "floor_number", floor_number)


@when(parsers.cfparse('I select "{view_status}" from the "Good View" dropdown'))
def select_good_view(browser, view_status):
    fill_add_room_form(browser, "good_view", view_status)


@when('I click the "Add room" button')
def submit_form(browser):
    fill_add_room_form(browser, "submit")


@then("the new room should be added successfully")
def verify_room_added(browser):
    verify_add_room_success(browser)


@then('I should be redirected to the "Rooms" page')
def check_redirect_to_rooms(browser):
    verify_add_room_success(browser, "redirect")


@then(
    'I should see a form with fields for "Room number", "Floor number", and "Good View"'
)
def check_form_fields(browser):
    verify_add_room_form_fields(browser)


@then('I should see a submit button labeled "Add room"')
def check_form_submit(browser):
    verify_submit_button(browser)


@when('I leave the "Room number" field blank')
def check_room_number_blank(browser):
    leave_room_number_blank(browser)
