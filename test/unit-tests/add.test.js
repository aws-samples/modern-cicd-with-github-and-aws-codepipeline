const { mockClient } = require("aws-sdk-client-mock");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const app = require("../../app");
const request = require("supertest");

const dynamoMock = mockClient(DynamoDBClient);

beforeEach(() => {
  dynamoMock.reset();
});

describe("POST /add", () => {
  it("should add a new room and return a success message", async () => {
    dynamoMock.on(PutItemCommand).resolves({});

    const res = await request(app)
      .post("/add")
      .send({ roomNumber: "101", floorNumber: "2", hasView: "1" });

    expect(res.status).toBe(200);
    expect(res.text).toContain("Room number 101 added");
  });
});
