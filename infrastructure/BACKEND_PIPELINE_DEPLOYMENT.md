# Backend Pipeline Deployment Guide

This guide explains how to deploy the backend CI/CD pipeline for the Hotel Management Application.

## Overview

The backend pipeline automates the deployment of Lambda functions, API Gateway, and DynamoDB using CloudFormation. It includes:

1. **Source Stage**: Pulls code from GitHub via CodeConnections
2. **Test Stage**: Runs unit tests and property-based tests
3. **Validate Stage**: Validates CloudFormation templates and runs cfn_nag security checks
4. **Build Stage**: Builds Lambda functions and creates deployment packages
5. **Deploy Stage**: Deploys the backend stack using CloudFormation

## Prerequisites

Before deploying the backend pipeline, ensure you have:

1. **Base Infrastructure Deployed**: The base-infra.yaml CloudFormation stack must be deployed first
2. **GitHub Connection**: A CodeConnections connection to your GitHub repository
3. **AWS CLI**: Configured with appropriate credentials
4. **Permissions**: IAM permissions to create CodePipeline and CodeBuild resources

## Path Filter

The pipeline is configured with a path filter to trigger only on changes to the `backend/**` directory. This ensures:

- Frontend changes don't trigger backend deployments
- Faster pipeline execution by avoiding unnecessary builds
- Independent deployment of frontend and backend

## Deployment Steps

### Step 1: Get GitHub Connection ARN

If you haven't already created a GitHub connection, follow these steps:

```bash
# List existing connections
aws codeconnections list-connections

# If you need to create a new connection, use the AWS Console:
# 1. Go to Developer Tools > Connections
# 2. Create a new connection to GitHub
# 3. Complete the OAuth flow
# 4. Copy the connection ARN
```

### Step 2: Update Parameters

Edit the parameters in the deployment command below:

- `GitHubConnectionArn`: Your CodeConnections connection ARN
- `GitHubRepo`: Your repository in format `owner/repo`
- `GitHubBranch`: Branch to track (default: `main`)
- `BaseInfraStackName`: Name of your base infrastructure stack (default: `hotel-base-infra`)
- `BackendStackName`: Name for the backend CloudFormation stack (default: `hotel-backend`)
- `Environment`: Environment name (dev, staging, or prod)
- `HotelName`: Name of your hotel (default: `Hotel Yorba`)

### Step 3: Deploy the Pipeline

```bash
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

### Step 4: Verify Deployment

After deployment completes, verify the pipeline was created:

```bash
# Check pipeline status
aws codepipeline get-pipeline-state \
  --name hotel-backend-pipeline

# List CodeBuild projects
aws codebuild list-projects | grep hotel-backend
```

### Step 5: Trigger the Pipeline

The pipeline will automatically trigger on the next push to the `backend/**` directory. To manually trigger:

```bash
aws codepipeline start-pipeline-execution \
  --name hotel-backend-pipeline
```

## Pipeline Stages Explained

### 1. Source Stage

- **Action**: GitHub_Source
- **Provider**: CodeStarSourceConnection
- **Trigger**: Automatic on push to `backend/**`
- **Output**: Source code as artifact

### 2. Test Stage

- **Action**: Run_Tests
- **Provider**: CodeBuild
- **Project**: hotel-backend-test
- **Purpose**: Runs unit tests and property-based tests
- **Reports**: JUnit XML and Cobertura coverage reports
- **Failure**: Pipeline stops if tests fail

### 3. Validate Stage

- **Action**: Validate_CloudFormation
- **Provider**: CodeBuild
- **Project**: hotel-backend-validate
- **Purpose**: 
  - Validates CloudFormation template syntax
  - Runs cfn_nag security checks
- **Failure**: Pipeline stops if validation fails

### 4. Build Stage

- **Action**: Build_Lambda_Functions
- **Provider**: CodeBuild
- **Project**: hotel-backend-build
- **Purpose**:
  - Compiles TypeScript to JavaScript
  - Creates Lambda deployment package (ZIP)
  - Prepares CloudFormation template
- **Output**: Lambda ZIP and CloudFormation template

### 5. Deploy Stage

- **Action**: Deploy_CloudFormation_Stack
- **Provider**: CloudFormation
- **Mode**: CREATE_UPDATE
- **Purpose**:
  - Creates or updates the backend stack
  - Deploys Lambda functions
  - Creates/updates API Gateway
  - Creates/updates DynamoDB table
- **Output**: Stack outputs (API URL, table name, etc.)

## IAM Roles

The pipeline uses IAM roles from the base infrastructure stack:

- **CodePipelineRole**: Service role for CodePipeline
- **CodeBuildBackEndRole**: Execution role for CodeBuild projects
  - Permissions for CloudFormation operations
  - Permissions for Lambda operations
  - Permissions for API Gateway operations
  - Permissions for DynamoDB operations
  - Permissions for S3 artifact storage

## Monitoring

### CloudWatch Logs

CodeBuild logs are available in CloudWatch:

```bash
# View test logs
aws logs tail /aws/codebuild/hotel-backend-test --follow

# View validate logs
aws logs tail /aws/codebuild/hotel-backend-validate --follow

# View build logs
aws logs tail /aws/codebuild/hotel-backend-build --follow
```

### Test Reports

CodeBuild test reports are available in the AWS Console:

1. Go to CodeBuild > Report groups
2. Find `backend-test-results` and `backend-coverage-report`
3. View test results and coverage metrics

### Pipeline Execution History

View pipeline execution history:

```bash
aws codepipeline list-pipeline-executions \
  --pipeline-name hotel-backend-pipeline
```

## Troubleshooting

### Pipeline Fails at Test Stage

**Symptom**: Tests fail in CodeBuild

**Solution**:
1. Check test logs in CloudWatch
2. Run tests locally: `cd backend && npm test`
3. Fix failing tests and push changes

### Pipeline Fails at Validate Stage

**Symptom**: CloudFormation validation or cfn_nag fails

**Solution**:
1. Check validation logs in CloudWatch
2. Validate template locally:
   ```bash
   aws cloudformation validate-template --template-body file://backend/backend.yml
   cfn_nag_scan --input-path backend/backend.yml
   ```
3. Fix template issues and push changes

### Pipeline Fails at Build Stage

**Symptom**: Lambda build fails

**Solution**:
1. Check build logs in CloudWatch
2. Build locally: `cd backend && npm run build`
3. Fix build errors and push changes

### Pipeline Fails at Deploy Stage

**Symptom**: CloudFormation deployment fails

**Solution**:
1. Check CloudFormation events in AWS Console
2. Common issues:
   - IAM permissions missing
   - Resource limits exceeded
   - Invalid parameter values
3. Fix issues and retry deployment

### Path Filter Not Working

**Symptom**: Pipeline triggers on non-backend changes

**Solution**:
1. Verify path filter configuration in pipeline
2. Check that changes are in `backend/**` directory
3. Update pipeline if needed:
   ```bash
   aws cloudformation update-stack \
     --stack-name hotel-backend-pipeline \
     --use-previous-template \
     --parameters ...
   ```

## Updating the Pipeline

To update the pipeline configuration:

```bash
aws cloudformation deploy \
  --template-file infrastructure/backend-pipeline.yaml \
  --stack-name hotel-backend-pipeline \
  --parameter-overrides ... \
  --capabilities CAPABILITY_IAM
```

## Deleting the Pipeline

To delete the pipeline and all associated resources:

```bash
# Delete the pipeline stack
aws cloudformation delete-stack \
  --stack-name hotel-backend-pipeline

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name hotel-backend-pipeline

# Note: This does NOT delete the backend stack
# To delete the backend stack:
aws cloudformation delete-stack \
  --stack-name hotel-backend
```

## Cost Considerations

The backend pipeline incurs costs for:

- **CodePipeline**: $1/month per active pipeline
- **CodeBuild**: $0.005/minute for BUILD_GENERAL1_SMALL
- **S3**: Storage for artifacts (minimal)
- **CloudWatch Logs**: Log storage (minimal with 7-day retention)

Estimated monthly cost: **$5-10** for moderate usage (10-20 builds/month)

## Security Best Practices

1. **Least Privilege IAM**: Roles have minimum required permissions
2. **Private S3 Buckets**: All buckets block public access
3. **Encryption**: S3 buckets use server-side encryption
4. **cfn_nag Checks**: Security scanning in validate stage
5. **No Hardcoded Secrets**: Use SSM Parameter Store or Secrets Manager

## Next Steps

After deploying the backend pipeline:

1. **Test the Pipeline**: Push a change to `backend/**` and verify it triggers
2. **Monitor Execution**: Watch the pipeline execute through all stages
3. **Verify Backend**: Test the deployed API endpoints
4. **Set Up Alarms**: Create CloudWatch alarms for pipeline failures
5. **Document**: Update team documentation with pipeline details

## Related Documentation

- [Frontend Pipeline Deployment](./FRONTEND_PIPELINE_DEPLOYMENT.md)
- [Base Infrastructure Deployment](../DEPLOYMENT_GUIDE.md)
- [Backend CloudFormation Template](../backend/backend.yml)
- [Backend Buildspec](../backend/buildspec-backend.yml)

## Support

For issues or questions:

1. Check CloudWatch logs for detailed error messages
2. Review CloudFormation events for deployment issues
3. Consult AWS CodePipeline documentation
4. Open an issue in the repository
