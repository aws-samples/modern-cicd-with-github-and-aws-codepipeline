# Hotel Room Management System

This project is a web application for managing hotel rooms, allowing users to view, add, and list room information.

The Hotel Room Management System is designed to provide an efficient way for hotel staff to manage room inventory. It offers a user-friendly interface for adding new rooms, viewing existing rooms, and managing room details such as floor number and view status. The application is built with Node.js and Express.js, utilizing AWS services like DynamoDB for data storage and App Runner for deployment.

![Hotel Room Management](readme_image.png)

Key features include:
- Add new rooms with details (room number, floor number, view status)
- View a list of all rooms
- Responsive web interface
- Integration with AWS DynamoDB for data persistence
- Deployment automation using AWS App Runner

## Repository Structure

```
.
├── app.js                 # Main application entry point
├── backend.yml            # CloudFormation template for infrastructure
├── config.js              # Application configuration
├── deploy.sh              # Deployment script for AWS App Runner
├── routes
│   ├── add.js             # Route handler for adding rooms
│   ├── index.js           # Route handler for the home page
│   └── rooms.js           # Route handler for listing rooms
├── public                 # Static assets (CSS, JS)
└── test
    ├── integration-tests  # Integration tests using Cucumber.js
    └── unit-tests         # Unit tests using Jest
```

## Usage Instructions

### Prerequisites

- Node.js (version 14 or higher)
- AWS CLI configured with appropriate credentials
- Docker (for local development and testing)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd hotel-room-management
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```
   AWS_REGION=<your-aws-region>
   DYNAMODB_TABLE=<your-dynamodb-table-name>
   ```

### Running the Application

1. Start the application:
   ```
   npm start
   ```

2. Access the application at `http://localhost:3000`

### Testing

Run unit tests:
```
npm run unit-test
```

Run integration tests:
```
npm run integration-tests
```

### Troubleshooting

1. DynamoDB Connection Issues:
   - Problem: Unable to connect to DynamoDB
   - Error message: "Unable to add room: NetworkingError: connect ECONNREFUSED"
   - Diagnostic steps:
     1. Check AWS credentials in `~/.aws/credentials`
     2. Verify the correct AWS region is set in the config
     3. Ensure the DynamoDB table exists and is accessible
   - Resolution: Update AWS credentials or create the DynamoDB table if missing

2. App Runner Deployment Failures:
   - Problem: Deployment to App Runner fails
   - Error message: "Error: Multiple App Runner services found for environment"
   - Diagnostic steps:
     1. Check the `deploy.sh` script for any environment-specific issues
     2. Verify that only one App Runner service exists for the target environment
   - Resolution: Remove extra App Runner services or update the deployment script

### Debugging

To enable debug mode:
1. Set the `DEBUG` environment variable:
   ```
   export DEBUG=hotel-app:*
   ```
2. Run the application:
   ```
   npm start
   ```
3. Debug output will be visible in the console

Log files are located at:
- Application logs: `/var/log/hotel-app/application.log`
- AWS SDK logs: `/var/log/hotel-app/aws-sdk.log`

Note: Ensure you have the necessary permissions to access these log files.

## Data Flow

The Hotel Room Management System follows a simple request-response flow:

1. User interacts with the web interface
2. Express.js routes handle incoming requests
3. Route handlers interact with DynamoDB for data operations
4. Responses are rendered using Pug templates
5. Rendered HTML is sent back to the user's browser

```
[User] <-> [Express Routes] <-> [DynamoDB Client] <-> [AWS DynamoDB]
   ^                ^
   |                |
   v                v
[Web Browser]    [Pug Templates]
```

Note: All data operations are performed asynchronously to ensure optimal performance.

## Deployment

1. Build the Docker image:
   ```
   docker build -t hotel-app:latest .
   ```

2. Push the image to Amazon ECR:
   ```
   aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
   docker tag hotel-app:latest <account-id>.dkr.ecr.<region>.amazonaws.com/hotel-app:latest
   docker push <account-id>.dkr.ecr.<region>.amazonaws.com/hotel-app:latest
   ```

3. Deploy to AWS App Runner:
   ```
   ./deploy.sh <branch-name> <account-id>.dkr.ecr.<region>.amazonaws.com/hotel-app:latest
   ```

## Infrastructure

The application's infrastructure is defined in the `backend.yml` CloudFormation template. Key resources include:

- DynamoDB:
  - RoomsTable: Stores room information with attributes for id, floor, and hasView

- IAM:
  - AppRunnerInstanceRole: Allows App Runner to access DynamoDB and CloudWatch Logs
  - AppRunnerECRAccessRole: Grants App Runner access to ECR for image pulling

- CloudWatch:
  - DynamoDBReadCapacityAlarm: Monitors DynamoDB read capacity utilization