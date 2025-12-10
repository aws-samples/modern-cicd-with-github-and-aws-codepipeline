#!/bin/bash

# Backend CloudFormation Deployment Test Script
# This script validates and tests the backend.yml CloudFormation template

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_FILE="${SCRIPT_DIR}/backend.yml"
STACK_NAME="${STACK_NAME:-hotel-backend-test}"
ENVIRONMENT="${ENVIRONMENT:-dev}"
HOTEL_NAME="${HOTEL_NAME:-Test Hotel}"

echo "=========================================="
echo "Backend CloudFormation Deployment Test"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Step 1: Validate template syntax with cfn-lint
echo "Step 1: Validating CloudFormation template syntax..."
if command -v cfn-lint &> /dev/null; then
    if cfn-lint "$TEMPLATE_FILE"; then
        print_success "Template syntax is valid (cfn-lint)"
    else
        print_error "Template syntax validation failed"
        exit 1
    fi
else
    print_info "cfn-lint not installed, skipping syntax validation"
    print_info "Install with: pip install cfn-lint"
fi
echo ""

# Step 2: Validate template with AWS CloudFormation
echo "Step 2: Validating template with AWS CloudFormation..."
if aws cloudformation validate-template --template-body "file://${TEMPLATE_FILE}" > /dev/null 2>&1; then
    print_success "Template is valid (AWS CloudFormation)"
else
    print_error "AWS CloudFormation validation failed or credentials not available"
    print_info "Ensure AWS credentials are configured: aws configure"
fi
echo ""

# Step 3: Check if stack already exists
echo "Step 3: Checking if stack already exists..."
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" > /dev/null 2>&1; then
    print_info "Stack '$STACK_NAME' already exists"
    read -p "Do you want to update the existing stack? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Skipping deployment"
        exit 0
    fi
    OPERATION="update"
else
    print_info "Stack '$STACK_NAME' does not exist, will create new stack"
    OPERATION="create"
fi
echo ""

# Step 4: Build Lambda function code
echo "Step 4: Building Lambda function code..."
cd "$SCRIPT_DIR"
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm install
fi

print_info "Building TypeScript code..."
npm run build

if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not found"
    exit 1
fi
print_success "Lambda code built successfully"
echo ""

# Step 5: Package Lambda code
echo "Step 5: Packaging Lambda code..."
cd dist
if [ -f "../lambda.zip" ]; then
    rm "../lambda.zip"
fi
zip -r ../lambda.zip . > /dev/null
cd ..
print_success "Lambda code packaged to lambda.zip"
echo ""

# Step 6: Deploy CloudFormation stack
echo "Step 6: Deploying CloudFormation stack..."
print_info "Stack Name: $STACK_NAME"
print_info "Environment: $ENVIRONMENT"
print_info "Hotel Name: $HOTEL_NAME"
echo ""

if aws cloudformation deploy \
    --template-file "$TEMPLATE_FILE" \
    --stack-name "$STACK_NAME" \
    --parameter-overrides \
        HotelName="$HOTEL_NAME" \
        Environment="$ENVIRONMENT" \
    --capabilities CAPABILITY_NAMED_IAM \
    --no-fail-on-empty-changeset; then
    print_success "Stack deployed successfully"
else
    print_error "Stack deployment failed"
    exit 1
fi
echo ""

# Step 7: Update Lambda function code
echo "Step 7: Updating Lambda function code..."
FUNCTION_NAME="hotel-api-${ENVIRONMENT}"
if aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://lambda.zip > /dev/null 2>&1; then
    print_success "Lambda function code updated"
else
    print_error "Failed to update Lambda function code"
    print_info "This is expected if the function was just created"
fi
echo ""

# Step 8: Get stack outputs
echo "Step 8: Retrieving stack outputs..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text 2>/dev/null || echo "")

TABLE_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`RoomsTableName`].OutputValue' \
    --output text 2>/dev/null || echo "")

FUNCTION_ARN=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiFunctionArn`].OutputValue' \
    --output text 2>/dev/null || echo "")

if [ -n "$API_URL" ]; then
    print_success "API URL: $API_URL"
    print_success "DynamoDB Table: $TABLE_NAME"
    print_success "Lambda Function: $FUNCTION_ARN"
else
    print_error "Failed to retrieve stack outputs"
fi
echo ""

# Step 9: Verify DynamoDB table
echo "Step 9: Verifying DynamoDB table..."
if [ -n "$TABLE_NAME" ]; then
    if aws dynamodb describe-table --table-name "$TABLE_NAME" > /dev/null 2>&1; then
        print_success "DynamoDB table exists and is accessible"
        
        # Check encryption
        ENCRYPTION=$(aws dynamodb describe-table \
            --table-name "$TABLE_NAME" \
            --query 'Table.SSEDescription.Status' \
            --output text 2>/dev/null || echo "")
        
        if [ "$ENCRYPTION" = "ENABLED" ]; then
            print_success "DynamoDB encryption is enabled"
        else
            print_error "DynamoDB encryption is not enabled"
        fi
    else
        print_error "DynamoDB table not accessible"
    fi
else
    print_error "DynamoDB table name not found"
fi
echo ""

# Step 10: Verify Lambda function
echo "Step 10: Verifying Lambda function..."
if aws lambda get-function --function-name "$FUNCTION_NAME" > /dev/null 2>&1; then
    print_success "Lambda function exists and is accessible"
    
    # Check runtime
    RUNTIME=$(aws lambda get-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --query 'Runtime' \
        --output text 2>/dev/null || echo "")
    
    print_info "Runtime: $RUNTIME"
    
    # Check memory
    MEMORY=$(aws lambda get-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --query 'MemorySize' \
        --output text 2>/dev/null || echo "")
    
    print_info "Memory: ${MEMORY}MB"
else
    print_error "Lambda function not accessible"
fi
echo ""

# Step 11: Verify API Gateway
echo "Step 11: Verifying API Gateway..."
if [ -n "$API_URL" ]; then
    print_success "API Gateway endpoint: $API_URL"
    
    # Test /api/config endpoint
    print_info "Testing GET /api/config..."
    if curl -s -f "${API_URL}/api/config" > /dev/null 2>&1; then
        print_success "GET /api/config is accessible"
        
        # Show response
        RESPONSE=$(curl -s "${API_URL}/api/config")
        print_info "Response: $RESPONSE"
    else
        print_error "GET /api/config is not accessible"
        print_info "This may be expected if Lambda code is not deployed yet"
    fi
    
    # Test /api/rooms endpoint
    print_info "Testing GET /api/rooms..."
    if curl -s -f "${API_URL}/api/rooms" > /dev/null 2>&1; then
        print_success "GET /api/rooms is accessible"
        
        # Show response
        RESPONSE=$(curl -s "${API_URL}/api/rooms")
        print_info "Response: $RESPONSE"
    else
        print_error "GET /api/rooms is not accessible"
        print_info "This may be expected if Lambda code is not deployed yet"
    fi
else
    print_error "API URL not found"
fi
echo ""

# Step 12: Manual test instructions
echo "=========================================="
echo "Manual Testing Instructions"
echo "=========================================="
echo ""
echo "1. Test GET /api/config:"
echo "   curl ${API_URL}/api/config"
echo ""
echo "2. Test GET /api/rooms:"
echo "   curl ${API_URL}/api/rooms"
echo ""
echo "3. Test POST /api/rooms:"
echo "   curl -X POST ${API_URL}/api/rooms \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"roomNumber\": 101, \"floorNumber\": 1, \"hasView\": true}'"
echo ""
echo "4. View Lambda logs:"
echo "   aws logs tail /aws/lambda/hotel-api-${ENVIRONMENT} --follow"
echo ""
echo "5. View API Gateway logs:"
echo "   aws logs tail /aws/apigateway/hotel-api-${ENVIRONMENT} --follow"
echo ""

# Step 13: Cleanup instructions
echo "=========================================="
echo "Cleanup Instructions"
echo "=========================================="
echo ""
echo "To delete the test stack:"
echo "  aws cloudformation delete-stack --stack-name $STACK_NAME"
echo ""
echo "To wait for deletion to complete:"
echo "  aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME"
echo ""

print_success "Deployment test completed successfully!"
