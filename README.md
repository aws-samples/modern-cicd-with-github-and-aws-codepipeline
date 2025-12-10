# Modern CI/CD with GitHub and AWS CodePipeline - Serverless Architecture

A modern hotel management application demonstrating CI/CD best practices with GitHub and AWS CodePipeline using serverless architecture.

## Overview

This project showcases a complete serverless application with:

- **Frontend**: React SPA with AWS Cloudscape Design System, deployed to S3 + CloudFront
- **Backend**: Node.js Lambda functions with API Gateway and DynamoDB
- **Infrastructure**: CloudFormation templates with optional CDK accelerator
- **CI/CD**: Separate pipelines for frontend and backend using AWS CodePipeline

## Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│ CloudFront  │   │ API Gateway │
│     +       │   │      +      │
│     S3      │   │   Lambda    │
│  (Frontend) │   │  (Backend)  │
└─────────────┘   └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  DynamoDB   │
                  └─────────────┘
```

## Monorepo Structure

This project uses a monorepo structure with npm workspaces:

```
.
├── frontend/           # React frontend application
├── backend/            # Lambda backend functions
├── infrastructure/     # CDK infrastructure code (optional)
├── package.json        # Root package.json with workspace configuration
├── .prettierrc         # Shared Prettier configuration
├── .eslintrc.json      # Shared ESLint configuration
├── tsconfig.json       # Shared TypeScript configuration
└── README.md           # This file
```

## Prerequisites

- **Node.js** 18+ and npm 9+
- **AWS CLI** configured with credentials
- **AWS SAM CLI** for local Lambda development
- **Docker Desktop** for DynamoDB Local
- **Git** for version control

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hotel-app-monorepo
```

### 2. Install Dependencies

Install all dependencies for all workspaces:

```bash
npm install
```

This will install dependencies for the root project and all workspaces (frontend, backend, infrastructure).

### 3. Set Up Local Environment

Create environment files for local development:

**Frontend** (`.env.local` in `frontend/`):
```
VITE_API_URL=http://localhost:3000
VITE_HOTEL_NAME=AWS Hotel
```

**Backend** (environment variables in `backend/template.yaml`):
```yaml
Environment:
  Variables:
    HOTEL_NAME: AWS Hotel
    DYNAMODB_TABLE_NAME: Rooms-Local
    AWS_REGION: us-west-2
```

### 4. Start Local Development

Start all services with a single command:

```bash
npm run dev
```

This will start:
- Frontend dev server at http://localhost:5173
- Backend API at http://localhost:3000
- DynamoDB Local at http://localhost:8000

Or start services individually:

```bash
# Terminal 1: Start DynamoDB Local
npm run dev:dynamodb

# Terminal 2: Start backend
npm run dev:backend

# Terminal 3: Start frontend
npm run dev:frontend
```

### 5. Access the Application

Open your browser to http://localhost:5173 to see the application.

## Local Development Setup Details

### DynamoDB Local

DynamoDB Local runs in a Docker container and provides a local database for development:

- **Endpoint**: http://localhost:8000
- **Table**: `Rooms-local`
- **Sample Data**: 4 rooms are automatically created

To manage DynamoDB Local:

```bash
# Start DynamoDB Local
npm run dynamodb:start

# Set up tables (run once after starting)
npm run dynamodb:setup

# Stop DynamoDB Local
npm run dynamodb:stop
```

### SAM Local

SAM Local emulates API Gateway and Lambda functions locally:

- **API Endpoint**: http://localhost:3000
- **Hot Reload**: Restart SAM Local after code changes
- **Logs**: Lambda logs appear in the terminal

The backend automatically connects to DynamoDB Local when running locally.

### Frontend Dev Server

Vite provides a fast development server with:

- **Hot Module Replacement**: Instant updates on file changes
- **API Proxy**: Automatically proxies `/api/*` requests to http://localhost:3000
- **TypeScript**: Type checking in the editor

### Environment Variables

**Frontend** (`.env.local`):
- `VITE_API_URL`: Backend API URL (default: http://localhost:3000)
- `VITE_HOTEL_NAME`: Hotel name to display (default: Hotel Yorba)

**Backend** (configured in `template.yaml`):
- `HOTEL_NAME`: Hotel name (default: Hotel Yorba)
- `DYNAMODB_TABLE_NAME`: DynamoDB table name (default: Rooms-local)
- `DYNAMODB_ENDPOINT`: DynamoDB endpoint (default: http://dynamodb-local:8000)
- `AWS_REGION`: AWS region (default: us-west-2)

### Troubleshooting Local Development

**DynamoDB Local won't start:**
```bash
# Check if Docker is running
docker ps

# Check if port 8000 is available
lsof -i :8000

# Restart Docker Desktop if needed
```

**SAM Local won't start:**
```bash
# Build TypeScript first
npm run build:backend

# Check if port 3000 is available
lsof -i :3000

# Verify SAM CLI is installed
sam --version
```

**Frontend can't connect to backend:**
```bash
# Verify backend is running
curl http://localhost:3000/api/config

# Check Vite proxy configuration in frontend/vite.config.ts
# Ensure VITE_API_URL is set correctly in frontend/.env.local
```

**Changes not reflecting:**
- **Frontend**: Vite has HMR, changes should be instant
- **Backend**: Restart SAM Local after code changes (`npm run dev:backend`)
- **DynamoDB**: Data persists in Docker volume, use `docker-compose down -v` to reset

## Available Scripts

### Root Level Scripts

- `npm run dev` - Start frontend and backend together
- `npm run build` - Build all workspaces
- `npm run test` - Run tests for all workspaces
- `npm run lint` - Lint all workspaces
- `npm run format` - Format all code with Prettier
- `npm run format:check` - Check code formatting
- `npm run clean` - Clean all build artifacts

### Workspace-Specific Scripts

Run scripts in specific workspaces:

```bash
# Frontend
npm run dev:frontend
npm run build:frontend
npm run test:frontend

# Backend
npm run dev:backend
npm run build:backend
npm run test:backend

# Infrastructure
npm run synth --workspace=infrastructure
npm run deploy --workspace=infrastructure
```

## Project Structure

### Frontend (`frontend/`)

React application with:
- Vite for fast development and optimized builds
- AWS Cloudscape Design System for UI components
- React Router for navigation
- TypeScript for type safety
- Vitest for testing

See [frontend/README.md](frontend/README.md) for details.

### Backend (`backend/`)

Serverless backend with:
- Lambda functions for API endpoints
- DynamoDB for data storage
- API Gateway for REST API
- SAM for local development
- Jest for testing

See [backend/README.md](backend/README.md) for details.

### Infrastructure (`infrastructure/`)

Optional CDK code for:
- Infrastructure as code with TypeScript
- Automated deployment
- Workshop accelerator

See [infrastructure/README.md](infrastructure/README.md) for details.

## Deployment

This section covers deploying the application to AWS. You can use either manual CloudFormation templates (recommended for learning) or CDK for faster deployment.

### Prerequisites for AWS Deployment

Before deploying, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials:
   ```bash
   aws configure
   # Enter your AWS Access Key ID, Secret Access Key, and default region
   ```
3. **GitHub Repository** forked and connected to AWS CodeConnections
4. **S3 Bucket Names** chosen (must be globally unique)

### Option 1: Manual CloudFormation (Workshop Approach)

This approach teaches you CloudFormation step-by-step and is recommended for learning.

#### Step 1: Deploy Base Infrastructure

The base infrastructure includes IAM roles, S3 buckets, and CloudFront distribution.

```bash
aws cloudformation deploy \
  --template-file base-infra.yaml \
  --stack-name workshop-base-infra \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    FrontendBucketName=my-hotel-frontend-bucket \
    ArtifactBucketName=my-hotel-artifacts-bucket
```

**What this creates:**
- IAM roles for CodeBuild and CodePipeline
- S3 bucket for frontend hosting (private)
- CloudFront distribution with Origin Access Identity (OAI)
- S3 bucket for pipeline artifacts
- SSM parameters for resource identifiers

**Outputs to note:**
- `FrontendBucketName`: S3 bucket for frontend files
- `CloudFrontDistributionId`: CloudFront distribution ID
- `CloudFrontDomainName`: Your application URL
- `CodeBuildRoleArn`: IAM role for CodeBuild
- `CodePipelineRoleArn`: IAM role for CodePipeline

#### Step 2: Deploy Backend Stack

The backend stack includes Lambda functions, API Gateway, and DynamoDB.

```bash
aws cloudformation deploy \
  --template-file backend/backend.yml \
  --stack-name hotel-backend \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    HotelName="AWS Hotel" \
    Environment=prod
```

**What this creates:**
- DynamoDB table for rooms
- Lambda functions (getConfig, getRooms, addRoom)
- API Gateway REST API
- Lambda execution roles
- CloudWatch log groups

**Outputs to note:**
- `ApiGatewayUrl`: Your backend API URL (e.g., https://abc123.execute-api.us-west-2.amazonaws.com/prod)
- `DynamoDBTableName`: DynamoDB table name

#### Step 3: Configure Frontend Environment

Update the frontend to use your deployed backend:

```bash
# Create production environment file
cat > frontend/.env.production << EOF
VITE_API_URL=https://your-api-id.execute-api.us-west-2.amazonaws.com/prod
VITE_HOTEL_NAME=AWS Hotel
EOF
```

Replace `your-api-id` with the API Gateway ID from Step 2 outputs.

#### Step 4: Build and Deploy Frontend

Build the frontend and deploy to S3:

```bash
cd frontend
npm run build

# Deploy to S3
aws s3 sync dist/ s3://my-hotel-frontend-bucket/ --delete

# Invalidate CloudFront cache (required for immediate updates)
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

**Important**: CloudFront invalidation is required to ensure users see the latest version immediately. Without it, users may see cached content for up to 24 hours.

#### Step 5: Verify Deployment

1. Open the CloudFront domain name in your browser
2. Verify the hotel name displays correctly
3. Test adding a room
4. Check that rooms persist after page refresh

### Option 2: CDK (Optional Accelerator)

CDK provides a faster deployment path using infrastructure as code. This is optional and bypasses manual CloudFormation steps.

#### Prerequisites

```bash
cd infrastructure
npm install
```

#### Deploy All Stacks

```bash
# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy base infrastructure
cdk deploy BaseInfraStack

# Deploy backend
cdk deploy BackendStack

# Deploy frontend
cdk deploy FrontendStack
```

#### Deploy with CI/CD Pipelines

```bash
# Deploy frontend pipeline (Lab 2)
cdk deploy FrontendPipelineStack

# Deploy backend pipeline (Lab 3)
cdk deploy BackendPipelineStack

# Deploy full deployment automation (Lab 4)
cdk deploy DeploymentStack

# Deploy advanced features (Lab 5)
cdk deploy AdvancedPipelineStack
```

#### CDK Outputs

After deployment, CDK will output:
- Frontend URL (CloudFront domain)
- Backend API URL
- DynamoDB table name
- Pipeline names

### Deployment Verification Checklist

After deployment, verify:

- [ ] Frontend loads at CloudFront URL
- [ ] Hotel name displays correctly
- [ ] Rooms list loads (may be empty initially)
- [ ] Can add a new room successfully
- [ ] New room appears in the list
- [ ] Room data persists after page refresh
- [ ] API returns proper CORS headers
- [ ] HTTPS is enforced (no HTTP access)

### Updating the Application

#### Frontend Updates

```bash
cd frontend
npm run build
aws s3 sync dist/ s3://my-hotel-frontend-bucket/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

#### Backend Updates

```bash
aws cloudformation deploy \
  --template-file backend/backend.yml \
  --stack-name hotel-backend \
  --capabilities CAPABILITY_IAM
```

CloudFormation will automatically update Lambda functions with new code.

### Tearing Down

To avoid ongoing charges, delete all resources:

#### Manual CloudFormation

```bash
# Delete backend stack
aws cloudformation delete-stack --stack-name hotel-backend

# Empty S3 buckets first (required)
aws s3 rm s3://my-hotel-frontend-bucket/ --recursive
aws s3 rm s3://my-hotel-artifacts-bucket/ --recursive

# Delete base infrastructure
aws cloudformation delete-stack --stack-name workshop-base-infra
```

#### CDK

```bash
cd infrastructure
cdk destroy --all
```

**Note**: You may need to manually empty S3 buckets before deletion.

## CI/CD Pipelines

The project includes two separate CI/CD pipelines that automatically build, test, and deploy your application when you push code to GitHub.

### Pipeline Architecture

```
GitHub Repository
       │
       ├─── frontend/** changes ──→ Frontend Pipeline
       │                              ├─ Source (GitHub)
       │                              ├─ Test (CodeBuild)
       │                              ├─ Build (CodeBuild)
       │                              └─ Deploy (S3 + CloudFront)
       │
       └─── backend/** changes ───→ Backend Pipeline
                                      ├─ Source (GitHub)
                                      ├─ Test (CodeBuild)
                                      ├─ Validate (cfn_nag)
                                      └─ Deploy (CloudFormation)
```

### Frontend Pipeline

**Trigger**: Changes to `frontend/**` files in the main branch

**Stages**:

1. **Source Stage**
   - Pulls code from GitHub via AWS CodeConnections
   - Triggered automatically on push to main branch
   - Uses path filter to only trigger on frontend changes

2. **Test Stage** (CodeBuild)
   - Installs dependencies: `npm install`
   - Runs unit tests: `npm test`
   - Runs property-based tests
   - Generates test reports (JUnit XML)
   - Generates coverage reports (Cobertura XML)
   - **Buildspec**: `frontend/buildspec-frontend.yml`

3. **Build Stage** (CodeBuild)
   - Builds production bundle: `npm run build`
   - Optimizes assets (minification, tree-shaking)
   - Outputs `dist/` directory as artifact
   - **Build time**: ~1-2 minutes

4. **Deploy Stage** (S3 + CloudFront)
   - Syncs `dist/` to S3 bucket
   - Sets appropriate cache headers
   - Invalidates CloudFront distribution
   - **Deployment time**: ~30-60 seconds

**Total Pipeline Time**: 2-4 minutes

**Configuration Files**:
- `frontend/buildspec-frontend.yml` - CodeBuild configuration
- `infrastructure/frontend-pipeline.yaml` - Pipeline CloudFormation template

### Backend Pipeline

**Trigger**: Changes to `backend/**` files in the main branch

**Stages**:

1. **Source Stage**
   - Pulls code from GitHub via AWS CodeConnections
   - Triggered automatically on push to main branch
   - Uses path filter to only trigger on backend changes

2. **Test Stage** (CodeBuild)
   - Installs dependencies: `npm install`
   - Compiles TypeScript: `npm run build`
   - Runs unit tests: `npm test`
   - Runs property-based tests
   - Generates test reports (JUnit XML)
   - Generates coverage reports (Cobertura XML)
   - **Buildspec**: `backend/buildspec-backend.yml`

3. **Validate Stage** (CodeBuild)
   - Validates CloudFormation template syntax
   - Runs cfn_nag security checks
   - Checks for security best practices
   - **Build time**: ~30 seconds

4. **Deploy Stage** (CloudFormation)
   - Deploys backend.yml CloudFormation stack
   - Updates Lambda functions
   - Updates API Gateway
   - Updates DynamoDB table (if schema changed)
   - **Deployment time**: ~1-2 minutes

**Total Pipeline Time**: 3-5 minutes

**Configuration Files**:
- `backend/buildspec-backend.yml` - CodeBuild configuration
- `backend/backend.yml` - CloudFormation template
- `infrastructure/backend-pipeline.yaml` - Pipeline CloudFormation template

### Setting Up CI/CD Pipelines

#### Prerequisites

1. **GitHub Repository**: Fork this repository to your GitHub account
2. **AWS CodeConnections**: Set up connection to GitHub (see Lab 1 in workshop)
3. **Base Infrastructure**: Deploy base-infra.yaml stack first

#### Deploy Frontend Pipeline

```bash
aws cloudformation deploy \
  --template-file infrastructure/frontend-pipeline.yaml \
  --stack-name hotel-frontend-pipeline \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    GitHubRepo=your-username/your-repo-name \
    GitHubBranch=main \
    CodeConnectionArn=arn:aws:codeconnections:region:account:connection/xxx
```

#### Deploy Backend Pipeline

```bash
aws cloudformation deploy \
  --template-file infrastructure/backend-pipeline.yaml \
  --stack-name hotel-backend-pipeline \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    GitHubRepo=your-username/your-repo-name \
    GitHubBranch=main \
    CodeConnectionArn=arn:aws:codeconnections:region:account:connection/xxx
```

### Pipeline Features

#### Path-Based Triggers

Pipelines only trigger when relevant files change:
- Frontend pipeline: `frontend/**`
- Backend pipeline: `backend/**`

This prevents unnecessary builds and saves time and costs.

#### Test Reports

Both pipelines generate test reports visible in CodeBuild:
- **Test Results**: Pass/fail status for each test
- **Code Coverage**: Line and branch coverage percentages
- **Trends**: Historical test performance

Access reports in AWS Console:
1. Go to CodeBuild → Report groups
2. View test history and coverage trends

#### Build Artifacts

Artifacts are stored in S3 and versioned:
- Frontend: `dist/` directory with static assets
- Backend: CloudFormation templates and Lambda code

#### Notifications

Set up SNS notifications for pipeline events:
- Pipeline started
- Pipeline succeeded
- Pipeline failed
- Manual approval needed (Lab 5)

### Monitoring Pipelines

#### View Pipeline Status

```bash
# List all pipelines
aws codepipeline list-pipelines

# Get pipeline status
aws codepipeline get-pipeline-state --name hotel-frontend-pipeline

# View execution history
aws codepipeline list-pipeline-executions --pipeline-name hotel-frontend-pipeline
```

#### View Build Logs

1. Go to AWS Console → CodePipeline
2. Click on your pipeline
3. Click on a stage → View logs
4. Or go directly to CodeBuild → Build history

#### Common Pipeline Issues

**Pipeline not triggering:**
- Check path filter matches your changes
- Verify CodeConnections status is "Available"
- Check GitHub webhook is active

**Tests failing:**
- View CodeBuild logs for specific errors
- Run tests locally first: `npm test`
- Check environment variables are set correctly

**Deployment failing:**
- Check IAM permissions for CodePipeline role
- Verify CloudFormation template is valid
- Check S3 bucket exists and is accessible

### Pipeline Best Practices

1. **Test Locally First**: Always run tests locally before pushing
2. **Small Commits**: Make small, focused commits for faster pipelines
3. **Branch Protection**: Use branch protection rules to require tests to pass
4. **Manual Approvals**: Add manual approval gates for production (Lab 5)
5. **Rollback Plan**: Keep previous versions for quick rollback
6. **Monitor Costs**: Review CodeBuild usage monthly

### Advanced Pipeline Features (Lab 5)

The workshop covers advanced features:
- Manual approval gates
- Multi-environment deployments (dev, staging, prod)
- Automated rollbacks on failure
- Blue/green deployments
- Canary deployments with Lambda aliases

## GitHub Actions Workflows

In addition to AWS CodePipeline, this project includes GitHub Actions workflows for continuous integration. These workflows run automatically on pull requests and pushes to the main branch.

### Available Workflows

#### 1. Frontend CI (`frontend-ci.yml`)

**Triggers**:
- Pull requests to main branch (with `frontend/**` path filter)
- Pushes to main branch (with `frontend/**` path filter)
- Manual workflow dispatch

**Jobs**:

**test-and-build**:
- Checks out code
- Sets up Node.js 18 with npm caching
- Installs dependencies
- Runs linting (`npm run lint:frontend`)
- Runs unit tests with coverage
- Uploads test results and coverage reports as artifacts
- Builds production frontend bundle
- Uploads build artifacts
- Reports bundle size

**format-check**:
- Checks code formatting with Prettier
- Ensures consistent code style across the project

**Artifacts**:
- `frontend-test-results`: JUnit XML test results (30 days retention)
- `frontend-coverage`: Code coverage reports (30 days retention)
- `frontend-dist`: Production build artifacts (7 days retention)

**Example**:
```bash
# Workflow runs automatically when you push frontend changes
git add frontend/
git commit -m "Update frontend component"
git push origin main
```

#### 2. Backend CI (`backend-ci.yml`)

**Triggers**:
- Pull requests to main branch (with `backend/**` path filter)
- Pushes to main branch (with `backend/**` path filter)
- Manual workflow dispatch

**Jobs**:

**test-and-validate**:
- Checks out code
- Sets up Node.js 18 and Python 3.11
- Installs AWS SAM CLI
- Installs dependencies
- Runs linting (`npm run lint:backend`)
- Builds backend TypeScript code
- Runs unit tests with coverage
- Uploads test results and coverage reports
- Validates SAM template
- Validates CloudFormation template
- Builds SAM application
- Uploads SAM build artifacts

**security-scan**:
- Runs npm audit to check for vulnerable dependencies
- Uploads security audit results
- Continues on error (doesn't fail the build)

**Artifacts**:
- `backend-test-results`: JUnit XML test results (30 days retention)
- `backend-coverage`: Code coverage reports (30 days retention)
- `backend-sam-build`: SAM build artifacts (7 days retention)
- `backend-security-audit`: npm audit results (30 days retention)

**Example**:
```bash
# Workflow runs automatically when you push backend changes
git add backend/
git commit -m "Update Lambda handler"
git push origin main
```

#### 3. Integration Tests (`integration-tests.yml`)

**Triggers**:
- Pull requests to main branch (any changes)
- Pushes to main branch (any changes)
- Manual workflow dispatch
- Scheduled: Nightly at 3 AM UTC

**Jobs**:

**integration-tests**:
- Checks out code
- Sets up Node.js 18
- Installs Chrome browser and ChromeDriver
- Installs dependencies
- Starts DynamoDB Local in Docker
- Sets up DynamoDB tables
- Builds backend
- Starts SAM Local API (port 3000)
- Builds frontend
- Starts frontend dev server (port 5173)
- Runs Selenium-based integration tests
- Uploads test results and screenshots on failure
- Cleans up Docker containers and processes

**Artifacts**:
- `integration-test-results`: Test results (30 days retention)
- `integration-test-screenshots`: Screenshots on failure (30 days retention)

**Example**:
```bash
# Workflow runs automatically on any push
git push origin main

# Or trigger manually from GitHub Actions UI
```

### Workflow Features

#### Path Filters

Workflows use path filters to run only when relevant files change:

**Frontend CI** runs when:
- `frontend/**` files change
- Root `package.json` or `package-lock.json` changes
- Workflow file itself changes

**Backend CI** runs when:
- `backend/**` files change
- Root `package.json` or `package-lock.json` changes
- Workflow file itself changes

**Integration Tests** run on:
- Any changes (no path filter)
- Scheduled nightly runs

#### Caching

Workflows use npm caching to speed up builds:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'npm'
```

This caches `node_modules` between runs, reducing installation time from ~2 minutes to ~30 seconds.

#### Test Reporting

All workflows upload test results as artifacts:
- **JUnit XML**: For test result visualization
- **Coverage Reports**: For code coverage tracking
- **Build Artifacts**: For deployment verification

Access artifacts from:
1. GitHub Actions → Workflow run → Artifacts section
2. Download and view locally

#### Status Checks

Workflows appear as status checks on pull requests:
- ✅ All checks passed → Ready to merge
- ❌ Checks failed → Review errors before merging
- 🟡 Checks running → Wait for completion

### Running Workflows Locally

You can test workflow steps locally before pushing:

#### Frontend CI Steps

```bash
# Install dependencies
npm ci

# Run linting
npm run lint:frontend

# Run tests
npm run test:frontend

# Build
npm run build:frontend

# Check formatting
npm run format:check
```

#### Backend CI Steps

```bash
# Install dependencies
npm ci

# Run linting
npm run lint:backend

# Build
npm run build:backend

# Run tests
npm run test:backend

# Validate SAM template
cd backend
sam validate --lint

# Build SAM application
sam build
```

#### Integration Tests Steps

```bash
# Start DynamoDB Local
npm run dynamodb:start

# Setup tables
npm run dynamodb:setup

# Build backend
npm run build:backend

# Start backend (in separate terminal)
npm run dev:backend

# Start frontend (in separate terminal)
npm run dev:frontend

# Run integration tests
npm run test:integration
```

### Workflow Best Practices

1. **Test Locally First**: Always run tests locally before pushing
2. **Small Commits**: Make focused commits for faster CI runs
3. **Path Filters**: Leverage path filters to avoid unnecessary runs
4. **Review Artifacts**: Check test results and coverage reports
5. **Fix Failures Quickly**: Don't let failing tests accumulate
6. **Monitor Costs**: GitHub Actions is free for public repos, but has limits for private repos

### Workflow Limits (GitHub Actions)

**Free Tier** (Public repositories):
- Unlimited minutes
- 20 concurrent jobs

**Free Tier** (Private repositories):
- 2,000 minutes/month
- 20 concurrent jobs

**Typical Usage**:
- Frontend CI: ~3-5 minutes per run
- Backend CI: ~4-6 minutes per run
- Integration Tests: ~8-12 minutes per run

**Estimated Monthly Usage** (10 PRs + 20 commits):
- Frontend: ~30 runs × 4 min = 120 minutes
- Backend: ~30 runs × 5 min = 150 minutes
- Integration: ~50 runs × 10 min = 500 minutes
- **Total**: ~770 minutes/month (well within free tier)

### Viewing Workflow Results

#### From GitHub UI

1. Go to your repository on GitHub
2. Click "Actions" tab
3. Select a workflow from the left sidebar
4. Click on a specific run to see details
5. Click on a job to see logs
6. Download artifacts from the "Artifacts" section

#### From Command Line

```bash
# List workflow runs
gh run list

# View specific run
gh run view <run-id>

# Download artifacts
gh run download <run-id>
```

### Troubleshooting Workflows

#### Workflow Not Triggering

**Check**:
- Path filter matches your changes
- Branch name is correct (main)
- Workflow file is in `.github/workflows/`
- Workflow file has correct YAML syntax

#### Workflow Failing

**Common Issues**:
- **Tests failing**: Fix tests locally first
- **Linting errors**: Run `npm run lint` locally
- **Build errors**: Run `npm run build` locally
- **Timeout**: Increase timeout in workflow file
- **Permissions**: Check workflow permissions

**Debug Steps**:
1. View workflow logs in GitHub Actions UI
2. Reproduce issue locally
3. Fix the issue
4. Push changes
5. Verify workflow passes

#### Slow Workflows

**Optimization Tips**:
- Use npm caching (already configured)
- Run tests in parallel (already configured)
- Skip unnecessary steps with `if` conditions
- Use smaller Docker images
- Cache Docker layers

### Comparing GitHub Actions vs AWS CodePipeline

| Feature | GitHub Actions | AWS CodePipeline |
|---------|----------------|------------------|
| **Trigger** | Git events | Git events |
| **Cost** | Free (public repos) | $1/pipeline/month |
| **Speed** | 3-5 minutes | 3-5 minutes |
| **Artifacts** | GitHub storage | S3 storage |
| **Logs** | GitHub UI | CloudWatch Logs |
| **Integration** | GitHub native | AWS native |
| **Use Case** | CI (testing) | CI/CD (deploy) |

**Recommendation**:
- Use **GitHub Actions** for continuous integration (testing, linting)
- Use **AWS CodePipeline** for continuous deployment (AWS resources)
- Both can run in parallel for comprehensive CI/CD

## Testing

### Run All Tests

```bash
npm run test
```

### Run Tests by Workspace

```bash
npm run test:frontend
npm run test:backend
```

### Test Coverage

```bash
npm run test:frontend -- --coverage
npm run test:backend -- --coverage
```

## Code Quality

### Linting

```bash
npm run lint
```

### Formatting

```bash
# Check formatting
npm run format:check

# Fix formatting
npm run format
```

## Cost Estimation Guide

Understanding AWS costs helps you budget and optimize your application. This section provides detailed cost estimates for different usage levels.

### Cost Calculator

Use this formula to estimate your monthly costs:

```
Total Cost = Lambda + API Gateway + DynamoDB + S3 + CloudFront + CloudWatch + Data Transfer
```

### Detailed Cost Breakdown

#### 1. AWS Lambda

**Pricing**:
- **Requests**: $0.20 per 1 million requests
- **Duration**: $0.0000166667 per GB-second
- **Free Tier**: 1 million requests + 400,000 GB-seconds per month (permanent)

**Example Calculations**:

| Usage Level | Requests/Month | Duration (avg) | Memory | Cost |
|-------------|----------------|----------------|--------|------|
| Workshop    | 10,000         | 200ms          | 512MB  | **$0.00** (free tier) |
| Light       | 100,000        | 200ms          | 512MB  | **$0.00** (free tier) |
| Moderate    | 1,000,000      | 200ms          | 512MB  | **$0.00** (free tier) |
| Heavy       | 10,000,000     | 200ms          | 512MB  | **$1.80** |

**Optimization Tips**:
- Use ARM architecture (Graviton2) for 20% cost savings
- Right-size memory allocation (512MB is usually sufficient)
- Minimize cold starts with efficient code
- Use Lambda@Edge for global distribution (if needed)

#### 2. API Gateway

**Pricing**:
- **REST API**: $3.50 per million requests
- **Free Tier**: 1 million requests per month (12 months)

**Example Calculations**:

| Usage Level | Requests/Month | Cost |
|-------------|----------------|------|
| Workshop    | 10,000         | **$0.00** (free tier) |
| Light       | 100,000        | **$0.00** (free tier) |
| Moderate    | 1,000,000      | **$0.00** (free tier) |
| Heavy       | 10,000,000     | **$31.50** |

**Optimization Tips**:
- Enable caching to reduce backend calls
- Use HTTP API instead of REST API for 70% cost savings (requires code changes)
- Implement request throttling to prevent abuse

#### 3. DynamoDB

**Pricing** (On-Demand):
- **Write requests**: $1.25 per million write request units
- **Read requests**: $0.25 per million read request units
- **Storage**: $0.25 per GB-month
- **Free Tier**: 25 GB storage + 25 read/write capacity units (permanent)

**Example Calculations**:

| Usage Level | Reads/Month | Writes/Month | Storage | Cost |
|-------------|-------------|--------------|---------|------|
| Workshop    | 5,000       | 1,000        | 1MB     | **$0.00** (free tier) |
| Light       | 50,000      | 10,000       | 10MB    | **$0.00** (free tier) |
| Moderate    | 500,000     | 100,000      | 100MB   | **$0.15** |
| Heavy       | 5,000,000   | 1,000,000    | 1GB     | **$2.50** |

**Optimization Tips**:
- Use batch operations for multiple items
- Implement caching to reduce reads
- Use TTL to automatically delete old data
- Consider provisioned capacity for predictable workloads (cheaper)

#### 4. S3

**Pricing**:
- **Storage**: $0.023 per GB-month (Standard)
- **PUT requests**: $0.005 per 1,000 requests
- **GET requests**: $0.0004 per 1,000 requests
- **Free Tier**: 5 GB storage + 20,000 GET + 2,000 PUT requests (12 months)

**Example Calculations**:

| Usage Level | Storage | GET Requests | PUT Requests | Cost |
|-------------|---------|--------------|--------------|------|
| Workshop    | 100MB   | 1,000        | 100          | **$0.00** (free tier) |
| Light       | 500MB   | 10,000       | 500          | **$0.01** |
| Moderate    | 2GB     | 100,000      | 1,000        | **$0.09** |
| Heavy       | 10GB    | 1,000,000    | 5,000        | **$0.66** |

**Optimization Tips**:
- Use lifecycle policies to delete old artifacts
- Enable S3 Intelligent-Tiering for infrequent access
- Compress assets before uploading
- Use CloudFront to reduce S3 GET requests

#### 5. CloudFront

**Pricing** (US/Europe):
- **Data Transfer Out**: $0.085 per GB (first 10 TB)
- **HTTP/HTTPS Requests**: $0.0075 per 10,000 requests
- **Free Tier**: 1 TB data transfer + 10 million requests (12 months)

**Example Calculations**:

| Usage Level | Data Transfer | Requests | Cost |
|-------------|---------------|----------|------|
| Workshop    | 1GB           | 10,000   | **$0.00** (free tier) |
| Light       | 10GB          | 100,000  | **$0.00** (free tier) |
| Moderate    | 100GB         | 1,000,000| **$8.58** |
| Heavy       | 1TB           | 10,000,000| **$92.50** |

**Optimization Tips**:
- Enable compression (automatic)
- Set appropriate cache TTLs
- Use CloudFront Functions for edge logic
- Consider regional pricing differences

#### 6. CloudWatch

**Pricing**:
- **Logs Ingestion**: $0.50 per GB
- **Logs Storage**: $0.03 per GB-month
- **Metrics**: $0.30 per custom metric per month
- **Free Tier**: 5 GB logs + 10 custom metrics (permanent)

**Example Calculations**:

| Usage Level | Logs/Month | Custom Metrics | Cost |
|-------------|------------|----------------|------|
| Workshop    | 100MB      | 5              | **$0.00** (free tier) |
| Light       | 1GB        | 10             | **$0.50** |
| Moderate    | 5GB        | 20             | **$2.65** |
| Heavy       | 20GB       | 50             | **$25.60** |

**Optimization Tips**:
- Set log retention to 7 days (default is forever)
- Filter logs to reduce volume
- Use log insights instead of exporting
- Delete old log groups

#### 7. CodePipeline & CodeBuild

**Pricing**:
- **CodePipeline**: $1.00 per active pipeline per month
- **CodeBuild**: $0.005 per build minute (Linux, general1.small)
- **Free Tier**: 100 build minutes per month (permanent)

**Example Calculations**:

| Usage Level | Pipelines | Builds/Month | Minutes/Build | Cost |
|-------------|-----------|--------------|---------------|------|
| Workshop    | 2         | 10           | 3             | **$2.00** |
| Light       | 2         | 50           | 3             | **$2.75** |
| Moderate    | 2         | 200          | 3             | **$5.00** |
| Heavy       | 2         | 1000         | 3             | **$17.00** |

**Optimization Tips**:
- Use path filters to avoid unnecessary builds
- Optimize build times (cache dependencies)
- Use smaller build instances when possible
- Delete unused pipelines

### Total Cost Estimates

#### Workshop Usage (Learning/Testing)
- **Lambda**: $0.00 (free tier)
- **API Gateway**: $0.00 (free tier)
- **DynamoDB**: $0.00 (free tier)
- **S3**: $0.00 (free tier)
- **CloudFront**: $0.00 (free tier)
- **CloudWatch**: $0.00 (free tier)
- **CodePipeline/Build**: $2.00
- **Total**: **~$2-5/month**

#### Light Production Usage
- **Lambda**: $0.00 (free tier)
- **API Gateway**: $0.00 (free tier)
- **DynamoDB**: $0.00 (free tier)
- **S3**: $0.01
- **CloudFront**: $0.00 (free tier)
- **CloudWatch**: $0.50
- **CodePipeline/Build**: $2.75
- **Total**: **~$3-8/month**

#### Moderate Production Usage
- **Lambda**: $0.00 (free tier)
- **API Gateway**: $0.00 (free tier)
- **DynamoDB**: $0.15
- **S3**: $0.09
- **CloudFront**: $8.58
- **CloudWatch**: $2.65
- **CodePipeline/Build**: $5.00
- **Total**: **~$15-20/month**

#### Heavy Production Usage
- **Lambda**: $1.80
- **API Gateway**: $31.50
- **DynamoDB**: $2.50
- **S3**: $0.66
- **CloudFront**: $92.50
- **CloudWatch**: $25.60
- **CodePipeline/Build**: $17.00
- **Total**: **~$170-200/month**

### Cost Comparison: Serverless vs ECS

| Component | ECS (Monthly) | Serverless (Monthly) | Savings |
|-----------|---------------|----------------------|---------|
| Compute   | $30-40 (Fargate) | $0-2 (Lambda) | 95%+ |
| Load Balancer | $16 (ALB) | $3.50 (API Gateway) | 78% |
| Database  | $0.25 (DynamoDB) | $0.25 (DynamoDB) | 0% |
| Storage   | $0.50 (EFS) | $0.05 (S3) | 90% |
| CDN       | $10 (CloudFront) | $10 (CloudFront) | 0% |
| **Total** | **$56-67/month** | **$13-16/month** | **75%** |

**Key Savings**:
- No always-running compute (Fargate tasks)
- No Application Load Balancer
- No EFS storage (S3 is cheaper)
- Pay only for actual usage

### Cost Monitoring

#### Set Up Billing Alerts

1. **Create Budget**:
   ```bash
   aws budgets create-budget \
     --account-id YOUR_ACCOUNT_ID \
     --budget file://budget.json \
     --notifications-with-subscribers file://notifications.json
   ```

2. **Enable Cost Explorer**:
   - Go to AWS Console → Billing → Cost Explorer
   - Enable Cost Explorer (free)
   - View costs by service, region, and tag

3. **Set Up CloudWatch Alarms**:
   - Create alarms for estimated charges
   - Get notified when costs exceed threshold

#### Track Costs by Service

```bash
# View costs for current month
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

#### Cost Optimization Checklist

- [ ] Delete unused CloudFormation stacks
- [ ] Set CloudWatch log retention to 7 days
- [ ] Enable S3 lifecycle policies for artifacts
- [ ] Use path filters in CodePipeline
- [ ] Delete old DynamoDB data with TTL
- [ ] Review and delete unused resources monthly
- [ ] Use AWS Free Tier when possible
- [ ] Enable CloudFront compression
- [ ] Right-size Lambda memory allocation
- [ ] Use on-demand DynamoDB for unpredictable workloads

### Free Tier Summary

AWS Free Tier includes (permanent):
- **Lambda**: 1M requests + 400K GB-seconds/month
- **API Gateway**: 1M requests/month (12 months)
- **DynamoDB**: 25 GB storage + 25 RCU/WCU
- **S3**: 5 GB storage (12 months)
- **CloudFront**: 1 TB transfer + 10M requests (12 months)
- **CloudWatch**: 5 GB logs + 10 custom metrics
- **CodeBuild**: 100 build minutes/month

**For workshop usage, most costs are covered by free tier!**

### Cost Optimization Best Practices

1. **Use Tags**: Tag all resources for cost tracking
2. **Monitor Regularly**: Review costs weekly
3. **Set Budgets**: Create alerts for unexpected costs
4. **Delete Unused Resources**: Clean up after testing
5. **Use Free Tier**: Maximize free tier usage
6. **Optimize Code**: Faster Lambda = lower costs
7. **Cache Aggressively**: Reduce API calls
8. **Compress Assets**: Reduce data transfer
9. **Use Spot Instances**: For CodeBuild (if applicable)
10. **Review Monthly**: Analyze and optimize

## Why Serverless?

This project migrated from ECS to serverless architecture for several benefits:

### Faster Deployments
- **ECS**: 5-10 minutes (container build, push, deployment)
- **Serverless**: 30-60 seconds (Lambda code upload)
- **Improvement**: 5-10x faster

### Instant Local Testing
- **ECS**: Requires full container build
- **Serverless**: SAM Local provides instant testing
- **Improvement**: Instant feedback loop

### Lower Costs
- **ECS**: ~$30-50/month (always running)
- **Serverless**: ~$10-15/month (pay per request)
- **Savings**: 60-70% cost reduction

### Better Scalability
- **ECS**: Minutes to scale
- **Serverless**: Milliseconds to scale
- **Improvement**: Near-instant scaling

### No Server Management
- **ECS**: Manage container orchestration, task definitions, services
- **Serverless**: AWS manages all infrastructure
- **Benefit**: Focus on code, not infrastructure

### Automatic High Availability
- **ECS**: Configure across multiple AZs
- **Serverless**: Built-in multi-AZ redundancy
- **Benefit**: High availability by default

## Troubleshooting

This section covers common issues and their solutions.

### Local Development Issues

#### Frontend Won't Start

**Symptom**: `npm run dev:frontend` fails or shows errors

**Solutions**:

1. **Check Node.js version**:
   ```bash
   node --version  # Should be 18.x or higher
   ```
   If not, install Node.js 18+ from https://nodejs.org

2. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules frontend/node_modules
   npm install
   ```

3. **Check environment file**:
   ```bash
   # Ensure frontend/.env.local exists
   cat frontend/.env.local
   ```
   Should contain:
   ```
   VITE_API_URL=http://localhost:3000
   VITE_HOTEL_NAME=AWS Hotel
   ```

4. **Check port availability**:
   ```bash
   lsof -i :5173  # Check if port 5173 is in use
   ```
   If in use, kill the process or change the port in `frontend/vite.config.ts`

5. **Clear Vite cache**:
   ```bash
   rm -rf frontend/node_modules/.vite
   ```

#### Backend Won't Start

**Symptom**: `npm run dev:backend` fails or Lambda functions don't respond

**Solutions**:

1. **Check Docker is running**:
   ```bash
   docker ps
   ```
   If not running, start Docker Desktop

2. **Check SAM CLI is installed**:
   ```bash
   sam --version  # Should be 1.x or higher
   ```
   If not installed: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

3. **Check DynamoDB Local is running**:
   ```bash
   docker ps | grep dynamodb
   ```
   If not running:
   ```bash
   npm run dynamodb:start
   npm run dynamodb:setup
   ```

4. **Rebuild TypeScript**:
   ```bash
   cd backend
   npm run build
   ```

5. **Check port availability**:
   ```bash
   lsof -i :3000  # Check if port 3000 is in use
   ```

6. **View SAM Local logs**:
   SAM Local logs appear in the terminal. Look for:
   - Lambda function errors
   - DynamoDB connection errors
   - Port binding errors

#### DynamoDB Local Issues

**Symptom**: "Cannot connect to DynamoDB" or "Table does not exist"

**Solutions**:

1. **Verify DynamoDB Local is running**:
   ```bash
   docker ps | grep dynamodb
   ```

2. **Check tables exist**:
   ```bash
   aws dynamodb list-tables --endpoint-url http://localhost:8000
   ```
   Should show `Rooms-local` table

3. **Recreate tables**:
   ```bash
   npm run dynamodb:stop
   npm run dynamodb:start
   npm run dynamodb:setup
   ```

4. **Check Docker network**:
   ```bash
   docker network ls
   ```
   Ensure `hotel-app-network` exists

5. **Reset DynamoDB data**:
   ```bash
   docker-compose down -v  # Removes volumes
   npm run dynamodb:start
   npm run dynamodb:setup
   ```

#### Frontend Can't Connect to Backend

**Symptom**: API calls fail with network errors

**Solutions**:

1. **Verify backend is running**:
   ```bash
   curl http://localhost:3000/api/config
   ```
   Should return JSON with hotel name

2. **Check Vite proxy configuration**:
   Open `frontend/vite.config.ts` and verify:
   ```typescript
   server: {
     proxy: {
       '/api': 'http://localhost:3000'
     }
   }
   ```

3. **Check CORS headers**:
   Backend should return CORS headers. Check Lambda handler responses include:
   ```typescript
   headers: {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'Content-Type',
     'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
   }
   ```

4. **Check environment variable**:
   ```bash
   cat frontend/.env.local
   ```
   Ensure `VITE_API_URL=http://localhost:3000`

5. **Clear browser cache**:
   Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

#### Changes Not Reflecting

**Frontend changes not showing**:
- Vite has Hot Module Replacement (HMR)
- Changes should appear instantly
- If not, check browser console for errors
- Try hard refresh (Ctrl+Shift+R)

**Backend changes not showing**:
- SAM Local doesn't have hot reload
- Restart backend after code changes:
  ```bash
  # Stop SAM Local (Ctrl+C)
  npm run dev:backend
  ```

**DynamoDB data not persisting**:
- Data persists in Docker volume
- To reset data:
  ```bash
  docker-compose down -v
  npm run dynamodb:setup
  ```

### Testing Issues

#### Tests Failing

**Solutions**:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Check test environment**:
   ```bash
   # Frontend tests
   cd frontend
   npm test

   # Backend tests
   cd backend
   npm test
   ```

3. **View detailed test output**:
   ```bash
   npm test -- --reporter=verbose
   ```

4. **Run specific test file**:
   ```bash
   npm test -- path/to/test.test.ts
   ```

5. **Check for TypeScript errors**:
   ```bash
   npm run build
   ```

#### Property-Based Tests Failing

Property-based tests use random inputs and may occasionally find edge cases:

1. **Review the failing input**:
   The test output shows the failing input that caused the issue

2. **Reproduce locally**:
   ```bash
   npm test -- --reporter=verbose
   ```

3. **Fix the code or test**:
   - If the input is valid and code fails: fix the code
   - If the input is invalid: update test generators

4. **Re-run tests**:
   ```bash
   npm test
   ```

### AWS Deployment Issues

#### CloudFormation Stack Fails

**Symptom**: Stack creation or update fails

**Solutions**:

1. **Check CloudFormation events**:
   ```bash
   aws cloudformation describe-stack-events --stack-name your-stack-name
   ```

2. **Common issues**:
   - **Insufficient permissions**: Check IAM role has required permissions
   - **Resource already exists**: Delete existing resource or use different name
   - **Invalid parameter**: Check parameter values are correct
   - **Rollback**: Stack automatically rolls back on failure

3. **View detailed error**:
   Go to AWS Console → CloudFormation → Stack → Events tab

4. **Validate template before deploying**:
   ```bash
   aws cloudformation validate-template --template-body file://template.yaml
   ```

#### Lambda Function Errors

**Symptom**: Lambda returns 500 errors or times out

**Solutions**:

1. **Check CloudWatch Logs**:
   ```bash
   aws logs tail /aws/lambda/your-function-name --follow
   ```

2. **Common issues**:
   - **Timeout**: Increase timeout in CloudFormation template
   - **Memory**: Increase memory allocation
   - **Environment variables**: Check variables are set correctly
   - **DynamoDB permissions**: Check Lambda role has DynamoDB permissions

3. **Test Lambda locally**:
   ```bash
   cd backend
   npm run dev:backend
   curl http://localhost:3000/api/rooms
   ```

4. **Check Lambda configuration**:
   ```bash
   aws lambda get-function --function-name your-function-name
   ```

#### API Gateway Issues

**Symptom**: API returns 403, 404, or CORS errors

**Solutions**:

1. **Check API Gateway deployment**:
   - Go to AWS Console → API Gateway
   - Verify deployment exists for your stage
   - Check resource paths match your code

2. **CORS errors**:
   - Verify Lambda returns CORS headers
   - Check API Gateway has CORS enabled
   - Test with curl to see actual headers:
     ```bash
     curl -i https://your-api.execute-api.region.amazonaws.com/prod/api/config
     ```

3. **403 Forbidden**:
   - Check API Gateway resource policy
   - Verify Lambda permissions
   - Check IAM roles

4. **404 Not Found**:
   - Verify API path matches your request
   - Check API Gateway deployment stage
   - Ensure Lambda integration is configured

#### S3 and CloudFront Issues

**Symptom**: Frontend not loading or showing old version

**Solutions**:

1. **Check S3 bucket**:
   ```bash
   aws s3 ls s3://your-frontend-bucket/
   ```
   Should show index.html and assets/

2. **Check CloudFront distribution**:
   ```bash
   aws cloudfront get-distribution --id YOUR_DIST_ID
   ```
   Status should be "Deployed"

3. **Invalidate CloudFront cache**:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id YOUR_DIST_ID \
     --paths "/*"
   ```
   Wait 1-2 minutes for invalidation to complete

4. **Check Origin Access Identity (OAI)**:
   - S3 bucket should be private
   - CloudFront should use OAI to access S3
   - Verify S3 bucket policy allows CloudFront OAI

5. **Test S3 directly** (should fail if OAI is working):
   ```bash
   curl https://your-bucket.s3.amazonaws.com/index.html
   # Should return 403 Forbidden
   ```

6. **Test CloudFront**:
   ```bash
   curl https://your-distribution.cloudfront.net/
   # Should return index.html
   ```

### CI/CD Pipeline Issues

#### Pipeline Not Triggering

**Solutions**:

1. **Check CodeConnections status**:
   - Go to AWS Console → Developer Tools → Connections
   - Status should be "Available"
   - If "Pending", complete the authorization

2. **Check GitHub webhook**:
   - Go to GitHub → Repository → Settings → Webhooks
   - Verify webhook exists and is active
   - Check recent deliveries for errors

3. **Check path filter**:
   - Frontend pipeline only triggers on `frontend/**` changes
   - Backend pipeline only triggers on `backend/**` changes
   - Verify your changes match the filter

4. **Manually trigger pipeline**:
   ```bash
   aws codepipeline start-pipeline-execution --name your-pipeline-name
   ```

#### Pipeline Failing

**Solutions**:

1. **Check CodeBuild logs**:
   - Go to AWS Console → CodePipeline → Your pipeline
   - Click failed stage → View logs
   - Look for specific error messages

2. **Common issues**:
   - **Tests failing**: Fix tests locally first
   - **Build errors**: Check TypeScript compilation
   - **Permissions**: Check IAM roles
   - **Timeout**: Increase CodeBuild timeout

3. **Test buildspec locally**:
   ```bash
   # Frontend
   cd frontend
   npm install
   npm test
   npm run build

   # Backend
   cd backend
   npm install
   npm test
   npm run build
   ```

4. **Check environment variables**:
   Verify CodeBuild project has required environment variables

#### Deployment Succeeds But App Doesn't Work

**Solutions**:

1. **Check environment variables**:
   - Frontend: Verify VITE_API_URL points to correct API
   - Backend: Verify DYNAMODB_TABLE_NAME is correct

2. **Check API Gateway URL**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name hotel-backend \
     --query 'Stacks[0].Outputs'
   ```

3. **Test API directly**:
   ```bash
   curl https://your-api.execute-api.region.amazonaws.com/prod/api/config
   ```

4. **Check CloudWatch Logs**:
   ```bash
   aws logs tail /aws/lambda/your-function-name --follow
   ```

### Performance Issues

#### Slow API Responses

**Solutions**:

1. **Check Lambda cold starts**:
   - First request after idle period is slower (1-3 seconds)
   - Subsequent requests should be fast (<500ms)
   - Consider provisioned concurrency for production

2. **Check DynamoDB performance**:
   - Scan operations are slower than Query
   - Consider adding indexes for common queries
   - Check for throttling in CloudWatch metrics

3. **Check API Gateway caching**:
   - Enable caching for GET requests
   - Set appropriate TTL

#### Slow Frontend Loading

**Solutions**:

1. **Check CloudFront caching**:
   - Static assets should be cached
   - Check cache hit ratio in CloudWatch

2. **Optimize bundle size**:
   ```bash
   cd frontend
   npm run build
   # Check dist/ size
   ```

3. **Enable compression**:
   - CloudFront automatically compresses
   - Verify Content-Encoding: gzip header

### Getting Help

If you're still stuck:

1. **Check AWS Service Health**:
   https://status.aws.amazon.com

2. **Review AWS Documentation**:
   - Lambda: https://docs.aws.amazon.com/lambda
   - API Gateway: https://docs.aws.amazon.com/apigateway
   - CloudFormation: https://docs.aws.amazon.com/cloudformation

3. **Check Workshop Content**:
   Refer to the workshop repository for detailed labs

4. **AWS Support**:
   - AWS Forums: https://forums.aws.amazon.com
   - AWS Support (if you have a support plan)

5. **GitHub Issues**:
   Open an issue in the repository with:
   - Detailed error messages
   - Steps to reproduce
   - Environment details (OS, Node version, AWS region)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

See LICENSE file for details.

## Workshop

This project is part of the "Modern CI/CD with GitHub and AWS CodePipeline" workshop. See the workshop content repository for detailed labs and instructions.

## Support

For issues and questions:
- Open an issue in the GitHub repository
- Refer to the workshop documentation
- Check AWS documentation for service-specific questions
