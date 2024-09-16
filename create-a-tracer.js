"use strict";

// AWS SDK v3 - Modular import
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

// OpenTelemetry API
const { trace, SpanStatusCode } = require("@opentelemetry/api");

// Initialize DynamoDB v3 client
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

// Initialize tracer for manual tracing
const tracer = trace.getTracer("dynamodb-service");

async function performDynamoDBOperation() {
  // Start a new span for tracing this operation
  const span = tracer.startSpan("example-dynamodb-operation", {
    attributes: {
      "dynamodb.table_name": process.env.DYNAMODB_TABLE_NAME,
    },
  });

  try {
    // Perform a sample DynamoDB operation (PutItem)
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: {
        id: { N: "1" }, // DynamoDB v3 syntax for a number attribute
        roomType: { S: "Deluxe" }, // String attribute
        available: { BOOL: true }, // Boolean attribute
      },
    };

    const command = new PutItemCommand(params);
    await dynamoClient.send(command);

    // If successful, set the span status to OK
    span.setStatus({ code: SpanStatusCode.OK, message: "DynamoDB operation successful" });
  } catch (error) {
    // If an error occurs, record it in the span
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    throw error;
  } finally {
    // End the span after the operation is done
    span.end();
  }
}

// Example usage in your app
performDynamoDBOperation()
  .then(() => console.log("DynamoDB operation completed"))
  .catch((error) => console.error("Error performing DynamoDB operation:", error));

module.exports = { performDynamoDBOperation };
