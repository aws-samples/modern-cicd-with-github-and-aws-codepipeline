# Backend CloudFormation Template (backend.yml)

## Overview

This CloudFormation template deploys the serverless backend infrastructure for the Hotel Management application. It creates all necessary AWS resources including DynamoDB, Lambda functions, API Gateway, and supporting IAM roles and CloudWatch log groups.

## Architecture

The template creates a serverless architecture with:

- **DynamoDB Table**: Stores room data with encryption at rest
- **Lambda Function**: Single function that routes all API requests
- **API Gateway**: REST API with CORS support
- **IAM Roles**: Least-privilege execution roles for Lambda
- **CloudWatch Logs**: Log groups for Lambda and API Gateway

## Resources Created

### DynamoDB
- **RoomsTable**: Table with `id` as partition key, encryption enabled, point-in-time recovery enabled

### Lambda
- **ApiFunction**: Main API handler (routes to getConfig, getRooms, addRoom, updateRoom, deleteRoom)
- **LambdaExecutionRole**: IAM role with DynamoDB access and CloudWatch Logs permissions
- **ApiLogGroup**: CloudWatch log group for Lambda function logs

### API Gateway
- **HotelApi**: REST API with regional endpoint
- **ApiResource**: `/api` resource
- **ProxyResource**: `/api/{proxy+}` catch-all resource
- **OptionsMethod**: CORS preflight handler
- **ProxyMethod**: Routes all requests to Lambda
- **ApiDeployment**: Deployment resource
- **ApiStage**: Stage for the environment (dev/staging/prod)
- **ApiGatewayLogGroup**: CloudWatch log group for API Gateway logs
- **ApiGatewayAccount**: Enables CloudWatch logging for API Gateway
- **ApiGatewayCloudWatchRole**: IAM role for API Gateway logging

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| HotelName | String | "Hotel Yorba" | Name of the hotel displayed in the application |
| Environment | String | "dev" | Environment name (dev/staging/prod) |

## Outputs

| Output | Description | Export Name |
|--------|-------------|-------------|
| ApiUrl | API Gateway endpoint URL | `${StackName}-ApiUrl` |
| ApiId | API Gateway ID | `${StackName}-ApiId` |
| ApiStage | API Gateway stage name | `${StackName}-ApiStage` |
| RoomsTableName | DynamoDB table name | `${StackName}-RoomsTable` |
| RoomsTableArn | DynamoDB table ARN | `${StackName}-RoomsTableArn` |
| ApiFunctionArn | Lambda function ARN | `${StackName}-ApiFunctionArn` |
| ApiFunctionName | Lambda function name | `${StackName}-ApiFunctionName` |
| LambdaExecutionRoleArn | Lambda execution role ARN | `${StackName}-LambdaRoleArn` |

## Deployment

### Prerequisites

1. AWS CLI installed and configured
2. Appropriate AWS credentials with permissions to create:
   - DynamoDB tables
   - Lambda functions
   - API Gateway resources
   - IAM roles
   - CloudWatch log groups

### Deploy the Stack

```bash
# Build the Lambda function code first
cd backend
npm install
npm run build

# Package the Lambda code
cd dist
zip -r ../lambda.zip .
cd ..

# Deploy the CloudFormation stack
aws cloudformation deploy \
  --template-file backend.yml \
  --stack-name hotel-backend-dev \
  --parameter-overrides \
    HotelName="AWS Hotel" \
    Environment=dev \
  --capabilities CAPABILITY_NAMED_IAM

# Get the API URL
aws cloudformation describe-stacks \
  --stack-name hotel-backend-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text
```

### Update Lambda Code

After the initial deployment, you can update just the Lambda function code:

```bash
# Build and package
npm run build
cd dist
zip -r ../lambda.zip .
cd ..

# Update function code
aws lambda update-function-code \
  --function-name hotel-api-dev \
  --zip-file fileb://lambda.zip
```

### Delete the Stack

```bash
aws cloudformation delete-stack --stack-name hotel-backend-dev

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete --stack-name hotel-backend-dev
```

## Validation

### Validate Template Syntax

```bash
# Using cfn-lint
cfn-lint backend.yml

# Using AWS CLI
aws cloudformation validate-template --template-body file://backend.yml
```

### Security Scanning

```bash
# Using cfn_nag (if installed)
cfn_nag_scan --input-path backend.yml
```

## CORS Configuration

The API Gateway is configured with CORS to allow requests from any origin (`*`). This is suitable for development and workshop scenarios. For production, you should:

1. Restrict `Access-Control-Allow-Origin` to your specific frontend domain
2. Update the `OptionsMethod` integration response
3. Ensure Lambda responses include the same CORS headers

## Security Features

### Encryption
- DynamoDB table uses AWS KMS encryption (SSE-KMS)
- Point-in-time recovery enabled for DynamoDB

### IAM Roles
- Lambda execution role follows least-privilege principle
- Only grants necessary DynamoDB permissions (GetItem, PutItem, UpdateItem, DeleteItem, Scan, Query)
- Scoped to specific DynamoDB table ARN

### Logging
- CloudWatch log groups with 7-day retention
- API Gateway access logging enabled
- Lambda execution logs enabled

### API Gateway
- Regional endpoint (not edge-optimized) for better security control
- Throttling enabled (5000 burst, 10000 rate limit)
- Request/response logging enabled
- X-Ray tracing enabled

## Cost Optimization

### DynamoDB
- Uses on-demand billing mode (pay per request)
- Suitable for unpredictable workloads
- No minimum capacity charges

### Lambda
- 512 MB memory allocation (balance between cost and performance)
- 10-second timeout
- x86_64 architecture (consider ARM/Graviton2 for 20% cost savings)

### CloudWatch Logs
- 7-day retention period
- Reduces storage costs while maintaining recent logs

### Estimated Monthly Cost
For workshop usage (low traffic):
- DynamoDB: < $1
- Lambda: Free tier (1M requests)
- API Gateway: Free tier (1M requests)
- CloudWatch Logs: < $1
- **Total: < $5/month**

## Troubleshooting

### Lambda Function Not Found
If the Lambda function returns errors about missing handlers:
1. Ensure you've built the TypeScript code: `npm run build`
2. Verify the handler path: `dist/handlers/router.handler`
3. Check that the Lambda code is packaged correctly

### CORS Errors
If you see CORS errors in the browser:
1. Verify the `OptionsMethod` is deployed
2. Check that Lambda responses include CORS headers
3. Ensure the frontend origin is allowed

### DynamoDB Access Denied
If Lambda can't access DynamoDB:
1. Verify the Lambda execution role has the correct permissions
2. Check that the table name environment variable is set correctly
3. Ensure the table exists in the same region

### API Gateway 502 Errors
If API Gateway returns 502 Bad Gateway:
1. Check Lambda function logs in CloudWatch
2. Verify Lambda function is not timing out
3. Ensure Lambda response format is correct (API Gateway proxy integration)

## Integration with CI/CD

This template is designed to be deployed via AWS CodePipeline. The typical flow:

1. **Source Stage**: Pull code from GitHub
2. **Build Stage**: Run tests, build Lambda code, package as ZIP
3. **Deploy Stage**: Deploy CloudFormation stack with updated Lambda code

See the workshop content for detailed CI/CD pipeline setup instructions.

## References

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Amazon API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [Amazon DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
