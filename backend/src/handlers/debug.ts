import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      env: {
        DYNAMODB_ENDPOINT: process.env.DYNAMODB_ENDPOINT || 'NOT SET',
        DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || 'NOT SET',
        AWS_REGION: process.env.AWS_REGION || 'NOT SET',
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET',
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET',
        HOTEL_NAME: process.env.HOTEL_NAME || 'NOT SET',
      },
    }),
  };
};
