#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { BackendStack } from '../lib/backend-stack';
import { FrontendStack } from '../lib/frontend-stack';
import { FrontendPipelineStack } from '../lib/frontend-pipeline-stack';
import { BackendPipelineStack } from '../lib/backend-pipeline-stack';
import { DeploymentStack } from '../lib/deployment-stack';
import { AdvancedPipelineStack } from '../lib/advanced-pipeline-stack';

const app = new cdk.App();

// Get environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-west-2',
};

const hotelName = app.node.tryGetContext('hotelName') || 'Hotel Yorba';
const environment = app.node.tryGetContext('environment') || 'dev';
const githubRepo = app.node.tryGetContext('githubRepo');
const githubBranch = app.node.tryGetContext('githubBranch') || 'main';
const codeConnectionArn = app.node.tryGetContext('codeConnectionArn');

// Base Infrastructure Stack (Lab 1 prerequisite)
// Creates IAM roles, S3 buckets, and CloudFront distribution
const baseInfraStack = new BaseInfraStack(app, 'HotelBaseInfraStack', {
  env,
  description: 'Base infrastructure for Hotel Management Application - IAM roles, S3, CloudFront',
});

// Backend Stack (Lab 3)
// Creates DynamoDB, Lambda functions, and API Gateway
const backendStack = new BackendStack(app, 'HotelBackendStack', {
  env,
  description: 'Backend infrastructure for Hotel Management Application - DynamoDB, Lambda, API Gateway',
  hotelName,
  environment,
});

// Frontend Stack (Lab 2)
// Creates S3 bucket and CloudFront distribution for React app
// Note: This is an alternative to using the base-infra stack's frontend resources
const frontendStack = new FrontendStack(app, 'HotelFrontendStack', {
  env,
  description: 'Frontend infrastructure for Hotel Management Application - S3, CloudFront with OAI',
});

// Optional: CI/CD Pipeline Stacks
// These stacks are optional accelerators that correspond to workshop labs

if (codeConnectionArn && githubRepo) {
  // Frontend Pipeline Stack (Lab 2)
  const frontendPipelineStack = new FrontendPipelineStack(app, 'HotelFrontendPipelineStack', {
    env,
    description: 'CI/CD pipeline for frontend - Lab 2 accelerator',
    frontendBucket: baseInfraStack.frontendBucket,
    cloudFrontDistribution: baseInfraStack.cloudFrontDistribution,
    artifactsBucket: baseInfraStack.artifactsBucket,
    codeBuildRole: baseInfraStack.codeBuildFrontEndRole,
    codePipelineRole: baseInfraStack.codePipelineRole,
    codeConnectionArn,
    githubRepo,
    githubBranch,
  });
  frontendPipelineStack.addDependency(baseInfraStack);

  // Backend Pipeline Stack (Lab 3)
  const backendPipelineStack = new BackendPipelineStack(app, 'HotelBackendPipelineStack', {
    env,
    description: 'CI/CD pipeline for backend - Lab 3 accelerator',
    backendStack,
    artifactsBucket: baseInfraStack.artifactsBucket,
    codeBuildRole: baseInfraStack.codeBuildBackEndRole,
    codePipelineRole: baseInfraStack.codePipelineRole,
    codeConnectionArn,
    githubRepo,
    githubBranch,
  });
  backendPipelineStack.addDependency(baseInfraStack);
  backendPipelineStack.addDependency(backendStack);

  // Deployment Stack (Lab 4)
  // Combines frontend and backend pipelines with deployment automation
  const deploymentStack = new DeploymentStack(app, 'HotelDeploymentStack', {
    env,
    description: 'Full deployment automation - Lab 4 accelerator',
    frontendBucket: baseInfraStack.frontendBucket,
    cloudFrontDistribution: baseInfraStack.cloudFrontDistribution,
    backendStack,
    artifactsBucket: baseInfraStack.artifactsBucket,
    codeBuildFrontEndRole: baseInfraStack.codeBuildFrontEndRole,
    codeBuildBackEndRole: baseInfraStack.codeBuildBackEndRole,
    codePipelineRole: baseInfraStack.codePipelineRole,
    codeConnectionArn,
    githubRepo,
    githubBranch,
  });
  deploymentStack.addDependency(baseInfraStack);
  deploymentStack.addDependency(backendStack);

  // Advanced Pipeline Stack (Lab 5)
  // Adds rollbacks, gates, and advanced pipeline features
  const advancedPipelineStack = new AdvancedPipelineStack(app, 'HotelAdvancedPipelineStack', {
    env,
    description: 'Advanced CI/CD features - Lab 5 accelerator',
    frontendBucket: baseInfraStack.frontendBucket,
    cloudFrontDistribution: baseInfraStack.cloudFrontDistribution,
    backendStack,
    artifactsBucket: baseInfraStack.artifactsBucket,
    codeBuildFrontEndRole: baseInfraStack.codeBuildFrontEndRole,
    codeBuildBackEndRole: baseInfraStack.codeBuildBackEndRole,
    codeBuildIntTestRole: baseInfraStack.codeBuildIntTestRole,
    codePipelineRole: baseInfraStack.codePipelineRole,
    codeConnectionArn,
    githubRepo,
    githubBranch,
  });
  advancedPipelineStack.addDependency(baseInfraStack);
  advancedPipelineStack.addDependency(backendStack);
}

// Add tags to all stacks
cdk.Tags.of(app).add('Application', 'HotelManagement');
cdk.Tags.of(app).add('ManagedBy', 'CDK');
cdk.Tags.of(app).add('Environment', environment);
