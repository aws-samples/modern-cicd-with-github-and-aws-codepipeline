#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from '../lib/backend-stack';
import { FrontendPipelineStack } from '../lib/frontend-pipeline-stack';
import { BackendPipelineStack } from '../lib/backend-pipeline-stack';
import { DeploymentStack } from '../lib/deployment-stack';
import { AdvancedPipelineStack } from '../lib/advanced-pipeline-stack';

const app = new cdk.App();

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

const hotelName = app.node.tryGetContext('hotelName') || 'Hotel Yorba';
const environment = app.node.tryGetContext('environment') || 'dev';
const githubRepo = app.node.tryGetContext('githubRepo');
const githubBranch = app.node.tryGetContext('githubBranch') || 'main';
const codeConnectionArn = app.node.tryGetContext('codeConnectionArn');

// NOTE: The base infrastructure (S3 buckets, IAM roles, CloudFront) is created
// during workshop provisioning by static/cfn/base-infra.yaml and published to
// SSM under /hotelapp/*. The CDK accelerator therefore does NOT recreate it —
// doing so would collide with the already-provisioned resources. The pipeline
// stacks below import those resources from SSM.

// Backend application stack (DynamoDB + Lambda + API Gateway). Optional direct
// deploy of the backend; not required by the pipelines.
new BackendStack(app, 'HotelBackendStack', {
  env,
  description: 'Backend application - DynamoDB, Lambda, API Gateway',
  hotelName,
  environment,
});

// CI/CD pipeline stacks (Labs 2-5). Only instantiated when the GitHub repo and
// CodeConnection ARN are supplied as context. They import the provisioned base
// infrastructure from SSM, so no BaseInfraStack dependency is needed.
if (codeConnectionArn && githubRepo) {
  new FrontendPipelineStack(app, 'HotelFrontendPipelineStack', {
    env,
    description: 'CI/CD pipeline for frontend - Lab 2 accelerator',
    codeConnectionArn,
    githubRepo,
    githubBranch,
  });

  new BackendPipelineStack(app, 'HotelBackendPipelineStack', {
    env,
    description: 'CI/CD pipeline for backend - Lab 3 accelerator',
    environment,
    codeConnectionArn,
    githubRepo,
    githubBranch,
  });

  new DeploymentStack(app, 'HotelDeploymentStack', {
    env,
    description: 'Full-stack deployment pipeline - Lab 4 accelerator',
    environment,
    codeConnectionArn,
    githubRepo,
    githubBranch,
  });

  new AdvancedPipelineStack(app, 'HotelAdvancedPipelineStack', {
    env,
    description: 'Advanced CI/CD features - Lab 5 accelerator',
    environment,
    codeConnectionArn,
    githubRepo,
    githubBranch,
  });
}

// Tags applied to all stacks
cdk.Tags.of(app).add('Application', 'HotelManagement');
cdk.Tags.of(app).add('ManagedBy', 'CDK');
cdk.Tags.of(app).add('Environment', environment);
