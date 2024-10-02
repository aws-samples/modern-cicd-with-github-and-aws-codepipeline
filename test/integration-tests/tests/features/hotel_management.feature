Feature: AWS App Runner Hotel Web Application

  As a user,
  I want to navigate through the AWS App Runner Hotel web application
  So that I can view, add, and manage rooms.

  Background:
    Given I am on the homepage

  Scenario: Navigate to the homepage
    Then I should see the page title "AWS App Runner Hotel"
    And I should see a navbar with "Home", "Rooms", and "Add" options
    And I should see the heading "Welcome to AWS App Runner Hotel"

  Scenario: Navigate to the Rooms page
    When I click on "Rooms" in the navbar
    Then I should be on the "Room List" page
    And I should see a table with the list of rooms
    And the table should contain columns for "Room Number", "Floor Number", and "Good View"

  Scenario: Check the number of rooms stored in the database
    When I click on "Rooms" in the navbar
    Then I should see an alert displaying the number of rooms stored in the database

  Scenario: Navigate to the Add Room page
    When I click on "Add" in the navbar
    Then I should see a form with fields for "Room number", "Floor number", and "Good View"
    And I should see a submit button labeled "Add room"

  Scenario: Add a new room
    When I click on "Add" in the navbar
    When I enter "101" in the "Room number" field
    And I enter "5" in the "Floor number" field
    And I select "Yes" from the "Good View" dropdown
    And I click the "Add room" button
    Then the new room should be added successfully

  Scenario: Verify room details in the room list
    When I click on "Rooms" in the navbar
    Then I should see a room with the room number "101", on floor "5", with "Yes" under Good View
