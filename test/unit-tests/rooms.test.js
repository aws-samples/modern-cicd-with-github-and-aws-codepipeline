const { mockClient } = require("aws-sdk-client-mock");
const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const app = require("../../app");
const request = require("supertest");

const dynamoMock = mockClient(DynamoDBClient);

beforeEach(() => {
  dynamoMock.reset();
});

describe("GET /rooms", () => {
  it("should return a list of rooms", async () => {
    dynamoMock.on(ScanCommand).resolves({
      Items: [{ id: { N: "101" }, floor: { N: "2" }, hasView: { BOOL: true } }],
    });

    const res = await request(app).get("/rooms");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Room List");
    expect(res.text).toContain("101");
  });
});
