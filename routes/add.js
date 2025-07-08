// Import Express and initialize Router
const express = require("express");
const router = express.Router();
const config = require("../config"); // Correctly importing config

// Import DynamoDB Client from AWS SDK v3
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

// Initialize DynamoDB Client
const dynamoClient = new DynamoDBClient({
  region: config.infra.region,
  // endpoint: config.infra.dynamodb_endpoint,
});

// POST route to add a new room
router.post("/", async (req, res, next) => {
  if (req.body.roomNumber && req.body.floorNumber && req.body.hasView) {
    const params = {
      TableName: config.infra.dynamodb_table,
      Item: {
        id: { N: parseInt(req.body.roomNumber).toString() }, // Convert to string for DynamoDB 'N' type
        floor: { N: parseInt(req.body.floorNumber).toString() },
        hasView: { BOOL: req.body.hasView === "1" }, // Boolean type comparison
      },
    };

    try {
      // Use PutItemCommand to add the item
      const data = await dynamoClient.send(new PutItemCommand(params));
      res.render("add", {
        title: "Add new room",
        result: { roomId: req.body.roomNumber },
      });
      console.log("New room added:", data);
    } catch (err) {
      console.error("Unable to add room:", err);
      res.status(500).send(err);
    }
  } else {
    res.status(400).send("Missing room number, floor, or hasView parameters");
  }
});

// GET route to render the add room page
router.get("/", (req, res, next) => {
  res.render("add", {
    title: "Add new room",
    menuTitle: config.app.hotel_name,
  });
});

// Export the router
module.exports = router;
