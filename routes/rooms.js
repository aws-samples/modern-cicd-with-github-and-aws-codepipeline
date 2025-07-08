// Import Express and initialize Router
const express = require("express");
const router = express.Router();
const config = require("../config"); // Correctly importing config

// Import DynamoDB Client from AWS SDK v3
const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");

// Initialize DynamoDB Client
const dynamoClient = new DynamoDBClient({
  region: config.infra.region,
  // endpoint: config.infra.dynamodb_endpoint,
});

router.get("/", async (req, res, next) => {
  const params = {
    TableName: config.infra.dynamodb_table,
  };

  try {
    const data = await dynamoClient.send(new ScanCommand(params));

    // Map the items to extract the proper values from the DynamoDB format
    const rooms = data.Items.map((item) => ({
      id: item.id?.N || "Unknown", // Fallback to 'Unknown' if 'id.N' is missing
      floor: item.floor?.N || "N/A", // Fallback to 'N/A' if 'floor.N' is missing
      hasView: item.hasView?.BOOL !== undefined ? (item.hasView.BOOL ? "Yes" : "No") : "N/A", // Fallback to 'N/A' if 'hasView' is missing
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
