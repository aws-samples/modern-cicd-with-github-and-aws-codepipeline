# Hotel Management Backend

Lambda-based serverless backend for the hotel management application.

## Prerequisites

- Node.js 18+
- Docker Desktop (for DynamoDB Local)
- AWS SAM CLI
- npm

## Local Development

### Quick Start

From the project root:

```bash
npm run setup:local
```

This will:
1. Start DynamoDB Local in Docker
2. Create the Rooms table and add sample data
3. Start the frontend and backend development servers

### Manual Setup

If you prefer to run services individually:

```bash
# 1. Start DynamoDB Local
npm run dynamodb:start

# 2. Set up the database table
npm run dynamodb:setup

# 3. Start the backend API
npm run dev:backend

# 4. In another terminal, start the frontend
npm run dev:frontend
```

### Accessing Services

- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **DynamoDB Local**: http://localhost:8000

### API Endpoints

- `GET /api/config` - Get hotel configuration
- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Add a new room

### Environment Variables

The backend uses `env.json` for local development environment variables:

```json
{
  "GetRoomsFunction": {
    "DYNAMODB_ENDPOINT": "http://host.docker.internal:8000",
    "DYNAMODB_TABLE_NAME": "Rooms-local",
    "AWS_REGION": "us-west-2",
    "AWS_ACCESS_KEY_ID": "fakeMyKeyId",
    "AWS_SECRET_ACCESS_KEY": "fakeSecretAccessKey"
  }
}
```

**Note**: `host.docker.internal` is used because SAM Local runs Lambda functions in Docker containers.

## Project Structure

```
backend/
├── src/
│   ├── handlers/          # Lambda function handlers
│   │   ├── getConfig.ts
│   │   ├── getRooms.ts
│   │   └── addRoom.ts
│   ├── services/          # Business logic
│   │   └── dynamodb.ts
│   ├── types/             # TypeScript types
│   │   └── room.ts
│   └── utils/             # Utility functions
├── scripts/               # Setup and utility scripts
│   └── setup-local-dynamodb.js
├── template.yaml          # SAM template
├── samconfig.toml         # SAM configuration
├── env.json              # Local environment variables
└── package.json
```

## Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration
```

## Building

```bash
# Compile TypeScript
npm run build

# Build SAM application
npm run package
```

## Deployment

```bash
# Deploy to AWS (guided)
npm run deploy

# Deploy with SAM CLI directly
sam deploy --guided
```

## Troubleshooting

### DynamoDB Connection Issues

If you see "ExpiredTokenException" or connection errors:

1. Ensure DynamoDB Local is running:
   ```bash
   docker ps | grep dynamodb
   ```

2. Verify the table exists:
   ```bash
   aws dynamodb list-tables --endpoint-url http://localhost:8000
   ```

3. Restart the services:
   ```bash
   npm run dynamodb:stop
   npm run setup:local
   ```

### SAM Local Issues

If Lambda functions aren't starting:

1. Check Docker is running
2. Rebuild the backend: `npm run build`
3. Check the SAM logs for errors

### Port Conflicts

If port 3000 or 8000 is already in use:

- Backend API: Change the port in `backend/package.json` dev script
- DynamoDB Local: Change the port mapping in `docker-compose.yml`

## Architecture

The backend uses:
- **AWS Lambda** for serverless compute
- **API Gateway** for REST API
- **DynamoDB** for data storage
- **SAM** for local development and deployment
- **TypeScript** for type safety

## License

See the root LICENSE file.
