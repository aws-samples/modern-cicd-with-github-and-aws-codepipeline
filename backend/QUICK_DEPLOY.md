# Quick Deployment Guide

## Prerequisites
- AWS CLI installed and configured
- Node.js 18+ installed
- AWS credentials with appropriate permissions

## Quick Deploy (5 minutes)

### 1. Build Lambda Code
```bash
cd backend
npm install
npm run build
```

### 2. Package Lambda Code
```bash
cd dist
zip -r ../lambda.zip .
cd ..
```

### 3. Deploy CloudFormation Stack
```bash
aws cloudformation deploy \
  --template-file backend.yml \
  --stack-name hotel-backend-dev \
  --parameter-overrides \
    HotelName="AWS Hotel" \
    Environment=dev \
  --capabilities CAPABILITY_NAMED_IAM
```

### 4. Update Lambda Function Code
```bash
aws lambda update-function-code \
  --function-name hotel-api-dev \
  --zip-file fileb://lambda.zip
```

### 5. Get API URL
```bash
aws cloudformation describe-stacks \
  --stack-name hotel-backend-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text
```

### 6. Test API
```bash
# Get the API URL from step 5
API_URL="<your-api-url>"

# Test config endpoint
curl $API_URL/api/config

# Test rooms endpoint
curl $API_URL/api/rooms

# Add a room
curl -X POST $API_URL/api/rooms \
  -H 'Content-Type: application/json' \
  -d '{"roomNumber": 101, "floorNumber": 1, "hasView": true}'
```

## Cleanup

```bash
# Delete the stack
aws cloudformation delete-stack --stack-name hotel-backend-dev

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name hotel-backend-dev
```

## Troubleshooting

### Stack Creation Failed
```bash
# Check stack events
aws cloudformation describe-stack-events \
  --stack-name hotel-backend-dev \
  --max-items 10
```

### Lambda Function Errors
```bash
# View Lambda logs
aws logs tail /aws/lambda/hotel-api-dev --follow
```

### API Gateway Errors
```bash
# View API Gateway logs
aws logs tail /aws/apigateway/hotel-api-dev --follow
```

## Environment Variables

You can customize the deployment with environment variables:

```bash
export STACK_NAME="hotel-backend-prod"
export ENVIRONMENT="prod"
export HOTEL_NAME="Production Hotel"

aws cloudformation deploy \
  --template-file backend.yml \
  --stack-name $STACK_NAME \
  --parameter-overrides \
    HotelName="$HOTEL_NAME" \
    Environment=$ENVIRONMENT \
  --capabilities CAPABILITY_NAMED_IAM
```

## Automated Deployment

Use the provided scripts for automated deployment:

```bash
# Validate template
./validate-template.sh

# Deploy and test (requires AWS credentials)
./test-deployment.sh
```

## CI/CD Integration

For CI/CD pipeline integration, see the workshop content for:
- Lab 3: Backend Pipeline setup
- Lab 4: Full deployment automation
- Lab 5: Advanced features (rollbacks, gates)
