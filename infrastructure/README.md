# Hotel Management Application - CDK Infrastructure (Optional Accelerator)

This directory contains AWS CDK infrastructure code that provides an **optional accelerator** for deploying the Hotel Management Application. The CDK stacks generate equivalent CloudFormation templates to the manual templates used in the workshop.

## Overview

The CDK code is organized to match the workshop modules, allowing participants to bypass manual CloudFormation steps if desired. However, **the workshop is designed to teach CloudFormation**, so CDK is provided as a supplemental learning tool and deployment accelerator.

## Workshop Module Mapping

| Workshop Module | CDK Stack | Purpose |
|----------------|-----------|---------|
| Lab 1 (Prerequisite) | `BaseInfraStack` | IAM roles, S3 buckets, CloudFront with OAI |
| Lab 2 (Frontend) | `FrontendPipelineStack` | Frontend CI/CD pipeline |
| Lab 3 (Backend) | `BackendStack` + `BackendPipelineStack` | Backend resources and CI/CD |
| Lab 4 (Deployment) | `DeploymentStack` | Unified deployment automation |
| Lab 5 (Advanced) | `AdvancedPipelineStack` | Rollbacks, gates, advanced features |

## Stack Descriptions

### Core Infrastructure Stacks

#### BaseInfraStack
Equivalent to `base-infra.yaml` CloudFormation template.

**Resources:**
- IAM roles for CodeBuild (frontend and backend)
- IAM role for CodePipeline
- IAM role for integration tests
- S3 bucket for frontend hosting (private)
- S3 bucket for pipeline artifacts
- CloudFront distribution with Origin Access Identity (OAI)
- SSM parameters for resource identifiers

**Key Feature:** CloudFront OAI ensures S3 bucket remains private while serving content securely.

#### BackendStack
Equivalent to `backend.yml` CloudFormation template.

**Resources:**
- DynamoDB table for room data
- Lambda function for API handling
- API Gateway REST API
- Lambda execution role
- CloudWatch log groups

#### FrontendStack
Alternative standalone frontend deployment (not used in workshop).

**Resources:**
- S3 bucket for frontend hosting (private)
- CloudFront distribution with OAI
- Deployment configuration

### Pipeline Stacks (Optional Accelerators)

#### FrontendPipelineStack (Lab 2)
Creates the frontend CI/CD pipeline automatically.

**Pipeline Stages:**
1. Source: GitHub via CodeConnections
2. Test: Unit tests and property-based tests
3. Build: Production React build
4. Deploy: S3 upload and CloudFront invalidation

#### BackendPipelineStack (Lab 3)
Creates the backend CI/CD pipeline automatically.

**Pipeline Stages:**
1. Source: GitHub via CodeConnections
2. Test: Unit tests and property-based tests
3. Validate: CloudFormation validation and cfn_nag
4. Deploy: CloudFormation stack deployment

#### DeploymentStack (Lab 4)
Unified deployment pipeline for full-stack deployment.

**Features:**
- Coordinates frontend and backend deployment
- Manages deployment order
- Handles API Gateway integration

#### AdvancedPipelineStack (Lab 5)
Advanced CI/CD features for production-ready pipelines.

**Features:**
- Automatic rollbacks on failure
- Manual approval gates
- Integration tests
- Multi-environment support
- Lambda versioning and aliases

## Prerequisites

- Node.js 18 or later
- AWS CLI configured with credentials
- AWS CDK CLI: `npm install -g aws-cdk`
- GitHub repository forked
- AWS CodeConnections connection created (for pipeline stacks)

## Installation

```bash
cd infrastructure
npm install
```

## Usage

### Option 1: Deploy Using CloudFormation Templates (Recommended for Workshop)

The infrastructure includes standalone CloudFormation templates that can be deployed directly without CDK:

#### Deploy Base Infrastructure

```bash
# Deploy base infrastructure (prerequisite for all other stacks)
aws cloudformation deploy \
  --template-file ../modern-cicd-with-github-and-aws-codepipeline_workshop_content/static/cfn/base-infra.yaml \
  --stack-name hotel-base-infra \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

#### Deploy Frontend Pipeline

See [FRONTEND_PIPELINE_DEPLOYMENT.md](./FRONTEND_PIPELINE_DEPLOYMENT.md) for detailed instructions.

```bash
# Deploy frontend CI/CD pipeline
aws cloudformation deploy \
  --template-file infrastructure/frontend-pipeline.yaml \
  --stack-name hotel-frontend-pipeline \
  --parameter-overrides \
    GitHubConnectionArn=arn:aws:codeconnections:us-west-2:123456789012:connection/abc123... \
    GitHubRepo=your-username/your-repo \
    GitHubBranch=main \
    BaseInfraStackName=hotel-base-infra \
  --capabilities CAPABILITY_IAM \
  --region us-west-2
```

#### Deploy Backend Pipeline

See [BACKEND_PIPELINE_DEPLOYMENT.md](./BACKEND_PIPELINE_DEPLOYMENT.md) for detailed instructions.

```bash
# Deploy backend CI/CD pipeline
aws cloudformation deploy \
  --template-file infrastructure/backend-pipeline.yaml \
  --stack-name hotel-backend-pipeline \
  --parameter-overrides \
    GitHubConnectionArn=arn:aws:codeconnections:us-west-2:123456789012:connection/abc123... \
    GitHubRepo=your-username/your-repo \
    GitHubBranch=main \
    BaseInfraStackName=hotel-base-infra \
    BackendStackName=hotel-backend \
    Environment=dev \
    HotelName="Hotel Yorba" \
  --capabilities CAPABILITY_IAM \
  --region us-west-2
```

### Option 2: Deploy Using CDK (Optional Accelerator)

#### Deploy Base Infrastructure Only

This is the minimum required for the workshop:

```bash
# Synthesize CloudFormation template
npm run synth HotelBaseInfraStack

# Deploy base infrastructure
npm run deploy HotelBaseInfraStack
```

### Deploy Backend Stack

```bash
# Deploy with default hotel name
npm run deploy HotelBackendStack

# Deploy with custom hotel name
cdk deploy HotelBackendStack --context hotelName="My Hotel" --context environment="dev"
```

### Deploy Frontend Stack (Standalone)

```bash
npm run deploy HotelFrontendStack
```

### Deploy Pipeline Stacks (Requires CodeConnection)

```bash
# Set context variables
export GITHUB_REPO="your-username/your-repo"
export CODE_CONNECTION_ARN="arn:aws:codeconnections:region:account:connection/id"

# Deploy frontend pipeline
cdk deploy HotelFrontendPipelineStack \
  --context githubRepo="$GITHUB_REPO" \
  --context codeConnectionArn="$CODE_CONNECTION_ARN"

# Deploy backend pipeline
cdk deploy HotelBackendPipelineStack \
  --context githubRepo="$GITHUB_REPO" \
  --context codeConnectionArn="$CODE_CONNECTION_ARN"
```

### Deploy All Stacks

```bash
# Deploy everything (requires CodeConnection)
cdk deploy --all \
  --context githubRepo="$GITHUB_REPO" \
  --context codeConnectionArn="$CODE_CONNECTION_ARN" \
  --context hotelName="Hotel Yorba" \
  --context environment="dev"
```

## Context Variables

Configure deployment using CDK context:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `hotelName` | Hotel name to display | "Hotel Yorba" | No |
| `environment` | Environment name | "dev" | No |
| `githubRepo` | GitHub repository (owner/repo) | - | For pipelines |
| `githubBranch` | GitHub branch | "main" | No |
| `codeConnectionArn` | CodeConnection ARN | - | For pipelines |

## CDK Commands

```bash
# List all stacks
npm run cdk list

# Synthesize CloudFormation templates
npm run synth

# Show differences between deployed and local
npm run diff

# Deploy a specific stack
npm run deploy <StackName>

# Destroy a stack
npm run destroy <StackName>

# Build TypeScript
npm run build

# Watch for changes
npm run watch
```

## Comparison: CDK vs CloudFormation

### Advantages of CDK

✅ **Type Safety**: TypeScript provides compile-time error checking  
✅ **Reusability**: Create reusable constructs and patterns  
✅ **Abstraction**: Higher-level abstractions reduce boilerplate  
✅ **IDE Support**: IntelliSense and auto-completion  
✅ **Testing**: Unit test infrastructure code  

### Advantages of CloudFormation

✅ **Transparency**: See exactly what resources are created  
✅ **Learning**: Better for understanding AWS resource relationships  
✅ **Portability**: YAML/JSON templates work anywhere  
✅ **Workshop Focus**: Teaches fundamental AWS concepts  

## Workshop Recommendation

**For Learning:** Use the manual CloudFormation templates in the workshop. This teaches you:
- How AWS resources are structured
- Resource dependencies and relationships
- CloudFormation syntax and capabilities
- Troubleshooting deployment issues

**For Production:** Use CDK after completing the workshop. This provides:
- Faster iteration and deployment
- Better code organization
- Type safety and validation
- Easier maintenance and updates

## Generated CloudFormation Templates

CDK generates CloudFormation templates in the `cdk.out/` directory:

```bash
# View generated templates
npm run synth

# Templates are in:
cdk.out/HotelBaseInfraStack.template.json
cdk.out/HotelBackendStack.template.json
cdk.out/HotelFrontendStack.template.json
```

These templates are equivalent to the manual CloudFormation templates used in the workshop.

## Troubleshooting

### CDK Bootstrap Required

If you see "CDK bootstrap required" error:

```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
```

### Stack Already Exists

If deploying over existing CloudFormation stacks:

```bash
# Import existing stack
cdk import HotelBaseInfraStack

# Or delete and redeploy
aws cloudformation delete-stack --stack-name HotelBaseInfraStack
cdk deploy HotelBaseInfraStack
```

### TypeScript Compilation Errors

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Permission Errors

Ensure your AWS credentials have permissions for:
- CloudFormation
- IAM (for role creation)
- S3
- CloudFront
- Lambda
- API Gateway
- DynamoDB
- CodePipeline and CodeBuild (for pipeline stacks)

## Cost Considerations

Deploying these stacks will incur AWS costs:

- **S3**: Storage and requests (~$1-2/month)
- **CloudFront**: Data transfer (~$1-2/month)
- **Lambda**: Invocations (free tier covers workshop usage)
- **API Gateway**: Requests (free tier covers workshop usage)
- **DynamoDB**: On-demand billing (~$1/month)
- **CodePipeline**: $1/pipeline/month (if using pipeline stacks)

**Estimated Total**: $5-15/month for workshop usage

To minimize costs:
- Delete stacks when not in use: `cdk destroy --all`
- Use on-demand billing for DynamoDB
- Set lifecycle policies on S3 buckets

## Security Considerations

### Private S3 Buckets

All S3 buckets are created with:
- Block public access enabled
- Encryption at rest (AES-256)
- CloudFront OAI for secure access

### IAM Roles

All IAM roles follow least-privilege principles:
- Scoped to specific resources
- No wildcard permissions (except where required by AWS)
- Separate roles for different functions

### CloudFormation Security

Templates pass cfn_nag security checks with documented suppressions for workshop-specific requirements.

## Support

For issues or questions:
1. Check the workshop documentation
2. Review CloudFormation template equivalents
3. Consult AWS CDK documentation: https://docs.aws.amazon.com/cdk/
4. Open an issue in the workshop repository

## License

This CDK code is part of the Modern CI/CD with GitHub and AWS CodePipeline workshop and follows the same license as the workshop materials.
