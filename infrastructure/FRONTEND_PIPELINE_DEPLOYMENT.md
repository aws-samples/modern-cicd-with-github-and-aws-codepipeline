# Frontend Pipeline Deployment Guide

This guide explains how to deploy the frontend CI/CD pipeline for the Hotel Management Application.

## Prerequisites

Before deploying the frontend pipeline, ensure you have:

1. **Base Infrastructure Deployed**: The base-infra.yaml CloudFormation stack must be deployed first
2. **GitHub Connection**: A CodeConnections connection to your GitHub repository
3. **AWS CLI**: Configured with appropriate credentials
4. **GitHub Repository**: Forked or cloned the repository to your GitHub account

## Architecture Overview

The frontend pipeline consists of four stages:

1. **Source**: Pulls code from GitHub via CodeConnections
2. **Test**: Runs unit tests and property-based tests using Vitest
3. **Build**: Builds the React application for production using Vite
4. **Deploy**: Deploys to S3 and invalidates CloudFront cache

### Path Filtering

The pipeline uses path filtering to trigger only when files in the `frontend/**` directory change. This ensures that backend changes don't trigger unnecessary frontend builds.

## Deployment Steps

### Step 1: Create GitHub Connection

If you haven't already created a CodeConnections connection:

```bash
# Create a connection (this will require manual authorization in the console)
aws codeconnections create-connection \
  --provider-type GitHub \
  --connection-name hotel-app-github \
  --region us-west-2
```

After creating the connection, you must complete the authorization in the AWS Console:
1. Go to Developer Tools > Connections
2. Find your connection and click "Update pending connection"
3. Authorize AWS to access your GitHub account

Note the connection ARN for the next step.

### Step 2: Deploy the Frontend Pipeline

Deploy the CloudFormation stack:

```bash
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

Replace the parameter values:
- `GitHubConnectionArn`: The ARN from Step 1
- `GitHubRepo`: Your GitHub repository in format `owner/repo`
- `GitHubBranch`: The branch to track (usually `main`)
- `BaseInfraStackName`: The name of your base infrastructure stack (default: `hotel-base-infra`)

### Step 3: Verify Deployment

Check the stack status:

```bash
aws cloudformation describe-stacks \
  --stack-name hotel-frontend-pipeline \
  --query 'Stacks[0].StackStatus' \
  --region us-west-2
```

Get the pipeline name:

```bash
aws cloudformation describe-stacks \
  --stack-name hotel-frontend-pipeline \
  --query 'Stacks[0].Outputs[?OutputKey==`PipelineName`].OutputValue' \
  --output text \
  --region us-west-2
```

### Step 4: Trigger the Pipeline

The pipeline will automatically trigger when you push changes to the `frontend/**` directory. To manually trigger:

```bash
aws codepipeline start-pipeline-execution \
  --name hotel-frontend-pipeline \
  --region us-west-2
```

### Step 5: Monitor Pipeline Execution

View pipeline status in the AWS Console:
1. Go to Developer Tools > CodePipeline
2. Click on `hotel-frontend-pipeline`
3. Watch the stages progress

Or use the CLI:

```bash
aws codepipeline get-pipeline-state \
  --name hotel-frontend-pipeline \
  --region us-west-2
```

## Pipeline Stages Explained

### Source Stage

- **Action**: GitHub_Source
- **Provider**: CodeStarSourceConnection
- **Trigger**: Path filter on `frontend/**`
- **Output**: Source code as artifact

### Test Stage

- **Action**: Run_Tests
- **Provider**: CodeBuild
- **Project**: hotel-frontend-test
- **Commands**:
  - Install dependencies with `npm ci`
  - Run tests with `npm run test:coverage`
- **Reports**:
  - JUnit XML test results
  - Cobertura XML coverage report

### Build Stage

- **Action**: Build_React_App
- **Provider**: CodeBuild
- **Project**: hotel-frontend-build
- **Commands**:
  - Install dependencies with `npm ci`
  - Build with `npm run build`
- **Output**: Production-ready static files in `dist/`

### Deploy Stage

- **Action**: Deploy_to_S3_and_CloudFront
- **Provider**: CodeBuild
- **Project**: hotel-frontend-deploy
- **Commands**:
  - Sync files to S3 with cache headers
  - Create CloudFront invalidation
  - Wait for invalidation to complete

## Environment Variables

The build stage uses the following environment variable:

- `VITE_API_URL`: API Gateway URL (loaded from SSM Parameter Store)

To set this parameter:

```bash
aws ssm put-parameter \
  --name /hotelapp/api/url \
  --value https://your-api-gateway-url.execute-api.us-west-2.amazonaws.com/prod \
  --type String \
  --region us-west-2
```

## Troubleshooting

### Pipeline Fails at Test Stage

Check the CodeBuild logs:

```bash
aws codebuild batch-get-builds \
  --ids $(aws codepipeline get-pipeline-state \
    --name hotel-frontend-pipeline \
    --query 'stageStates[?stageName==`Test`].latestExecution.actionStates[0].latestExecution.externalExecutionId' \
    --output text) \
  --region us-west-2
```

Common issues:
- Missing dependencies: Ensure `package.json` is up to date
- Test failures: Check test output in CodeBuild logs

### Pipeline Fails at Build Stage

Common issues:
- Environment variable not set: Ensure `VITE_API_URL` is in SSM Parameter Store
- Build errors: Check Vite configuration and source code

### Pipeline Fails at Deploy Stage

Common issues:
- S3 permissions: Verify CodeBuild role has S3 write permissions
- CloudFront permissions: Verify CodeBuild role has CloudFront invalidation permissions
- Invalid distribution ID: Ensure base infrastructure is deployed correctly

### Pipeline Doesn't Trigger on Push

Check the path filter configuration:
- Ensure changes are in the `frontend/**` directory
- Verify the GitHub connection is active
- Check CodePipeline trigger configuration

## Cleanup

To delete the frontend pipeline:

```bash
aws cloudformation delete-stack \
  --stack-name hotel-frontend-pipeline \
  --region us-west-2
```

Wait for deletion to complete:

```bash
aws cloudformation wait stack-delete-complete \
  --stack-name hotel-frontend-pipeline \
  --region us-west-2
```

## CDK Alternative

If you prefer using CDK, you can use the `FrontendPipelineStack` in `infrastructure/lib/frontend-pipeline-stack.ts`:

```bash
cd infrastructure
npm install
cdk deploy FrontendPipelineStack \
  --parameters codeConnectionArn=arn:aws:codeconnections:... \
  --parameters githubRepo=your-username/your-repo \
  --parameters githubBranch=main
```

The CDK stack provides the same functionality as the CloudFormation template.

## Next Steps

After deploying the frontend pipeline:

1. Deploy the backend pipeline (Task 12)
2. Configure the API URL in SSM Parameter Store
3. Test the complete application
4. Set up monitoring and alarms

## Resources

- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [AWS CodeConnections Documentation](https://docs.aws.amazon.com/codeconnections/)
- [CloudFront Invalidation Documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html)
