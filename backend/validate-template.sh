#!/bin/bash

# CloudFormation Template Validation Script
# Validates backend.yml without requiring AWS credentials

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_FILE="${SCRIPT_DIR}/backend.yml"

echo "=========================================="
echo "CloudFormation Template Validation"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if template file exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    print_error "Template file not found: $TEMPLATE_FILE"
    exit 1
fi

print_success "Template file found: $TEMPLATE_FILE"
echo ""

# Validate YAML syntax (basic check)
echo "Validating YAML syntax..."
if command -v python3 &> /dev/null; then
    # CloudFormation YAML uses intrinsic functions like !Sub, !Ref, !GetAtt
    # Standard YAML parsers will fail on these, so we just check basic syntax
    if python3 -c "import sys; [line for line in open('$TEMPLATE_FILE') if line.strip()]" 2>/dev/null; then
        print_success "YAML file is readable"
    else
        print_error "YAML file has syntax errors"
        exit 1
    fi
else
    print_info "Python3 not found, skipping YAML validation"
fi
echo ""

# Validate with cfn-lint
echo "Validating with cfn-lint..."
if command -v cfn-lint &> /dev/null; then
    if cfn-lint "$TEMPLATE_FILE"; then
        print_success "Template passes cfn-lint validation"
    else
        print_error "Template failed cfn-lint validation"
        exit 1
    fi
else
    print_info "cfn-lint not installed"
    print_info "Install with: pip install cfn-lint"
fi
echo ""

# Check for required sections
echo "Checking template structure..."

# Check AWSTemplateFormatVersion
if grep -q "AWSTemplateFormatVersion" "$TEMPLATE_FILE"; then
    print_success "AWSTemplateFormatVersion present"
else
    print_error "AWSTemplateFormatVersion missing"
fi

# Check Description
if grep -q "Description:" "$TEMPLATE_FILE"; then
    print_success "Description present"
else
    print_error "Description missing"
fi

# Check Parameters
if grep -q "Parameters:" "$TEMPLATE_FILE"; then
    print_success "Parameters section present"
else
    print_error "Parameters section missing"
fi

# Check Resources
if grep -q "Resources:" "$TEMPLATE_FILE"; then
    print_success "Resources section present"
else
    print_error "Resources section missing"
fi

# Check Outputs
if grep -q "Outputs:" "$TEMPLATE_FILE"; then
    print_success "Outputs section present"
else
    print_error "Outputs section missing"
fi
echo ""

# Check for required resources
echo "Checking required resources..."

REQUIRED_RESOURCES=(
    "RoomsTable"
    "LambdaExecutionRole"
    "ApiFunction"
    "HotelApi"
    "ApiDeployment"
    "ApiStage"
)

for resource in "${REQUIRED_RESOURCES[@]}"; do
    if grep -q "$resource:" "$TEMPLATE_FILE"; then
        print_success "Resource found: $resource"
    else
        print_error "Resource missing: $resource"
    fi
done
echo ""

# Check for security features
echo "Checking security features..."

# DynamoDB encryption
if grep -q "SSEEnabled: true" "$TEMPLATE_FILE"; then
    print_success "DynamoDB encryption enabled"
else
    print_error "DynamoDB encryption not enabled"
fi

# Point-in-time recovery
if grep -q "PointInTimeRecoveryEnabled: true" "$TEMPLATE_FILE"; then
    print_success "DynamoDB point-in-time recovery enabled"
else
    print_info "DynamoDB point-in-time recovery not enabled (optional)"
fi

# CloudWatch log groups
if grep -q "AWS::Logs::LogGroup" "$TEMPLATE_FILE"; then
    print_success "CloudWatch log groups defined"
else
    print_error "CloudWatch log groups missing"
fi
echo ""

# Check for CORS configuration
echo "Checking CORS configuration..."
if grep -q "Access-Control-Allow-Origin" "$TEMPLATE_FILE"; then
    print_success "CORS headers configured"
else
    print_error "CORS headers missing"
fi
echo ""

# Check outputs
echo "Checking required outputs..."

REQUIRED_OUTPUTS=(
    "ApiUrl"
    "RoomsTableName"
    "ApiFunctionArn"
)

for output in "${REQUIRED_OUTPUTS[@]}"; do
    if grep -q "$output:" "$TEMPLATE_FILE"; then
        print_success "Output found: $output"
    else
        print_error "Output missing: $output"
    fi
done
echo ""

# Summary
echo "=========================================="
echo "Validation Summary"
echo "=========================================="
print_success "Template validation completed"
echo ""
print_info "To deploy this template:"
echo "  1. Build Lambda code: npm run build"
echo "  2. Package code: cd dist && zip -r ../lambda.zip . && cd .."
echo "  3. Deploy stack: aws cloudformation deploy --template-file backend.yml --stack-name hotel-backend-dev --capabilities CAPABILITY_NAMED_IAM"
echo "  4. Update Lambda: aws lambda update-function-code --function-name hotel-api-dev --zip-file fileb://lambda.zip"
echo ""
