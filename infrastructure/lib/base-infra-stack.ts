import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

/**
 * Base Infrastructure Stack
 * 
 * Creates foundational resources for the Hotel Management Application:
 * - IAM roles for CodeBuild and CodePipeline
 * - S3 buckets for frontend hosting and pipeline artifacts
 * - CloudFront distribution with Origin Access Identity (OAI)
 * - SSM parameters for resource identifiers
 * 
 * This stack corresponds to the base-infra.yaml CloudFormation template
 * and provides the same resources in CDK format.
 * 
 * Workshop Module: Prerequisite for all labs
 */
export class BaseInfraStack extends cdk.Stack {
  public readonly frontendBucket: s3.Bucket;
  public readonly artifactsBucket: s3.Bucket;
  public readonly cloudFrontDistribution: cloudfront.CloudFrontWebDistribution;
  public readonly cloudFrontOAI: cloudfront.OriginAccessIdentity;
  public readonly codeBuildBackEndRole: iam.Role;
  public readonly codeBuildFrontEndRole: iam.Role;
  public readonly codeBuildIntTestRole: iam.Role;
  public readonly codePipelineRole: iam.Role;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================================================
    // S3 Buckets
    // ========================================================================

    // Frontend hosting bucket (private, accessed via CloudFront OAI)
    this.frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `hotel-frontend-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // Pipeline artifacts bucket
    this.artifactsBucket = new s3.Bucket(this, 'PipelineArtifactsBucket', {
      bucketName: `hotel-pipeline-artifacts-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldArtifacts',
          enabled: true,
          expiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // ========================================================================
    // CloudFront Origin Access Identity
    // ========================================================================

    this.cloudFrontOAI = new cloudfront.OriginAccessIdentity(this, 'CloudFrontOAI', {
      comment: `OAI for hotel-frontend-${this.account}`,
    });

    // Grant CloudFront OAI read access to frontend bucket
    this.frontendBucket.grantRead(this.cloudFrontOAI);

    // ========================================================================
    // CloudFront Distribution
    // ========================================================================

    this.cloudFrontDistribution = new cloudfront.CloudFrontWebDistribution(this, 'CloudFrontDistribution', {
      comment: 'CloudFront distribution for hotel app frontend',
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: this.frontendBucket,
            originAccessIdentity: this.cloudFrontOAI,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              compress: true,
              allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
              cachedMethods: cloudfront.CloudFrontAllowedCachedMethods.GET_HEAD_OPTIONS,
              viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
              minTtl: cdk.Duration.seconds(0),
              defaultTtl: cdk.Duration.days(1),
              maxTtl: cdk.Duration.days(365),
              forwardedValues: {
                queryString: false,
                cookies: { forward: 'none' },
              },
            },
          ],
        },
      ],
      defaultRootObject: 'index.html',
      errorConfigurations: [
        {
          errorCode: 403,
          responseCode: 200,
          responsePagePath: '/index.html',
          errorCachingMinTtl: 300,
        },
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/index.html',
          errorCachingMinTtl: 300,
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      httpVersion: cloudfront.HttpVersion.HTTP2,
    });

    // ========================================================================
    // IAM Roles
    // ========================================================================

    // Backend CodeBuild Role (for Lambda deployment)
    this.codeBuildBackEndRole = new iam.Role(this, 'CodeBuildBackEndRole', {
      roleName: 'CodeBuildBackEndRole',
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      path: '/service-role/',
    });

    // Add policies to backend CodeBuild role
    this.codeBuildBackEndRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:PutRetentionPolicy',
        ],
        resources: [
          `arn:aws:logs:*:*:log-group:/aws/codebuild/*`,
          `arn:aws:logs:*:*:log-group:/aws/codebuild/*:log-stream:*`,
          `arn:aws:logs:*:*:log-group:/aws/lambda/*`,
          `arn:aws:logs:*:*:log-group:/aws/lambda/*:log-stream:*`,
        ],
      })
    );

    // S3 access for artifacts
    this.artifactsBucket.grantReadWrite(this.codeBuildBackEndRole);

    // CloudFormation permissions
    this.codeBuildBackEndRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudformation:CreateChangeSet',
          'cloudformation:CreateStack',
          'cloudformation:DeleteStack',
          'cloudformation:DescribeChangeSet',
          'cloudformation:DescribeStackEvents',
          'cloudformation:ExecuteChangeSet',
          'cloudformation:GetTemplate',
          'cloudformation:ListStackResources',
          'cloudformation:UpdateStack',
          'cloudformation:DescribeStacks',
          'cloudformation:GetTemplateSummary',
        ],
        resources: [`arn:aws:cloudformation:${this.region}:${this.account}:stack/hotel-backend*/*`],
      })
    );

    this.codeBuildBackEndRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudformation:ValidateTemplate'],
        resources: ['*'],
      })
    );

    // DynamoDB permissions
    this.codeBuildBackEndRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:CreateTable',
          'dynamodb:DeleteTable',
          'dynamodb:DescribeTable',
          'dynamodb:UpdateTable',
          'dynamodb:ListTables',
          'dynamodb:TagResource',
          'dynamodb:UntagResource',
          'dynamodb:ListTagsOfResource',
          'dynamodb:DescribeContinuousBackups',
          'dynamodb:DescribeTimeToLive',
          'dynamodb:UpdateContinuousBackups',
          'dynamodb:UpdateTimeToLive',
        ],
        resources: [`arn:aws:dynamodb:${this.region}:${this.account}:table/Rooms-*`],
      })
    );

    // Lambda permissions
    this.codeBuildBackEndRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'lambda:CreateFunction',
          'lambda:DeleteFunction',
          'lambda:GetFunction',
          'lambda:GetFunctionConfiguration',
          'lambda:UpdateFunctionCode',
          'lambda:UpdateFunctionConfiguration',
          'lambda:ListTags',
          'lambda:TagResource',
          'lambda:UntagResource',
          'lambda:PublishVersion',
          'lambda:CreateAlias',
          'lambda:UpdateAlias',
          'lambda:DeleteAlias',
          'lambda:GetAlias',
          'lambda:AddPermission',
          'lambda:RemovePermission',
          'lambda:GetPolicy',
        ],
        resources: [`arn:aws:lambda:${this.region}:${this.account}:function:hotel-*`],
      })
    );

    // API Gateway permissions
    this.codeBuildBackEndRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['apigateway:GET', 'apigateway:POST', 'apigateway:PUT', 'apigateway:PATCH', 'apigateway:DELETE'],
        resources: [
          `arn:aws:apigateway:${this.region}::/restapis`,
          `arn:aws:apigateway:${this.region}::/restapis/*`,
        ],
      })
    );

    // IAM permissions for Lambda execution roles
    this.codeBuildBackEndRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'iam:CreateRole',
          'iam:DeleteRole',
          'iam:GetRole',
          'iam:UpdateRole',
          'iam:AttachRolePolicy',
          'iam:DetachRolePolicy',
          'iam:PutRolePolicy',
          'iam:DeleteRolePolicy',
          'iam:ListRolePolicies',
          'iam:ListAttachedRolePolicies',
          'iam:TagRole',
          'iam:UntagRole',
          'iam:GetRolePolicy',
          'iam:PassRole',
        ],
        resources: [`arn:aws:iam::${this.account}:role/hotel-*`],
      })
    );

    // SSM parameters
    this.codeBuildBackEndRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:PutParameter', 'ssm:DeleteParameter', 'ssm:GetParameter', 'ssm:AddTagsToResource', 'ssm:RemoveTagsFromResource'],
        resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/hotelapp/*`],
      })
    );

    // CodeConnections
    this.codeBuildBackEndRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['codeconnections:GetConnection', 'codeconnections:GetConnectionToken'],
        resources: [`arn:aws:codeconnections:${this.region}:${this.account}:connection/*`],
      })
    );

    // CodeBuild reports
    this.codeBuildBackEndRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'codebuild:CreateReportGroup',
          'codebuild:CreateReport',
          'codebuild:UpdateReport',
          'codebuild:BatchPutTestCases',
          'codebuild:BatchPutCodeCoverages',
        ],
        resources: [`arn:aws:codebuild:${this.region}:${this.account}:report-group/*`],
      })
    );

    // Frontend CodeBuild Role (for React build and S3 deployment)
    this.codeBuildFrontEndRole = new iam.Role(this, 'CodeBuildFrontEndRole', {
      roleName: 'CodeBuildFrontEndRole',
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      path: '/service-role/',
    });

    // CloudWatch Logs
    this.codeBuildFrontEndRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [
          `arn:aws:logs:*:*:log-group:/aws/codebuild/*`,
          `arn:aws:logs:*:*:log-group:/aws/codebuild/*:log-stream:*`,
        ],
      })
    );

    // S3 access
    this.artifactsBucket.grantReadWrite(this.codeBuildFrontEndRole);
    this.frontendBucket.grantReadWrite(this.codeBuildFrontEndRole);

    // CloudFront invalidation
    this.codeBuildFrontEndRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudfront:CreateInvalidation', 'cloudfront:GetInvalidation'],
        resources: [`arn:aws:cloudfront::${this.account}:distribution/${this.cloudFrontDistribution.distributionId}`],
      })
    );

    // CodeBuild reports
    this.codeBuildFrontEndRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'codebuild:CreateReportGroup',
          'codebuild:CreateReport',
          'codebuild:UpdateReport',
          'codebuild:BatchPutTestCases',
          'codebuild:BatchPutCodeCoverages',
        ],
        resources: [`arn:aws:codebuild:${this.region}:${this.account}:report-group/*`],
      })
    );

    // SSM parameters
    this.codeBuildFrontEndRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:PutParameter', 'ssm:GetParameter', 'ssm:AddTagsToResource', 'ssm:RemoveTagsFromResource'],
        resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/hotelapp/*`],
      })
    );

    // KMS for encrypted parameters
    this.codeBuildFrontEndRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt'],
        resources: ['*'],
      })
    );

    // CodeConnections
    this.codeBuildFrontEndRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['codeconnections:GetConnection', 'codeconnections:GetConnectionToken'],
        resources: [`arn:aws:codeconnections:${this.region}:${this.account}:connection/*`],
      })
    );

    // Integration Test CodeBuild Role
    this.codeBuildIntTestRole = new iam.Role(this, 'CodeBuildIntTestRole', {
      roleName: 'CodeBuildIntTestRole',
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      path: '/service-role/',
    });

    // CloudWatch Logs
    this.codeBuildIntTestRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [
          `arn:aws:logs:*:*:log-group:/aws/codebuild/*`,
          `arn:aws:logs:*:*:log-group:/aws/codebuild/*:log-stream:*`,
        ],
      })
    );

    // SSM parameters
    this.codeBuildIntTestRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:GetParameter'],
        resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/hotelapp/*`],
      })
    );

    // KMS for encrypted parameters
    this.codeBuildIntTestRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt'],
        resources: ['*'],
      })
    );

    // CodeBuild reports
    this.codeBuildIntTestRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'codebuild:CreateReportGroup',
          'codebuild:CreateReport',
          'codebuild:UpdateReport',
          'codebuild:BatchPutTestCases',
          'codebuild:BatchPutCodeCoverages',
        ],
        resources: [`arn:aws:codebuild:${this.region}:${this.account}:report-group/*`],
      })
    );

    // S3 access
    this.artifactsBucket.grantReadWrite(this.codeBuildIntTestRole);

    // CodePipeline Role
    this.codePipelineRole = new iam.Role(this, 'CodePipelineRole', {
      roleName: 'CodePipelineRole',
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      path: '/service-role/',
    });

    // IAM PassRole
    this.codePipelineRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['iam:PassRole'],
        resources: [
          this.codeBuildBackEndRole.roleArn,
          this.codeBuildIntTestRole.roleArn,
          this.codeBuildFrontEndRole.roleArn,
          `arn:aws:iam::${this.account}:role/hotel-*`,
        ],
      })
    );

    // CodeConnections
    this.codePipelineRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'codestar-connections:UseConnection',
          'codeconnections:UseConnection',
          'codeconnections:GetConnection',
          'codeconnections:ListConnections',
          'codeconnections:ListInstallationTargets',
          'codeconnections:StartOAuthHandshake',
        ],
        resources: [`arn:aws:codeconnections:${this.region}:${this.account}:connection/*`],
      })
    );

    // CodeBuild
    this.codePipelineRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild', 'codebuild:BatchGetBuildBatches', 'codebuild:StartBuildBatch'],
        resources: [`arn:aws:codebuild:${this.region}:${this.account}:project/*`],
      })
    );

    // CloudWatch Logs
    this.codePipelineRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [
          `arn:aws:logs:*:*:log-group:/aws/codepipeline/*`,
          `arn:aws:logs:*:*:log-group:/aws/codepipeline/*:log-stream:*`,
        ],
      })
    );

    // KMS
    this.codePipelineRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
        resources: ['*'],
      })
    );

    // S3 for artifacts
    this.artifactsBucket.grantReadWrite(this.codePipelineRole);

    // S3 for frontend deployment
    this.frontendBucket.grantReadWrite(this.codePipelineRole);

    // CloudFront invalidation
    this.codePipelineRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudfront:CreateInvalidation', 'cloudfront:GetInvalidation'],
        resources: [`arn:aws:cloudfront::${this.account}:distribution/${this.cloudFrontDistribution.distributionId}`],
      })
    );

    // CloudWatch Alarms
    this.codePipelineRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudwatch:DescribeAlarms'],
        resources: [`arn:aws:cloudwatch:${this.region}:${this.account}:alarm:*`],
      })
    );

    // CloudFormation for backend deployment
    this.codePipelineRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudformation:CreateStack',
          'cloudformation:DeleteStack',
          'cloudformation:DescribeStacks',
          'cloudformation:UpdateStack',
          'cloudformation:CreateChangeSet',
          'cloudformation:DeleteChangeSet',
          'cloudformation:DescribeChangeSet',
          'cloudformation:ExecuteChangeSet',
          'cloudformation:SetStackPolicy',
          'cloudformation:ValidateTemplate',
        ],
        resources: [`arn:aws:cloudformation:${this.region}:${this.account}:stack/hotel-backend*/*`],
      })
    );

    // ========================================================================
    // SSM Parameters
    // ========================================================================

    // Role ARNs
    new ssm.StringParameter(this, 'CodeBuildBackEndRoleArnParameter', {
      parameterName: '/hotelapp/roles/CodeBuildBackEndRoleArn',
      stringValue: this.codeBuildBackEndRole.roleArn,
      description: 'ARN of CodeBuild role for backend Lambda deployment',
    });

    new ssm.StringParameter(this, 'CodeBuildIntTestRoleArnParameter', {
      parameterName: '/hotelapp/roles/CodeBuildIntTestRoleArn',
      stringValue: this.codeBuildIntTestRole.roleArn,
      description: 'ARN of CodeBuild role for integration tests',
    });

    new ssm.StringParameter(this, 'CodePipelineRoleArnParameter', {
      parameterName: '/hotelapp/roles/CodePipelineRoleArn',
      stringValue: this.codePipelineRole.roleArn,
      description: 'ARN of CodePipeline service role',
    });

    new ssm.StringParameter(this, 'CodeBuildFrontEndRoleArnParameter', {
      parameterName: '/hotelapp/roles/CodeBuildFrontEndRoleArn',
      stringValue: this.codeBuildFrontEndRole.roleArn,
      description: 'ARN of CodeBuild role for frontend React build',
    });

    // S3 Buckets
    new ssm.StringParameter(this, 'FrontendBucketNameParameter', {
      parameterName: '/hotelapp/s3/FrontendBucketName',
      stringValue: this.frontendBucket.bucketName,
      description: 'Name of S3 bucket for frontend hosting',
    });

    new ssm.StringParameter(this, 'FrontendBucketArnParameter', {
      parameterName: '/hotelapp/s3/FrontendBucketArn',
      stringValue: this.frontendBucket.bucketArn,
      description: 'ARN of S3 bucket for frontend hosting',
    });

    new ssm.StringParameter(this, 'PipelineArtifactsBucketNameParameter', {
      parameterName: '/hotelapp/s3/PipelineArtifactsBucketName',
      stringValue: this.artifactsBucket.bucketName,
      description: 'Name of S3 bucket for pipeline artifacts',
    });

    new ssm.StringParameter(this, 'PipelineArtifactsBucketArnParameter', {
      parameterName: '/hotelapp/s3/PipelineArtifactsBucketArn',
      stringValue: this.artifactsBucket.bucketArn,
      description: 'ARN of S3 bucket for pipeline artifacts',
    });

    // CloudFront
    new ssm.StringParameter(this, 'CloudFrontDistributionIdParameter', {
      parameterName: '/hotelapp/cloudfront/DistributionId',
      stringValue: this.cloudFrontDistribution.distributionId,
      description: 'CloudFront distribution ID for frontend',
    });

    new ssm.StringParameter(this, 'CloudFrontDistributionDomainParameter', {
      parameterName: '/hotelapp/cloudfront/DistributionDomain',
      stringValue: this.cloudFrontDistribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
    });

    new ssm.StringParameter(this, 'CloudFrontOAIIdParameter', {
      parameterName: '/hotelapp/cloudfront/OAIId',
      stringValue: this.cloudFrontOAI.originAccessIdentityId,
      description: 'CloudFront Origin Access Identity ID',
    });

    // ========================================================================
    // Stack Outputs
    // ========================================================================

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: this.frontendBucket.bucketName,
      description: 'Name of the S3 bucket for frontend hosting',
      exportName: `${this.stackName}-FrontendBucket`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: this.cloudFrontDistribution.distributionId,
      description: 'CloudFront distribution ID',
      exportName: `${this.stackName}-CloudFrontDistributionId`,
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${this.cloudFrontDistribution.distributionDomainName}`,
      description: 'CloudFront distribution URL',
      exportName: `${this.stackName}-CloudFrontURL`,
    });

    new cdk.CfnOutput(this, 'PipelineArtifactsBucketName', {
      value: this.artifactsBucket.bucketName,
      description: 'Name of the S3 bucket for pipeline artifacts',
      exportName: `${this.stackName}-PipelineArtifactsBucket`,
    });

    new cdk.CfnOutput(this, 'CodeBuildBackEndRoleArn', {
      value: this.codeBuildBackEndRole.roleArn,
      description: 'ARN of CodeBuild role for backend',
      exportName: `${this.stackName}-CodeBuildBackEndRoleArn`,
    });

    new cdk.CfnOutput(this, 'CodeBuildFrontEndRoleArn', {
      value: this.codeBuildFrontEndRole.roleArn,
      description: 'ARN of CodeBuild role for frontend',
      exportName: `${this.stackName}-CodeBuildFrontEndRoleArn`,
    });

    new cdk.CfnOutput(this, 'CodePipelineRoleArn', {
      value: this.codePipelineRole.roleArn,
      description: 'ARN of CodePipeline service role',
      exportName: `${this.stackName}-CodePipelineRoleArn`,
    });
  }
}
