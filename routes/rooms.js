// Import Express and initialize Router
const express = require("express");
const router = express.Router();
const config = require("../config"); // Correctly importing config

// Import DynamoDB Client from AWS SDK v3
const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");

// Initialize DynamoDB Client
const dynamoClient = new DynamoDBClient({ region: config.infra.region });

router.get("/", async (req, res, next) => {
  const params = {
    TableName: config.infra.dynamodb_table,
  };

  try {
    const data = await dynamoClient.send(new ScanCommand(params));

    // Map the items to extract the proper values from the DynamoDB format
    const rooms = data.Items.map((item) => ({
      id: item.id.N, // Extract the 'N' value for room number
      floor: item.floor.N, // Extract the 'N' value for floor
      hasView: item.hasView.BOOL ? "Yes" : "No", // Extract the boolean and map it to 'Yes' or 'No'
    }));

    res.render("room-list", {
      title: "Room List",
      rooms: rooms,
      menuTitle: config.app.hotel_name,
    });
    console.log("Displayed rooms:", rooms.length);
  } catch (err) {
    console.error("Unable to fetch rooms:", err);
    res.status(500).send(err);
  }
});

// Export the router
module.exports = router;
