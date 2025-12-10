import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { BackendStack } from './backend-stack';

export interface DeploymentStackProps extends cdk.StackProps {
  frontendBucket: s3.IBucket;
  cloudFrontDistribution: cloudfront.CloudFrontWebDistribution;
  backendStack: BackendStack;
  artifactsBucket: s3.IBucket;
  codeBuildFrontEndRole: iam.IRole;
  codeBuildBackEndRole: iam.IRole;
  codePipelineRole: iam.IRole;
  codeConnectionArn: string;
  githubRepo: string;
  githubBranch: string;
}

/**
 * Deployment Stack (Lab 4 Accelerator)
 * 
 * Creates a unified deployment pipeline that combines frontend and backend:
 * - Deploys both frontend and backend together
 * - Coordinates deployment order
 * - Handles API Gateway integration
 * - Manages CloudFront invalidation
 * 
 * This stack corresponds to Workshop Lab 4 and provides an accelerated
 * way to set up full-stack deployment automation.
 * 
 * Workshop Module: Lab 4 - Full Deployment
 */
export class DeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeploymentStackProps) {
    super(scope, id, props);

    // This is a placeholder for the full deployment stack
    // In a complete implementation, this would create a unified pipeline
    // that deploys both frontend and backend in a coordinated manner

    new cdk.CfnOutput(this, 'DeploymentStackInfo', {
      value: 'Deployment stack created - implement unified pipeline here',
      description: 'Deployment stack status',
    });
  }
}
